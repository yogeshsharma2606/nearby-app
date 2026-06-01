import { API_KEYS } from '../config/apiKeys';
import type { PlaceCategory } from '../config/placeTypes';
import { isLikelyParkingPlace } from '../config/placeTypes';

const NEARBY_BASE = 'https://maps.googleapis.com/maps/api/place/nearbysearch';

interface NearbyResult {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  rating?: number;
  opening_hours?: { open_now: boolean };
  geometry?: { location: { lat: number; lng: number } };
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
  return results
    .filter((r) => r.geometry?.location)
    .map((r) => ({
      placeId: r.place_id,
      name: r.name,
      address: r.vicinity ?? r.formatted_address ?? '',
      lat: r.geometry!.location.lat,
      lon: r.geometry!.location.lng,
      rating: r.rating ?? null,
      openNow: r.opening_hours?.open_now ?? null,
    }));
}

function delay(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function dedupeByPlaceId(places: NearbyPlaceResult[]): NearbyPlaceResult[] {
  const seen = new Set<string>();
  return places.filter((p) => {
    if (seen.has(p.placeId)) return false;
    seen.add(p.placeId);
    return true;
  });
}

async function fetchPaginated(
  buildUrl: (pageToken?: string) => string,
  label: string,
  maxPages = 3,
): Promise<NearbyPlaceResult[]> {
  const allResults: NearbyPlaceResult[] = [];
  let nextPageToken: string | undefined;
  let page = 1;

  while (page <= maxPages) {
    const url = buildUrl(nextPageToken);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`${label}: HTTP ${response.status}`);

    const data: NearbyResponse = await response.json();
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      // Stop pagination on invalid token instead of failing the whole search
      if (page > 1) break;
      throw new Error(
        `${label}: ${data.status}${data.error_message ? ' — ' + data.error_message : ''}`,
      );
    }

    allResults.push(...parseResults(data.results ?? []));
    nextPageToken = data.next_page_token;
    if (!nextPageToken) break;

    page++;
    await delay(2000);
  }

  return allResults;
}

/** Single Nearby Search (one type and/or keyword). */
async function fetchNearbySingle(
  lat: number,
  lon: number,
  radiusM: number,
  googleType?: string,
  keyword?: string,
  maxPages = 3,
): Promise<NearbyPlaceResult[]> {
  return fetchPaginated((pageToken) => {
    if (pageToken) {
      return `${NEARBY_BASE}/json?${new URLSearchParams({
        pagetoken: pageToken,
        key: API_KEYS.GOOGLE_MAPS,
      })}`;
    }
    const params = new URLSearchParams({
      location: `${lat},${lon}`,
      radius: String(radiusM),
      key: API_KEYS.GOOGLE_MAPS,
      language: 'en',
    });
    if (googleType) params.set('type', googleType);
    if (keyword) params.set('keyword', keyword);
    return `${NEARBY_BASE}/json?${params}`;
  }, 'Places Nearby', maxPages);
}

/** Fetch nearby places for a category (Nearby Search, up to 3 pages). */
export async function fetchPlacesForCategory(
  lat: number,
  lon: number,
  category: PlaceCategory,
  radiusM: number,
): Promise<NearbyPlaceResult[]> {
  const merged: NearbyPlaceResult[] = [];

  // One Nearby Search per category (up to 3 pages × 20 = 60 places) — same as petrol, temple, etc.
  if (category.googleType || category.keyword) {
    merged.push(
      ...(await fetchNearbySingle(
        lat,
        lon,
        radiusM,
        category.googleType,
        category.keyword,
        3,
      )),
    );
  }

  let unique = dedupeByPlaceId(merged);

  if (category.id === 'parking') {
    unique = unique.filter((p) => isLikelyParkingPlace(p.name));
  }

  return unique;
}

/** @deprecated Use fetchPlacesForCategory */
export async function fetchNearbyPlaces(
  lat: number,
  lon: number,
  radiusM: number,
  googleType: string | undefined,
  keyword?: string,
): Promise<NearbyPlaceResult[]> {
  return fetchNearbySingle(lat, lon, radiusM, googleType, keyword, 3);
}

// ---------- Place Details ----------

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

const DETAILS_BASE = 'https://maps.googleapis.com/maps/api/place/details';

export async function fetchPlaceDetails(placeId: string): Promise<PlaceDetails> {
  const params = new URLSearchParams({
    place_id: placeId,
    fields: 'opening_hours,formatted_address,rating,formatted_phone_number',
    key: API_KEYS.GOOGLE_MAPS,
    language: 'en',
  });

  const response = await fetch(`${DETAILS_BASE}/json?${params}`);
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
