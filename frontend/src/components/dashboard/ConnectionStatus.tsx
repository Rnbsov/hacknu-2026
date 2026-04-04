import React from 'react';
import { clsx } from 'clsx';

interface ConnectionStatusProps {
  status: 'connecting' | 'connected' | 'disconnected' | 'reconnecting';
}

export function ConnectionStatus({ status }: ConnectionStatusProps) {
  const statusConfig = {
    connected: { color: 'bg-green-500', text: 'Connected', pulse: true },
    connecting: { color: 'bg-yellow-500', text: 'Connecting...', pulse: true },
    reconnecting: { color: 'bg-yellow-500', text: 'Reconnecting...', pulse: true },
    disconnected: { color: 'bg-red-500', text: 'Disconnected', pulse: false },
  };

  const config = statusConfig[status];

  return (
    <div 
      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50"
      role="status"
    >
      <div className="relative flex h-2.5 w-2.5">
        {config.pulse && (
          <span
            className={clsx(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-75',
              config.color
            )}
          />
        )}
        <span
          className={clsx(
            'relative inline-flex h-2.5 w-2.5 rounded-full',
            config.color
          )}
        />
      </div>
      <span className="text-xs font-medium text-slate-600 dark:text-slate-300">
        {config.text}
      </span>
    </div>
  );
}
