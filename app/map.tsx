import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Text,
  TouchableOpacity,
  Modal,
  SafeAreaView,
} from 'react-native';
import MapView, { UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme } from '../context/ThemeContext';
import { PlaceMarker } from '../components/PlaceMarker';
import { PlaceDetailSheet } from '../components/PlaceDetailSheet';
import type { NearbyPlace } from '../types/place';

// CARTO free tiles — no API key, no usage policy restrictions
const MAP_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export default function MapScreen() {
  const router = useRouter();
  const { places, userLocation, selectedCategory } = usePlaces();
  const { theme } = useTheme();
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const mapRef = useRef<MapView>(null);

  const region = userLocation
    ? {
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        latitudeDelta: 0.06,
        longitudeDelta: 0.06,
      }
    : {
        latitude: 20.5937,
        longitude: 78.9629,
        latitudeDelta: 10,
        longitudeDelta: 10,
      };

  function focusUser() {
    if (!userLocation || !mapRef.current) return;
    mapRef.current.animateToRegion(
      {
        latitude: userLocation.lat,
        longitude: userLocation.lon,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      500,
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Count badge */}
      {places.length > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {selectedCategory.emoji} {places.length} {places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label} found
          </Text>
        </View>
      )}

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* CARTO tile layer — free, no API key required */}
        <UrlTile urlTemplate={MAP_TILE_URL} maximumZ={19} flipY={false} />

        {/* Place markers */}
        {places.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            categoryEmoji={selectedCategory.emoji}
            onPress={setSelectedPlace}
          />
        ))}
      </MapView>

      {/* Floating controls */}
      <View style={styles.controls}>
        {userLocation && (
          <TouchableOpacity style={styles.fab} onPress={focusUser} activeOpacity={0.85}>
            <Text style={styles.fabIcon}>📍</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/list')}
          activeOpacity={0.85}
        >
          <Text style={styles.fabIcon}>📋</Text>
        </TouchableOpacity>
      </View>

      {/* Empty state */}
      {places.length === 0 && (
        <View style={styles.emptyOverlay}>
          <Text style={styles.emptyText}>
            No {selectedCategory.labelPlural.toLowerCase()} found in this area.
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.emptyLink}>Try again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Place detail bottom sheet */}
      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setSelectedPlace(null)}
        />
        {selectedPlace && (
          <PlaceDetailSheet
            place={selectedPlace}
            categoryEmoji={selectedCategory.emoji}
            onClose={() => setSelectedPlace(null)}
            theme={theme}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  map: {
    flex: 1,
  },
  badge: {
    position: 'absolute',
    top: 14,
    alignSelf: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(10,126,164,0.92)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  badgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 13,
  },
  controls: {
    position: 'absolute',
    bottom: 28,
    right: 16,
    gap: 12,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
  emptyOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyLink: {
    color: '#0a7ea4',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
});
