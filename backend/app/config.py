from __future__ import annotations

import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"

LOCOMOTIVE_ID = os.getenv("LOCOMOTIVE_ID", "KTZ-4821")
SIMULATOR_INTERVAL = float(os.getenv("SIMULATOR_INTERVAL", "1.0"))
HISTORY_MAXLEN = int(os.getenv("HISTORY_MAXLEN", "900"))
WS_HEARTBEAT_INTERVAL = float(os.getenv("WS_HEARTBEAT_INTERVAL", "30.0"))
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))
