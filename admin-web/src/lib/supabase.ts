import { createClient } from '@supabase/supabase-js';

/**
 * One Supabase project, two clients.
 *
 * The mobile app (src/lib/supabase.ts) and this panel authenticate
 * against the same auth.users and obey the same RLS policies, so an
 * admin account works in both places with no second identity to manage.
 *
 * Credentials are read from the repository root .env (see `envDir` in
 * vite.config.ts). The names deliberately match the app's EXPO_PUBLIC_*
 * variables -- Vite only exposes prefixed names to the client bundle, so
 * reusing that prefix is what lets one .env drive both.
 */
const supabaseUrl =
  import.meta.env.EXPO_PUBLIC_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL;

const supabaseAnonKey =
  import.meta.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase credentials. Set EXPO_PUBLIC_SUPABASE_URL and ' +
      'EXPO_PUBLIC_SUPABASE_ANON_KEY in the repository root .env (copy .env.example).',
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    // The browser has no SecureStore; supabase-js defaults to
    // localStorage, which is what we want here. Refresh tokens keep the
    // session alive across reloads so an admin is not re-prompted.
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
