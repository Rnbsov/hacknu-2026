from __future__ import annotations

import time
from collections import deque
from typing import Any

from fastapi import APIRouter, Query

from app.models.telemetry import Alert, HealthIndex, TelemetryPoint

router = APIRouter(prefix="/api", tags=["telemetry"])

# In-memory ring buffer — populated by the broadcast loop in main.py
telemetry_history: deque[dict[str, Any]] = deque(maxlen=900)
current_state: dict[str, Any] = {}


@router.get("/telemetry/current")
async def get_current_telemetry() -> dict[str, Any]:
    """Return the latest telemetry point and health index."""
    if not current_state:
        return {"error": "No telemetry data yet", "data": None, "health": None}
    return current_state


@router.get("/telemetry/history")
async def get_telemetry_history(
    minutes: int = Query(default=5, ge=1, le=15),
) -> list[dict[str, Any]]:
    """Return telemetry history for the last N minutes."""
    cutoff = time.time() - (minutes * 60)
    return [
        point
        for point in telemetry_history
        if point.get("data", {}).get("timestamp", 0) >= cutoff
    ]


@router.get("/alerts")
async def get_alerts() -> list[dict[str, Any]]:
    """Return current active alerts."""
    if current_state and "alerts" in current_state:
        return current_state["alerts"]
    return []


@router.get("/health/config")
async def get_health_config() -> dict[str, Any]:
    """Return the current health weights configuration."""
    from app.services.health_engine import HealthEngine

    engine = HealthEngine()
    return engine.config
