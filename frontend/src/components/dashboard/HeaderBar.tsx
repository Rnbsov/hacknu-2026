'use client';

import React from 'react';
import { Train, Sun, Moon } from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import { ConnectionStatus } from './ConnectionStatus';
import { ExportButton } from './ExportButton';
import { TelemetryPoint, HealthIndex, Alert } from '@/lib/types';

interface HeaderBarProps {
  locomotiveId: string;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
  telemetryHistory: TelemetryPoint[];
  currentHealth: HealthIndex | null;
  alerts: Alert[];
}

export function HeaderBar({ locomotiveId, connectionStatus, telemetryHistory, currentHealth, alerts }: HeaderBarProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 px-4 md:px-6 py-4 bg-white dark:bg-slate-900/80 border-b border-gray-200 dark:border-blue-500/10 backdrop-blur-xl">
      <div className="flex items-center gap-4">
        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
          <Train className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            KTZh Digital Twin
          </h1>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
            <span className="font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-xs truncate max-w-[120px] sm:max-w-none">
              {locomotiveId || 'WAITING FOR DATA'}
            </span>
            <span className="hidden md:inline">•</span>
            <span className="hidden md:inline">Astana - Almaty Route</span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <ConnectionStatus status={connectionStatus} />
        
        <ExportButton 
          telemetryHistory={telemetryHistory}
          currentHealth={currentHealth}
          alerts={alerts}
        />
        
        <button
          type="button"
          onClick={toggleTheme}
          className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>
      </div>
    </header>
  );
}
