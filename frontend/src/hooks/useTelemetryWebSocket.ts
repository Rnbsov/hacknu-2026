'use client';

import { useEffect, useReducer, useRef } from 'react';
import { Alert, HealthIndex, TelemetryMessage, TelemetryPoint } from '@/lib/types';
import { BUFFER_FLUSH_INTERVAL, MAX_CHART_POINTS, WS_RECONNECT_DELAY, WS_URL } from '@/lib/constants';

type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'reconnecting';

interface TelemetryState {
  telemetryHistory: TelemetryPoint[];
  currentTelemetry: TelemetryPoint | null;
  currentHealth: HealthIndex | null;
  alerts: Alert[];
  connectionStatus: ConnectionStatus;
}

type TelemetryAction =
  | { type: 'SET_STATUS'; payload: ConnectionStatus }
  | { type: 'FLUSH_BUFFER'; payload: TelemetryMessage[] };

const initialState: TelemetryState = {
  telemetryHistory: [],
  currentTelemetry: null,
  currentHealth: null,
  alerts: [],
  connectionStatus: 'disconnected',
};

function telemetryReducer(state: TelemetryState, action: TelemetryAction): TelemetryState {
  switch (action.type) {
    case 'SET_STATUS':
      return { ...state, connectionStatus: action.payload };
    case 'FLUSH_BUFFER': {
      if (action.payload.length === 0) return state;

      const newPoints = action.payload.map((msg) => msg.data);
      const latestMsg = action.payload[action.payload.length - 1];
      
      // Update history with new points, keeping only MAX_CHART_POINTS
      const updatedHistory = [...state.telemetryHistory, ...newPoints].slice(-MAX_CHART_POINTS);
      
      // Merge new alerts, keeping them unique by ID and sorted by timestamp desc
      const newAlertsMap = new Map(state.alerts.map(a => [a.id, a]));
      action.payload.forEach(msg => {
        msg.alerts.forEach(alert => {
          newAlertsMap.set(alert.id, alert);
        });
      });
      const updatedAlerts = Array.from(newAlertsMap.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 50); // Keep last 50 alerts

      return {
        ...state,
        telemetryHistory: updatedHistory,
        currentTelemetry: latestMsg.data,
        currentHealth: latestMsg.health,
        alerts: updatedAlerts,
      };
    }
    default:
      return state;
  }
}

export function useTelemetryWebSocket() {
  const [state, dispatch] = useReducer(telemetryReducer, initialState);
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<TelemetryMessage[]>([]);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let isMounted = true;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;

      dispatch({ type: 'SET_STATUS', payload: state.connectionStatus === 'disconnected' ? 'connecting' : 'reconnecting' });

      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          if (!isMounted) return;
          dispatch({ type: 'SET_STATUS', payload: 'connected' });
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
          }
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const message: TelemetryMessage = JSON.parse(event.data);
            if (message.type === 'telemetry') {
              bufferRef.current.push(message);
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          dispatch({ type: 'SET_STATUS', payload: 'disconnected' });
          // Attempt to reconnect
          reconnectTimeoutRef.current = setTimeout(connect, WS_RECONNECT_DELAY);
        };

        ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          ws.close();
        };

        wsRef.current = ws;
      } catch (error) {
        console.error('Failed to create WebSocket:', error);
        dispatch({ type: 'SET_STATUS', payload: 'disconnected' });
        reconnectTimeoutRef.current = setTimeout(connect, WS_RECONNECT_DELAY);
      }
    };

    connect();

    // Flush buffer periodically
    const flushInterval = setInterval(() => {
      if (bufferRef.current.length > 0) {
        dispatch({ type: 'FLUSH_BUFFER', payload: [...bufferRef.current] });
        bufferRef.current = [];
      }
    }, BUFFER_FLUSH_INTERVAL);

    return () => {
      isMounted = false;
      clearInterval(flushInterval);
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, []); // Empty dependency array to run only once on mount

  return state;
}
