import React from 'react';
import { HealthFactor } from '@/lib/types';
import { Activity, AlertTriangle, CheckCircle2, Thermometer, Zap } from 'lucide-react';
import { clsx } from 'clsx';

interface HealthFactorsProps {
  factors: HealthFactor[];
}

export function HealthFactors({ factors }: HealthFactorsProps) {
  if (!factors || factors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500 dark:text-slate-400 text-sm">
        No health factors available
      </div>
    );
  }

  const getIcon = (parameter: string) => {
    if (parameter.includes('temp')) return Thermometer;
    if (parameter.includes('voltage') || parameter.includes('current')) return Zap;
    if (parameter.includes('vibration')) return Activity;
    return Activity;
  };

  return (
    <div className="flex flex-col gap-3 mt-4">
      <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
        Top Contributing Factors
      </h4>
      {factors.map((factor, idx) => {
        const Icon = getIcon(factor.parameter);
        const isCritical = factor.status === 'critical';
        const isWarning = factor.status === 'warning';
        
        return (
          <div key={`${factor.parameter}-${idx}`} className="flex items-center gap-3">
            <div className={clsx(
              "p-2 rounded-lg",
              isCritical ? "bg-red-500/10 text-red-500" :
              isWarning ? "bg-amber-500/10 text-amber-500" :
              "bg-green-500/10 text-green-500"
            )}>
              <Icon className="w-4 h-4" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline mb-1">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">
                  {factor.parameter.replace('_', ' ')}
                </span>
                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {factor.value.toFixed(1)}
                </span>
              </div>
              
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={clsx(
                    "h-full rounded-full",
                    isCritical ? "bg-red-500" :
                    isWarning ? "bg-amber-500" :
                    "bg-green-500"
                  )}
                  style={{ width: `${Math.min(100, factor.contribution * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="w-6 flex justify-end">
              {isCritical || isWarning ? (
                <AlertTriangle className={clsx(
                  "w-4 h-4",
                  isCritical ? "text-red-500" : "text-amber-500"
                )} />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
