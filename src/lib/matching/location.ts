/**
 * PostGIS `geography` columns are returned by PostgREST in one of several
 * shapes depending on the server version and the projection used in the query:
 *
 *  - GeoJSON:  { type: "Point", coordinates: [lng, lat] }
 *  - WKB hex:  "0101000020E6100000..." (little-endian point)
 *  - Explicit: { lat, lng } when the query casts the point explicitly
 *
 * Exact coordinates are server-only. This module exists so the matching
 * pipeline can compute distance bands without ever leaking a raw point.
 */

export interface LatLng {
  lat: number;
  lng: number;
}

export type RawLocation =
  | LatLng
  | { type: string; coordinates: number[] }
  | string
  | null
  | undefined;

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function decodeWkbPoint(hex: string): LatLng | undefined {
  const cleaned = hex.trim();
  if (cleaned.length < 42) return undefined;

  let byteOrder: number;
  try {
    byteOrder = parseInt(cleaned.slice(0, 2), 16);
  } catch {
    return undefined;
  }
  if (byteOrder !== 0 && byteOrder !== 1) return undefined;

  const littleEndian = byteOrder === 1;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.substr(i * 2, 2), 16);
  }

  const view = new DataView(bytes.buffer);
  // byte 0: endianness, bytes 1-4: geometry type (1 = Point)
  const geometryType = view.getUint32(1, littleEndian);
  if (geometryType !== 1) return undefined;

  // bytes 5-12: X (longitude), bytes 13-20: Y (latitude)
  const lng = view.getFloat64(5, littleEndian);
  const lat = view.getFloat64(13, littleEndian);

  if (!isFiniteNumber(lat) || !isFiniteNumber(lng)) return undefined;
  if (lat === 0 && lng === 0) return undefined;

  return { lat, lng };
}

/**
 * Normalizes any PostGIS return shape into `{ lat, lng }`.
 * Returns undefined when the value is missing or unparseable.
 */
export function parseLocation(raw: RawLocation): LatLng | undefined {
  if (!raw) return undefined;

  if (typeof raw === "string") {
    return decodeWkbPoint(raw);
  }

  if ("lat" in raw && "lng" in raw) {
    const { lat, lng } = raw as LatLng;
    return isFiniteNumber(lat) && isFiniteNumber(lng) ? { lat, lng } : undefined;
  }

  if ("coordinates" in raw && Array.isArray(raw.coordinates)) {
    const [lng, lat] = raw.coordinates;
    return isFiniteNumber(lat) && isFiniteNumber(lng) ? { lat, lng } : undefined;
  }

  return undefined;
}
