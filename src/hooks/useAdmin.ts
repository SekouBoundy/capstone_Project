import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { Profile, VerificationRequest, Report } from '@/types/models';

async function fetchAdminUsers(search?: string): Promise<Profile[]> {
  // email lives in auth.users, which PostgREST cannot select from, and
  // profiles.email is withheld from this role by column-level grants
  // (migration 012). So admin search goes through a SECURITY DEFINER
  // RPC that joins the two and is gated on profiles.role = 'admin'.
  const { data, error } = await supabase.rpc('admin_search_users', {
    search_term: search && search.trim() ? search.trim() : null,
  });
  if (error) throw error;
  return (data as Profile[]) || [];
}

async function fetchAdminVerifications(): Promise<VerificationRequest[]> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select(`*, profile:profiles(${PROFILE_PUBLIC_COLUMNS})`)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchAdminReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(`*, reporter:profiles(${PROFILE_PUBLIC_COLUMNS})`)
    .eq('status', 'open')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useAdminUsers(search?: string) {
  return useQuery({
    queryKey: ['admin-users', search],
    queryFn: () => fetchAdminUsers(search),
  });
}

export function useAdminVerifications() {
  return useQuery({
    queryKey: ['admin-verifications'],
    queryFn: fetchAdminVerifications,
  });
}

export function useAdminReports() {
  return useQuery({
    queryKey: ['admin-reports'],
    queryFn: fetchAdminReports,
  });
}
