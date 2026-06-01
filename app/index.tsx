import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme, type AppTheme } from '../context/ThemeContext';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { PLACE_CATEGORIES } from '../config/placeTypes';
import type { GeocodedPlace } from '../services/geocodeService';
import { getPlaceCoordinates } from '../services/geocodeService';
import { SearchModal } from '../components/SearchModal';
import { ThemedText } from '../components/ThemedText';
import { CategoryIcon } from '../components/CategoryIcon';
import { AppIcon } from '../components/AppIcon';

const STATUS_LABELS: Record<string, string> = {
  locating: 'Getting your location…',
  fetching: 'Searching nearby…',
  routing: 'Calculating distances…',
  done: '',
  error: '',
  idle: '',
};

export default function HomeScreen() {
  const router = useRouter();
  const { theme, toggleTheme } = useTheme();
  const c = theme.colors;

  const {
    status,
    error,
    places,
    selectedCategory,
    setSelectedCategory,
    findPlaces,
    findPlacesAt,
  } = usePlaces();

  const { recents, addRecent, clearRecents } = useRecentSearches();

  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);

  const isLoading = status === 'locating' || status === 'fetching' || status === 'routing';
  const hasPlaces = status === 'done' && places.length > 0;
  const canSearch = selectedCategory !== null;

  async function handleGPS() {
    setSearchLabel(null);
    const success = await findPlaces();
    if (success) router.push('/map');
  }

  async function handlePlace(place: GeocodedPlace) {
    if (!selectedCategory) return;
    setSearchModalOpen(false);
    setSearchLabel(place.label);

    let lat = place.lat;
    let lon = place.lon;

    if (place.placeId && (lat === 0 || lon === 0)) {
      try {
        const resolved = await getPlaceCoordinates(place.placeId, place.label);
        lat = resolved.lat;
        lon = resolved.lon;
      } catch {
        // fall through
      }
    }

    const success = await findPlacesAt(lat, lon);
    if (success) {
      addRecent({
        label: place.label,
        lat,
        lon,
        categoryId: selectedCategory.id,
        categoryEmoji: selectedCategory.emoji,
        categoryLabel: selectedCategory.label,
      });
      router.push('/map');
    }
  }

  async function handleRecent(recent: ReturnType<typeof useRecentSearches>['recents'][0]) {
    const cat = PLACE_CATEGORIES.find((x) => x.id === recent.categoryId);
    if (cat) setSelectedCategory(cat);
    setSearchLabel(recent.label);
    const success = await findPlacesAt(recent.lat, recent.lon, cat);
    if (success) router.push('/map');
  }

  const s = useMemo(() => makeStyles(c, theme.mode), [theme.mode, c]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Hero header */}
        <View style={[s.hero, { backgroundColor: c.card, borderColor: c.border }]}>
          <View style={s.heroTop}>
            <View style={[s.logoCircle, { backgroundColor: c.primaryLight }]}>
              <AppIcon name="location" size={26} color={c.primary} />
            </View>
            <View style={s.heroText}>
              <ThemedText variant="hero" color={c.textPrimary}>Nearby Finder</ThemedText>
              <ThemedText variant="caption" color={c.textSecondary} style={{ marginTop: 2 }}>
                Discover places around you
              </ThemedText>
            </View>
            <TouchableOpacity
              style={[s.themeBtn, { backgroundColor: c.inputBackground, borderColor: c.border }]}
              onPress={toggleTheme}
              activeOpacity={0.8}
            >
              <AppIcon
                name={theme.mode === 'dark' ? 'sunny' : 'moon'}
                size={22}
                color={c.textSecondary}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Categories */}
        <View style={s.block}>
          <ThemedText variant="sectionLabel" color={c.textMuted} style={s.blockLabel}>
            What are you looking for?
          </ThemedText>
          <View style={s.categoryGrid}>
            {PLACE_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory?.id === cat.id;
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    s.categoryChip,
                    {
                      backgroundColor: isSelected ? c.chipSelectedBackground : c.chipBackground,
                      borderColor: isSelected ? c.chipSelectedBorder : c.chipBorder,
                    },
                  ]}
                  onPress={() => setSelectedCategory(cat)}
                  activeOpacity={0.8}
                >
                  <View style={[s.catIconWrap, { backgroundColor: isSelected ? c.primaryLight : c.inputBackground }]}>
                    <CategoryIcon
                      categoryId={cat.id}
                      size={18}
                      color={isSelected ? c.chipSelectedText : c.textSecondary}
                    />
                  </View>
                  <ThemedText
                    variant="chip"
                    color={isSelected ? c.chipSelectedText : c.chipText}
                    numberOfLines={1}
                    style={s.catLabel}
                  >
                    {cat.label}
                  </ThemedText>
                </TouchableOpacity>
              );
            })}
          </View>
          {!canSearch && (
            <ThemedText variant="caption" color={c.textMuted} style={s.categoryHint}>
              Select a category to search nearby
            </ThemedText>
          )}
        </View>

        {/* Location */}
        <View style={[s.card, { backgroundColor: c.card, borderColor: c.border }]}>
          <ThemedText variant="sectionLabel" color={c.textMuted} style={s.blockLabel}>
            Find location
          </ThemedText>

          {isLoading ? (
            <View style={s.loadingRow}>
              <ActivityIndicator color={c.primary} size="small" />
              <ThemedText variant="caption" color={c.textSecondary}>
                {STATUS_LABELS[status]}
              </ThemedText>
            </View>
          ) : (
            <TouchableOpacity
              style={[
                s.gpsBtn,
                {
                  backgroundColor: c.card,
                  borderColor: canSearch ? c.primary : c.border,
                },
                !canSearch && s.disabled,
              ]}
              onPress={handleGPS}
              disabled={!canSearch}
              activeOpacity={0.88}
            >
              <AppIcon name="navigate" size={20} color={canSearch ? c.primary : c.textMuted} />
              <ThemedText variant="button" color={canSearch ? c.primary : c.textMuted}>
                Use my current location
              </ThemedText>
            </TouchableOpacity>
          )}

          <View style={s.dividerRow}>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
            <ThemedText variant="caption" color={c.textMuted}>or search by address</ThemedText>
            <View style={[s.dividerLine, { backgroundColor: c.border }]} />
          </View>

          <TouchableOpacity
            style={[
              s.searchBox,
              { backgroundColor: c.inputBackground, borderColor: c.border },
              !canSearch && s.searchBoxDisabled,
            ]}
            onPress={() => canSearch && !isLoading && setSearchModalOpen(true)}
            activeOpacity={0.75}
            disabled={!canSearch || isLoading}
          >
            <AppIcon name="search" size={20} color={c.textMuted} />
            <ThemedText
              variant="body"
              color={searchLabel ? c.textPrimary : c.textMuted}
              numberOfLines={1}
              style={{ flex: 1 }}
            >
              {searchLabel ?? 'Search city, area or landmark…'}
            </ThemedText>
            {searchLabel && (
              <TouchableOpacity onPress={() => setSearchLabel(null)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <AppIcon name="close-circle" size={22} color={c.textMuted} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {recents.length > 0 && (
            <View style={s.recentBlock}>
              <View style={s.recentHeader}>
                <ThemedText variant="sectionLabel" color={c.textMuted}>Recent</ThemedText>
                <TouchableOpacity onPress={clearRecents}>
                  <ThemedText variant="captionMedium" color={c.primary}>Clear all</ThemedText>
                </TouchableOpacity>
              </View>
              {recents.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[s.recentRow, { borderBottomColor: c.border }]}
                  onPress={() => handleRecent(r)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <View style={[s.recentIcon, { backgroundColor: c.primaryLight }]}>
                    <CategoryIcon categoryId={r.categoryId} size={20} color={c.primary} />
                  </View>
                  <View style={s.recentInfo}>
                    <ThemedText variant="bodyMedium" color={c.textPrimary} numberOfLines={1}>{r.label}</ThemedText>
                    <ThemedText variant="caption" color={c.textMuted}>{r.categoryLabel}</ThemedText>
                  </View>
                  <AppIcon name="chevron-forward" size={20} color={c.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {error && (
          <View style={[s.alert, { backgroundColor: c.dangerLight, borderColor: c.danger }]}>
            <ThemedText variant="bodyMedium" color={c.danger}>Something went wrong</ThemedText>
            <ThemedText variant="caption" color={c.danger} selectable style={{ marginTop: 4 }}>{error}</ThemedText>
          </View>
        )}

        {status === 'done' && places.length === 0 && selectedCategory && (
          <View style={[s.emptyCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[s.emptyIconWrap, { backgroundColor: c.primaryLight }]}>
              <CategoryIcon categoryId={selectedCategory.id} size={40} color={c.primary} />
            </View>
            <ThemedText variant="body" color={c.textSecondary} style={{ textAlign: 'center' }}>
              No {selectedCategory.labelPlural.toLowerCase()} found nearby.{'\n'}Try another location.
            </ThemedText>
          </View>
        )}

        {hasPlaces && selectedCategory && (
          <View style={[s.resultsCard, { backgroundColor: c.card, borderColor: c.border }]}>
            <View style={[s.resultsHead, { borderBottomColor: c.border }]}>
              <View style={[s.countPill, { backgroundColor: c.primaryLight }]}>
                <View style={s.countRow}>
                  <CategoryIcon categoryId={selectedCategory.id} size={18} color={c.primary} />
                  <ThemedText variant="subtitle" color={c.primary}>
                    {places.length}{' '}
                    {places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label}
                  </ThemedText>
                </View>
              </View>
              {searchLabel && (
                <ThemedText variant="caption" color={c.textMuted}>Near {searchLabel}</ThemedText>
              )}
            </View>
            <View style={s.resultsActions}>
              <TouchableOpacity
                style={[s.btnPrimary, { backgroundColor: c.primary }]}
                onPress={() => router.push('/map')}
                activeOpacity={0.88}
              >
                <AppIcon name="map" size={18} color="#FFFFFF" />
                <ThemedText variant="button" color="#FFFFFF">View on map</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.btnOutline, { borderColor: c.primary, backgroundColor: c.primaryLight }]}
                onPress={() => router.push('/list')}
                activeOpacity={0.88}
              >
                <AppIcon name="list" size={18} color={c.primary} />
                <ThemedText variant="button" color={c.primary}>View as list</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      <SearchModal
        visible={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handlePlace}
        theme={theme}
      />
    </SafeAreaView>
  );
}

function makeStyles(c: AppTheme['colors'], mode: AppTheme['mode']) {
  const shadow = mode === 'dark'
    ? { shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 12, elevation: 4 }
    : { shadowColor: '#64748B', shadowOpacity: 0.12, shadowRadius: 16, elevation: 3 };

  return StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 32, gap: 16 },

    hero: {
      borderRadius: 20,
      borderWidth: 1,
      padding: 18,
      ...shadow,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    logoCircle: {
      width: 52, height: 52, borderRadius: 16,
      alignItems: 'center', justifyContent: 'center',
    },
    heroText: { flex: 1 },
    themeBtn: {
      width: 44, height: 44, borderRadius: 14,
      alignItems: 'center', justifyContent: 'center', borderWidth: 1,
    },

    block: { gap: 10 },
    blockLabel: { marginLeft: 4 },
    card: {
      borderRadius: 20, borderWidth: 1, padding: 18, gap: 14, ...shadow,
    },

    categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    categoryChip: {
      width: '48%',
      flexGrow: 1,
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: 12,
      borderWidth: 1.5,
      paddingVertical: 8,
      paddingHorizontal: 10,
      gap: 8,
    },
    catIconWrap: {
      width: 32, height: 32, borderRadius: 10,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    catLabel: { flex: 1 },
    categoryHint: { marginLeft: 4, marginTop: 2 },

    loadingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingVertical: 10,
    },
    gpsBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 10, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
    },
    disabled: { opacity: 0.55 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },

    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: 16, borderWidth: 1, paddingHorizontal: 16, minHeight: 54,
    },
    searchBoxDisabled: { opacity: 0.5 },
    recentBlock: { marginTop: 4 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    recentRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth,
    },
    recentIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    recentEmoji: { fontSize: 20 },
    recentInfo: { flex: 1, gap: 2 },
    chevron: { fontSize: 22, lineHeight: 24 },

    alert: { borderRadius: 16, borderWidth: 1, padding: 16 },
    emptyCard: {
      borderRadius: 20, borderWidth: 1, padding: 28, alignItems: 'center', gap: 12, ...shadow,
    },
    emptyIconWrap: {
      width: 80, height: 80, borderRadius: 24,
      alignItems: 'center', justifyContent: 'center',
    },
    countRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },

    resultsCard: { borderRadius: 20, borderWidth: 1, overflow: 'hidden', ...shadow },
    resultsHead: { padding: 18, gap: 8, borderBottomWidth: StyleSheet.hairlineWidth },
    countPill: { alignSelf: 'flex-start', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8 },
    resultsActions: { padding: 16, gap: 10 },
    btnPrimary: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 16, borderRadius: 16,
    },
    btnOutline: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, paddingVertical: 16, borderRadius: 16, borderWidth: 1.5,
    },
  });
}
