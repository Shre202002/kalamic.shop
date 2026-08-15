export type LocationSource = 'geocoded' | 'gps' | 'manual';

export interface DeliveryLocation {
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  source: LocationSource;
  updatedAt?: string | Date;
}

export function isValidDeliveryLocation(value: any): value is DeliveryLocation {
  return Boolean(value)
    && Number.isFinite(Number(value.latitude))
    && Number(value.latitude) >= -90
    && Number(value.latitude) <= 90
    && Number.isFinite(Number(value.longitude))
    && Number(value.longitude) >= -180
    && Number(value.longitude) <= 180
    && (value.accuracy == null || (Number.isFinite(Number(value.accuracy)) && Number(value.accuracy) >= 0))
    && ['geocoded', 'gps', 'manual'].includes(value.source);
}

export function normalizeDeliveryLocation(value: any): DeliveryLocation | null {
  if (!isValidDeliveryLocation(value)) return null;
  return {
    latitude: Number(value.latitude),
    longitude: Number(value.longitude),
    accuracy: value.accuracy == null ? null : Number(value.accuracy),
    source: value.source,
  };
}
