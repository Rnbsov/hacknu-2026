import React from 'react';
import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

interface PanelProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  children: React.ReactNode;
}

export function Panel({ title, children, className, ...props }: PanelProps) {
  return (
    <div
      className={cn(
        'flex flex-col rounded-xl p-4',
        'bg-white border border-gray-200 shadow-sm',
        'dark:bg-slate-900/80 dark:border-blue-500/10 dark:backdrop-blur-xl',
        'transition-all duration-200 hover:shadow-md dark:hover:border-blue-500/20 animate-fadeIn',
        className
      )}
      {...props}
    >
      {title && (
        <h3 className="mb-4 text-sm font-semibold tracking-wider text-slate-500 dark:text-slate-400 uppercase">
          {title}
        </h3>
      )}
      <div className="flex-1 min-h-0">
        {children}
      </div>
    </div>
  );
}
