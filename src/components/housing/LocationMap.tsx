import { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import MapView, { Marker, type Region } from 'react-native-maps';
import { useTranslation } from 'react-i18next';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';
import { CITY_COORDINATES } from '@/lib/constants';
import { colors, spacing, radii, typography } from '@/theme';

interface LocationMapProps {
  latitude: number | null;
  longitude: number | null;
  city: string;
  address: string;
  title: string;
  height?: number;
}

/** How far the camera sits back, in degrees, for a city-level fallback. */
const CITY_ZOOM = 0.35;
/** A street-level zoom for a listing that has a real pin. */
const PROPERTY_ZOOM = 0.012;

/**
 * Embedded map for a listing's Location section.
 *
 * `react-native-maps` is in Expo Go as of SDK 57, so this renders in the
 * Expo Go app without a development build. It uses the platform default
 * provider — Apple Maps on iOS (no API key), Google Maps on Android.
 *
 * Web is excluded deliberately. `react-native-maps` needs a DOM map host
 * that Metro's web bundle does not reliably provide, and a broken web
 * build is a worse outcome than a plain card on a platform the app does
 * not ship to.
 */
export function LocationMap({
  latitude,
  longitude,
  city,
  address,
  title,
  height = 220,
}: LocationMapProps) {
  const { t } = useTranslation();
  const [mapReady, setMapReady] = useState(false);

  const hasPin =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude);

  const fallback = CITY_COORDINATES[city];

  const center = useMemo<{ latitude: number; longitude: number } | null>(() => {
    if (hasPin) return { latitude: latitude as number, longitude: longitude as number };
    return fallback ?? null;
  }, [hasPin, latitude, longitude, fallback]);

  if (Platform.OS === 'web') {
    return (
      <View style={[styles.card, { height }]}>
        <MaterialCommunityIcons name="map-marker-outline" size={28} color={colors.textMuted} />
        <Text style={styles.webText}>{[address, city].filter(Boolean).join(', ')}</Text>
      </View>
    );
  }

  // No pin and no known city: there is genuinely nowhere to point. Say so
  // rather than framing the Atlantic somewhere.
  if (!center) {
    return (
      <View style={[styles.card, { height }]}>
        <MaterialCommunityIcons name="map-marker-off-outline" size={28} color={colors.textMuted} />
        <Text style={styles.webText}>{t('housing.noLocation')}</Text>
      </View>
    );
  }

  const region: Region = {
    ...center,
    latitudeDelta: hasPin ? PROPERTY_ZOOM : CITY_ZOOM,
    longitudeDelta: hasPin ? PROPERTY_ZOOM : CITY_ZOOM,
  };

  return (
    <View style={[styles.wrap, { height }]}>
      <MapView
        initialRegion={region}
        onMapReady={() => setMapReady(true)}
        // Gestures stay on: this is a map, and being unable to look around
        // is the thing people complain about most.
        showsCompass={false}
        showsScale={false}
        showsUserLocation={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        loadingBackgroundColor={colors.surfaceMuted}
        loadingIndicatorColor={colors.textMuted}
        // `absoluteFill` positions the map inside the rounded, clipping
        // wrapper; the opacity crossfade hides the grey frame while tiles
        // are still downloading.
        style={[StyleSheet.absoluteFill, mapReady ? styles.ready : styles.loading]}
      >
        {hasPin ? (
          <Marker
            coordinate={center}
            title={title}
            description={[address, city].filter(Boolean).join(', ')}
            // A flat pin rather than the default teardrop: at this size
            // the bubble reads as a blob, and a circle matches the
            // monochrome icon set the rest of the app uses.
            pinColor={colors.text}
          />
        ) : null}
      </MapView>

      {/* A city-level map is a fallback, not the address. Saying so is the
          difference between "this is where the flat is" and "this is
          somewhere in Nicosia". */}
      {!hasPin ? (
        <View style={styles.notice} pointerEvents="none">
          <MaterialCommunityIcons name="information-outline" size={13} color={colors.text} />
          <Text style={styles.noticeText} numberOfLines={1}>
            {t('housing.approximateLocation')}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radii.lg,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  // The fade-in on ready avoids a flash of grey when the tiles are still
  // downloading, which reads as a broken image rather than a loading map.
  loading: { opacity: 0 },
  ready: { opacity: 1 },

  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  webText: { ...typography.caption, textAlign: 'center' },

  notice: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    right: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.sm,
  },
  noticeText: { ...typography.label, color: colors.text, flexShrink: 1 },
});
