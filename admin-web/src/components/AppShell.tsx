import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '@/auth/AuthProvider';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/users', label: 'Users', end: false },
  { to: '/verifications', label: 'Verifications', end: false },
  { to: '/reports', label: 'Reports', end: false },
  { to: '/moderation', label: 'Moderation', end: false },
];

export function AppShell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen lg:flex">
      <aside className="flex shrink-0 flex-col border-b border-line bg-white lg:h-screen lg:w-60 lg:border-r lg:border-b-0">
        <div className="px-5 py-4">
          <p className="text-sm font-bold tracking-tight text-ink">DOUCSOFT</p>
          <p className="text-xs text-ink-3">Admin panel</p>
        </div>

        <nav className="flex gap-1 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:px-3 lg:pb-0">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `shrink-0 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive ? 'bg-ink text-white' : 'text-ink-2 hover:bg-fill hover:text-ink'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto hidden border-t border-line px-5 py-4 lg:block">
          <p className="truncate text-xs text-ink-2" title={user?.email ?? undefined}>
            {user?.email ?? 'Signed in'}
          </p>
          <button
            type="button"
            className="btn btn-ghost btn-sm mt-2 -ml-2"
            onClick={handleSignOut}
          >
            Sign out
          </button>
        </div>
      </aside>

      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
