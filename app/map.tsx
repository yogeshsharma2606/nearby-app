import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import MapView, { UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme } from '../context/ThemeContext';
import { PlaceMarker } from '../components/PlaceMarker';
import { PlaceDetailSheet } from '../components/PlaceDetailSheet';
import { CategoryIcon } from '../components/CategoryIcon';
import { AppIcon } from '../components/AppIcon';
import { ThemedText } from '../components/ThemedText';
import type { NearbyPlace } from '../types/place';

const MAP_TILE_URL = 'https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png';

export default function MapScreen() {
  const router = useRouter();
  const { places, userLocation, selectedCategory } = usePlaces();
  const { theme } = useTheme();
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);
  const mapRef = useRef<MapView>(null);

  if (!selectedCategory) {
    router.replace('/');
    return null;
  }

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

  const countLabel =
    places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label;

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <TouchableOpacity style={styles.backFab} onPress={() => router.back()} activeOpacity={0.85}>
          <AppIcon name="chevron-back" size={26} color="#1E293B" />
        </TouchableOpacity>
        {places.length > 0 && (
          <View style={[styles.badge, { backgroundColor: c.primary }]}>
            <CategoryIcon categoryId={selectedCategory.id} size={16} color="#FFFFFF" />
            <ThemedText variant="captionMedium" color="#FFFFFF" style={styles.badgeText}>
              {places.length} {countLabel} found
            </ThemedText>
          </View>
        )}
      </View>

      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        showsUserLocation
        showsMyLocationButton={false}
      >
        <UrlTile urlTemplate={MAP_TILE_URL} maximumZ={19} flipY={false} />

        {places.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            categoryId={selectedCategory.id}
            pinColor={c.primary}
            onPress={setSelectedPlace}
          />
        ))}
      </MapView>

      <View style={[styles.controls, { bottom: 16 + insets.bottom }]}>
        {userLocation && (
          <TouchableOpacity style={styles.fab} onPress={focusUser} activeOpacity={0.85}>
            <AppIcon name="locate" size={24} color={c.primary} />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/list')}
          activeOpacity={0.85}
        >
          <AppIcon name="list" size={24} color={c.primary} />
        </TouchableOpacity>
      </View>

      {places.length === 0 && (
        <View style={[styles.emptyOverlay, { backgroundColor: c.card }]}>
          <ThemedText variant="body" color={c.textSecondary} style={{ textAlign: 'center' }}>
            No {selectedCategory.labelPlural.toLowerCase()} found in this area.
          </ThemedText>
          <TouchableOpacity onPress={() => router.back()}>
            <ThemedText variant="bodyMedium" color={c.primary}>Try again</ThemedText>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        visible={selectedPlace !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        <TouchableOpacity
          style={[styles.modalOverlay, { backgroundColor: c.overlay }]}
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
  container: { flex: 1, backgroundColor: '#000' },
  map: { flex: 1 },
  topBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  backFab: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  badge: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  badgeText: { textAlign: 'center' },
  controls: {
    position: 'absolute',
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
  emptyOverlay: {
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalOverlay: { flex: 1 },
});
