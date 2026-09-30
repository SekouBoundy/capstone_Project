import { Linking, Platform } from 'react-native';
import type { Property } from '@/types/models';

const GOOGLE_MAPS_SEARCH = 'https://www.google.com/maps/search/?api=1&query=';

/**
 * Open a property's location in the platform's maps app.
 *
 * Deliberately not `react-native-maps`: an embedded map needs a native
 * module, which means a development build and, on Android, a Google Maps
 * API key. A deep link to whatever maps app the user already has is one
 * tap, no key, and works in Expo Go.
 *
 * Preference order:
 *   1. lat/lng — the user asked for *this* pin, not the street address.
 *   2. the address text, as a search query. Every property row has an
 *      address but `latitude`/`longitude` are nullable and usually empty,
 *      so this is the common path, not the fallback.
 */
export async function openMapForProperty(property: Pick<Property, 'latitude' | 'longitude' | 'address' | 'city' | 'title'>): Promise<void> {
  const hasCoords =
    typeof property.latitude === 'number' &&
    typeof property.longitude === 'number' &&
    Number.isFinite(property.latitude) &&
    Number.isFinite(property.longitude);

  const url = hasCoords
    ? buildCoordsUrl(property.latitude as number, property.longitude as number, property.title)
    : buildQueryUrl([property.address, property.city].filter(Boolean).join(', ') || property.title);

  // `canOpenURL` rejects geo: on iOS and many https map URLs on Android
  // without a declared scheme, so it is not worth gating on: `openURL`
  // failing is the only real error case, and the caller surfaces it.
  await Linking.openURL(url);
}

function buildCoordsUrl(lat: number, lng: number, label?: string): string {
  const coords = `${lat},${lng}`;

  if (Platform.OS === 'ios') {
    const params = new URLSearchParams({ q: label ?? coords });
    return `https://maps.apple.com/?${params.toString()}`;
  }

  // `geo:` is the Android maps intent; the `q=` label is what gets
  // written on the pin. `google.navigation:` would launch turn-by-turn,
  // which is too much for "show me where this is".
  const q = label ? `${coords}(${label})` : coords;
  return `geo:${coords}?q=${encodeURIComponent(q)}`;
}

function buildQueryUrl(query: string): string {
  return `${GOOGLE_MAPS_SEARCH}${encodeURIComponent(query)}`;
}
