import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import type { NearbyPlace } from '../types/place';
import type { AppTheme } from '../context/ThemeContext';
import { formatDistance, formatDuration } from '../services/osrmService';
import { ThemedText } from './ThemedText';
import { AppIcon } from './AppIcon';

interface Props {
  place: NearbyPlace;
  index: number;
  onPress: (place: NearbyPlace) => void;
  theme: AppTheme;
}

export function PlaceListItem({ place, index, onPress, theme }: Props) {
  const c = theme.colors;

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: c.card,
          borderColor: c.border,
          shadowColor: theme.mode === 'dark' ? '#000' : '#94A3B8',
        },
      ]}
      onPress={() => onPress(place)}
      activeOpacity={0.75}
    >
      <View style={[styles.rank, { backgroundColor: c.primary, }]}>
        <ThemedText variant="badge" color="#FFFFFF">{index + 1}</ThemedText>
      </View>

      <View style={styles.content}>
        <View style={styles.topRow}>
          <ThemedText variant="bodyMedium" color={c.textPrimary} numberOfLines={1} style={{ flex: 1 }}>
            {place.name}
          </ThemedText>
          {place.distance != null && (
            <View style={[styles.distancePill, { backgroundColor: c.successLight }]}>
              <ThemedText variant="badge" color={c.success}>{formatDistance(place.distance)}</ThemedText>
            </View>
          )}
        </View>

        <ThemedText variant="caption" color={c.textSecondary} numberOfLines={1}>
          {place.address}
        </ThemedText>

        <View style={styles.metaRow}>
          {place.duration != null && (
            <ThemedText variant="caption" color={c.textMuted}>{formatDuration(place.duration)} drive</ThemedText>
          )}
          {place.openNow !== null && (
            <View style={[
              styles.statusPill,
              place.openNow
                ? { backgroundColor: c.successLight }
                : { backgroundColor: c.dangerLight },
            ]}>
              <ThemedText variant="badge" color={place.openNow ? c.success : c.danger}>
                {place.openNow ? 'Open' : 'Closed'}
              </ThemedText>
            </View>
          )}
          {place.rating !== null && (
            <View style={styles.ratingRow}>
              <AppIcon name="star" size={14} color={c.warning} />
              <ThemedText variant="captionMedium" color={c.warning}>{place.rating.toFixed(1)}</ThemedText>
            </View>
          )}
        </View>
      </View>

      <AppIcon name="chevron-forward" size={20} color={c.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    gap: 12,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  rank: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: { flex: 1, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  distancePill: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  metaRow: { flexDirection: 'row', gap: 10, alignItems: 'center', flexWrap: 'wrap' },
  statusPill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
