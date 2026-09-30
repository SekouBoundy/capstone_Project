export const PROPERTY_TYPES = [
  { value: 'apartment', labelKey: 'housing.apartment' },
  { value: 'room', labelKey: 'housing.room' },
  { value: 'studio', labelKey: 'housing.studio' },
  { value: 'house', labelKey: 'housing.house' },
  { value: 'dorm', labelKey: 'housing.dorm' },
] as const;

export const PRODUCT_CATEGORIES = [
  { value: 'furniture', labelKey: 'marketplace.furniture' },
  { value: 'electronics', labelKey: 'marketplace.electronics' },
  { value: 'books', labelKey: 'marketplace.books' },
  { value: 'kitchen', labelKey: 'marketplace.kitchen' },
  { value: 'clothing', labelKey: 'marketplace.clothing' },
  { value: 'other', labelKey: 'marketplace.other' },
] as const;

export const PRODUCT_CONDITIONS = [
  { value: 'new', labelKey: 'marketplace.new' },
  { value: 'like_new', labelKey: 'marketplace.likeNew' },
  { value: 'good', labelKey: 'marketplace.good' },
  { value: 'fair', labelKey: 'marketplace.fair' },
] as const;

export const AMENITIES = [
  'wifi',
  'ac',
  'heating',
  'washer',
  'dryer',
  'dishwasher',
  'parking',
  'gym',
  'pool',
  'furnished',
  'balcony',
  'elevator',
  'security',
  'pets_allowed',
] as const;

export const CITIES = [
  'Nicosia',
  'Kyrenia',
  'Famagusta',
  'Morphou',
  'Lefke',
  'Iskele',
] as const;

/**
 * City-centre coordinates, keyed by the names in `CITIES`.
 *
 * A fallback for the map on a listing whose `latitude`/`longitude` are
 * null, which is the common case: the address column is free text but
 * nothing geocodes it. This is the city, not the property — the map says
 * so rather than dropping a pin somewhere invented. Pinning the property
 * itself needs a geocoding step at listing-creation time.
 */
export const CITY_COORDINATES: Record<string, { latitude: number; longitude: number }> = {
  Nicosia: { latitude: 35.1856, longitude: 33.3823 },
  Kyrenia: { latitude: 35.236, longitude: 33.117 },
  Famagusta: { latitude: 35.1264, longitude: 33.9403 },
  Morphou: { latitude: 35.198, longitude: 32.99 },
  Lefke: { latitude: 35.051, longitude: 32.839 },
  Iskele: { latitude: 35.054, longitude: 33.889 },
};

export const UNIVERSITIES = [
  'Eastern Mediterranean University (EMU)',
  'Near East University (NEU)',
  'Cyprus International University (CIU)',
  'European University of Lefke (EUL)',
  'Middle East Technical University (METU)',
  'Cyprus University of Technology',
  'Other',
] as const;

export const MAX_IMAGES_PER_LISTING = 10;

export const MESSAGE_PAGE_SIZE = 50;

export const PROPERTY_PRICE_RANGE = { min: 0, max: 5000 };
export const PRODUCT_PRICE_RANGE = { min: 0, max: 10000 };
