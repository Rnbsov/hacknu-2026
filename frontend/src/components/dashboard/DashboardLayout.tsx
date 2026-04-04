'use client';

import React from 'react';
import { useTelemetryWebSocket } from '@/hooks/useTelemetryWebSocket';
import { HeaderBar } from './HeaderBar';
import { QuickStats } from './QuickStats';
import { Panel } from '../ui/Panel';
import { HealthGauge } from './HealthGauge';
import { HealthFactors } from './HealthFactors';
import { TelemetryChart } from './TelemetryChart';
import { AlertsPanel } from './AlertsPanel';
import RouteMapWrapper from './RouteMapWrapper';
import { DiagnosticReplay } from './DiagnosticReplay';

export function DashboardLayout() {
  const {
    telemetryHistory,
    currentTelemetry,
    currentHealth,
    alerts,
    connectionStatus,
  } = useTelemetryWebSocket();

  const locomotiveId = currentTelemetry?.locomotive_id || '';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0e1a] text-slate-900 dark:text-slate-100 flex flex-col font-sans">
      <HeaderBar 
        locomotiveId={locomotiveId} 
        connectionStatus={connectionStatus} 
        telemetryHistory={telemetryHistory}
        currentHealth={currentHealth}
        alerts={alerts}
      />
      
      <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
        <div className="max-w-[1920px] mx-auto space-y-3 md:space-y-4 lg:space-y-6">
          
          {/* Top Row: Quick Stats */}
          <QuickStats data={currentTelemetry} />

          {/* Middle Row: Health, Speed/RPM Chart, Alerts */}
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-12 gap-3 md:gap-4 lg:gap-6">
            
            {/* Health Panel (3 cols) */}
            <Panel title="System Health" className="order-2 lg:order-1 lg:col-span-3 min-h-[400px]">
              <HealthGauge health={currentHealth} />
              <HealthFactors factors={currentHealth?.top_factors || []} />
            </Panel>

            {/* Speed & RPM Chart (6 cols) */}
            <Panel title="Speed & Engine RPM" className="order-1 lg:order-2 lg:col-span-6 min-h-[400px]">
              <TelemetryChart
                data={telemetryHistory}
                dataKeys={[
                  { key: 'speed', color: '#3b82f6', label: 'Speed (km/h)' },
                  { key: 'rpm', color: '#8b5cf6', label: 'Engine RPM' },
                ]}
              />
            </Panel>

            {/* Alerts Panel (3 cols) */}
            <Panel title="Active Alerts" className="order-3 lg:order-3 lg:col-span-3 min-h-[400px]">
              <AlertsPanel alerts={alerts} />
            </Panel>

          </div>

          {/* Route Map Row */}
          <Panel title="Route Map — Astana → Almaty" className="min-h-[350px]">
            <RouteMapWrapper
              latitude={currentTelemetry?.latitude ?? null}
              longitude={currentTelemetry?.longitude ?? null}
              speed={currentTelemetry?.speed ?? null}
            />
          </Panel>

          {/* Diagnostic Replay */}
          <Panel title="Diagnostic Replay" className="min-h-[300px]">
            <DiagnosticReplay />
          </Panel>

          {/* Bottom Row: Temp/Pressure Chart, Voltage/Current Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4 lg:gap-6">
            
            {/* Temp & Pressure Chart */}
            <Panel title="Temperature & Pressure" className="min-h-[300px]">
              <TelemetryChart
                data={telemetryHistory}
                dataKeys={[
                  { key: 'coolant_temp', color: '#06b6d4', label: 'Coolant Temp (°C)' },
                  { key: 'oil_pressure', color: '#f59e0b', label: 'Oil Pressure (bar)' },
                  { key: 'brake_pressure', color: '#ef4444', label: 'Brake Pressure (bar)' },
                ]}
              />
            </Panel>

            {/* Voltage & Current Chart */}
            <Panel title="Electrical System" className="min-h-[300px]">
              <TelemetryChart
                data={telemetryHistory}
                dataKeys={[
                  { key: 'voltage', color: '#22c55e', label: 'Voltage (V)' },
                  { key: 'current', color: '#eab308', label: 'Current (A)' },
                ]}
              />
            </Panel>

          </div>

        </div>
      </main>
    </div>
  );
}
