import { API_KEYS } from '../config/apiKeys';

const BASE = 'https://maps.googleapis.com/maps/api/place';

// ---------- Nearby Search ----------

interface NearbyResult {
  place_id: string;
  name: string;
  vicinity: string;
  rating?: number;
  opening_hours?: { open_now: boolean };
  geometry: { location: { lat: number; lng: number } };
}

interface NearbyResponse {
  status: string;
  error_message?: string;
  next_page_token?: string;
  results: NearbyResult[];
}

export interface NearbyPlaceResult {
  placeId: string;
  name: string;
  address: string;
  lat: number;
  lon: number;
  rating: number | null;
  openNow: boolean | null;
}

function parseResults(results: NearbyResult[]): NearbyPlaceResult[] {
  return results.map((r) => ({
    placeId: r.place_id,
    name: r.name,
    address: r.vicinity,
    lat: r.geometry.location.lat,
    lon: r.geometry.location.lng,
    rating: r.rating ?? null,
    openNow: r.opening_hours?.open_now ?? null,
  }));
}

/** Google requires a short delay before a next_page_token becomes valid. */
function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/**
 * Fetch nearby places of any Google Places type.
 * Automatically fetches up to 3 pages (60 results) to catch places
 * that Google's ranking pushes off the first page of 20.
 */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusM: number,
  googleType: string | undefined,
  keyword?: string,
): Promise<NearbyPlaceResult[]> {
  const params = new URLSearchParams({
    location: `${lat},${lon}`,
    radius: String(radiusM),
    key: API_KEYS.GOOGLE_MAPS,
    language: 'en',
  });

  // Only add type when provided — some categories (e.g. washrooms) work better keyword-only
  if (googleType) params.set('type', googleType);
  if (keyword) params.set('keyword', keyword);

  const response = await fetch(`${BASE}/nearbysearch/json?${params}`);
  if (!response.ok) throw new Error(`Places Nearby Search: HTTP ${response.status}`);

  const data: NearbyResponse = await response.json();
  console.log('[Places Nearby] status:', data.status, data.error_message ?? '', `(${data.results?.length ?? 0} results)`);

  if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
    throw new Error(
      `Places Nearby Search: ${data.status}${data.error_message ? ' — ' + data.error_message : ''}`,
    );
  }

  const allResults: NearbyPlaceResult[] = parseResults(data.results ?? []);

  // Fetch pages 2 and 3 if available (Google allows max 3 pages = 60 results total)
  let nextPageToken = data.next_page_token;
  let page = 2;

  while (nextPageToken && page <= 3) {
    // Google requires ~2s before the next_page_token becomes active
    await delay(2000);

    const pageParams = new URLSearchParams({
      pagetoken: nextPageToken,
      key: API_KEYS.GOOGLE_MAPS,
    });

    const pageResponse = await fetch(`${BASE}/nearbysearch/json?${pageParams}`);
    if (!pageResponse.ok) break;

    const pageData: NearbyResponse = await pageResponse.json();
    console.log(`[Places Nearby] page ${page} status:`, pageData.status, `(${pageData.results?.length ?? 0} results)`);

    if (pageData.status === 'OK') {
      allResults.push(...parseResults(pageData.results ?? []));
    }

    nextPageToken = pageData.next_page_token;
    page++;
  }

  console.log(`[Places Nearby] total results: ${allResults.length}`);
  return allResults;
}

// ---------- Place Details (full weekly hours) ----------

interface DetailsResponse {
  status: string;
  error_message?: string;
  result?: {
    opening_hours?: {
      open_now?: boolean;
      weekday_text?: string[];
    };
    formatted_address?: string;
    rating?: number;
    formatted_phone_number?: string;
  };
}

export interface PlaceDetails {
  weekdayHours: string[] | null;
  openNow: boolean | null;
  formattedAddress: string | null;
  rating: number | null;
  phone: string | null;
}

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'opening_hours,formatted_address,rating,formatted_phone_number',
    key: API_KEYS.GOOGLE_MAPS,
    language: 'en',
  });

  const response = await fetch(`${BASE}/details/json?${params}`);
  if (!response.ok) throw new Error(`Place Details: HTTP ${response.status}`);

  const data: DetailsResponse = await response.json();

  if (data.status !== 'OK') {
    throw new Error(
      `Place Details: ${data.status}${data.error_message ? ' — ' + data.error_message : ''}`,
    );
  }

  const r = data.result ?? {};
  return {
    weekdayHours: r.opening_hours?.weekday_text ?? null,
    openNow: r.opening_hours?.open_now ?? null,
    formattedAddress: r.formatted_address ?? null,
    rating: r.rating ?? null,
    phone: r.formatted_phone_number ?? null,
  };
}
