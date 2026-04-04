export const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/telemetry';
export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
export const MAX_CHART_POINTS = 120; // 2 minutes at 1Hz
export const WS_RECONNECT_DELAY = 2000;
export const BUFFER_FLUSH_INTERVAL = 100; // ms
