import { Link } from 'react-router-dom';
import { useDashboardStats } from '@/hooks/useAdminData';
import { PageHeader } from '@/components/ui/Data';
import { TableSkeleton } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/States';
import { formatNumber } from '@/lib';
import type { DashboardStats } from '@/lib/types';

export function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useDashboardStats();

  if (isError) {
    return <ErrorState message={error.message} onRetry={() => refetch()} />;
  }

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Platform activity at a glance. Counts refresh every 30 seconds."
      />

      {isLoading || !data ? (
        <div className="card p-4">
          <TableSkeleton rows={4} cols={3} />
        </div>
      ) : (
        <div className="space-y-6">
          <QueueTiles stats={data} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Total users"
              value={formatNumber(data.total_users)}
              hint={`${formatNumber(data.new_users_7d)} joined in the last 7 days`}
            />
            <StatCard
              label="Properties"
              value={formatNumber(data.total_properties)}
              hint={`${formatNumber(data.published_properties)} published`}
            />
            <StatCard
              label="Marketplace items"
              value={formatNumber(data.total_products)}
              hint={`${formatNumber(data.active_products)} active`}
            />
            <StatCard
              label="Suspended users"
              value={formatNumber(data.suspended_users)}
              hint={
                data.suspended_users > 0
                  ? 'Hidden from the public app'
                  : 'Nobody is suspended'
              }
            />
          </div>
        </div>
      )}
    </>
  );
}

/**
 * The two queues that need a human are promoted above the raw counts.
 * An admin opening the panel is usually here to clear one of them.
 */
function QueueTiles({ stats }: { stats: DashboardStats }) {
  const tiles = [
    {
      to: '/verifications?status=pending',
      label: 'Pending verifications',
      value: stats.pending_verifications,
      hint: 'Owner and agency approvals',
      urgent: stats.pending_verifications > 0,
    },
    {
      to: '/reports?status=unresolved',
      label: 'Unresolved reports',
      value: stats.open_reports,
      hint: 'Open or under investigation',
      urgent: stats.open_reports > 0,
    },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {tiles.map((tile) => (
        <Link
          key={tile.to}
          to={tile.to}
          className="card flex items-center justify-between gap-4 p-5 transition-colors hover:bg-fill"
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink">{tile.label}</p>
            <p className="mt-0.5 text-xs text-ink-2">{tile.hint}</p>
          </div>
          <p
            className={`text-3xl font-bold tabular-nums ${
              tile.urgent ? 'text-ink' : 'text-ink-3'
            }`}
          >
            {formatNumber(tile.value)}
          </p>
        </Link>
      ))}
    </div>
  );
}

function StatCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="card p-5">
      <p className="text-xs font-semibold tracking-wide text-ink-2 uppercase">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular-nums text-ink">{value}</p>
      <p className="mt-1 text-xs text-ink-3">{hint}</p>
    </div>
  );
}
