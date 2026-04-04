export interface TelemetryPoint {
  timestamp: number;
  locomotive_id: string;
  speed: number;
  rpm: number;
  fuel_level: number;
  oil_pressure: number;
  coolant_temp: number;
  brake_pressure: number;
  voltage: number;
  current: number;
  axle_load: number;
  vibration: number;
  latitude: number;
  longitude: number;
}

export interface HealthFactor {
  parameter: string;
  contribution: number;
  value: number;
  normal_range: [number, number];
  status: 'normal' | 'warning' | 'critical';
}

export interface HealthIndex {
  score: number;
  category: 'A' | 'B' | 'C' | 'D' | 'E';
  top_factors: HealthFactor[];
  timestamp: number;
}

export interface Alert {
  id: string;
  timestamp: number;
  severity: 'info' | 'warning' | 'critical';
  parameter: string;
  message: string;
  value: number;
  threshold: number;
}

export interface TelemetryMessage {
  type: 'telemetry';
  data: TelemetryPoint;
  health: HealthIndex;
  alerts: Alert[];
}
