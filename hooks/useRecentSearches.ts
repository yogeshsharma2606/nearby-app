import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@nearby_finder_recent_searches';
const MAX_RECENT = 5;

export interface RecentSearch {
  id: string;
  label: string;
  lat: number;
  lon: number;
  categoryId: string;
  categoryEmoji: string;
  categoryLabel: string;
  timestamp: number;
}

export function useRecentSearches() {
  const [recents, setRecents] = useState<RecentSearch[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) {
          try {
            setRecents(JSON.parse(raw));
          } catch {
            setRecents([]);
          }
        }
      })
      .catch(() => {/* ignore — AsyncStorage unavailable on old builds */});
  }, []);

  const addRecent = useCallback(
    async (entry: Omit<RecentSearch, 'id' | 'timestamp'>) => {
      setRecents((prev) => {
        const filtered = prev.filter(
          (r) => !(r.label === entry.label && r.categoryId === entry.categoryId),
        );
        const next: RecentSearch[] = [
          { ...entry, id: `${Date.now()}`, timestamp: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [],
  );

  const clearRecents = useCallback(async () => {
    setRecents([]);
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  }, []);

  return { recents, addRecent, clearRecents };
}
