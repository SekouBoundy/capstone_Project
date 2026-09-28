import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { Profile, VerificationRequest, Report } from '@/types/models';

async function fetchAdminUsers(search?: string): Promise<Profile[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (search) {
    query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

async function fetchAdminVerifications(): Promise<VerificationRequest[]> {
  const { data, error } = await supabase
    .from('verification_requests')
    .select('*, profile:profiles(*)')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

async function fetchAdminReports(): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*, reporter:profiles(*)')
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
