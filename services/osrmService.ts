import type { OsrmResponse } from '../types/place';

const OSRM_BASE = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Get driving distance (metres) and duration (seconds) between two coordinates
 * using the public OSRM demo server. Free, no API key required.
 *
 * Returns null if routing fails (e.g. no road network available).
 */
export async function getDrivingRoute(
  fromLat: number,
  fromLon: number,
  toLat: number,
  toLon: number,
): Promise<{ distance: number; duration: number } | null> {
  const url = `${OSRM_BASE}/${fromLon},${fromLat};${toLon},${toLat}?overview=false`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const json: OsrmResponse = await response.json();
    if (!json || json.code !== 'Ok' || !json.routes || !json.routes.length) return null;

    const route = json.routes[0];
    if (!route || route.distance == null || route.duration == null) return null;

    return { distance: route.distance, duration: route.duration };
  } catch {
    return null;
  }
}

/** Format metres into a readable distance string, e.g. "1.2 km" or "850 m". */
export function formatDistance(metres: number | null): string {
  if (metres === null) return 'N/A';
  if (metres < 1000) return `${Math.round(metres)} m`;
  return `${(metres / 1000).toFixed(1)} km`;
}

/** Format seconds into a readable duration string, e.g. "5 min" or "1 hr 10 min". */
export function formatDuration(seconds: number | null): string {
  if (seconds === null) return 'N/A';
  const mins = Math.round(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem > 0 ? `${hrs} hr ${rem} min` : `${hrs} hr`;
}
