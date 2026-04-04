'use client';

import dynamic from 'next/dynamic';

interface RouteMapProps {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
}

const RouteMap = dynamic(() => import('./RouteMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[350px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg flex items-center justify-center">
      <span className="text-slate-400 dark:text-slate-500">Loading map...</span>
    </div>
  ),
});

export default function RouteMapWrapper(props: RouteMapProps) {
  return <RouteMap {...props} />;
}
