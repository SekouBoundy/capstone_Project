export type UserRole = 'student' | 'owner' | 'agency' | 'admin';

export type PropertyStatus = 'draft' | 'published' | 'unavailable' | 'removed';

export type PropertyType = 'apartment' | 'room' | 'studio' | 'house' | 'dorm';

export type ProductStatus = 'active' | 'sold' | 'removed';

export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';

export type ProductCategory = 'furniture' | 'electronics' | 'books' | 'kitchen' | 'clothing' | 'other';

export type VerificationStatus = 'pending' | 'approved' | 'rejected';

export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';

export type ReportReason = 'fake_listing' | 'scam' | 'inappropriate' | 'spam' | 'other';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email?: string;
  phone: string | null;
  avatar_url: string | null;
  university: string | null;
  faculty: string | null;
  year_of_study: string | null;
  bio: string | null;
  preferred_locale: 'en' | 'fr' | 'tr' | 'ar';
  is_suspended: boolean;
  created_at: string;
  updated_at: string;
}

export interface VerificationRequest {
  id: string;
  profile_id: string;
  role_type: 'owner' | 'agency';
  id_document_url: string | null;
  agency_name: string | null;
  business_reg_url: string | null;
  contact_person: string | null;
  status: VerificationStatus;
  admin_notes: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export interface Property {
  id: string;
  owner_id: string;
  title: string;
  description: string;
  property_type: PropertyType;
  price_monthly: number;
  charges: number | null;
  currency: string;
  rooms: number;
  bathrooms: number;
  area_sqm: number | null;
  furnished: boolean;
  amenities: string[];
  address: string;
  city: string;
  latitude: number | null;
  longitude: number | null;
  available_from: string | null;
  available: boolean;
  is_verified: boolean;
  status: PropertyStatus;
  created_at: string;
  updated_at: string;
  images?: PropertyImage[];
  owner?: Profile;
}

export interface PropertyImage {
  id: string;
  property_id: string;
  image_url: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: string;
  seller_id: string;
  title: string;
  description: string;
  category: ProductCategory;
  price: number;
  currency: string;
  condition: ProductCondition;
  image_urls: string[];
  city: string;
  status: ProductStatus;
  created_at: string;
  updated_at: string;
  seller?: Profile;
}

export interface Conversation {
  id: string;
  listing_type: 'property' | 'product';
  listing_id: string;
  participant_a: string;
  participant_b: string;
  created_at: string;
  last_message_at: string;
  listing?: Property | Product;
  other_participant?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
  sender?: Profile;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: 'user' | 'property' | 'product' | 'message';
  target_id: string;
  reason: ReportReason;
  description: string;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  reporter?: Profile;
}

export interface Favorite {
  id: string;
  user_id: string;
  listing_type: 'property' | 'product';
  listing_id: string;
  created_at: string;
  listing?: Property | Product;
}

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_message' | 'verification_update' | 'listing_approved' | 'report_update';
  title: string;
  body: string;
  data: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

export interface HousingFilters {
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  propertyType?: PropertyType;
  rooms?: number;
  furnished?: boolean;
  city?: string;
}

export interface MarketplaceFilters {
  search?: string;
  category?: ProductCategory;
  minPrice?: number;
  maxPrice?: number;
  condition?: ProductCondition;
  city?: string;
}
