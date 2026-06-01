import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme } from '../context/ThemeContext';
import { PlaceDetailSheet } from '../components/PlaceDetailSheet';
import { formatDistance, formatDuration } from '../services/osrmService';
import type { NearbyPlace } from '../types/place';

/**
 * Web fallback for MapScreen.
 * react-native-maps is native-only, so on web we render an embedded
 * OpenStreetMap iframe alongside the places list.
 */
export default function MapWebScreen() {
  const router = useRouter();
  const { places, userLocation, selectedCategory } = usePlaces();
  const { theme } = useTheme();
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const [iframeUrl, setIframeUrl] = useState('');

  useEffect(() => {
    if (userLocation) {
      const { lat, lon } = userLocation;
      const bbox = 0.05;
      setIframeUrl(
        `https://www.openstreetmap.org/export/embed.html?bbox=${lon - bbox},${lat - bbox},${lon + bbox},${lat + bbox}&layer=mapnik&marker=${lat},${lon}`,
      );
    }
  }, [userLocation, places]);

  return (
    <View style={styles.container}>
      {/* Map embed */}
      {iframeUrl ? (
        <View style={styles.mapContainer}>
          {/* @ts-ignore — iframe is valid HTML on web via react-native-web */}
          <iframe
            src={iframeUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            title="Map"
          />
        </View>
      ) : (
        <View style={styles.mapPlaceholder}>
          <Text style={styles.placeholderText}>🗺️ Map loading…</Text>
        </View>
      )}

      {/* Places list panel */}
      <View style={styles.listPanel}>
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>
            {selectedCategory.emoji} {places.length} {places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label} nearby
          </Text>
          <TouchableOpacity onPress={() => router.push('/list')}>
            <Text style={styles.listLink}>Full list →</Text>
          </TouchableOpacity>
        </View>

        <ScrollView showsVerticalScrollIndicator={false}>
          {places.map((place, i) => (
            <TouchableOpacity
              key={place.id}
              style={styles.placeRow}
              onPress={() => setSelectedPlace(place)}
              activeOpacity={0.75}
            >
              <View style={styles.rank}>
                <Text style={styles.rankText}>{i + 1}</Text>
              </View>
              <View style={styles.placeInfo}>
                <Text style={styles.placeName} numberOfLines={1}>
                  {place.name}
                </Text>
                <Text style={styles.placeMeta}>
                  {formatDistance(place.distance)} · {formatDuration(place.duration)}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
          {places.length === 0 && (
            <Text style={styles.emptyText}>No places found. Go back and search again.</Text>
          )}
        </ScrollView>
      </View>

      {/* Detail sheet */}
      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setSelectedPlace(null)}
        />
        {selectedPlace && (
          <PlaceDetailSheet
            place={selectedPlace}
            categoryId={selectedCategory.id}
            onClose={() => setSelectedPlace(null)}
            theme={theme}
          />
        )}
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
  },
  mapContainer: {
    flex: 1,
    height: '100%',
  },
  mapPlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e5e7eb',
  },
  placeholderText: {
    fontSize: 18,
    color: '#6b7280',
  },
  listPanel: {
    width: 320,
    backgroundColor: '#fff',
    borderLeftWidth: 1,
    borderLeftColor: '#e5e7eb',
    display: 'flex',
    flexDirection: 'column',
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  listTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  listLink: {
    fontSize: 13,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  placeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
    gap: 12,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rankText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  placeInfo: { flex: 1 },
  placeName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  placeMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 18,
    color: '#d1d5db',
  },
  emptyText: {
    padding: 20,
    color: '#6b7280',
    fontSize: 13,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
