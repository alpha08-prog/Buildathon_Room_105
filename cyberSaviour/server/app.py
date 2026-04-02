"""
FastAPI Backend Server for Gamified SOC Dashboard
Handles real-time events, game state, and WebSocket connections
"""

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import asyncio
import logging
from datetime import datetime
from typing import Dict, List

# Import game modules
from .game_store import GameStore
from .websocket_manager import ConnectionManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Gamified SOC API",
    description="Real-time gamified security operations center",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8080", "http://127.0.0.1:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global connection manager for WebSocket broadcasting
connection_manager = ConnectionManager()

# Global game store for in-memory state
game_store = GameStore()


# ===== Health Check =====
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow().isoformat()}


# ===== Game State Endpoints =====
@app.get("/api/game-state")
async def get_game_state():
    """Get current player game state"""
    return {
        "state": game_store.state.dict(),
        "timestamp": datetime.utcnow().isoformat()
    }


@app.post("/api/game-state/xp")
async def add_xp(amount: int, reason: str = "action"):
    """Add XP and update game state"""
    result = game_store.add_xp(amount, reason)

    # Broadcast XP update to all connected clients
    await connection_manager.broadcast({
        "type": "xp_update",
        "data": result,
        "timestamp": datetime.utcnow().isoformat()
    })

    return result


@app.post("/api/game-state/streak")
async def update_streak(success: bool):
    """Update streak counter"""
    result = game_store.update_streak(success)

    # Broadcast streak update
    await connection_manager.broadcast({
        "type": "streak_update",
        "data": result,
        "timestamp": datetime.utcnow().isoformat()
    })

    return result


@app.get("/api/achievements")
async def get_achievements():
    """Get all unlocked achievements"""
    return {
        "achievements": game_store.achievements_unlocked,
        "count": len(game_store.achievements_unlocked)
    }


@app.post("/api/achievements/unlock")
async def unlock_achievement(achievement_id: str):
    """Unlock a new achievement"""
    if achievement_id in game_store.achievements_unlocked:
        return {"status": "already_unlocked", "achievement_id": achievement_id}

    # Add achievement with timestamp
    achievement = {
        "id": achievement_id,
        "unlocked_at": datetime.utcnow().isoformat()
    }
    game_store.achievements_unlocked[achievement_id] = achievement

    # Broadcast achievement unlock
    await connection_manager.broadcast({
        "type": "achievement_unlock",
        "data": achievement,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "unlocked", "achievement": achievement}


# ===== Mission/Incident Endpoints =====
@app.get("/api/missions")
async def get_missions():
    """Get all active missions"""
    return {
        "missions": game_store.active_missions,
        "count": len(game_store.active_missions)
    }


@app.post("/api/missions/create")
async def create_mission(mission_data: dict):
    """Create a new mission from incident data"""
    mission_id = mission_data.get("incident_id", f"MISS-{len(game_store.active_missions) + 1}")

    mission = {
        "incident_id": mission_id,
        "title": mission_data.get("title", "Unknown Incident"),
        "phase": mission_data.get("phase", "Initial Access"),
        "difficulty": mission_data.get("difficulty", "normal"),
        "xp_reward": mission_data.get("xp_reward", 100),
        "boss_fight": mission_data.get("boss_fight", False),
        "status": "active",
        "created_at": datetime.utcnow().isoformat()
    }

    game_store.active_missions[mission_id] = mission

    # Broadcast new mission
    await connection_manager.broadcast({
        "type": "mission_created",
        "data": mission,
        "timestamp": datetime.utcnow().isoformat()
    })

    return mission


@app.post("/api/missions/{mission_id}/complete")
async def complete_mission(mission_id: str):
    """Mark mission as completed"""
    if mission_id not in game_store.active_missions:
        return {"status": "not_found", "mission_id": mission_id}

    mission = game_store.active_missions[mission_id]
    mission["status"] = "completed"
    mission["completed_at"] = datetime.utcnow().isoformat()

    # Award XP
    xp_reward = mission.get("xp_reward", 100)
    game_store.add_xp(xp_reward, f"mission_complete:{mission_id}")

    # Broadcast mission completion
    await connection_manager.broadcast({
        "type": "mission_completed",
        "data": mission,
        "timestamp": datetime.utcnow().isoformat()
    })

    return mission


# ===== WebSocket Endpoint =====
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time event streaming"""
    await connection_manager.connect(websocket)

    try:
        # Keep connection alive and handle incoming messages
        while True:
            data = await websocket.receive_text()
            logger.info(f"Received message: {data}")

            # Echo the message back to confirm receipt
            await websocket.send_json({
                "type": "message_received",
                "data": data,
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
        logger.info("Client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket)


# ===== Event Broadcasting Endpoint (for testing) =====
@app.post("/api/test/broadcast-event")
async def broadcast_test_event(event_type: str, data: dict):
    """Test endpoint to broadcast events to connected clients"""
    await connection_manager.broadcast({
        "type": event_type,
        "data": data,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {"status": "broadcast_sent", "event_type": event_type}


# ===== Error Handlers =====
@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )


if __name__ == "__main__":
    import uvicorn

    logger.info("Starting Gamified SOC Server...")
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=8000,
        log_level="info",
        reload=True
    )
