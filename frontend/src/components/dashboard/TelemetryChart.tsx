'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import { format } from 'date-fns';
import { useTheme } from '@/context/ThemeContext';

interface DataKeyConfig {
  key: string;
  color: string;
  label: string;
}

interface TelemetryChartProps {
  data: any[];
  dataKeys: DataKeyConfig[];
  title?: string;
}

export function TelemetryChart({ data, dataKeys, title }: TelemetryChartProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const gridColor = isDark ? '#1e293b' : '#e2e8f0';
  const axisColor = isDark ? '#475569' : '#94a3b8';
  const textColor = isDark ? '#94a3b8' : '#64748b';
  const tooltipBg = isDark ? '#0f172a' : '#ffffff';
  const tooltipBorder = isDark ? '#1e293b' : '#e2e8f0';

  const formatTime = (timestamp: number) => {
    if (!timestamp) return '';
    // Assuming timestamp is in seconds or milliseconds. If seconds, multiply by 1000.
    // The backend JSON example shows 1234567890.123 (seconds)
    const ms = timestamp > 1e11 ? timestamp : timestamp * 1000;
    return format(new Date(ms), 'HH:mm:ss');
  };

  return (
    <div className="w-full h-full min-h-[250px] flex flex-col">
      {title && (
        <h4 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-4">
          {title}
        </h4>
      )}
      <div className="flex-1 w-full h-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 10, left: -20, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
            <XAxis
              dataKey="timestamp"
              tickFormatter={formatTime}
              stroke={axisColor}
              tick={{ fill: textColor, fontSize: 12 }}
              tickMargin={10}
              minTickGap={30}
            />
            <YAxis
              stroke={axisColor}
              tick={{ fill: textColor, fontSize: 12 }}
              tickMargin={10}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: tooltipBg,
                borderColor: tooltipBorder,
                borderRadius: '8px',
                color: isDark ? '#f8fafc' : '#0f172a',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
              }}
              labelFormatter={(label) => formatTime(label as number)}
              isAnimationActive={false}
            />
            <Legend 
              wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
              iconType="circle"
            />
            {dataKeys.map((config) => (
              <Line
                key={config.key}
                type="monotone"
                dataKey={config.key}
                name={config.label}
                stroke={config.color}
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
                activeDot={{ r: 4, strokeWidth: 0 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
