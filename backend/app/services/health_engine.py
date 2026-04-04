from __future__ import annotations

import logging
from pathlib import Path
from typing import Any

import yaml

from app.config import DATA_DIR
from app.models.telemetry import Alert, HealthFactor, HealthIndex, TelemetryPoint

logger = logging.getLogger(__name__)


class HealthEngine:
    """Computes Health Index from telemetry data using weighted normalized scores."""

    def __init__(self, config_path: Path | None = None) -> None:
        if config_path is None:
            config_path = DATA_DIR / "health_weights.yaml"
        self._config = self._load_config(config_path)
        self._alert_penalties = self._config.get(
            "alert_penalty", {"info": 2, "warning": 5, "critical": 15}
        )
        logger.info(
            "HealthEngine loaded %d parameter configs",
            len(self._config.get("parameters", {})),
        )

    def _load_config(self, path: Path) -> dict[str, Any]:
        """Load health weights configuration from YAML."""
        with open(path) as f:
            return yaml.safe_load(f)

    def _normalize(
        self,
        value: float,
        optimal: list[float],
        warning: list[float],
        critical: list[float],
    ) -> float:
        """Normalize a parameter value to 0-1 based on range thresholds.

        In optimal range → 1.0
        In warning range → 0.5-0.9
        In critical range → 0.0-0.5
        Beyond critical → 0.0
        """
        opt_lo, opt_hi = optimal
        warn_lo, warn_hi = warning
        crit_lo, crit_hi = critical

        # In optimal range
        if opt_lo <= value <= opt_hi:
            return 1.0

        # Above optimal
        if value > opt_hi:
            if value <= warn_hi:
                t = (value - opt_hi) / (warn_hi - opt_hi) if warn_hi > opt_hi else 0
                return 0.9 - 0.4 * t  # 0.9 -> 0.5
            elif value <= crit_hi:
                t = (value - warn_hi) / (crit_hi - warn_hi) if crit_hi > warn_hi else 0
                return 0.5 - 0.5 * t  # 0.5 -> 0.0
            else:
                return 0.0

        # Below optimal
        if value < opt_lo:
            if value >= warn_lo:
                t = (opt_lo - value) / (opt_lo - warn_lo) if opt_lo > warn_lo else 0
                return 0.9 - 0.4 * t
            elif value >= crit_lo:
                t = (warn_lo - value) / (warn_lo - crit_lo) if warn_lo > crit_lo else 0
                return 0.5 - 0.5 * t
            else:
                return 0.0

        return 1.0

    def _get_status(
        self,
        value: float,
        optimal: list[float],
        warning: list[float],
        critical: list[float],
    ) -> str:
        """Determine the status of a parameter value."""
        if optimal[0] <= value <= optimal[1]:
            return "normal"
        if warning[0] <= value <= warning[1]:
            return "warning"
        return "critical"

    def compute(
        self, telemetry: TelemetryPoint, active_alerts: list[Alert]
    ) -> HealthIndex:
        """Compute the Health Index for a telemetry snapshot."""
        params_config = self._config.get("parameters", {})
        factors: list[HealthFactor] = []
        weighted_sum = 0.0
        total_weight = 0.0

        for param_name, config in params_config.items():
            value = getattr(telemetry, param_name, None)
            if value is None:
                continue

            weight = config["weight"]
            optimal = config["optimal"]
            warning = config["warning"]
            critical = config["critical"]

            normalized = self._normalize(value, optimal, warning, critical)
            deviation = 1.0 - normalized
            contribution = weight * deviation

            weighted_sum += weight * normalized
            total_weight += weight

            status = self._get_status(value, optimal, warning, critical)

            factors.append(
                HealthFactor(
                    parameter=param_name,
                    contribution=round(contribution, 4),
                    value=round(value, 2),
                    normal_range=(optimal[0], optimal[1]),
                    status=status,
                )
            )

        # Base score from weighted normalized values
        if total_weight > 0:
            base_score = (weighted_sum / total_weight) * 100
        else:
            base_score = 100.0

        # Apply alert penalties
        penalty = sum(self._alert_penalties.get(a.severity, 0) for a in active_alerts)
        score = max(0.0, min(100.0, base_score - penalty))

        # Category
        if score >= 80:
            category = "A"
        elif score >= 60:
            category = "B"
        elif score >= 40:
            category = "C"
        elif score >= 20:
            category = "D"
        else:
            category = "E"

        # Sort factors by contribution descending, take top 5
        factors.sort(key=lambda f: f.contribution, reverse=True)
        top_factors = factors[:5]

        return HealthIndex(
            score=round(score, 1),
            category=category,
            top_factors=top_factors,
            timestamp=telemetry.timestamp,
        )

    @property
    def config(self) -> dict[str, Any]:
        """Return the current health weights configuration."""
        return self._config
