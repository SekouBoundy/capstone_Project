import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { VerificationRequest } from '@/types/models';

/**
 * The signed-in user's most recent verification request.
 *
 * Verification state lives in `verification_requests` (one row per
 * submission, status pending/approved/rejected) — there is no
 * `is_verified` column on `profiles`, so the badge on the account screen
 * has to be derived from the latest request rather than read off the
 * profile. Returns null when the user has never submitted one.
 */
export function useMyVerification(userId?: string) {
  return useQuery({
    queryKey: ['my-verification', userId],
    enabled: !!userId,
    queryFn: async (): Promise<VerificationRequest | null> => {
      const { data, error } = await supabase
        .from('verification_requests')
        .select('*')
        .eq('profile_id', userId!)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data ?? null;
    },
  });
}
