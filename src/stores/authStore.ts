import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import { PROFILE_PUBLIC_COLUMNS } from '@/lib/profileColumns';
import { Session, User } from '@supabase/supabase-js';
import { Profile } from '@/types/models';

interface AuthState {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  initialize: () => Promise<void>;
  setSession: (session: Session | null) => void;
  setProfile: (profile: Profile | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  user: null,
  profile: null,
  loading: true,

  initialize: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ session, user: session?.user ?? null, loading: false });

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select(PROFILE_PUBLIC_COLUMNS)
          .eq('id', session.user.id)
          .single();
        set({ profile: profile ?? null });
      }

      supabase.auth.onAuthStateChange(async (_event, session) => {
        set({ session, user: session?.user ?? null });
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select(PROFILE_PUBLIC_COLUMNS)
            .eq('id', session.user.id)
            .single();
          set({ profile: profile ?? null });
        } else {
          set({ profile: null });
        }
      });
    } catch {
      set({ loading: false });
    }
  },

  setSession: (session) => set({ session, user: session?.user ?? null }),
  setProfile: (profile) => set({ profile }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
