'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Loader2, MapPin, LocateFixed } from 'lucide-react';
import { DeliveryLocation, LocationSource } from '@/lib/types/location';

const DEFAULT_CENTER: [number, number] = [26.4499, 80.3319]; // Kanpur

function MapInteractions({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  useMapEvents({ click: (event) => onPick(event.latlng.lat, event.latlng.lng) });
  return null;
}

function Recenter({ location }: { location: DeliveryLocation | null }) {
  const map = useMap();
  useEffect(() => {
    if (location) map.setView([location.latitude, location.longitude], Math.max(map.getZoom(), 15));
  }, [location, map]);
  return null;
}

interface Props {
  address: string;
  city: string;
  state: string;
  pincode: string;
  value: DeliveryLocation | null;
  onChange: (location: DeliveryLocation) => void;
  requirePin?: boolean;
}

export default function LocationPicker({ address, city, state, pincode, value, onChange, requirePin = true }: Props) {
  const [status, setStatus] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [mapReady, setMapReady] = useState(false);
  const center = useMemo<[number, number]>(() => value ? [value.latitude, value.longitude] : DEFAULT_CENTER, [value]);
  const icon = useMemo(() => L.icon({
    iconUrl: '/leaflet/marker-icon.png',
    iconRetinaUrl: '/leaflet/marker-icon-2x.png',
    shadowUrl: '/leaflet/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41],
  }), []);

  const setPoint = (latitude: number, longitude: number, source: LocationSource, accuracy?: number | null) => {
    onChange({ latitude, longitude, source, accuracy: accuracy ?? null, updatedAt: new Date().toISOString() });
    setStatus(source === 'manual' ? 'Pin manually adjusted.' : source === 'gps' ? 'GPS location selected.' : 'Address found on the map.');
  };

  const findOnMap = async () => {
    const query = [address, city, state, pincode, 'India'].filter(Boolean).join(', ');
    if (query.length < 8) { setStatus('Enter a fuller address and pincode first.'); return; }
    setIsGeocoding(true); setStatus('Finding address…');
    try {
      const response = await fetch('/api/geocode', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Address not found');
      setPoint(data.latitude, data.longitude, 'geocoded');
    } catch (error: any) {
      setStatus(error.message || 'Could not find that address. Place the pin manually.');
    } finally { setIsGeocoding(false); }
  };

  const useMyLocation = () => {
    if (!navigator.geolocation) { setStatus('GPS is not available in this browser.'); return; }
    setStatus('Requesting your location…');
    navigator.geolocation.getCurrentPosition(
      (position) => setPoint(position.coords.latitude, position.coords.longitude, 'gps', position.coords.accuracy),
      () => setStatus('Location permission was denied. You can place the pin manually.'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
    );
  };

  useEffect(() => {
    const query = [address, city, state, pincode].filter(Boolean).join(', ');
    if (pincode.length !== 6 || query.length < 8 || value) return;
    const timer = window.setTimeout(() => { void findOnMap(); }, 900);
    return () => window.clearTimeout(timer);
  }, [address, city, state, pincode, value]);

  return <div className="space-y-3">
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" onClick={findOnMap} disabled={isGeocoding} className="min-h-11 rounded-xl">
        {isGeocoding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <MapPin className="mr-2 h-4 w-4" />} Find on map
      </Button>
      <Button type="button" variant="outline" onClick={useMyLocation} className="min-h-11 rounded-xl"><LocateFixed className="mr-2 h-4 w-4" /> Use my location</Button>
    </div>
    <div className="overflow-hidden rounded-2xl border border-border bg-muted" style={{ height: 280 }}>
      <MapContainer center={center} zoom={value ? 15 : 12} scrollWheelZoom className="h-full w-full" whenReady={() => setMapReady(true)}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <MapInteractions onPick={(lat, lng) => setPoint(lat, lng, 'manual')} />
        <Recenter location={value} />
        {value && <Marker position={[value.latitude, value.longitude]} icon={icon} draggable eventHandlers={{ dragend: (event) => { const p = event.target.getLatLng(); setPoint(p.lat, p.lng, 'manual'); } }} />}
      </MapContainer>
    </div>
    <p className="text-xs text-muted-foreground">{status || (mapReady ? 'Tap or drag the marker to set the exact delivery point.' : 'Loading map…')}</p>
    {value && <p className="text-xs font-medium text-primary">{value.latitude.toFixed(6)}, {value.longitude.toFixed(6)} · {value.source === 'geocoded' ? 'Address' : value.source === 'gps' ? 'GPS' : 'Manual'} pin</p>}
    {requirePin && !value && <p className="text-xs font-bold text-destructive">A delivery pin is required before saving a new or edited address.</p>}
  </div>;
}
