import React from 'react';
import { Alert } from '@/lib/types';
import { AlertTriangle, CheckCircle2, Info } from 'lucide-react';
import { format } from 'date-fns';
import { clsx } from 'clsx';

interface AlertsPanelProps {
  alerts: Alert[];
}

export function AlertsPanel({ alerts }: AlertsPanelProps) {
  if (!alerts || alerts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 dark:text-slate-400 gap-3">
        <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium">No active alerts</p>
      </div>
    );
  }

  const formatTime = (timestamp: number) => {
    const ms = timestamp > 1e11 ? timestamp : timestamp * 1000;
    return format(new Date(ms), 'HH:mm:ss');
  };

  return (
    <div 
      className="flex flex-col gap-3 overflow-y-auto pr-2 custom-scrollbar h-full max-h-[400px]"
      aria-live="polite"
    >
      {alerts.map((alert) => {
        const isCritical = alert.severity === 'critical';
        const isWarning = alert.severity === 'warning';
        const isInfo = alert.severity === 'info';

        const Icon = isCritical || isWarning ? AlertTriangle : Info;

        return (
          <div
            key={alert.id}
            className={clsx(
              "flex items-start gap-3 p-3 rounded-xl border",
              isCritical ? "bg-red-500/5 border-red-500/20" :
              isWarning ? "bg-amber-500/5 border-amber-500/20" :
              "bg-blue-500/5 border-blue-500/20"
            )}
          >
            <div className={clsx(
              "p-2 rounded-lg shrink-0",
              isCritical ? "bg-red-500/10 text-red-500" :
              isWarning ? "bg-amber-500/10 text-amber-500" :
              "bg-blue-500/10 text-blue-500",
              isCritical && "animate-pulse"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h5 className={clsx(
                  "text-sm font-semibold truncate pr-2",
                  isCritical ? "text-red-600 dark:text-red-400" :
                  isWarning ? "text-amber-600 dark:text-amber-400" :
                  "text-blue-600 dark:text-blue-400"
                )}>
                  {alert.message}
                </h5>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400 shrink-0">
                  {formatTime(alert.timestamp)}
                </span>
              </div>
              
              <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="capitalize">{alert.parameter.replace('_', ' ')}:</span>
                <span className="font-mono font-medium">{alert.value.toFixed(1)}</span>
                <span className="text-slate-400 dark:text-slate-500">
                  (Threshold: {alert.threshold.toFixed(1)})
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
