import { useState } from 'react';
import type { FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';
import { Spinner } from '@/components/ui/Loader';

export function LoginPage() {
  const { session, isAdmin, signIn } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  // A signed-in admin landing on /login goes straight through.
  if (session && isAdmin) return <Navigate to="/" replace />;

  // Signed in but not an admin: signing in again with different
  // credentials would not help, so the form is replaced by the reason.
  if (session && isAdmin === false) {
    return (
      <AuthCard title="No admin access">
        <p className="text-sm text-ink-2">
          <span className="font-semibold text-ink">{session.user.email}</span> is signed in, but
          this account is not an active administrator.
        </p>
        <p className="mt-2 text-xs text-ink-3">
          Ask an existing admin to grant the role, then sign in again.
        </p>
        <button
          type="button"
          className="btn btn-secondary mt-5 w-full"
          onClick={() => window.location.reload()}
        >
          Check again
        </button>
      </AuthCard>
    );
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      await signIn(email.trim(), password);
      // Navigation is driven by the auth state change; the guard sends
      // an admin to the page they came from, or the dashboard.
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : 'Sign in failed. Please try again.',
      );
    } finally {
      setPending(false);
    }
  };

  const denied = (location.state as { denied?: boolean } | null)?.denied;

  return (
    <AuthCard title="Sign in to administer DOUCSOFT">
      <p className="mb-5 text-sm text-ink-2">
        This panel uses the same accounts as the mobile app. Admin role is checked against the
        database on every sign-in.
      </p>

      {denied ? (
        <p className="mb-4 rounded-lg bg-warn-bg px-3 py-2 text-sm text-[#8a5200]">
          That account is not an active administrator.
        </p>
      ) : null}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label htmlFor="email" className="mb-1.5 block text-xs font-semibold text-ink">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            className="input"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1.5 block text-xs font-semibold text-ink">
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            className="input"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-bad-bg px-3 py-2 text-sm text-[#c0271d]">{error}</p>
        ) : null}

        <button type="submit" className="btn btn-primary w-full" disabled={pending}>
          {pending ? <Spinner /> : null}
          Sign in
        </button>
      </form>
    </AuthCard>
  );
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-fill px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-bold tracking-tight text-ink">DOUCSOFT</p>
          <p className="text-xs text-ink-3">Admin panel</p>
        </div>
        <div className="card p-6">
          <h1 className="mb-4 text-base font-semibold text-ink">{title}</h1>
          {children}
        </div>
      </div>
    </div>
  );
}
