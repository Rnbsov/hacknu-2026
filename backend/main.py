from __future__ import annotations

import asyncio
import logging
import time
from contextlib import asynccontextmanager
from typing import AsyncGenerator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.telemetry import (
    current_state,
    router as telemetry_router,
    telemetry_history,
)
from app.api.websocket import manager, router as ws_router
from app.config import SIMULATOR_INTERVAL
from app.services.health_engine import HealthEngine
from app.services.simulator import TelemetrySimulator

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

simulator = TelemetrySimulator()
health_engine = HealthEngine()


async def broadcast_loop() -> None:
    """Background task: generate telemetry, compute health, broadcast to clients."""
    logger.info("Broadcast loop started (interval=%.1fs)", SIMULATOR_INTERVAL)
    while True:
        try:
            telemetry = simulator.generate()
            alerts = simulator.active_alerts
            health = health_engine.compute(telemetry, alerts)

            message = {
                "type": "telemetry",
                "data": telemetry.model_dump(),
                "health": health.model_dump(),
                "alerts": [a.model_dump() for a in alerts],
            }

            # Update shared state for REST endpoints
            current_state.clear()
            current_state.update(message)
            telemetry_history.append(message)

            # Broadcast to WebSocket clients
            await manager.broadcast(message)

        except Exception:
            logger.exception("Error in broadcast loop")

        await asyncio.sleep(SIMULATOR_INTERVAL)


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Manage application lifecycle — start/stop background tasks."""
    logger.info("Starting KTZh Locomotive Digital Twin API")
    task = asyncio.create_task(broadcast_loop())
    yield
    logger.info("Shutting down...")
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass


app = FastAPI(
    title="KTZh Locomotive Digital Twin API",
    description="Real-time telemetry monitoring and health index computation for locomotives",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ws_router)
app.include_router(telemetry_router)
app.include_router(health_router)
