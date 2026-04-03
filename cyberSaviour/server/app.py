"""
FastAPI Backend Server for CyberSaviour SOC Dashboard
Handles real-time events, game state, pipeline integration, and WebSocket connections.

Run from cyberSaviour/:
    uvicorn server.app:app --reload --port 8000
"""

import asyncio
import logging
from datetime import datetime
from typing import Dict, List

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .game_store import GameStore
from .websocket_manager import ConnectionManager
from .integrations import integration_manager

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="CyberSaviour SOC API",
    description="Real-time gamified security operations centre",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://[::1]:8080",
    ],
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$",
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
_pipeline_responses: List[dict] = []
_pending_action_contexts: Dict[str, dict] = {}


def _identity_value(item: dict | None):
    if not item:
        return None
    return item.get("dedupeKey") or item.get("id")


def _prepend_unique(store: List[dict], items: List[dict]):
    existing_by_identity = {
        _identity_value(item): item
        for item in store
        if _identity_value(item) is not None
    }
    merged: List[dict] = []

    for item in items:
        identity = _identity_value(item)
        if identity is None:
            merged.append(item)
            continue

        current = existing_by_identity.pop(identity, None)
        if current:
            merged_item = {**current, **item}
            if current.get("id"):
                merged_item["id"] = current["id"]
            merged.append(merged_item)
        else:
            merged.append(item)

    merged.extend(existing_by_identity.values())
    store[:] = merged


def _upsert_one(store: List[dict], item: dict | None):
    if not item:
        return
    identity = _identity_value(item)
    updated = False
    next_store: List[dict] = []

    for current in store:
        current_identity = _identity_value(current)
        if identity is not None and current_identity == identity:
            merged_item = {**current, **item}
            if current.get("id"):
                merged_item["id"] = current["id"]
            next_store.append(merged_item)
            updated = True
        else:
            next_store.append(current)

    if not updated:
        next_store.insert(0, item)

    store[:] = next_store


def _find_by_id(store: List[dict], item_id: str):
    for item in store:
        if item.get("id") == item_id:
            return item
    return None


def _snapshot_payload():
    return {
        "achievements": game_store.all_achievements(),
        "agents": _pipeline_agents,
        "alerts": _pipeline_alerts,
        "game_state": game_store.state.dict(),
        "incidents": _pipeline_incidents,
        "memory_entries": _pipeline_memory,
        "missions": _pipeline_missions,
        "response_actions": _pipeline_actions,
        "responses": _pipeline_responses,
    }


# ── Shared ingest helper ──────────────────────────────────────────────────────

async def _ingest_result(result: dict):
    """
    Store pipeline result, update game state, broadcast everything via WebSocket.
    Called by both /api/pipeline/run and /api/pipeline/result.
    """
    _prepend_unique(_pipeline_alerts, result.get("alerts", []))
    _upsert_one(_pipeline_incidents, result.get("incident"))
    _pipeline_agents[:] = result.get("agents", [])
    _prepend_unique(_pipeline_actions, result.get("response_actions", []))
    _prepend_unique(_pipeline_memory, result.get("memory_entries", []))
    _upsert_one(_pipeline_missions, result.get("mission"))
    _upsert_one(_pipeline_responses, result.get("response"))
    _pending_action_contexts.update(result.get("_pending_action_contexts", {}))

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
        f"response={'yes' if result.get('response') else 'no'} "
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
                "data": {
                    "mission": m,
                    "xp_earned": xp,
                    "game_state": game_store.state.dict(),
                },
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


@app.get("/api/responses")
async def get_responses():
    return {"responses": _pipeline_responses, "count": len(_pipeline_responses)}


@app.post("/api/demo/reset")
async def reset_demo_state():
    _pipeline_alerts.clear()
    _pipeline_incidents.clear()
    _pipeline_agents.clear()
    _pipeline_actions.clear()
    _pipeline_memory.clear()
    _pipeline_missions.clear()
    _pipeline_responses.clear()
    _pending_action_contexts.clear()
    game_store.reset()

    ts = datetime.utcnow().isoformat()
    payload = _snapshot_payload()

    await connection_manager.broadcast({
        "type": "demo_state_reset",
        "data": payload,
        "timestamp": ts,
    })

    return {
        "status": "ok",
        "timestamp": ts,
        **payload,
    }


