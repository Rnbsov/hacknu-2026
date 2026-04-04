'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, ChevronDown } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { API_URL } from '@/lib/constants';
import { TelemetryPoint } from '@/lib/types';

interface HistoryEntry {
  data: TelemetryPoint;
  health: { score: number; category: string };
  alerts: unknown[];
}

const TIME_RANGES = [
  { label: '5 min', minutes: 5 },
  { label: '10 min', minutes: 10 },
  { label: '15 min', minutes: 15 },
] as const;

export function DiagnosticReplay() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRange, setSelectedRange] = useState<number>(5);
  const [cursorIdx, setCursorIdx] = useState<number>(0);
  const [playing, setPlaying] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchHistory = useCallback(async (minutes: number) => {
    setLoading(true);
    setPlaying(false);
    if (playRef.current) clearInterval(playRef.current);
    try {
      const res = await fetch(`${API_URL}/api/telemetry/history?minutes=${minutes}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data: HistoryEntry[] = await res.json();
      setHistory(data);
      setCursorIdx(data.length > 0 ? data.length - 1 : 0);
    } catch {
      setHistory([]);
      setCursorIdx(0);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetchHistory(selectedRange);
  }, [fetchHistory, selectedRange]);

  // Playback timer
  useEffect(() => {
    if (playing && history.length > 1) {
      playRef.current = setInterval(() => {
        setCursorIdx((prev) => {
          if (prev >= history.length - 1) {
            setPlaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 200);
    }
    return () => {
      if (playRef.current) clearInterval(playRef.current);
    };
  }, [playing, history.length]);

  const handleRangeSelect = (minutes: number) => {
    setSelectedRange(minutes);
    setDropdownOpen(false);
  };

  const currentEntry = history[cursorIdx] ?? null;

  // Chart data: speed + health score over time
  const chartData = history.map((entry, idx) => ({
    idx,
    time: new Date(entry.data.timestamp * 1000).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }),
    speed: entry.data.speed,
    health: entry.health.score,
  }));

  const formatTooltipTime = (label: React.ReactNode) => label;

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Controls Row */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Time range dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <Clock className="w-3.5 h-3.5" />
            {TIME_RANGES.find((r) => r.minutes === selectedRange)?.label ?? `${selectedRange} min`}
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
          {dropdownOpen && (
            <div className="absolute top-full left-0 mt-1 w-28 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-lg z-50 overflow-hidden">
              {TIME_RANGES.map((r) => (
                <button
                  type="button"
                  key={r.minutes}
                  onClick={() => handleRangeSelect(r.minutes)}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                    selectedRange === r.minutes
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium'
                      : 'text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Playback controls */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              if (cursorIdx >= history.length - 1) setCursorIdx(0);
              setPlaying(!playing);
            }}
            disabled={history.length < 2}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label={playing ? 'Pause replay' : 'Play replay'}
          >
            {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={() => {
              setPlaying(false);
              setCursorIdx(0);
            }}
            disabled={history.length < 2}
            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Reset replay"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Slider */}
        <input
          type="range"
          min={0}
          max={Math.max(history.length - 1, 0)}
          value={cursorIdx}
          onChange={(e) => {
            setPlaying(false);
            setCursorIdx(Number(e.target.value));
          }}
          disabled={history.length < 2}
          className="flex-1 min-w-[100px] h-1.5 appearance-none rounded-full bg-slate-200 dark:bg-slate-700 accent-blue-500 disabled:opacity-40 cursor-pointer"
          aria-label="Replay position"
        />

        {/* Timestamp badge */}
        {currentEntry && (
          <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded whitespace-nowrap">
            {new Date(currentEntry.data.timestamp * 1000).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false,
            })}
          </span>
        )}
      </div>

      {/* Snapshot Card */}
      {currentEntry && (
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center">
          {[
            { label: 'Speed', value: `${currentEntry.data.speed.toFixed(1)}`, unit: 'km/h' },
            { label: 'RPM', value: `${currentEntry.data.rpm.toFixed(0)}`, unit: '' },
            { label: 'Health', value: `${currentEntry.health.score.toFixed(0)}`, unit: currentEntry.health.category },
            { label: 'Coolant', value: `${currentEntry.data.coolant_temp.toFixed(1)}`, unit: '°C' },
            { label: 'Oil', value: `${currentEntry.data.oil_pressure.toFixed(1)}`, unit: 'bar' },
            { label: 'Fuel', value: `${currentEntry.data.fuel_level.toFixed(1)}`, unit: '%' },
          ].map((stat) => (
            <div
              key={stat.label}
              className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-2 border border-slate-200/50 dark:border-slate-700/30"
            >
              <div className="text-xs text-slate-500 dark:text-slate-400 mb-0.5">{stat.label}</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">
                {stat.value}
                {stat.unit && (
                  <span className="text-xs font-normal text-slate-400 dark:text-slate-500 ml-0.5">
                    {stat.unit}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mini Chart */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          <div className="text-sm text-slate-400 dark:text-slate-500">Loading history...</div>
        </div>
      ) : chartData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center min-h-[120px]">
          <div className="text-sm text-slate-400 dark:text-slate-500">No history data available</div>
        </div>
      ) : (
        <div className="flex-1 min-h-[120px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                interval="preserveStartEnd"
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="speed"
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <YAxis
                yAxisId="health"
                orientation="right"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                tickLine={false}
                axisLine={false}
                width={35}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(15, 23, 42, 0.9)',
                  border: '1px solid rgba(51, 65, 85, 0.5)',
                  borderRadius: '8px',
                  color: '#e2e8f0',
                  fontSize: '12px',
                }}
                labelFormatter={formatTooltipTime}
              />
              <Line
                yAxisId="speed"
                type="monotone"
                dataKey="speed"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Speed (km/h)"
              />
              <Line
                yAxisId="health"
                type="monotone"
                dataKey="health"
                stroke="#22c55e"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
                name="Health Score"
              />
              {/* Cursor line */}
              {history.length > 0 && (
                <Line
                  yAxisId="speed"
                  type="monotone"
                  dataKey="speed"
                  stroke="transparent"
                  dot={false}
                  isAnimationActive={false}
                  activeDot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
