import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { usePlaces } from '../context/PlacesContext';
import { useTheme, type AppTheme } from '../context/ThemeContext';
import { useRecentSearches } from '../hooks/useRecentSearches';
import { PLACE_CATEGORIES } from '../config/placeTypes';
import type { GeocodedPlace } from '../services/geocodeService';
import { geocodeAddress, getPlaceCoordinates } from '../services/geocodeService';

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
    setError,
  } = usePlaces();

  const { recents, addRecent, clearRecents } = useRecentSearches();

  const [searchText, setSearchText] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [searchLabel, setSearchLabel] = useState<string | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLoading = status === 'locating' || status === 'fetching' || status === 'routing';
  const hasPlaces = status === 'done' && places.length > 0;

  async function handleGPS() {
    setSearchLabel(null);
    setSearchText('');
    setSuggestions([]);
    const success = await findPlaces();
    if (success) router.push('/map');
  }

  async function handlePlace(place: GeocodedPlace) {
    setSearchLabel(place.label);
    setSearchText('');
    setSuggestions([]);

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
    const cat = PLACE_CATEGORIES.find((c) => c.id === recent.categoryId);
    // Update local UI state
    if (cat) setSelectedCategory(cat);
    setSearchLabel(recent.label);
    setSearchText('');
    setSuggestions([]);
    // Pass cat directly — state update is async so the closure still has the old value
    const success = await findPlacesAt(recent.lat, recent.lon, cat);
    if (success) router.push('/map');
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
    setSuggestions([]);
    setNoResults(false);
    setSearchError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.trim().length < 5) return;
    debounceRef.current = setTimeout(async () => {
      setSearchingAddress(true);
      try {
        const results = await geocodeAddress(text);
        setSuggestions(results);
        setNoResults(results.length === 0);
      } catch (err) {
        setSuggestions([]);
        setNoResults(false);
        const msg = err instanceof Error ? err.message : 'Unknown search error';
        setSearchError(msg);
      } finally {
        setSearchingAddress(false);
      }
    }, 600);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const s = useMemo(() => makeStyles(c), [theme.mode]);

  return (
    <SafeAreaView style={[s.safe, { backgroundColor: c.background }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <Text style={[s.appTitle, { color: c.primary }]}>Nearby Finder</Text>
              <Text style={[s.appSubtitle, { color: c.textMuted }]}>Discover places around you</Text>
            </View>
            <TouchableOpacity style={[s.themeToggle, { backgroundColor: c.card, borderColor: c.border }]} onPress={toggleTheme}>
              <Text style={s.themeIcon}>{theme.mode === 'dark' ? '☀️' : '🌙'}</Text>
            </TouchableOpacity>
          </View>

          {/* ── Category Picker ── */}
          <View style={[s.section, { backgroundColor: c.card }]}>
            <Text style={[s.sectionTitle, { color: c.textSecondary }]}>WHAT ARE YOU LOOKING FOR?</Text>
            <View style={s.categoryGrid}>
              {PLACE_CATEGORIES.map((cat) => {
                const isSelected = cat.id === selectedCategory.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      s.categoryChip,
                      isSelected
                        ? { backgroundColor: c.primary, borderColor: c.primary }
                        : { backgroundColor: c.chipBackground, borderColor: c.chipBorder },
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.catEmoji, isSelected && s.catEmojiSelected]}>{cat.emoji}</Text>
                    <Text
                      style={[s.catLabel, { color: isSelected ? '#FFFFFF' : c.chipText }]}
                      numberOfLines={1}
                    >
                      {cat.label}
                    </Text>
                    {isSelected && <View style={s.selectedDot} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* ── Find Location ── */}
          <View style={[s.section, { backgroundColor: c.card }]}>
            <Text style={[s.sectionTitle, { color: c.textSecondary }]}>FIND LOCATION</Text>

            {/* GPS Button */}
            <TouchableOpacity
              style={[s.gpsBtn, { backgroundColor: c.primary }, isLoading && s.disabled]}
              onPress={handleGPS}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {status === 'locating'
                ? <ActivityIndicator color="#fff" size="small" />
                : <Text style={s.gpsBtnIcon}>📍</Text>
              }
              <Text style={s.gpsBtnText}>Use My Current Location</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={s.dividerRow}>
              <View style={[s.dividerLine, { backgroundColor: c.border }]} />
              <Text style={[s.dividerText, { color: c.textMuted }]}>or search by address</Text>
              <View style={[s.dividerLine, { backgroundColor: c.border }]} />
            </View>

            {/* Search Input */}
            <View style={[s.inputBox, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
              <Text style={s.inputIcon}>🔍</Text>
              <TextInput
                style={[s.input, { color: c.textPrimary }]}
                placeholder="Type a city or landmark…"
                placeholderTextColor={c.textMuted}
                value={searchText}
                onChangeText={handleSearchChange}
                returnKeyType="search"
                editable={!isLoading}
              />
              {searchingAddress && <ActivityIndicator size="small" color={c.primary} />}
            </View>

            {searchText.length > 0 && searchText.length < 5 && (
              <Text style={[s.hint, { color: c.textMuted }]}>Type at least 5 characters to search…</Text>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <View style={[s.suggestionsList, { backgroundColor: c.card, borderColor: c.border }]}>
                {suggestions.map((place, i) => (
                  <TouchableOpacity
                    key={i}
                    style={[s.suggestionRow, { borderBottomColor: c.border }, i === suggestions.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => handlePlace(place)}
                    activeOpacity={0.7}
                  >
                    <Text style={s.suggestionPin}>📍</Text>
                    <Text style={[s.suggestionText, { color: c.textPrimary }]} numberOfLines={2}>{place.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {noResults && searchText.length >= 5 && !searchingAddress && (
              <View style={[s.infoBox, { backgroundColor: c.warningLight }]}>
                <Text style={[s.infoText, { color: c.warning }]}>No results for "{searchText}". Try a broader term.</Text>
              </View>
            )}

            {searchError && (
              <View style={[s.infoBox, { backgroundColor: c.dangerLight }]}>
                <Text style={[s.infoText, { color: c.danger }]}>⚠️ {searchError}</Text>
              </View>
            )}

            {/* Recent Searches */}
            {recents.length > 0 && suggestions.length === 0 && (
              <View style={s.recentSection}>
                <View style={s.recentHeader}>
                  <Text style={[s.recentTitle, { color: c.textSecondary }]}>🕐 RECENT SEARCHES</Text>
                  <TouchableOpacity onPress={clearRecents}>
                    <Text style={[s.clearText, { color: c.primary }]}>Clear</Text>
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
                    <View style={[s.recentEmojiBox, { backgroundColor: c.primaryLight }]}>
                      <Text style={s.recentEmoji}>{r.categoryEmoji}</Text>
                    </View>
                    <View style={s.recentInfo}>
                      <Text style={[s.recentLabel, { color: c.textPrimary }]} numberOfLines={1}>{r.label}</Text>
                      <Text style={[s.recentMeta, { color: c.textMuted }]}>{r.categoryLabel}</Text>
                    </View>
                    <Text style={[s.recentChevron, { color: c.textMuted }]}>›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* ── Loading Status ── */}
          {isLoading && (
            <View style={[s.statusCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <ActivityIndicator color={c.primary} size="small" />
              <Text style={[s.statusText, { color: c.textSecondary }]}>{STATUS_LABELS[status]}</Text>
            </View>
          )}

          {/* ── Error ── */}
          {error && (
            <View style={[s.errorCard, { backgroundColor: c.dangerLight, borderColor: c.danger }]}>
              <Text style={s.errorIcon}>⚠️</Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.errorTitle, { color: c.danger }]}>Something went wrong</Text>
                <Text style={[s.errorBody, { color: c.danger }]} selectable>{error}</Text>
              </View>
            </View>
          )}

          {/* ── No results ── */}
          {status === 'done' && places.length === 0 && (
            <View style={[s.emptyCard, { backgroundColor: c.card }]}>
              <Text style={s.emptyEmoji}>{selectedCategory.emoji}</Text>
              <Text style={[s.emptyText, { color: c.textSecondary }]}>
                No {selectedCategory.labelPlural.toLowerCase()} found within 5 km.{'\n'}Try a different location.
              </Text>
            </View>
          )}

          {/* ── Results ── */}
          {hasPlaces && (
            <View style={[s.resultsCard, { backgroundColor: c.card, borderColor: c.border }]}>
              <View style={[s.resultsTop, { borderBottomColor: c.border }]}>
                <View style={[s.resultsBadge, { backgroundColor: c.primaryLight }]}>
                  <Text style={[s.resultsBadgeText, { color: c.primary }]}>
                    {selectedCategory.emoji}  {places.length} {places.length !== 1 ? selectedCategory.labelPlural : selectedCategory.label}
                  </Text>
                </View>
                {searchLabel && (
                  <Text style={[s.resultsNear, { color: c.textMuted }]}>near {searchLabel}</Text>
                )}
              </View>
              <View style={s.resultsBtns}>
                <TouchableOpacity style={[s.btnPrimary, { backgroundColor: c.primary }]} onPress={() => router.push('/map')} activeOpacity={0.85}>
                  <Text style={s.btnPrimaryText}>🗺️  View on Map</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[s.btnSecondary, { backgroundColor: c.primaryLight, borderColor: c.primary }]} onPress={() => router.push('/list')} activeOpacity={0.85}>
                  <Text style={[s.btnSecondaryText, { color: c.primary }]}>📋  View as List</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(c: AppTheme['colors']) {
  return StyleSheet.create({
    safe: { flex: 1 },
    scroll: { padding: 16, paddingBottom: 48, gap: 14 },

    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingVertical: 8 },
    headerLeft: { gap: 2 },
    appTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    appSubtitle: { fontSize: 13, fontWeight: '500' },
    themeToggle: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3,
    },
    themeIcon: { fontSize: 20 },

    section: {
      borderRadius: 20, padding: 18, gap: 12,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.07, shadowRadius: 10, elevation: 4,
    },
    sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },

    categoryGrid: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 10,
    },
    categoryChip: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 14, paddingVertical: 13,
      borderRadius: 14, borderWidth: 2,
      width: '47%', flexGrow: 1,
    },
    catEmoji: { fontSize: 22 },
    catEmojiSelected: { transform: [{ scale: 1.1 }] },
    catLabel: { fontSize: 13, fontWeight: '700', flex: 1 },
    selectedDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: 'rgba(255,255,255,0.7)', flexShrink: 0,
    },

    gpsBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      paddingVertical: 16, borderRadius: 16, gap: 8,
    },
    disabled: { opacity: 0.5 },
    gpsBtnIcon: { fontSize: 18 },
    gpsBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },

    dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    dividerLine: { flex: 1, height: 1 },
    dividerText: { fontSize: 12, fontWeight: '500' },

    inputBox: {
      flexDirection: 'row', alignItems: 'center',
      borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, gap: 8,
    },
    inputIcon: { fontSize: 16 },
    input: { flex: 1, paddingVertical: 14, fontSize: 14 },

    hint: { fontSize: 12, paddingHorizontal: 2 },

    suggestionsList: { borderRadius: 14, borderWidth: 1, overflow: 'hidden' },
    suggestionRow: {
      flexDirection: 'row', alignItems: 'center',
      padding: 14, gap: 10, borderBottomWidth: 1,
    },
    suggestionPin: { fontSize: 14 },
    suggestionText: { flex: 1, fontSize: 13, lineHeight: 18 },

    infoBox: { borderRadius: 12, padding: 12 },
    infoText: { fontSize: 12, lineHeight: 18 },

    recentSection: { gap: 0 },
    recentHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
    recentTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 1 },
    clearText: { fontSize: 12, fontWeight: '600' },
    recentRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingVertical: 12, borderBottomWidth: 1,
    },
    recentEmojiBox: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    recentEmoji: { fontSize: 20 },
    recentInfo: { flex: 1, gap: 2 },
    recentLabel: { fontSize: 14, fontWeight: '600' },
    recentMeta: { fontSize: 12 },
    recentChevron: { fontSize: 22 },

    statusCard: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      borderRadius: 16, padding: 16, borderWidth: 1,
    },
    statusText: { fontSize: 14, fontWeight: '500' },

    errorCard: {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      borderRadius: 16, padding: 16, borderWidth: 1,
    },
    errorIcon: { fontSize: 18 },
    errorTitle: { fontWeight: '700', fontSize: 14, marginBottom: 2 },
    errorBody: { fontSize: 12, lineHeight: 17 },

    emptyCard: {
      borderRadius: 20, padding: 28, alignItems: 'center', gap: 10,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    emptyEmoji: { fontSize: 48 },
    emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 22 },

    resultsCard: {
      borderRadius: 20, overflow: 'hidden', borderWidth: 1,
      shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 4,
    },
    resultsTop: { padding: 18, gap: 6, borderBottomWidth: 1 },
    resultsBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    resultsBadgeText: { fontSize: 15, fontWeight: '800' },
    resultsNear: { fontSize: 12 },
    resultsBtns: { padding: 14, gap: 10 },
    btnPrimary: { paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
    btnPrimaryText: { color: '#fff', fontSize: 15, fontWeight: '700' },
    btnSecondary: { paddingVertical: 15, borderRadius: 14, alignItems: 'center', borderWidth: 1.5 },
    btnSecondaryText: { fontSize: 15, fontWeight: '700' },
  });
}
