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
