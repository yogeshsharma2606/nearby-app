import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TextInput, TouchableOpacity,
  FlatList, ActivityIndicator, Modal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { AppTheme } from '../context/ThemeContext';
import type { GeocodedPlace } from '../services/geocodeService';
import { geocodeAddress } from '../services/geocodeService';
import { ThemedText } from './ThemedText';
import { AppIcon } from './AppIcon';
import { FONT } from '../theme/typography';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (place: GeocodedPlace) => void;
  theme: AppTheme;
}

export function SearchModal({ visible, onClose, onSelect, theme }: Props) {
  const c = theme.colors;
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [text, setText] = useState('');
  const [suggestions, setSuggestions] = useState<GeocodedPlace[]>([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setText('');
      setSuggestions([]);
      setNoResults(false);
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [visible]);

  const handleChange = useCallback((val: string) => {
    setText(val);
    setSuggestions([]);
    setNoResults(false);
    setError(null);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length < 4) return;
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await geocodeAddress(val);
        setSuggestions(results);
        setNoResults(results.length === 0);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
      } finally {
        setLoading(false);
      }
    }, 500);
  }, []);

  function handleSelect(place: GeocodedPlace) {
    onSelect(place);
    onClose();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: c.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.topBar, { paddingTop: insets.top + 8, backgroundColor: c.card, borderBottomColor: c.border }]}>
          <View style={[styles.inputRow, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
            <AppIcon name="search" size={20} color={c.textMuted} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: c.textPrimary }]}
              placeholder="Search city, area or landmark…"
              placeholderTextColor={c.textMuted}
              value={text}
              onChangeText={handleChange}
              returnKeyType="search"
              autoCorrect={false}
            />
            {loading ? (
              <ActivityIndicator size="small" color={c.primary} style={{ marginRight: 8 }} />
            ) : text.length > 0 ? (
              <TouchableOpacity onPress={() => { setText(''); setSuggestions([]); }} style={styles.clearBtn}>
                <AppIcon name="close-circle" size={22} color={c.textMuted} />
              </TouchableOpacity>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
            <ThemedText variant="bodyMedium" color={c.primary}>Cancel</ThemedText>
          </TouchableOpacity>
        </View>

        {text.length > 0 && text.length < 4 && (
          <View style={styles.hintRow}>
            <ThemedText variant="caption" color={c.textMuted}>Type at least 4 characters…</ThemedText>
          </View>
        )}

        {error && (
          <View style={[styles.infoRow, { backgroundColor: c.dangerLight }]}>
            <ThemedText variant="caption" color={c.danger}>{error}</ThemedText>
          </View>
        )}

        {noResults && !loading && (
          <View style={styles.hintRow}>
            <ThemedText variant="caption" color={c.textMuted}>
              No results for "{text}" — try a broader term.
            </ThemedText>
          </View>
        )}

        <FlatList
          data={suggestions}
          keyExtractor={(item, i) => item.placeId ?? `${i}-${item.label}`}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.row, { borderBottomColor: c.border }]}
              onPress={() => handleSelect(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.pinCircle, { backgroundColor: c.primaryLight }]}>
                <AppIcon name="location-outline" size={20} color={c.primary} />
              </View>
              <ThemedText variant="body" color={c.textPrimary} numberOfLines={2} style={{ flex: 1 }}>
                {item.label}
              </ThemedText>
            </TouchableOpacity>
          )}
          ListFooterComponent={<View style={{ height: insets.bottom + 16 }} />}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingBottom: 14,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 14,
    gap: 8,
    minHeight: 50,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: FONT.regular,
    paddingVertical: 12,
  },
  clearBtn: { padding: 4 },
  cancelBtn: { paddingHorizontal: 4, paddingVertical: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pinCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintRow: { paddingHorizontal: 18, paddingVertical: 14 },
  infoRow: { marginHorizontal: 14, marginTop: 10, borderRadius: 12, padding: 14 },
});
