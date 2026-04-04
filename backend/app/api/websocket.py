from __future__ import annotations

import logging

from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.connection_manager import ConnectionManager

logger = logging.getLogger(__name__)

router = APIRouter()
manager = ConnectionManager()


@router.websocket("/ws/telemetry")
async def telemetry_websocket(websocket: WebSocket) -> None:
    """WebSocket endpoint for real-time telemetry streaming."""
    await manager.connect(websocket)
    try:
        while True:
            # Keep connection alive; client can send pings
            data = await websocket.receive_text()
            logger.debug("Received from client: %s", data)
    except WebSocketDisconnect:
        logger.info("Client disconnected normally")
    except Exception as e:
        logger.warning("WebSocket error: %s", e)
    finally:
        manager.disconnect(websocket)
