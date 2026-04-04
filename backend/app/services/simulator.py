from __future__ import annotations

import asyncio
import logging
import math
import random
import time
import uuid
from dataclasses import dataclass, field

from app.config import LOCOMOTIVE_ID, SIMULATOR_INTERVAL
from app.models.telemetry import Alert, TelemetryPoint

logger = logging.getLogger(__name__)

# Astana–Almaty corridor waypoints (lat, lng)
ROUTE_POINTS = [
    (51.1694, 71.4491),  # Astana
    (50.2839, 72.0891),  # Karaganda direction
    (49.8047, 73.1094),  # Karaganda
    (48.0196, 73.8553),  # Balkhash approach
    (46.8481, 75.0000),  # Balkhash
    (45.4596, 75.9521),  # Midway
    (44.3515, 76.5234),  # Approaching Almaty
    (43.2380, 76.9450),  # Almaty
]

TOTAL_DISTANCE_KM = 1200.0


@dataclass
class DegradationEvent:
    """Tracks a parameter degradation event."""

    parameter: str
    target_delta: float
    current_delta: float = 0.0
    step: float = 0.0
    remaining_ticks: int = 0


@dataclass
class SimulatorState:
    """Mutable state for the telemetry simulator."""

    speed: float = 90.0
    rpm: float = 1500.0
    fuel_level: float = 85.0
    oil_pressure: float = 4.5
    coolant_temp: float = 82.0
    brake_pressure: float = 6.0
    voltage: float = 580.0
    current: float = 550.0
    axle_load: float = 20.0
    vibration: float = 3.0
    route_progress: float = 0.0  # 0..1 along route
    tick: int = 0
    active_degradations: list[DegradationEvent] = field(default_factory=list)
    alerts: list[Alert] = field(default_factory=list)
    next_event_tick: int = 0


