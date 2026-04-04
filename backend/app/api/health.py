from __future__ import annotations

import time

from fastapi import APIRouter

from app.api.websocket import manager

router = APIRouter(tags=["health"])

_start_time = time.time()


@router.get("/health")
async def health_check() -> dict:
    """Health check endpoint returning system status."""
    return {
        "status": "ok",
        "uptime": round(time.time() - _start_time, 1),
        "clients": manager.client_count,
    }