@app.post("/api/response-actions/{action_id}/decision")
async def decide_response_action(action_id: str, payload: dict):
    decision = payload.get("decision")
    if decision not in {"approved", "rejected"}:
        return JSONResponse(status_code=422, content={"detail": "decision must be approved or rejected"})

    action = _find_by_id(_pipeline_actions, action_id)
    if not action:
        return JSONResponse(status_code=404, content={"detail": "Response action not found"})
    if action.get("status") != "pending":
        return JSONResponse(status_code=409, content={"detail": "Response action already reviewed"})

    context = _pending_action_contexts.get(action_id, {})
    incident = _find_by_id(_pipeline_incidents, action.get("incidentId"))
    mission = next((m for m in _pipeline_missions if m.get("incidentId") == action.get("incidentId")), None)
    response = next((r for r in _pipeline_responses if r.get("incidentId") == action.get("incidentId")), None)
    ts = datetime.utcnow().isoformat()
    xp_earned = 0

    if decision == "approved":
        action["status"] = "approved"
        action["actionStatus"] = "success"
        action["reviewedAt"] = ts
        xp_earned = 80
        game_store.add_xp(xp_earned, f"approve_response:{action_id}")
        game_store.update_streak(True)

        if incident:
            incident["status"] = "investigating"
            incident["updatedAt"] = ts
        if mission:
            for objective in mission.get("objectives", []):
                desc = objective.get("description", "").lower()
                if action.get("target", "").lower() in desc or action.get("action", "").lower() in desc:
                    objective["completed"] = True
            mission["updatedAt"] = ts
        if response:
            response["actionTaken"] = context.get("action", action.get("action", "log")).lower().replace(" ", "_")
            response["actionStatus"] = "success"
            response["ipsActedOn"] = [action.get("target", "unknown")]
            response["requiresHumanApproval"] = False
            response["timestamp"] = ts
    else:
        action["status"] = "rejected"
        action["actionStatus"] = "rejected_by_human"
        action["reviewedAt"] = ts
        game_store.update_streak(False)
        if incident:
            incident["status"] = "open"
            incident["updatedAt"] = ts
        if response:
            response["actionTaken"] = "rejected"
            response["actionStatus"] = "rejected_by_human"
            response["ipsActedOn"] = [action.get("target", "unknown")]
            response["requiresHumanApproval"] = False
            response["timestamp"] = ts

    game_update = {
        "game_state": game_store.state.dict(),
        "xp_earned": xp_earned,
    }
    _pending_action_contexts.pop(action_id, None)

    await connection_manager.broadcast({
        "type": "response_action_updated",
        "data": {
            "action": action,
            "game_update": game_update,
            "incident": incident,
            "mission": mission,
            "response": response,
        },
        "timestamp": ts,
    })

    return {
        "status": "ok",
        "action": action,
        "game_update": game_update,
        "incident": incident,
        "mission": mission,
        "response": response,
    }


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


# ── CybORG Scenario Integration ───────────────────────────────────────────────

@app.get("/api/cyborg/scenarios")
async def get_cyborg_scenarios():
    """List all available CybORG scenarios."""
    from integrations.cyborg_bridge import list_scenarios
    return {"scenarios": list_scenarios()}


