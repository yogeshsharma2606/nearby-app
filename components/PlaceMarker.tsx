import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { NearbyPlace } from '../types/place';
import { formatDistance, formatDuration } from '../services/osrmService';
import { CategoryIcon } from './CategoryIcon';
import { ThemedText } from './ThemedText';
import { AppIcon } from './AppIcon';
import { FONT } from '../theme/typography';

interface Props {
  place: NearbyPlace;
  categoryId: string;
  pinColor?: string;
  onPress: (place: NearbyPlace) => void;
}

export function PlaceMarker({ place, categoryId, pinColor = '#0E7490', onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lon }}
      title={place.name}
      onPress={() => onPress(place)}
    >
      <View style={styles.markerContainer}>
        <View style={[styles.pin, { backgroundColor: pinColor, borderColor: '#fff' }]}>
          <CategoryIcon categoryId={categoryId} size={22} color="#FFFFFF" />
        </View>
        <View style={[styles.pinTail, { borderTopColor: pinColor }]} />
      </View>

      <Callout tooltip>
        <View style={styles.callout}>
          <ThemedText variant="captionMedium" color="#111827" numberOfLines={1} style={styles.calloutName}>
            {place.name}
          </ThemedText>
          <ThemedText variant="captionMedium" color={pinColor} style={styles.calloutMeta}>
            {formatDistance(place.distance)} · {formatDuration(place.duration)}
          </ThemedText>
          {place.rating !== null && (
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={12} color="#D97706" />
              <ThemedText variant="caption" color="#92400E">{place.rating.toFixed(1)}</ThemedText>
            </View>
          )}
          <ThemedText variant="caption" color="#9CA3AF">Tap for details</ThemedText>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: { alignItems: 'center' },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -2,
  },
  callout: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    minWidth: 160,
    maxWidth: 220,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  calloutName: { fontFamily: FONT.semiBold, marginBottom: 4 },
  calloutMeta: { marginBottom: 4 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 },
});