class TelemetrySimulator:
    """Generates realistic locomotive telemetry with degradation & spike events."""

    NORMAL_RANGES: dict[str, tuple[float, float]] = {
        "speed": (60.0, 120.0),
        "rpm": (800.0, 2200.0),
        "fuel_level": (20.0, 100.0),
        "oil_pressure": (3.5, 5.5),
        "coolant_temp": (75.0, 95.0),
        "brake_pressure": (4.0, 8.0),
        "voltage": (540.0, 620.0),
        "current": (300.0, 800.0),
        "axle_load": (18.0, 22.0),
        "vibration": (1.0, 5.0),
    }

    WARNING_THRESHOLDS: dict[str, tuple[float, float]] = {
        "coolant_temp": (65.0, 100.0),
        "oil_pressure": (2.5, 6.5),
        "vibration": (0.0, 10.0),
        "brake_pressure": (2.5, 9.5),
        "voltage": (480.0, 680.0),
    }

    def __init__(self, interval: float = SIMULATOR_INTERVAL) -> None:
        self.interval = interval
        self.state = SimulatorState()
        self._running = False
        self._schedule_next_event()

    def _schedule_next_event(self) -> None:
        """Schedule next degradation/spike event."""
        self.state.next_event_tick = self.state.tick + random.randint(30, 90)

    def _interpolate_position(self, progress: float) -> tuple[float, float]:
        """Get lat/lng position along the route."""
        progress = max(0.0, min(1.0, progress))
        total_segments = len(ROUTE_POINTS) - 1
        segment_progress = progress * total_segments
        segment_idx = min(int(segment_progress), total_segments - 1)
        t = segment_progress - segment_idx

        lat1, lng1 = ROUTE_POINTS[segment_idx]
        lat2, lng2 = ROUTE_POINTS[segment_idx + 1]
        return (lat1 + t * (lat2 - lat1), lng1 + t * (lng2 - lng1))

    def _add_noise(self, value: float, amplitude: float) -> float:
        """Add Gaussian noise to a value."""
        return value + random.gauss(0, amplitude)

    def _clamp(self, value: float, lo: float, hi: float) -> float:
        return max(lo, min(hi, value))

    def _trigger_event(self) -> None:
        """Trigger a random degradation or spike event."""
        event_type = random.choice(["degradation", "degradation", "spike"])
        param = random.choice(
            ["coolant_temp", "oil_pressure", "vibration", "brake_pressure", "voltage"]
        )

        if event_type == "degradation":
            direction = random.choice([-1, 1])
            lo, hi = self.NORMAL_RANGES[param]
            range_size = hi - lo
            target_delta = direction * random.uniform(
                range_size * 0.3, range_size * 0.8
            )
            duration = random.randint(60, 180)
            step = target_delta / duration

            self.state.active_degradations.append(
                DegradationEvent(
                    parameter=param,
                    target_delta=target_delta,
                    step=step,
                    remaining_ticks=duration,
                )
            )
            logger.info(
                "Degradation event: %s delta=%.2f over %ds",
                param,
                target_delta,
                duration,
            )
        else:
            # Spike: instant jump
            lo, hi = self.NORMAL_RANGES[param]
            current_val: float = getattr(self.state, param)
            spike_magnitude = random.uniform((hi - lo) * 0.5, (hi - lo) * 1.2)
            direction = random.choice([-1, 1])
            new_val = current_val + direction * spike_magnitude
            setattr(self.state, param, new_val)
            logger.info("Spike event: %s jumped to %.2f", param, new_val)

            self.state.alerts.append(
                Alert(
                    id=f"alert-{uuid.uuid4().hex[:8]}",
                    timestamp=time.time(),
                    severity="critical"
                    if abs(direction * spike_magnitude) > (hi - lo) * 0.8
                    else "warning",
                    parameter=param,
                    message=f"{param.replace('_', ' ').title()} spike detected",
                    value=round(new_val, 2),
                    threshold=round(hi if direction > 0 else lo, 2),
                )
            )

    def _apply_degradations(self) -> None:
        """Apply ongoing degradation events."""
        remaining = []
        for deg in self.state.active_degradations:
            if deg.remaining_ticks > 0:
                current: float = getattr(self.state, deg.parameter)
                setattr(self.state, deg.parameter, current + deg.step)
                deg.current_delta += deg.step
                deg.remaining_ticks -= 1

                # Check if we need to raise a warning alert
                lo, hi = self.NORMAL_RANGES[deg.parameter]
                val: float = getattr(self.state, deg.parameter)
                if val < lo or val > hi:
                    threshold = lo if val < lo else hi
                    existing_ids = {a.parameter for a in self.state.alerts}
                    if deg.parameter not in existing_ids:
                        self.state.alerts.append(
                            Alert(
                                id=f"alert-{uuid.uuid4().hex[:8]}",
                                timestamp=time.time(),
                                severity="warning",
                                parameter=deg.parameter,
                                message=f"{deg.parameter.replace('_', ' ').title()} drifting out of range",
                                value=round(val, 2),
                                threshold=round(threshold, 2),
                            )
                        )
                remaining.append(deg)
            else:
                # Recovery: gradually return to normal
                current_val: float = getattr(self.state, deg.parameter)
                lo, hi = self.NORMAL_RANGES[deg.parameter]
                mid = (lo + hi) / 2
                recovery = (mid - current_val) * 0.05
                setattr(self.state, deg.parameter, current_val + recovery)

        self.state.active_degradations = remaining

    def _check_alerts(self) -> None:
        """Expire old alerts if parameter returned to normal."""
        active = []
        for alert in self.state.alerts:
            val: float = getattr(self.state, alert.parameter, None)
            if val is None:
                active.append(alert)
                continue
            lo, hi = self.NORMAL_RANGES.get(
                alert.parameter, (float("-inf"), float("inf"))
            )
            if lo <= val <= hi:
                if time.time() - alert.timestamp > 10:
                    logger.info("Alert resolved: %s", alert.parameter)
                    continue
            active.append(alert)
        self.state.alerts = active[-10:]  # Keep max 10 alerts

    def generate(self) -> TelemetryPoint:
        """Generate a single telemetry data point."""
        self.state.tick += 1

        # Trigger events on schedule
        if self.state.tick >= self.state.next_event_tick:
            self._trigger_event()
            self._schedule_next_event()

        # Apply active degradations
        self._apply_degradations()

        # Natural parameter evolution with noise
        self.state.speed = self._clamp(
            self._add_noise(self.state.speed + random.gauss(0, 1.5), 0.5),
            0.0,
            180.0,
        )
        self.state.rpm = self._clamp(
            self.state.speed * 15 + random.gauss(0, 30),
            0.0,
            3000.0,
        )
        self.state.fuel_level = self._clamp(
            self.state.fuel_level - random.uniform(0.005, 0.02),
            0.0,
            100.0,
        )
        self.state.oil_pressure = self._clamp(
            self._add_noise(self.state.oil_pressure, 0.05),
            0.0,
            10.0,
        )
        self.state.coolant_temp = self._clamp(
            self._add_noise(self.state.coolant_temp, 0.3),
            40.0,
            130.0,
        )
        self.state.brake_pressure = self._clamp(
            self._add_noise(self.state.brake_pressure, 0.1),
            0.0,
            12.0,
        )
        self.state.voltage = self._clamp(
            self._add_noise(self.state.voltage, 2.0),
            400.0,
            800.0,
        )
        self.state.current = self._clamp(
            self.state.speed * 5 + random.gauss(100, 20),
            0.0,
            1500.0,
        )
        self.state.axle_load = self._clamp(
            self._add_noise(self.state.axle_load, 0.1),
            10.0,
            25.0,
        )
        self.state.vibration = self._clamp(
            self._add_noise(self.state.vibration, 0.2),
            0.0,
            20.0,
        )

        # Route progress based on speed
        km_per_tick = (self.state.speed / 3600.0) * self.interval
        self.state.route_progress += km_per_tick / TOTAL_DISTANCE_KM
        if self.state.route_progress >= 1.0:
            self.state.route_progress = 0.0  # Loop the route
            self.state.fuel_level = 85.0

        # Expire stale alerts
        self._check_alerts()

        lat, lng = self._interpolate_position(self.state.route_progress)

        return TelemetryPoint(
            timestamp=time.time(),
            locomotive_id=LOCOMOTIVE_ID,
            speed=round(self.state.speed, 1),
            rpm=round(self.state.rpm, 0),
            fuel_level=round(self.state.fuel_level, 1),
            oil_pressure=round(self.state.oil_pressure, 2),
            coolant_temp=round(self.state.coolant_temp, 1),
            brake_pressure=round(self.state.brake_pressure, 2),
            voltage=round(self.state.voltage, 1),
            current=round(self.state.current, 0),
            axle_load=round(self.state.axle_load, 1),
            vibration=round(self.state.vibration, 2),
            latitude=round(lat, 6),
            longitude=round(lng, 6),
        )

    @property
    def active_alerts(self) -> list[Alert]:
        """Return current active alerts."""
        return list(self.state.alerts)
