'use client';

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { HealthIndex } from '@/lib/types';

interface HealthGaugeProps {
  health: HealthIndex | null;
}

export function HealthGauge({ health }: HealthGaugeProps) {
  const score = health?.score ?? 0;
  const category = health?.category ?? '-';

  // Data for the background gauge (5 segments)
  const data = [
    { name: 'E', value: 20, color: '#ef4444' }, // Red
    { name: 'D', value: 20, color: '#f97316' }, // Orange
    { name: 'C', value: 20, color: '#f59e0b' }, // Amber
    { name: 'B', value: 20, color: '#3b82f6' }, // Blue
    { name: 'A', value: 20, color: '#22c55e' }, // Green
  ];

  // Calculate needle rotation (0 to 180 degrees)
  // Score 0 -> 180deg (left), Score 100 -> 0deg (right)
  const needleRotation = 180 - (score / 100) * 180;

  return (
    <div className="relative w-full h-[200px] flex flex-col items-center justify-end pb-4">
      <div className="absolute inset-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="80%"
              startAngle={180}
              endAngle={0}
              innerRadius="60%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
              isAnimationActive={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* Needle */}
      <div 
        className="absolute bottom-[20%] left-1/2 w-1 h-[40%] bg-slate-800 dark:bg-white origin-bottom rounded-t-full transition-transform duration-500 ease-out z-10"
        style={{ 
          transform: `translateX(-50%) rotate(${needleRotation - 90}deg)`,
        }}
      >
        <div className="absolute -bottom-2 -left-1.5 w-4 h-4 rounded-full bg-slate-800 dark:bg-white" />
      </div>

      {/* Score Text */}
      <div className="absolute bottom-0 flex flex-col items-center">
        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-bold text-slate-900 dark:text-white tracking-tighter">
            {score.toFixed(1)}
          </span>
          <span className="text-xl font-semibold text-slate-500 dark:text-slate-400">
            /100
          </span>
        </div>
        <div className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1">
          Category {category}
        </div>
      </div>
    </div>
  );
}
