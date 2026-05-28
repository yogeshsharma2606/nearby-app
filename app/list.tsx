import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Modal, SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme } from '../context/ThemeContext';
import { PlaceListItem } from '../components/PlaceListItem';
import { PlaceDetailSheet } from '../components/PlaceDetailSheet';
import type { NearbyPlace } from '../types/place';

export default function ListScreen() {
  const router = useRouter();
  const { places, selectedCategory } = usePlaces();
  const { theme } = useTheme();
  const c = theme.colors;
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  if (places.length === 0) {
    return (
      <SafeAreaView style={[styles.emptyContainer, { backgroundColor: c.background }]}>
        <Text style={styles.emptyEmoji}>{selectedCategory.emoji}</Text>
        <Text style={[styles.emptyTitle, { color: c.textPrimary }]}>No {selectedCategory.labelPlural} found</Text>
        <Text style={[styles.emptySubtitle, { color: c.textSecondary }]}>
          Go back and search again to find {selectedCategory.labelPlural.toLowerCase()} near you.
        </Text>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: c.primary }]} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.background }]}>
      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <PlaceListItem
            place={item}
            index={index}
            categoryEmoji={selectedCategory.emoji}
            onPress={setSelectedPlace}
            theme={theme}
          />
        )}
        ListHeaderComponent={
          <View style={[styles.listHeader, { borderBottomColor: c.border }]}>
            <Text style={[styles.listHeaderText, { color: c.textSecondary }]}>
              {selectedCategory.emoji}  {places.length} {places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label} found nearby
            </Text>
            <TouchableOpacity onPress={() => router.push('/map')} activeOpacity={0.7}>
              <Text style={[styles.mapLink, { color: c.primary }]}>🗺️ Map</Text>
            </TouchableOpacity>
          </View>
        }
        ListFooterComponent={<View style={{ height: 24 }} />}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      <Modal visible={selectedPlace !== null} transparent animationType="slide" onRequestClose={() => setSelectedPlace(null)}>
        <TouchableOpacity style={[styles.overlay, { backgroundColor: c.overlay }]} activeOpacity={1} onPress={() => setSelectedPlace(null)} />
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
  container: { flex: 1 },
  listContent: { paddingTop: 0 },
  listHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  listHeaderText: { fontSize: 13, fontWeight: '600' },
  mapLink: { fontSize: 13, fontWeight: '700' },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: { fontSize: 22, fontWeight: '700' },
  emptySubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  backButton: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  backButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  overlay: { flex: 1 },
});
