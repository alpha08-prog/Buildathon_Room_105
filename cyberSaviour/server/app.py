"""
FastAPI Backend Server for CyberSaviour SOC Dashboard
Handles real-time events, game state, pipeline integration, and WebSocket connections.

Run from cyberSaviour/:
    uvicorn server.app:app --reload --port 8000
"""

import asyncio
import logging
from datetime import datetime
from typing import List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .game_store import GameStore
from .websocket_manager import ConnectionManager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CyberSaviour SOC API",
    description="Real-time gamified security operations centre",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

connection_manager = ConnectionManager()
game_store         = GameStore()

# ── In-memory pipeline result store ──────────────────────────────────────────
_pipeline_alerts:    List[dict] = []
_pipeline_incidents: List[dict] = []
_pipeline_agents:    List[dict] = []
_pipeline_actions:   List[dict] = []
_pipeline_memory:    List[dict] = []
_pipeline_missions:  List[dict] = []


# ── Shared ingest helper ──────────────────────────────────────────────────────

async def _ingest_result(result: dict):
    """
    Store pipeline result, update game state, broadcast everything via WebSocket.
    Called by both /api/pipeline/run and /api/pipeline/result.
    """
    _pipeline_alerts[:0]  = result.get("alerts", [])
    if result.get("incident"):
        _pipeline_incidents.insert(0, result["incident"])
    _pipeline_agents[:]   = result.get("agents", [])
    _pipeline_actions[:0] = result.get("response_actions", [])
    _pipeline_memory[:0]  = result.get("memory_entries", [])
    if result.get("mission"):
        _pipeline_missions.insert(0, result["mission"])

    # ── Derive game-layer updates from pipeline outcome ───────────────────────
    game_update = game_store.apply_pipeline_result(result)

    ts = datetime.utcnow().isoformat()

    # Broadcast pipeline data + game updates in one message
    await connection_manager.broadcast({
        "type":      "pipeline_result",
        "data": {
            **result,
            "game_update": game_update,
        },
        "timestamp": ts,
    })

    # If any achievements were newly unlocked, broadcast them individually
    for ach in game_update.get("newly_unlocked", []):
        await connection_manager.broadcast({
            "type":      "achievement_unlock",
            "data":      ach,
            "timestamp": ts,
        })

    logger.info(
        f"[Pipeline] alerts={len(result.get('alerts', []))} "
        f"mission={'yes' if result.get('mission') else 'no'} "
        f"xp_earned={game_update.get('xp_earned', 0)} "
        f"unlocked={[a['id'] for a in game_update.get('newly_unlocked', [])]}"
    )

    return game_update


# ── Health ─────────────────────────────────────────────────────────────────────
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ── Game state ─────────────────────────────────────────────────────────────────
@app.get("/api/game-state")
async def get_game_state():
    return {
        "state":        game_store.state.dict(),
        "achievements": game_store.all_achievements(),
        "timestamp":    datetime.utcnow().isoformat(),
    }


# ── Achievements ───────────────────────────────────────────────────────────────
@app.get("/api/achievements")
async def get_achievements():
    return {
        "achievements": game_store.all_achievements(),
        "count":        len(game_store.all_achievements()),
    }


# ── Missions ───────────────────────────────────────────────────────────────────
@app.get("/api/missions")
async def get_missions():
    return {"missions": _pipeline_missions, "count": len(_pipeline_missions)}


@app.post("/api/missions/{mission_id}/complete")
async def complete_mission(mission_id: str):
    for m in _pipeline_missions:
        if m["id"] == mission_id:
            m["status"] = "completed"
            m["completed_at"] = datetime.utcnow().isoformat()
            xp = m.get("xpReward", 0)
            game_store.add_xp(xp, f"mission_complete:{mission_id}")
            await connection_manager.broadcast({
                "type": "mission_completed",
                "data": {"mission": m, "xp_earned": xp},
                "timestamp": datetime.utcnow().isoformat(),
            })
            return m
    return JSONResponse(status_code=404, content={"detail": "Mission not found"})


# ── Pipeline data endpoints ────────────────────────────────────────────────────
@app.get("/api/alerts")
async def get_alerts():
    return {"alerts": _pipeline_alerts, "count": len(_pipeline_alerts)}


@app.get("/api/incidents")
async def get_incidents():
    return {"incidents": _pipeline_incidents, "count": len(_pipeline_incidents)}


@app.get("/api/agents")
async def get_agents():
    return {"agents": _pipeline_agents, "count": len(_pipeline_agents)}


@app.get("/api/response-actions")
async def get_response_actions():
    return {"response_actions": _pipeline_actions, "count": len(_pipeline_actions)}


@app.get("/api/memory")
async def get_memory():
    return {"memory_entries": _pipeline_memory, "count": len(_pipeline_memory)}


# ── /api/pipeline/run — server runs the pipeline itself ───────────────────────
@app.post("/api/pipeline/run")
async def run_pipeline_endpoint(payload: dict):
    """Run the pipeline in-process and ingest the result."""
    events = payload.get("events", [])
    if not events:
        return JSONResponse(status_code=422, content={"detail": "No events provided"})

    try:
        from .pipeline_bridge import run_pipeline
    except ImportError as e:
        logger.error(f"Pipeline import failed: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, run_pipeline, events)
    except Exception as e:
        logger.error(f"Pipeline error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    game_update = await _ingest_result(result)
    return {**result, "game_update": game_update}


# ── /api/pipeline/result — Rust orchestrator pushes pre-shaped result ─────────
@app.post("/api/pipeline/result")
async def ingest_pipeline_result(result: dict):
    """
    Accepts a pre-shaped result POSTed by the Rust orchestrator
    (output of pipeline_bridge_worker.py). Stores, updates game state,
    and broadcasts — no re-run.
    """
    game_update = await _ingest_result(result)
    return {
        "status":     "ok",
        "alerts":     len(result.get("alerts", [])),
        "mission":    bool(result.get("mission")),
        "xp_earned":  game_update.get("xp_earned", 0),
        "unlocked":   [a["id"] for a in game_update.get("newly_unlocked", [])],
    }


# ── WebSocket ──────────────────────────────────────────────────────────────────
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await connection_manager.connect(websocket)
    # Send current game state immediately on connect
    await websocket.send_json({
        "type":      "init",
        "data": {
            "game_state":   game_store.state.dict(),
            "achievements": game_store.all_achievements(),
            "missions":     _pipeline_missions,
        },
        "timestamp": datetime.utcnow().isoformat(),
    })
    try:
        while True:
            await websocket.receive_text()   # keep alive
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket)


# ── Error handler ──────────────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)},
    )


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting CyberSaviour SOC Server…")
    uvicorn.run("server.app:app", host="0.0.0.0", port=8000, reload=True)
