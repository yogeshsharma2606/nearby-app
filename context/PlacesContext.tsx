import React, { createContext, useContext } from 'react';
import type { UseNearbyPlacesResult } from '../hooks/useNearbyPlaces';
import { useNearbyPlaces } from '../hooks/useNearbyPlaces';

const PlacesContext = createContext<UseNearbyPlacesResult | null>(null);

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const value = useNearbyPlaces();
  return <PlacesContext.Provider value={value}>{children}</PlacesContext.Provider>;
}

export function usePlaces(): UseNearbyPlacesResult {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces must be used inside PlacesProvider');
  return ctx;
}
