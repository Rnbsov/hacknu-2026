from __future__ import annotations

from pydantic import BaseModel


class HealthFactor(BaseModel):
    """Single contributing factor to the Health Index."""

    parameter: str
    contribution: float
    value: float
    normal_range: tuple[float, float]
    status: str  # "normal" | "warning" | "critical"


class HealthIndex(BaseModel):
    """Computed health index for the locomotive."""

    score: float
    category: str  # A/B/C/D/E
    top_factors: list[HealthFactor]
    timestamp: float


class Alert(BaseModel):
    """Active alert raised by threshold breach."""

    id: str
    timestamp: float
    severity: str  # "info" | "warning" | "critical"
    parameter: str
    message: str
    value: float
    threshold: float


class TelemetryPoint(BaseModel):
    """Single telemetry snapshot from a locomotive."""

    timestamp: float
    locomotive_id: str
    speed: float
    rpm: float
    fuel_level: float
    oil_pressure: float
    coolant_temp: float
    brake_pressure: float
    voltage: float
    current: float
    axle_load: float
    vibration: float
    latitude: float
    longitude: float


class TelemetryMessage(BaseModel):
    """Full WebSocket broadcast message."""

    type: str = "telemetry"
    data: TelemetryPoint
    health: HealthIndex
    alerts: list[Alert]
