import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { FullPageLoader } from '@/components/ui/Loader';

/**
 * Route guard for the whole panel.
 *
 * Three states have to be distinguished, and collapsing them would either
 * flash the login screen for a signed-in admin or let a non-admin sit on
 * a blank page:
 *   - still resolving  -> spinner
 *   - no session       -> login
 *   - session, not admin -> login, with an explicit "not an admin" note
 *     rather than a silent bounce, so a legitimate admin who was
 *     suspended understands why.
 *
 * RLS is still the real boundary -- the RPCs reject a non-admin
 * regardless of what the browser believes. This is UX, not security.
 */
export function RequireAdmin({ children }: { children: ReactNode }) {
  const { session, loading, isAdmin } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageLoader label="Checking your access..." />;

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (isAdmin === false) {
    return <Navigate to="/login" replace state={{ denied: true }} />;
  }

  return <>{children}</>;
}
