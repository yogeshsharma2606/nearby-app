import type { OverpassNode, OverpassResponse } from '../types/place';

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

/** Fetch with a hard timeout. Throws if the request takes longer than ms. */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeoutMs: number,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// ---------- Nominatim ----------

interface NominatimResult {
  place_id: number;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  namedetails?: Record<string, string>;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

function boundingBox(lat: number, lon: number, radiusM: number) {
  const latDelta = radiusM / 111320;
  const lonDelta = radiusM / (111320 * Math.cos((lat * Math.PI) / 180));
  return {
    west: lon - lonDelta,
    south: lat - latDelta,
    east: lon + lonDelta,
    north: lat + latDelta,
  };
}

async function fetchViaNominatim(
  lat: number,
  lon: number,
  radiusM: number,
  overpassTag = 'amenity=fuel',
): Promise<OverpassNode[]> {
  const bb = boundingBox(lat, lon, radiusM);
  const [tagKey, tagVal] = overpassTag.split('=');
  const tagParam = tagVal ? `${tagKey}=${tagVal}` : `amenity=${tagKey}`;
  const url =
    `https://nominatim.openstreetmap.org/search` +
    `?${tagParam}` +
    `&format=json` +
    `&limit=50` +
    `&bounded=1` +
    `&viewbox=${bb.west},${bb.north},${bb.east},${bb.south}` +
    `&addressdetails=1` +
    `&namedetails=1` +
    `&extratags=1` +
    `&dedupe=1`;

  const response = await fetchWithTimeout(
    url,
    {
      headers: {
        // Nominatim requires a User-Agent identifying your app
        'User-Agent': 'PetrolPumpFinder/1.0 (contact@petrolpumpfinder.app)',
        'Accept-Language': 'en',
      },
    },
    10000, // 10 second timeout
  );

  if (!response.ok) {
    throw new Error(`Nominatim HTTP ${response.status}`);
  }

  const results: NominatimResult[] = await response.json();

  return results
    .filter((r) => r.lat && r.lon)
    .map((r) => ({
      type: 'node' as const,
      id: r.place_id,
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      tags: {
        name:
          r.name ||
          (r.namedetails && r.namedetails['name']) ||
          (r.display_name ? r.display_name.split(',')[0] : '') ||
          'Unknown Place',
        'opening_hours': (r.extratags && r.extratags['opening_hours']) || '',
        brand: (r.extratags && r.extratags['brand']) || '',
        'addr:street': (r.address && r.address['road']) || '',
        'addr:city':
          (r.address &&
            (r.address['city'] || r.address['town'] || r.address['village'])) ||
          '',
        'addr:state': (r.address && r.address['state']) || '',
        'addr:housenumber': (r.address && r.address['house_number']) || '',
      },
    }));
}

// ---------- Overpass (quick attempt, skip fast if blocked) ----------

async function tryOverpassEndpoint(
  baseUrl: string,
  query: string,
): Promise<OverpassNode[] | null> {
  try {
    const response = await fetchWithTimeout(
      `${baseUrl}?data=${encodeURIComponent(query)}`,
      {},
      5000, // 5 second hard timeout — fail fast
    );
    if (!response.ok) return null;
    const json: OverpassResponse = await response.json();
    return json.elements ?? [];
  } catch {
    return null;
  }
}

// ---------- Public API ----------

/**
 * Fetch nearby places via Overpass (primary) or Nominatim (fallback).
 * @param overpassTag  e.g. "amenity=fuel", "amenity=parking", "railway=station"
 */
export async function fetchNearbyPumps(
  lat: number,
  lon: number,
  radiusMetres = 5000,
  overpassTag = 'amenity=fuel',
): Promise<OverpassNode[]> {
  const [tagKey, tagVal] = overpassTag.split('=');
  const query = tagVal
    ? `[out:json][timeout:10];node["${tagKey}"="${tagVal}"](around:${radiusMetres},${lat},${lon});out body;`
    : `[out:json][timeout:10];node["amenity"="${tagKey}"](around:${radiusMetres},${lat},${lon});out body;`;

  // Try Overpass first (max 5s per attempt — fail fast if blocked)
  for (const endpoint of OVERPASS_ENDPOINTS) {
    const result = await tryOverpassEndpoint(endpoint, query);
    if (result !== null) return result;
  }

  // Fall back to Nominatim
  try {
    return await fetchViaNominatim(lat, lon, radiusMetres, overpassTag);
  } catch (nomErr) {
    const msg = nomErr instanceof Error ? nomErr.message : String(nomErr);
    throw new Error(
      `Could not fetch nearby places.\nOverpass API: blocked on your network.\nNominatim fallback: ${msg}\n\nPlease check your internet connection.`,
    );
  }
}

// ---------- Helpers ----------

function buildAddress(tags: Record<string, string>): string {
  const parts: string[] = [];
  const houseNumber = tags['addr:housenumber'];
  const street = tags['addr:street'];
  const city = tags['addr:city'];
  const state = tags['addr:state'];
  if (street) parts.push(houseNumber ? `${houseNumber} ${street}` : street);
  if (city) parts.push(city);
  if (state) parts.push(state);
  return parts.length > 0 ? parts.join(', ') : 'Address not available';
}

export function parseNodeDetails(node: OverpassNode): {
  name: string;
  address: string;
  openingHours: string | null;
  brand: string | null;
} {
  const tags = node.tags ?? {};
  const name = tags['name'] ?? tags['brand'] ?? tags['operator'] ?? 'Unknown Place';
  return {
    name,
    address: buildAddress(tags),
    openingHours: tags['opening_hours'] || null,
    brand: tags['brand'] || null,
  };
}
