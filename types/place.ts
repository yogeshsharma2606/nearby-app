export interface NearbyPlace {
  id: number;
  name: string;
  lat: number;
  lon: number;
  address: string;
  openingHours: string | null;
  brand: string | null;
  /** Driving distance in metres */
  distance: number | null;
  /** Driving duration in seconds */
  duration: number | null;
  /** Google Places rating (1–5) */
  rating: number | null;
  /** Whether the place is currently open (from Google Places) */
  openNow: boolean | null;
  /** Google Place ID — used to fetch full weekly hours on demand */
  placeId: string | null;
  /** Full weekly schedule e.g. ["Monday: 6:00 AM – 10:00 PM", …] */
  weekdayHours: string[] | null;
}

export interface OverpassNode {
  type: 'node';
  id: number;
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

export interface OverpassResponse {
  elements: OverpassNode[];
}

export interface OsrmRoute {
  distance: number;
  duration: number;
}

export interface OsrmResponse {
  code: string;
  routes: OsrmRoute[];
}
