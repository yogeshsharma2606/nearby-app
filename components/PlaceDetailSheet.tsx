import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Platform, ScrollView, ActivityIndicator,
} from 'react-native';
import type { NearbyPlace } from '../types/place';
import type { AppTheme } from '../context/ThemeContext';
import { formatDistance, formatDuration } from '../services/osrmService';
import { fetchPlaceDetails } from '../services/placesService';

interface Props {
  place: NearbyPlace;
  categoryEmoji: string;
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

export function PlaceDetailSheet({ place, categoryEmoji, onClose, theme }: Props) {
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
            <Text style={styles.iconText}>{categoryEmoji}</Text>
          </View>
          <View style={styles.headerText}>
            <Text style={[styles.name, { color: c.textPrimary }]} numberOfLines={2}>{place.name}</Text>
            {place.brand && place.brand !== place.name && (
              <Text style={[styles.brand, { color: c.textSecondary }]}>{place.brand}</Text>
            )}
          </View>
        </View>

        {/* Rating + open badges */}
        <View style={styles.badgeRow}>
          {place.rating !== null && (
            <View style={[styles.badge, { backgroundColor: c.warningLight, borderColor: c.warning }]}>
              <Text style={[styles.badgeText, { color: c.warning }]}>⭐ {place.rating.toFixed(1)}</Text>
            </View>
          )}
          {place.openNow !== null && (
            <View style={[
              styles.badge,
              place.openNow
                ? { backgroundColor: c.successLight, borderColor: c.success }
                : { backgroundColor: c.dangerLight, borderColor: c.danger },
            ]}>
              <Text style={[styles.badgeText, { color: place.openNow ? c.success : c.danger }]}>
                {place.openNow ? '● Open now' : '● Closed now'}
              </Text>
            </View>
          )}
        </View>

        {/* Info Section */}
        <View style={[styles.infoSection, { backgroundColor: c.inputBackground, borderColor: c.border }]}>
          <InfoRow icon="📍" label="Address" value={place.address} c={c} />
          <InfoRow icon="📏" label="Distance" value={formatDistance(place.distance)} c={c} />
          <InfoRow icon="⏱️" label="Drive Time" value={formatDuration(place.duration)} c={c} />

          {/* Weekly hours */}
          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <Text style={styles.infoIcon}>🕐</Text>
            <View style={styles.infoContent}>
              <Text style={[styles.infoLabel, { color: c.textMuted }]}>Timings</Text>
              {loadingHours ? (
                <ActivityIndicator size="small" color={c.primary} style={{ marginTop: 4 }} />
              ) : weekdayHours && weekdayHours.length > 0 ? (
                weekdayHours.map((line, i) => (
                  <Text key={i} style={[styles.infoValue, { color: c.textPrimary }]}>{line}</Text>
                ))
              ) : (
                <Text style={[styles.infoValue, { color: c.textPrimary }]}>
                  {place.openingHours ?? 'Not available'}
                </Text>
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
          <Text style={styles.navBtnIcon}>🗺️</Text>
          <Text style={styles.navBtnText}>Open in Google Maps</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
          <Text style={[styles.closeBtnText, { color: c.textSecondary }]}>Close</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function InfoRow({ icon, label, value, c }: {
  icon: string; label: string; value: string;
  c: AppTheme['colors'];
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoIcon}>{icon}</Text>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: c.textPrimary }]}>{value}</Text>
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
  iconText: { fontSize: 28 },
  headerText: { flex: 1 },
  name: { fontSize: 19, fontWeight: '800', lineHeight: 26 },
  brand: { fontSize: 13, marginTop: 2 },

  badgeRow: { flexDirection: 'row', gap: 8, marginBottom: 18, flexWrap: 'wrap' },
  badge: { borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1 },
  badgeText: { fontSize: 13, fontWeight: '700' },

  infoSection: {
    borderRadius: 18, paddingVertical: 4,
    marginBottom: 20, borderWidth: 1,
  },
  infoRow: {
    flexDirection: 'row', alignItems: 'flex-start',
    paddingHorizontal: 16, paddingVertical: 13,
    gap: 12, borderBottomWidth: 1, borderBottomColor: 'transparent',
  },
  infoIcon: { fontSize: 18, width: 26, textAlign: 'center', marginTop: 1 },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 3 },
  infoValue: { fontSize: 14, lineHeight: 20 },

  navBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 17, borderRadius: 16, gap: 8, marginBottom: 12,
  },
  navBtnIcon: { fontSize: 20 },
  navBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  closeBtn: { alignItems: 'center', paddingVertical: 12 },
  closeBtnText: { fontSize: 15, fontWeight: '500' },
});
