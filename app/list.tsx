import React, { useState } from 'react';
import {
  View, StyleSheet, FlatList,
  TouchableOpacity, Modal,
} from 'react-native';
import { ThemedText } from '../components/ThemedText';
import { CategoryIcon } from '../components/CategoryIcon';
import { AppIcon } from '../components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme } from '../context/ThemeContext';
import { PlaceListItem } from '../components/PlaceListItem';
import { PlaceDetailSheet } from '../components/PlaceDetailSheet';
import type { NearbyPlace } from '../types/place';

const HEADER_CONTENT_HEIGHT = 44;

function ListHeaderBar({
  placesCount,
  categoryId,
  onBack,
  onMap,
  colors,
}: {
  placesCount: number;
  categoryId: string;
  onBack: () => void;
  onMap: () => void;
  colors: { headerBackground: string; headerText: string; primary: string };
}) {
  return (
    <View style={[styles.headerBar, { backgroundColor: colors.headerBackground }]}>
      <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <AppIcon name="chevron-back" size={26} color={colors.headerText} />
      </TouchableOpacity>
      <ThemedText variant="bodyMedium" color={colors.headerText} numberOfLines={1} style={{ flexShrink: 1 }}>
        Nearby — List
      </ThemedText>
      <View style={styles.headerRight}>
        <View style={styles.countBadge}>
          <CategoryIcon categoryId={categoryId} size={16} color={colors.primary} />
          <ThemedText variant="captionMedium" color={colors.headerText}>{placesCount}</ThemedText>
        </View>
        <TouchableOpacity onPress={onMap} style={styles.mapLink} activeOpacity={0.7}>
          <AppIcon name="map-outline" size={18} color={colors.headerText} />
          <ThemedText variant="captionMedium" color={colors.headerText}>Map</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function ListScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { places, selectedCategory } = usePlaces();
  const { theme } = useTheme();
  const c = theme.colors;
  const [selectedPlace, setSelectedPlace] = useState<NearbyPlace | null>(null);

  if (!selectedCategory) {
    router.replace('/');
    return null;
  }

  if (places.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <View style={{ paddingTop: insets.top, backgroundColor: c.headerBackground }}>
          <ListHeaderBar
            placesCount={0}
            categoryId={selectedCategory.id}
            onBack={() => router.back()}
            onMap={() => router.push('/map')}
            colors={c}
          />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconWrap, { backgroundColor: c.primaryLight }]}>
            <CategoryIcon categoryId={selectedCategory.id} size={44} color={c.primary} />
          </View>
          <ThemedText variant="title" color={c.textPrimary}>No {selectedCategory.labelPlural} found</ThemedText>
          <ThemedText variant="body" color={c.textSecondary} style={{ textAlign: 'center' }}>
            Go back and search again to find {selectedCategory.labelPlural.toLowerCase()} near you.
          </ThemedText>
          <TouchableOpacity style={[styles.backButton, { backgroundColor: c.primary }]} onPress={() => router.back()}>
            <ThemedText variant="button" color="#FFFFFF">Go back</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <View style={{ paddingTop: insets.top, backgroundColor: c.headerBackground }}>
        <ListHeaderBar
          placesCount={places.length}
          categoryId={selectedCategory.id}
          onBack={() => router.back()}
          onMap={() => router.push('/map')}
          colors={c}
        />
      </View>

      <FlatList
        data={places}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item, index }) => (
          <PlaceListItem
            place={item}
            index={index}
            onPress={setSelectedPlace}
            theme={theme}
          />
        )}
        ListFooterComponent={<View style={{ height: insets.bottom + 16 }} />}
        showsVerticalScrollIndicator={false}
        style={styles.list}
      />

      <Modal visible={selectedPlace !== null} transparent animationType="slide" onRequestClose={() => setSelectedPlace(null)}>
        <TouchableOpacity style={[styles.overlay, { backgroundColor: c.overlay }]} activeOpacity={1} onPress={() => setSelectedPlace(null)} />
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
  container: { flex: 1 },
  list: { flex: 1 },
  headerBar: {
    height: HEADER_CONTENT_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRight: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 14,
    marginRight: 8,
  },
  countBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, opacity: 0.9 },
  mapLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyIconWrap: {
    width: 88, height: 88, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
  },
  backButton: { marginTop: 8, paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  overlay: { flex: 1 },
});