@app.post("/api/cyborg/run-scenario")
async def run_cyborg_scenario(payload: dict):
    """
    Run a CybORG network simulation scenario and feed results through
    the full CyberSaviour pipeline.

    Body: { "scenario_name": str, "num_steps": int (default 20) }
    """
    scenario_name = payload.get("scenario_name", "Scenario1")
    num_steps     = int(payload.get("num_steps", 20))

    try:
        from integrations.cyborg_bridge import run_cyborg_scenario as _run
        cyborg_result = _run(scenario_name, num_steps)
    except ValueError as e:
        return JSONResponse(status_code=422, content={"detail": str(e)})
    except Exception as e:
        logger.error(f"CybORG scenario error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    pipeline_events = cyborg_result["pipeline_events"]
    if not pipeline_events:
        return JSONResponse(status_code=422, content={"detail": "Scenario produced no events"})

    try:
        from .pipeline_bridge import run_pipeline
    except ImportError as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

    loop = asyncio.get_event_loop()
    try:
        result = await loop.run_in_executor(None, run_pipeline, pipeline_events)
    except Exception as e:
        logger.error(f"Pipeline error (CybORG): {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    # Tag result with CybORG metadata
    result["cyborg"] = {
        "scenario":            cyborg_result["scenario"],
        "description":         cyborg_result["description"],
        "difficulty":          cyborg_result["difficulty"],
        "steps_run":           cyborg_result["steps_run"],
        "compromised_hosts":   cyborg_result["compromised_hosts"],
        "defender_detections": cyborg_result["defender_detections"],
        "ip_map":              cyborg_result["ip_map"],
        "summary":             cyborg_result["summary"],
    }

    game_update = await _ingest_result(result)
    return {**result, "game_update": game_update}


# ── Cybersleuth Forensic Integration ─────────────────────────────────────────

@app.get("/api/forensic/events")
async def get_forensic_events(benchmark: str = "CFA"):
    """List all available forensic events (PCAP files) from the benchmark."""
    try:
        from integrations.cybersleuth_bridge import list_events
        events = list_events(benchmark)
        return {"events": events, "count": len(events), "benchmark": benchmark}
    except Exception as e:
        logger.error(f"Forensic events error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})


@app.post("/api/forensic/analyze")
async def run_forensic_analysis(payload: dict):
    """
    Analyse a PCAP from the CFA benchmark and feed results through the
    full CyberSaviour pipeline.

    Body: { "event_id": str, "benchmark": str (default "CFA") }
    """
    event_id  = str(payload.get("event_id", "0"))
    benchmark = payload.get("benchmark", "CFA")

    try:
        from integrations.cybersleuth_bridge import run_forensic_analysis as _run
    except ImportError as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

    loop = asyncio.get_event_loop()
    try:
        forensic = await loop.run_in_executor(None, _run, event_id, benchmark)
    except FileNotFoundError as e:
        return JSONResponse(status_code=404, content={"detail": str(e)})
    except ValueError as e:
        return JSONResponse(status_code=422, content={"detail": str(e)})
    except Exception as e:
        logger.error(f"Forensic analysis error: {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    pipeline_events = forensic.get("pipeline_events", [])
    if not pipeline_events:
        # No PCAP traffic to analyse — still return the forensic report
        return {
            "forensic": forensic,
            "alerts": [],
            "incident": None,
            "mission": None,
            "game_update": {"xp_earned": 0, "newly_unlocked": []},
        }

    try:
        from .pipeline_bridge import run_pipeline
    except ImportError as e:
        return JSONResponse(status_code=500, content={"detail": str(e)})

    try:
        result = await loop.run_in_executor(None, run_pipeline, pipeline_events)
    except Exception as e:
        logger.error(f"Pipeline error (forensic): {e}")
        return JSONResponse(status_code=500, content={"detail": str(e)})

    # Attach forensic metadata to the result
    result["forensic"] = forensic

    # Enrich mission with forensic context when available
    if result.get("mission"):
        result["mission"]["title"] = (
            f"[Forensic] {forensic['cve']} — {forensic['service'].upper()}"
        )
        result["mission"]["description"] = forensic.get("cve_description", "")
        result["mission"]["xpReward"] = max(
            result["mission"].get("xpReward", 100),
            150 + (50 if forensic.get("severity") == "critical" else 0),
        )

    game_update = await _ingest_result(result)
    return {**result, "game_update": game_update}


# ── Forensic background jobs ──────────────────────────────────────────────────

@app.post("/api/forensic/analyze/async")
async def run_forensic_async(payload: dict):
    """
    Submit a forensic analysis as a background job.
    Returns job_id immediately; poll GET /api/forensic/jobs/{job_id} for status.

    Body: { "event_id": str, "benchmark": str (default "CFA") }
    """
    event_id  = str(payload.get("event_id", "0"))
    benchmark = payload.get("benchmark", "CFA")
    job_id    = integration_manager.submit_forensic_job(event_id, benchmark)
    return {"job_id": job_id, "status": "running", "event_id": event_id, "benchmark": benchmark}


@app.get("/api/forensic/jobs")
async def list_forensic_jobs():
    """Return all forensic analysis jobs (newest first)."""
    return {"jobs": integration_manager.list_jobs(), "count": len(integration_manager.list_jobs())}


@app.get("/api/forensic/jobs/{job_id}")
async def get_forensic_job(job_id: str):
    """Poll the status of a background forensic analysis job."""
    job = integration_manager.get_job(job_id)
    if not job:
        return JSONResponse(status_code=404, content={"detail": f"Job '{job_id}' not found"})

    if job["status"] == "complete" and job.get("result"):
        # Ingest the result into the pipeline if not already done
        forensic = job["result"]
        pipeline_events = forensic.get("pipeline_events", [])
        if pipeline_events:
            try:
                result = await integration_manager.run_pipeline(pipeline_events)
                result["forensic"] = forensic
                if result.get("mission"):
                    result["mission"]["title"] = f"[Forensic] {forensic['cve']} — {forensic['service'].upper()}"
                    result["mission"]["description"] = forensic.get("cve_description", "")
                game_update = await _ingest_result(result)
                return {**job, "pipeline_result": result, "game_update": game_update}
            except Exception as e:
                logger.error(f"Pipeline error (async forensic job {job_id}): {e}")

    return job


# ── System Status ─────────────────────────────────────────────────────────────

@app.get("/api/status")
async def get_system_status():
    """
    Unified health summary for the System Status dashboard page.
    Returns pipeline counts, integration health, and game stats.
    """
    integration_status = integration_manager.get_status()
    return {
        "timestamp":    datetime.utcnow().isoformat(),
        "pipeline": {
            "alerts":    len(_pipeline_alerts),
            "incidents": len(_pipeline_incidents),
            "missions":  len(_pipeline_missions),
            "actions":   len(_pipeline_actions),
            "memory":    len(_pipeline_memory),
        },
        "game": {
            "xp":                 game_store.state.xp,
            "rank":               game_store.state.rank,
            "streak":             game_store.state.streak,
            "missions_completed": game_store.state.total_runs,
        },
        "integrations": integration_status,
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
            "responses":    _pipeline_responses,
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
