import { supabase } from './supabase';
import type {
  AdminProduct,
  AdminProperty,
  AdminReport,
  AdminUser,
  AdminVerification,
  DashboardStats,
  Paged,
} from './types';

/**
 * Typed wrappers around the admin RPCs in migrations 011 and 014.
 *
 * Every one of those functions is SECURITY DEFINER and gated on
 * public.is_admin(), so a 42501 'admin privileges required' here means
 * the signed-in account is not an active admin -- the UI turns that
 * into a redirect rather than a generic error.
 *
 * The cast on each result is deliberate. supabase-js infers RPC return
 * types only when the client is constructed with a generated `Database`
 * generic, which this project does not have. Rather than hand-maintain a
 * parallel generated file, the shapes live in lib/types.ts and are
 * asserted here, in one place.
 */

const ADMIN_DENIED = 'admin privileges required';

/** True when an error is the is_admin() gate rejecting the caller. */
export function isAdminDenied(error: { message?: string } | null): boolean {
  return !!error && (error.message?.includes(ADMIN_DENIED) ?? false);
}

function unwrap<T>(data: T[] | null): T[] {
  return data ?? [];
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('admin_dashboard_stats');
  if (error) throw error;
  // RETURNS TABLE with a single row: an empty array would mean the
  // function returned nothing, which cannot happen past the is_admin()
  // gate. Zeroing out keeps the dashboard renderable rather than
  // crashing on a structural surprise.
  return (data as DashboardStats[] | null)?.[0] ?? {
    total_users: 0,
    suspended_users: 0,
    new_users_7d: 0,
    total_properties: 0,
    published_properties: 0,
    total_products: 0,
    active_products: 0,
    pending_verifications: 0,
    open_reports: 0,
  };
}

export async function fetchUsers(params: {
  search?: string;
  role?: string;
  status?: string;
  pageSize: number;
  offset: number;
}): Promise<Paged<AdminUser>> {
  const { data, error } = await supabase.rpc('admin_list_users', {
    search_term: params.search?.trim() || null,
    role_filter: params.role || null,
    status_filter: params.status || null,
    page_size: params.pageSize,
    page_offset: params.offset,
  });
  if (error) throw error;
  const rows = unwrap(data as AdminUser[] | null);
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function setUserRole(userId: string, role: string): Promise<void> {
  const { error } = await supabase.rpc('admin_set_role', {
    target_id: userId,
    new_role: role,
  });
  if (error) throw error;
}

export async function setUserSuspended(userId: string, suspended: boolean): Promise<void> {
  const { error } = await supabase.rpc('admin_set_suspended', {
    target_id: userId,
    suspended,
  });
  if (error) throw error;
}

export async function fetchVerifications(params: {
  status?: string;
  pageSize: number;
  offset: number;
}): Promise<Paged<AdminVerification>> {
  const { data, error } = await supabase.rpc('admin_list_verifications', {
    status_filter: params.status || null,
    page_size: params.pageSize,
    page_offset: params.offset,
  });
  if (error) throw error;
  const rows = unwrap(data as AdminVerification[] | null);
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function reviewVerification(params: {
  requestId: string;
  decision: 'approved' | 'rejected';
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_review_verification', {
    request_id: params.requestId,
    decision: params.decision,
    notes: params.notes?.trim() || null,
  });
  if (error) throw error;
}

export async function fetchReports(params: {
  status?: string;
  reason?: string;
  pageSize: number;
  offset: number;
}): Promise<Paged<AdminReport>> {
  const { data, error } = await supabase.rpc('admin_list_reports', {
    status_filter: params.status || null,
    reason_filter: params.reason || null,
    page_size: params.pageSize,
    page_offset: params.offset,
  });
  if (error) throw error;
  const rows = unwrap(data as AdminReport[] | null);
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function updateReport(params: {
  reportId: string;
  status: string;
  notes?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_update_report', {
    report_id: params.reportId,
    new_status: params.status,
    notes: params.notes?.trim() || null,
  });
  if (error) throw error;
}

export async function fetchProperties(params: {
  status?: string;
  city?: string;
  pageSize: number;
  offset: number;
}): Promise<Paged<AdminProperty>> {
  const { data, error } = await supabase.rpc('admin_list_properties', {
    status_filter: params.status || null,
    city_filter: params.city || null,
    page_size: params.pageSize,
    page_offset: params.offset,
  });
  if (error) throw error;
  const rows = unwrap(data as AdminProperty[] | null);
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function moderateProperty(params: {
  propertyId: string;
  status: 'published' | 'removed';
  reason?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_moderate_property', {
    property_id: params.propertyId,
    new_status: params.status,
    reason: params.reason?.trim() || null,
  });
  if (error) throw error;
}

export async function fetchProducts(params: {
  status?: string;
  category?: string;
  pageSize: number;
  offset: number;
}): Promise<Paged<AdminProduct>> {
  const { data, error } = await supabase.rpc('admin_list_products', {
    status_filter: params.status || null,
    category_filter: params.category || null,
    page_size: params.pageSize,
    page_offset: params.offset,
  });
  if (error) throw error;
  const rows = unwrap(data as AdminProduct[] | null);
  return { rows, total: rows.length ? Number(rows[0].total_count) : 0 };
}

export async function moderateProduct(params: {
  productId: string;
  status: 'active' | 'removed';
  reason?: string;
}): Promise<void> {
  const { error } = await supabase.rpc('admin_moderate_product', {
    product_id: params.productId,
    new_status: params.status,
    reason: params.reason?.trim() || null,
  });
  if (error) throw error;
}

/**
 * Whether the signed-in account is an active admin.
 *
 * Asks the database rather than reading profiles.role: is_admin() also
 * checks is_suspended, so it stays correct if an admin is suspended and
 * a cached profile still says admin.
 */
export async function checkIsAdmin(): Promise<boolean> {
  const { data, error } = await supabase.rpc('is_admin');
  if (error) throw error;
  return data === true;
}
