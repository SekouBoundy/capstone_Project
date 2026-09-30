import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { checkIsAdmin } from '@/lib/api';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  /** True while the session and the admin check are still resolving. */
  loading: boolean;
  /** Resolved admin status. Null until `loading` is false. */
  isAdmin: boolean | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      // The admin check needs a session, so `loading` is only released
      // after it has run (or been skipped for a signed-out visitor).
      if (!data.session) setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => {
      if (!active) return;
      setSession(next);
      setUser(next?.user ?? null);
      if (!next) {
        setIsAdmin(null);
        setLoading(false);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Re-check whenever the user id changes. Asking the database rather
  // than trusting a cached role means a suspension takes effect on the
  // next sign-in instead of persisting in local storage.
  useEffect(() => {
    if (!user) return;
    let active = true;

    checkIsAdmin()
      .then((allowed) => {
        if (!active) return;
        setIsAdmin(allowed);
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setIsAdmin(false);
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [user]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setIsAdmin(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({ session, user, loading, isAdmin, signIn, signOut }),
    [session, user, loading, isAdmin, signIn, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside <AuthProvider>');
  return context;
}
