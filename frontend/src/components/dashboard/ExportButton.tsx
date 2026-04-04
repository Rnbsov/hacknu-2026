'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';
import { TelemetryPoint, HealthIndex, Alert } from '@/lib/types';

interface ExportButtonProps {
  telemetryHistory: TelemetryPoint[];
  currentHealth: HealthIndex | null;
  alerts: Alert[];
}

export function ExportButton({ telemetryHistory, currentHealth, alerts }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const exportCSV = () => {
    if (!telemetryHistory.length) return;

    const headers = [
      'timestamp', 'speed', 'rpm', 'fuel_level', 'oil_pressure', 
      'coolant_temp', 'brake_pressure', 'voltage', 'current', 
      'axle_load', 'vibration', 'latitude', 'longitude'
    ];

    const csvRows = [
      headers.join(','),
      ...telemetryHistory.map(point => {
        return [
          new Date(point.timestamp * 1000).toISOString(),
          point.speed,
          point.rpm,
          point.fuel_level,
          point.oil_pressure,
          point.coolant_temp,
          point.brake_pressure,
          point.voltage,
          point.current,
          point.axle_load,
          point.vibration,
          point.latitude,
          point.longitude
        ].join(',');
      })
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ktj-telemetry-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setIsOpen(false);
  };

  const exportPDF = () => {
    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const now = new Date().toLocaleString();
    
    // Calculate summary stats for last 5 minutes
    const fiveMinsAgo = Date.now() / 1000 - 300;
    const recentTelemetry = telemetryHistory.filter(p => p.timestamp >= fiveMinsAgo);
    
    let avgSpeed = 0, avgRpm = 0, minCoolant = 0, maxCoolant = 0;
    if (recentTelemetry.length > 0) {
      avgSpeed = recentTelemetry.reduce((sum, p) => sum + p.speed, 0) / recentTelemetry.length;
      avgRpm = recentTelemetry.reduce((sum, p) => sum + p.rpm, 0) / recentTelemetry.length;
      minCoolant = Math.min(...recentTelemetry.map(p => p.coolant_temp));
      maxCoolant = Math.max(...recentTelemetry.map(p => p.coolant_temp));
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KTZh Locomotive Health Report</title>
        <style>
          body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; padding: 20px; }
          h1 { color: #1a365d; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; }
          h2 { color: #2d3748; margin-top: 30px; }
          .meta { color: #718096; font-size: 0.9em; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid #cbd5e0; padding: 8px 12px; text-align: left; }
          th { background-color: #f7fafc; font-weight: bold; }
          .score-box { background: #f7fafc; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; display: inline-block; margin-bottom: 20px; }
          .score-value { font-size: 24px; font-weight: bold; color: #2b6cb0; }
          .critical { color: #e53e3e; }
          .warning { color: #dd6b20; }
          .normal { color: #38a169; }
        </style>
      </head>
      <body>
        <h1>KTZh Locomotive Health Report</h1>
        <div class="meta">Generated at: ${now}</div>

        <div class="score-box">
          <div>Current Health Score</div>
          <div class="score-value">${currentHealth ? `${currentHealth.score.toFixed(1)} (Category ${currentHealth.category})` : 'N/A'}</div>
        </div>

        <h2>Last 5 Minutes Summary</h2>
        <table>
          <tr><th>Metric</th><th>Value</th></tr>
          <tr><td>Average Speed</td><td>${avgSpeed.toFixed(1)} km/h</td></tr>
          <tr><td>Average RPM</td><td>${avgRpm.toFixed(0)}</td></tr>
          <tr><td>Coolant Temp Range</td><td>${minCoolant.toFixed(1)} - ${maxCoolant.toFixed(1)} °C</td></tr>
        </table>

        <h2>Top Health Factors</h2>
        <table>
          <tr><th>Parameter</th><th>Status</th><th>Value</th><th>Contribution</th></tr>
          ${currentHealth?.top_factors.map(f => `
            <tr>
              <td>${f.parameter}</td>
              <td class="${f.status}">${f.status.toUpperCase()}</td>
              <td>${f.value.toFixed(2)}</td>
              <td>${(f.contribution * 100).toFixed(1)}%</td>
            </tr>
          `).join('') || '<tr><td colspan="4">No data available</td></tr>'}
        </table>

        <h2>Active Alerts</h2>
        <table>
          <tr><th>Time</th><th>Severity</th><th>Parameter</th><th>Message</th></tr>
          ${alerts.length > 0 ? alerts.map(a => `
            <tr>
              <td>${new Date(a.timestamp * 1000).toLocaleTimeString()}</td>
              <td class="${a.severity}">${a.severity.toUpperCase()}</td>
              <td>${a.parameter}</td>
              <td>${a.message}</td>
            </tr>
          `).join('') : '<tr><td colspan="4">No active alerts</td></tr>'}
        </table>
      </body>
      </html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    iframe.onload = () => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    };

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
        title="Export Data"
        aria-label="Export Data"
      >
        <Download className="w-5 h-5" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            type="button"
            onClick={exportCSV}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportPDF}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left focus:outline-none focus:bg-slate-100 dark:focus:bg-slate-800"
          >
            <FileText className="w-4 h-4" />
            Export PDF Report
          </button>
        </div>
      )}
    </div>
  );
}
