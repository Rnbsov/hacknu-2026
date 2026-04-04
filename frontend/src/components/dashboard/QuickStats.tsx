import React from 'react';
import { Activity, Droplets, Gauge, Thermometer, Zap } from 'lucide-react';
import { TelemetryPoint } from '@/lib/types';
import { Panel } from '../ui/Panel';
import { clsx } from 'clsx';

interface QuickStatsProps {
  data: TelemetryPoint | null;
}

export function QuickStats({ data }: QuickStatsProps) {
  const stats = [
    {
      name: 'Speed',
      value: data?.speed.toFixed(1) ?? '--',
      unit: 'km/h',
      icon: Gauge,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      status: 'normal',
    },
    {
      name: 'Engine RPM',
      value: data?.rpm.toFixed(0) ?? '--',
      unit: 'rpm',
      icon: Activity,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      status: 'normal',
    },
    {
      name: 'Fuel Level',
      value: data?.fuel_level.toFixed(1) ?? '--',
      unit: '%',
      icon: Droplets,
      color: (data?.fuel_level ?? 100) < 20 ? 'text-red-500' : (data?.fuel_level ?? 100) < 40 ? 'text-amber-500' : 'text-green-500',
      bg: (data?.fuel_level ?? 100) < 20 ? 'bg-red-500/10' : (data?.fuel_level ?? 100) < 40 ? 'bg-amber-500/10' : 'bg-green-500/10',
      status: (data?.fuel_level ?? 100) < 20 ? 'critical' : (data?.fuel_level ?? 100) < 40 ? 'warning' : 'normal',
    },
    {
      name: 'Oil Pressure',
      value: data?.oil_pressure.toFixed(1) ?? '--',
      unit: 'bar',
      icon: Droplets,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      status: 'normal',
    },
    {
      name: 'Coolant Temp',
      value: data?.coolant_temp.toFixed(1) ?? '--',
      unit: '°C',
      icon: Thermometer,
      color: (data?.coolant_temp ?? 0) > 95 ? 'text-red-500' : (data?.coolant_temp ?? 0) > 90 ? 'text-amber-500' : 'text-cyan-500',
      bg: (data?.coolant_temp ?? 0) > 95 ? 'bg-red-500/10' : (data?.coolant_temp ?? 0) > 90 ? 'bg-amber-500/10' : 'bg-cyan-500/10',
      status: (data?.coolant_temp ?? 0) > 95 ? 'critical' : (data?.coolant_temp ?? 0) > 90 ? 'warning' : 'normal',
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Panel key={stat.name} className="flex flex-row items-center justify-between p-4 gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 truncate">
                {stat.name}
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={clsx(
                  "text-xl sm:text-2xl font-bold tracking-tight truncate",
                  stat.status === 'critical' ? 'text-red-600 dark:text-red-400' :
                  stat.status === 'warning' ? 'text-amber-600 dark:text-amber-400' :
                  'text-slate-900 dark:text-white'
                )}>
                  {stat.value}
                </span>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.unit}
                </span>
              </div>
            </div>
            <div className={clsx('p-2 sm:p-3 rounded-xl shrink-0', stat.bg, stat.color)}>
              <Icon className="w-6 h-6" />
            </div>
          </Panel>
        );
      })}
    </div>
  );
}
