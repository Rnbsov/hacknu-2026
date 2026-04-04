from __future__ import annotations

import asyncio
import json
import logging
from typing import Any

from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    """Manages WebSocket connections with O(1) add/remove and concurrent broadcast."""

    def __init__(self) -> None:
        self._connections: set[WebSocket] = set()

    @property
    def client_count(self) -> int:
        return len(self._connections)

    async def connect(self, websocket: WebSocket) -> None:
        """Accept a WebSocket connection and register it."""
        await websocket.accept()
        self._connections.add(websocket)
        logger.info("Client connected. Total: %d", self.client_count)

    def disconnect(self, websocket: WebSocket) -> None:
        """Remove a WebSocket connection."""
        self._connections.discard(websocket)
        logger.info("Client disconnected. Total: %d", self.client_count)

    async def broadcast(self, message: dict[str, Any]) -> None:
        """Send JSON message to all connected clients concurrently."""
        if not self._connections:
            return

        payload = json.dumps(message)
        snapshot = list(self._connections)
        results = await asyncio.gather(
            *(self._safe_send(ws, payload) for ws in snapshot),
            return_exceptions=True,
        )

        for ws, result in zip(snapshot, results):
            if isinstance(result, Exception):
                logger.warning("Evicting dead connection: %s", result)
                self._connections.discard(ws)

    async def _safe_send(self, websocket: WebSocket, payload: str) -> None:
        """Send text payload to a single WebSocket."""
        await websocket.send_text(payload)
