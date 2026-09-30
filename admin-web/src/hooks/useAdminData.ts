import { useQuery } from '@tanstack/react-query';
import * as api from '@/lib/api';

/**
 * React Query wrappers around the admin RPCs.
 *
 * `placeholderData: keepPrevious` on the paginated hooks is what stops
 * the table flashing empty when the offset or a filter changes: the
 * previous page stays on screen while the next one loads.
 */

const ADMIN_KEYS = {
  stats: ['admin', 'stats'] as const,
  users: (params: unknown) => ['admin', 'users', params] as const,
  verifications: (params: unknown) => ['admin', 'verifications', params] as const,
  reports: (params: unknown) => ['admin', 'reports', params] as const,
  properties: (params: unknown) => ['admin', 'properties', params] as const,
  products: (params: unknown) => ['admin', 'products', params] as const,
};

export const adminKeys = ADMIN_KEYS;

export function useDashboardStats() {
  return useQuery({
    queryKey: ADMIN_KEYS.stats,
    queryFn: api.fetchDashboardStats,
    // Counts move slowly; a stale dashboard on navigation is fine and
    // saves a round trip per page visit.
    staleTime: 30_000,
  });
}

export function useAdminUsers(params: {
  search: string;
  role: string;
  status: string;
  pageSize: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.users(params),
    queryFn: () => api.fetchUsers(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminVerifications(params: {
  status: string;
  pageSize: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.verifications(params),
    queryFn: () => api.fetchVerifications(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminReports(params: {
  status: string;
  reason: string;
  pageSize: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.reports(params),
    queryFn: () => api.fetchReports(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminProperties(params: {
  status: string;
  city: string;
  pageSize: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.properties(params),
    queryFn: () => api.fetchProperties(params),
    placeholderData: (previous) => previous,
  });
}

export function useAdminProducts(params: {
  status: string;
  category: string;
  pageSize: number;
  offset: number;
}) {
  return useQuery({
    queryKey: ADMIN_KEYS.products(params),
    queryFn: () => api.fetchProducts(params),
    placeholderData: (previous) => previous,
  });
}
