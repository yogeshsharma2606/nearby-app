import React, { useEffect, useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity,
  Linking, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import { ThemedText } from './ThemedText';
import { CategoryIcon } from './CategoryIcon';
import { AppIcon } from './AppIcon';
import type { ComponentProps } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { NearbyPlace } from '../types/place';
import type { AppTheme } from '../context/ThemeContext';
import { formatDistance, formatDuration } from '../services/osrmService';
import { fetchPlaceDetails } from '../services/placesService';

type IonName = ComponentProps<typeof Ionicons>['name'];

interface Props {
  place: NearbyPlace;
  categoryId: string;
  onClose: () => void;
  theme: AppTheme;
}

function openInGoogleMaps(lat: number, lon: number, name: string) {
  const label = encodeURIComponent(name);
  const url = Platform.select({
    ios: `maps:0,0?q=${label}@${lat},${lon}`,
    android: `geo:${lat},${lon}?q=${lat},${lon}(${label})`,
    default: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`,
  });
  Linking.openURL(url ?? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`);
}

export function PlaceDetailSheet({ place, categoryId, onClose, theme }: Props) {
  const c = theme.colors;
  const [weekdayHours, setWeekdayHours] = useState<string[] | null>(place.weekdayHours);
  const [loadingHours, setLoadingHours] = useState(false);

  useEffect(() => {
    if (place.placeId && !weekdayHours) {
      setLoadingHours(true);
      fetchPlaceDetails(place.placeId)
        .then((d) => setWeekdayHours(d.weekdayHours))
        .catch(() => setWeekdayHours(null))
        .finally(() => setLoadingHours(false));
    }
  }, [place.placeId]);

  return (
    <View style={[styles.container, { backgroundColor: c.card }]}>
      <View style={[styles.handle, { backgroundColor: c.border }]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.iconCircle, { backgroundColor: c.primaryLight }]}>
            <CategoryIcon categoryId={categoryId} size={28} color={c.primary} />
          </View>
          <View style={styles.headerText}>
            <ThemedText variant="title" color={c.textPrimary} numberOfLines={2}>{place.name}</ThemedText>
            {place.brand && place.brand !== place.name && (
              <ThemedText variant="caption" color={c.textSecondary}>{place.brand}</ThemedText>
            )}
          </View>
        </View>

        {/* Rating + open badges */}
        <View style={styles.badgeRow}>
          {place.rating !== null && (
            <View style={[styles.badge, { backgroundColor: c.warningLight, borderColor: c.warning }]}>
              <View style={styles.starRow}>
                <AppIcon name="star" size={14} color={c.warning} />
                <ThemedText variant="captionMedium" color={c.warning}>{place.rating.toFixed(1)}</ThemedText>
              </View>
            </View>
          )}
          {place.openNow !== null && (
            <View style={[
              styles.badge,
              place.openNow
                ? { backgroundColor: c.successLight, borderColor: c.success }
                : { backgroundColor: c.dangerLight, borderColor: c.danger },
            ]}>
              <ThemedText variant="captionMedium" color={place.openNow ? c.success : c.danger}>
                {place.openNow ? 'Open now' : 'Closed now'}
              </ThemedText>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
          <InfoRow icon="location-outline" label="Address" value={place.address} c={c} />
          <InfoRow icon="navigate-outline" label="Distance" value={formatDistance(place.distance)} c={c} />
          <InfoRow icon="time-outline" label="Drive Time" value={formatDuration(place.duration)} c={c} />

          {/* Weekly hours */}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoIconWrap}>
              <AppIcon name="calendar-outline" size={20} color={c.primary} />
            </View>
            <View style={styles.infoContent}>
              <ThemedText variant="sectionLabel" color={c.textMuted}>Timings</ThemedText>
              {loadingHours ? (
                <ActivityIndicator size="small" color={c.primary} style={{ marginTop: 4 }} />
              ) : weekdayHours && weekdayHours.length > 0 ? (
                weekdayHours.map((line, i) => (
                  <ThemedText key={i} variant="body" color={c.textPrimary}>{line}</ThemedText>
                ))
              ) : (
                <ThemedText variant="body" color={c.textPrimary}>
                  {place.openingHours ?? 'Not available'}
                </ThemedText>
              )}
            </View>
          </View>
        </View>

        {/* Navigate */}
        <TouchableOpacity
          style={[styles.navBtn, { backgroundColor: c.primary }]}
          onPress={() => openInGoogleMaps(place.lat, place.lon, place.name)}
          activeOpacity={0.85}
        >
          <AppIcon name="navigate" size={20} color="#FFFFFF" />
          <ThemedText variant="button" color="#FFFFFF">Open in Google Maps</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <ThemedText variant="bodyMedium" color={c.textSecondary}>Close</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, c }: {
  icon: IonName; label: string; value: string;
  c: AppTheme['colors'];
}) {
  return (
    <View style={[styles.infoRow, { borderBottomColor: c.border }]}>
      <View style={styles.infoIconWrap}>
        <AppIcon name={icon} size={20} color={c.primary} />
      </View>
      <View style={styles.infoContent}>
        <ThemedText variant="sectionLabel" color={c.textMuted}>{label}</ThemedText>
        <ThemedText variant="body" color={c.textPrimary}>{value}</ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingBottom: 36, maxHeight: '85%',
    shadowColor: '#000', shadowOffset: { width: 0, height: -6 }, shadowOpacity: 0.15, shadowRadius: 16, elevation: 24,
  },
  handle: {
    width: 44, height: 5, borderRadius: 3,
    alignSelf: 'center', marginTop: 14, marginBottom: 20,
  },
  header: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 14, gap: 14 },
  iconCircle: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  headerText: { flex: 1 },
  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  badge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  starRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },

  infoSection: {
    borderRadius: 18, paddingVertical: 4,
    marginBottom: 20, borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 13,
    gap: 12, borderBottomWidth: 1, borderBottomColor: 'transparent',
  },
  infoIconWrap: { width: 28, alignItems: 'center', marginTop: 1 },
  infoContent: { flex: 1 },
  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 17, borderRadius: 16, marginBottom: 12,
  },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
});
