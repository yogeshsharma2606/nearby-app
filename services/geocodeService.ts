import { API_KEYS } from '../config/apiKeys';

export interface GeocodedPlace {
  lat: number;
  lon: number;
  label: string;
  placeId?: string;
}

const PLACES_BASE = 'https://maps.googleapis.com/maps/api/place';
const GEOCODE_BASE = 'https://maps.googleapis.com/maps/api/geocode';

// ---------- Step 1: Autocomplete suggestions ----------

interface AutocompleteResult {
  place_id: string;
  description: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface AutocompleteResponse {
  status: string;
  predictions: AutocompleteResult[];
}

/**
 * Get place suggestions as the user types.
 * Returns name + place_id for each match.
 */
export async function getPlaceSuggestions(
  input: string,
): Promise<Array<{ placeId: string; label: string }>> {
  if (!input || input.trim().length < 4) return [];

  const params = new URLSearchParams({
    input: input.trim(),
    key: API_KEYS.GOOGLE_MAPS,
    components: 'country:in',   // restrict to India; remove for worldwide
    language: 'en',
    types: 'geocode|establishment',
  });

  const response = await fetch(`${PLACES_BASE}/autocomplete/json?${params}`);
  if (!response.ok) throw new Error(`Places API error: HTTP ${response.status}`);

  const data: AutocompleteResponse & { error_message?: string } = await response.json();
  console.log('[Places] status:', data.status, data.error_message ?? '');

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(`Places API: ${data.status}${data.error_message ? ' — ' + data.error_message : ''}`);
  }

  return (data.predictions ?? []).map((p) => ({
    placeId: p.place_id,
    label:
      [p.structured_formatting.main_text, p.structured_formatting.secondary_text]
        .filter(Boolean)
        .join(', '),
  }));
}

// ---------- Step 2: Resolve place_id to coordinates ----------

interface GeocodeResponse {
  status: string;
  results: Array<{
    geometry: { location: { lat: number; lng: number } };
    formatted_address: string;
  }>;
}

/**
 * Convert a Google place_id to lat/lon coordinates.
 */
export async function getPlaceCoordinates(
  placeId: string,
  label: string,
): Promise<GeocodedPlace> {
  const params = new URLSearchParams({
    place_id: placeId,
    key: API_KEYS.GOOGLE_MAPS,
    language: 'en',
  });

  const response = await fetch(`${GEOCODE_BASE}/json?${params}`);
  if (!response.ok) throw new Error(`Geocoding API error: HTTP ${response.status}`);

  const data: GeocodeResponse = await response.json();
  if (data.status !== 'OK' || !data.results.length) {
    throw new Error(`Geocoding API: ${data.status}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lon: lng, label, placeId };
}

// ---------- Fallback: Nominatim (used if Google key not set) ----------

async function nominatimFallback(query: string): Promise<GeocodedPlace[]> {
  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: '8',
    addressdetails: '1',
    dedupe: '1',
    countrycodes: 'in',
  });

  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?${params}`,
    {
      headers: {
        'User-Agent': 'PetrolPumpFinder/1.0 (contact@petrolpumpfinder.app)',
        'Accept-Language': 'en',
      },
    },
  );

  if (!response.ok) return [];

  const data: Array<{
    lat: string;
    lon: string;
    display_name: string;
    address?: Record<string, string>;
  }> = await response.json();

  return data.map((r) => {
    const parts = [
      r.address?.amenity || r.address?.road || r.address?.neighbourhood,
      r.address?.city || r.address?.town || r.address?.village,
      r.address?.state,
    ].filter(Boolean);
    return {
      lat: parseFloat(r.lat),
      lon: parseFloat(r.lon),
      label: parts.length >= 2 ? parts.join(', ') : r.display_name.split(',').slice(0, 2).join(',').trim(),
    };
  });
}

/**
 * Unified geocode function.
 * Uses Google Places if API key is set, Nominatim otherwise.
 */
export async function geocodeAddress(query: string): Promise<GeocodedPlace[]> {
  if (API_KEYS.GOOGLE_MAPS && API_KEYS.GOOGLE_MAPS !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE') {
    const suggestions = await getPlaceSuggestions(query);
    return suggestions.map((s) => ({
      lat: 0,
      lon: 0,
      label: s.label,
      placeId: s.placeId,
    }));
  }
  return nominatimFallback(query);
}
