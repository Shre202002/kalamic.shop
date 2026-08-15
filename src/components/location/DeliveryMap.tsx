'use client';

import 'leaflet/dist/leaflet.css';
import { useMemo } from 'react';
import { MapContainer, Marker, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import { DeliveryLocation } from '@/lib/types/location';

export default function DeliveryMap({ location }: { location: DeliveryLocation }) {
  const icon = useMemo(() => L.icon({ iconUrl: '/leaflet/marker-icon.png', iconRetinaUrl: '/leaflet/marker-icon-2x.png', shadowUrl: '/leaflet/marker-shadow.png', iconSize: [25, 41], iconAnchor: [12, 41] }), []);
  return <div className="overflow-hidden rounded-xl" style={{ height: 220 }}>
    <MapContainer center={[location.latitude, location.longitude]} zoom={16} scrollWheelZoom={false} dragging={false} doubleClickZoom={false} className="h-full w-full">
      <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      <Marker position={[location.latitude, location.longitude]} icon={icon} />
    </MapContainer>
  </div>;
}
