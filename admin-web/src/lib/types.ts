/**
 * Response shapes for the admin RPCs in supabase/migrations/014.
 *
 * These are hand-written rather than generated: the project has no
 * `supabase gen types` output checked in, and the RPC return types are
 * declared in SQL. When a migration changes a function's RETURNS TABLE,
 * the matching interface here must change with it.
 *
 * `total_count` is carried on every row by a `count(*) OVER ()` window
 * function, so a paginated table knows its grand total without a second
 * round trip. It is `0` on an empty result set, because an empty set
 * produces no rows to carry it -- callers should fall back to their own
 * row count for the "showing N results" line.
 */

export type UserRole = 'student' | 'owner' | 'agency' | 'admin';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type ReportStatus = 'open' | 'investigating' | 'resolved' | 'dismissed';
export type ReportReason = 'fake_listing' | 'scam' | 'inappropriate' | 'spam' | 'other';
export type PropertyStatus = 'draft' | 'published' | 'unavailable' | 'removed';
export type ProductStatus = 'active' | 'sold' | 'removed';
export type PropertyType = 'apartment' | 'room' | 'studio' | 'house' | 'dorm';
export type ProductCategory =
  | 'furniture'
  | 'electronics'
  | 'books'
  | 'kitchen'
  | 'clothing'
  | 'other';
export type ProductCondition = 'new' | 'like_new' | 'good' | 'fair';

export interface DashboardStats {
  total_users: number;
  suspended_users: number;
  new_users_7d: number;
  total_properties: number;
  published_properties: number;
  total_products: number;
  active_products: number;
  pending_verifications: number;
  open_reports: number;
}

export interface AdminUser {
  total_count: number;
  id: string;
  full_name: string | null;
  role: UserRole;
  email: string | null;
  phone: string | null;
  university: string | null;
  faculty: string | null;
  year_of_study: string | null;
  is_suspended: boolean;
  preferred_locale: string;
  property_count: number;
  product_count: number;
  report_count: number;
  created_at: string;
}

export interface AdminVerification {
  total_count: number;
  id: string;
  profile_id: string;
  role_type: 'owner' | 'agency';
  id_document_url: string | null;
  agency_name: string | null;
  business_reg_url: string | null;
  contact_person: string | null;
  status: VerificationStatus;
  admin_notes: string | null;
  reviewed_at: string | null;
  created_at: string;
  applicant_name: string | null;
  applicant_email: string | null;
  applicant_phone: string | null;
  applicant_suspended: boolean;
}

export interface AdminReport {
  total_count: number;
  id: string;
  reporter_id: string;
  reporter_name: string | null;
  reporter_email: string | null;
  target_type: 'user' | 'property' | 'product' | 'message';
  target_id: string;
  target_title: string;
  reason: ReportReason;
  description: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  created_at: string;
}

export interface AdminProperty {
  total_count: number;
  id: string;
  owner_id: string;
  owner_name: string | null;
  owner_email: string | null;
  owner_suspended: boolean;
  title: string;
  property_type: PropertyType;
  price_monthly: number;
  currency: string | null;
  city: string | null;
  available: boolean;
  is_verified: boolean;
  status: PropertyStatus;
  created_at: string;
  report_count: number;
}

export interface AdminProduct {
  total_count: number;
  id: string;
  seller_id: string;
  seller_name: string | null;
  seller_email: string | null;
  seller_suspended: boolean;
  title: string;
  category: ProductCategory;
  condition: ProductCondition;
  price: number;
  currency: string | null;
  city: string | null;
  status: ProductStatus;
  created_at: string;
  report_count: number;
}

/** A page of rows plus the total the query matched before LIMIT/OFFSET. */
export interface Paged<T> {
  rows: T[];
  total: number;
}
