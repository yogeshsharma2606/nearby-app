import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { fetchNearbyPumps, parseNodeDetails } from '../services/overpassService';
import { fetchPlacesForCategory } from '../services/placesService';
import { getDrivingRoute } from '../services/osrmService';
import { API_KEYS } from '../config/apiKeys';
import type { PlaceCategory } from '../config/placeTypes';
import type { NearbyPlace } from '../types/place';

export type FetchStatus = 'idle' | 'locating' | 'fetching' | 'routing' | 'done' | 'error';

export interface UseNearbyPlacesResult {
  places: NearbyPlace[];
  userLocation: { lat: number; lon: number } | null;
  status: FetchStatus;
  error: string | null;
  setError: (msg: string | null) => void;
  selectedCategory: PlaceCategory | null;
  setSelectedCategory: (category: PlaceCategory) => void;
  /** Use device GPS then search */
  findPlaces: () => Promise<boolean>;
  /** Skip GPS — search at the supplied coordinates, optionally with a specific category */
  findPlacesAt: (lat: number, lon: number, categoryOverride?: PlaceCategory) => Promise<boolean>;
}

const SEARCH_RADIUS_M = 5000;   // 5 km radius
const MAX_ROUTING_PLACES = 20;  // calculate distance for top 20 results

export function useNearbyPlaces(): UseNearbyPlacesResult {
  const [places, setPlaces] = useState<NearbyPlace[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [status, setStatus] = useState<FetchStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategoryRaw] = useState<PlaceCategory | null>(null);

  // Changing category clears stale results so the label always matches the data.
  const setSelectedCategory = useCallback((category: PlaceCategory) => {
    setSelectedCategoryRaw(category);
    setPlaces([]);
    setStatus('idle');
    setError(null);
  }, []);

  const hasGoogleKey =
    !!API_KEYS.GOOGLE_MAPS && API_KEYS.GOOGLE_MAPS !== 'YOUR_GOOGLE_MAPS_API_KEY_HERE';

  const fetchForLocation = useCallback(
    async (lat: number, lon: number, category: PlaceCategory): Promise<boolean> => {
      try {
        setStatus('fetching');

        let preliminary: NearbyPlace[] = [];

        if (hasGoogleKey) {
          // Google Places Nearby Search (primary)
          const radiusM = category.searchRadiusM ?? SEARCH_RADIUS_M;
          const results = await fetchPlacesForCategory(lat, lon, category, radiusM);
          preliminary = results.map((s, i) => ({
            id: i,
            name: s.name,
            lat: s.lat,
            lon: s.lon,
            address: s.address,
            openingHours: s.openNow === null ? null : s.openNow ? 'Open now' : 'Closed now',
            brand: null,
            distance: null,
            duration: null,
            rating: s.rating,
            openNow: s.openNow,
            placeId: s.placeId,
            weekdayHours: null,
          }));
        } else {
          // Overpass / Nominatim fallback
          const nodes = await fetchNearbyPumps(lat, lon, SEARCH_RADIUS_M, category.overpassTag);
          preliminary = nodes.map((node) => {
            const { name, address, openingHours, brand } = parseNodeDetails(node);
            return {
              id: node.id,
              name,
              lat: node.lat,
              lon: node.lon,
              address,
              openingHours,
              brand,
              distance: null,
              duration: null,
              rating: null,
              openNow: null,
              placeId: null,
              weekdayHours: null,
            };
          });
        }

        if (preliminary.length === 0) {
          setPlaces([]);
          setStatus('done');
          return true;
        }

        setStatus('routing');

        const toRoute = preliminary.slice(0, MAX_ROUTING_PLACES);
        const routes = await Promise.all(
          toRoute.map((p) => getDrivingRoute(lat, lon, p.lat, p.lon)),
        );

        const enriched: NearbyPlace[] = preliminary.map((place, i) => {
          if (i >= MAX_ROUTING_PLACES) return place;
          const route = routes[i];
          return {
            ...place,
            distance: route?.distance ?? null,
            duration: route?.duration ?? null,
          };
        });

        enriched.sort((a, b) => {
          if (a.distance === null && b.distance === null) return 0;
          if (a.distance === null) return 1;
          if (b.distance === null) return -1;
          return a.distance - b.distance;
        });

        setPlaces(enriched);
        setStatus('done');
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
        setError(message);
        setStatus('error');
        return false;
      }
    },
    [hasGoogleKey],
  );

  const findPlaces = useCallback(async (): Promise<boolean> => {
    setError(null);
    setPlaces([]);

    if (!selectedCategory) {
      setError('Choose what you\'re looking for first.');
      setStatus('idle');
      return false;
    }

    try {
      setStatus('locating');

      const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') {
        setError('Location permission denied. Please enable location access in your device settings.');
        setStatus('error');
        return false;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude: lat, longitude: lon } = location.coords;
      setUserLocation({ lat, lon });

      return fetchForLocation(lat, lon, selectedCategory);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(message);
      setStatus('error');
      return false;
    }
  }, [fetchForLocation, selectedCategory]);

  const findPlacesAt = useCallback(
    async (lat: number, lon: number, categoryOverride?: PlaceCategory): Promise<boolean> => {
      setError(null);
      setPlaces([]);
      setUserLocation({ lat, lon });
      const category = categoryOverride ?? selectedCategory;
      if (!category) {
        setError('Choose what you\'re looking for first.');
        setStatus('idle');
        return false;
      }
      return fetchForLocation(lat, lon, category);
    },
    [fetchForLocation, selectedCategory],
  );

  return {
    places,
    userLocation,
    status,
    error,
    setError,
    selectedCategory,
    setSelectedCategory,
    findPlaces,
    findPlacesAt,
  };
}
