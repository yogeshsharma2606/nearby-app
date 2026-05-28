import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import type { NearbyPlace } from '../types/place';
import { formatDistance, formatDuration } from '../services/osrmService';

interface Props {
  place: NearbyPlace;
  categoryEmoji: string;
  onPress: (place: NearbyPlace) => void;
}

export function PlaceMarker({ place, categoryEmoji, onPress }: Props) {
  return (
    <Marker
      coordinate={{ latitude: place.lat, longitude: place.lon }}
      title={place.name}
      onPress={() => onPress(place)}
    >
      <View style={styles.markerContainer}>
        <View style={styles.pin}>
          <Text style={styles.pinIcon}>{categoryEmoji}</Text>
        </View>
        <View style={styles.pinTail} />
      </View>

      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutName} numberOfLines={1}>
            {place.name}
          </Text>
          <Text style={styles.calloutMeta}>
            {formatDistance(place.distance)} · {formatDuration(place.duration)}
          </Text>
          {place.rating !== null && (
            <Text style={styles.calloutRating}>⭐ {place.rating.toFixed(1)}</Text>
          )}
          <Text style={styles.calloutHint}>Tap for details</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: 'center',
  },
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#0a7ea4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  pinIcon: { fontSize: 22 },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#0a7ea4',
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
  calloutName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  calloutMeta: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
    marginBottom: 2,
  },
  calloutRating: {
    fontSize: 12,
    color: '#92400e',
    marginBottom: 2,
  },
  calloutHint: {
    fontSize: 11,
    color: '#9ca3af',
  },
});
