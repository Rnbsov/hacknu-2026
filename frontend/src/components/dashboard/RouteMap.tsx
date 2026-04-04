'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '@/context/ThemeContext';

// Fix default marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const ROUTE_POINTS = [
  { name: 'Astana', lat: 51.1694, lng: 71.4491 },
  { name: 'Karaganda Dir.', lat: 50.2839, lng: 72.0891 },
  { name: 'Karaganda', lat: 49.8047, lng: 73.1094 },
  { name: 'Balkhash App.', lat: 48.0196, lng: 73.8553 },
  { name: 'Balkhash', lat: 46.8481, lng: 75.0000 },
  { name: 'Midway', lat: 45.4596, lng: 75.9521 },
  { name: 'Almaty App.', lat: 44.3515, lng: 76.5234 },
  { name: 'Almaty', lat: 43.2380, lng: 76.9450 },
];

const polylinePositions: [number, number][] = ROUTE_POINTS.map(p => [p.lat, p.lng]);

interface RouteMapProps {
  latitude: number | null;
  longitude: number | null;
  speed: number | null;
}

// Component to smoothly follow the train
function MapFollower({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  
  return null;
}

export default function RouteMap({ latitude, longitude, speed }: RouteMapProps) {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return <div className="w-full h-full min-h-[350px] bg-slate-100 dark:bg-slate-800 animate-pulse rounded-lg" />;

  const tileUrl = theme === 'dark' 
    ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
    : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png';

  const trainIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: `<div class="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-[0_0_10px_rgba(59,130,246,0.8)] animate-pulse"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

  const hasValidPosition = latitude !== null && longitude !== null;
  const centerLat = hasValidPosition ? latitude : ROUTE_POINTS[0].lat;
  const centerLng = hasValidPosition ? longitude : ROUTE_POINTS[0].lng;

  return (
    <div className="w-full h-full min-h-[350px] rounded-lg overflow-hidden relative z-0">
      <MapContainer 
        center={[centerLat, centerLng]} 
        zoom={6} 
        scrollWheelZoom={false}
        className="w-full h-full absolute inset-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        
        <Polyline positions={polylinePositions} color="#3b82f6" weight={3} opacity={0.7} />
        
        {ROUTE_POINTS.map((point, idx) => (
          <Marker key={point.name} position={[point.lat, point.lng]}>
            <Popup>{point.name}</Popup>
          </Marker>
        ))}

        {hasValidPosition && (
          <>
            <Marker position={[latitude, longitude]} icon={trainIcon}>
              <Popup>
                <div className="font-semibold">Locomotive</div>
                <div>Speed: {speed !== null ? `${speed.toFixed(1)} km/h` : 'N/A'}</div>
              </Popup>
            </Marker>
            <MapFollower lat={latitude} lng={longitude} />
          </>
        )}
      </MapContainer>
    </div>
  );
}
