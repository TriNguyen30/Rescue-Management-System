/**
 * Reverse geocoding via OpenStreetMap Nominatim (free, no API key).
 * Usage policy: 1 req/sec, set User-Agent, cache results.
 */

const NOMINATIM_BASE = "https://nominatim.openstreetmap.org/reverse";
const CACHE_KEY_PRECISION = 4; // round coords to 4 decimals for cache

const addressCache = new Map<string, string>();

function cacheKey(lat: number, lon: number): string {
  const r = 10 ** CACHE_KEY_PRECISION;
  return `${Math.round(lat * r) / r},${Math.round(lon * r) / r}`;
}

export interface ReverseGeocodeResult {
  displayName: string;
  lat: string;
  lon: string;
}

/**
 * Reverse geocode: (lat, lon) -> human-readable address.
 * Results are cached. Use 1 request per second when calling in bulk.
 */
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<string> {
  const key = cacheKey(lat, lon);
  const cached = addressCache.get(key);
  if (cached !== undefined) return cached;

  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
  });

  const res = await fetch(`${NOMINATIM_BASE}?${params}`, {
    headers: {
      "User-Agent": "RescueManagementSystem/1.0 (contact@example.com)",
    },
  });

  if (!res.ok) {
    throw new Error(`Geocoding failed: ${res.status}`);
  }

  const data = (await res.json()) as { display_name?: string; address?: Record<string, string> };
  const displayName =
    data.display_name ||
    (data.address
      ? [
          data.address.road,
          data.address.suburb,
          data.address.city,
          data.address.state,
          data.address.country,
        ]
          .filter(Boolean)
          .join(", ")
      : null) ||
    `${lat.toFixed(4)}, ${lon.toFixed(4)}`;

  addressCache.set(key, displayName);
  return displayName;
}

/**
 * GeoJSON coordinates are [longitude, latitude].
 */
export function geoJsonToLatLon(coordinates: [number, number]): {
  lat: number;
  lon: number;
} {
  const [lon, lat] = coordinates;
  return { lat, lon };
}
