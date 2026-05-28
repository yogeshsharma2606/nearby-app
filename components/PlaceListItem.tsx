import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import type { NearbyPlace } from '../types/place';
import type { AppTheme } from '../context/ThemeContext';
import { formatDistance, formatDuration } from '../services/osrmService';

interface Props {
  place: NearbyPlace;
  index: number;
  categoryEmoji: string;
  onPress: (place: NearbyPlace) => void;
  theme: AppTheme;
}

export function PlaceListItem({ place, index, categoryEmoji, onPress, theme }: Props) {
  const c = theme.colors;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: c.card, shadowColor: theme.mode === 'dark' ? '#000' : '#64748B' }]}
      onPress={() => onPress(place)}
      activeOpacity={0.75}
    >
      <View style={[styles.badge, { backgroundColor: c.primaryLight, borderColor: c.primary }]}>
        <Text style={[styles.badgeText, { color: c.primary }]}>{index + 1}</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={1}>{place.name}</Text>
          <View style={[styles.distancePill, { backgroundColor: c.successLight }]}>
            <Text style={[styles.distanceText, { color: c.success }]}>{formatDistance(place.distance)}</Text>
          </View>
        </View>

        <Text style={[styles.address, { color: c.textSecondary }]} numberOfLines={1}>
          📍 {place.address}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={[styles.meta, { color: c.textMuted }]}>⏱️ {formatDuration(place.duration)}</Text>
          {place.openNow !== null ? (
            <View style={[
              styles.openBadge,
              place.openNow
                ? { backgroundColor: c.successLight, borderColor: c.success }
                : { backgroundColor: c.dangerLight, borderColor: c.danger },
            ]}>
              <Text style={[styles.openText, { color: place.openNow ? c.success : c.danger }]}>
                {place.openNow ? 'Open' : 'Closed'}
              </Text>
            </View>
          ) : place.openingHours ? (
            <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>🕐 {place.openingHours}</Text>
          ) : null}
          {place.rating !== null && (
            <Text style={[styles.rating, { color: c.warning }]}>⭐ {place.rating.toFixed(1)}</Text>
          )}
        </View>
      </View>

      <Text style={[styles.chevron, { color: c.textMuted }]}>›</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 14,
    marginHorizontal: 14, marginBottom: 10,
    shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 8, elevation: 3,
    gap: 12,
  },
  badge: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  badgeText: { fontSize: 13, fontWeight: '800' },
  content: { flex: 1, gap: 5 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  name: { flex: 1, fontSize: 15, fontWeight: '700' },
  distancePill: { borderRadius: 10, paddingHorizontal: 9, paddingVertical: 4, flexShrink: 0 },
  distanceText: { fontSize: 12, fontWeight: '700' },
  address: { fontSize: 12, lineHeight: 16 },
  bottomRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  meta: { fontSize: 12 },
  rating: { fontSize: 12, fontWeight: '600' },
  openBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1 },
  openText: { fontSize: 11, fontWeight: '700' },
  chevron: { fontSize: 24, fontWeight: '300' },
});
