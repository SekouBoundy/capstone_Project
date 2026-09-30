import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/auth/AuthProvider';
import { useAdminUsers } from '@/hooks/useAdminData';
import { setUserRole, setUserSuspended } from '@/lib/api';
import { formatDate, initials } from '@/lib';
import type { AdminUser } from '@/lib/types';
import {
  PageHeader,
  Pagination,
  SearchInput,
  SelectInput,
  Table,
  Td,
  Th,
  Toolbar,
} from '@/components/ui/Data';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loader';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

const PAGE_SIZE = 25;

const ROLE_OPTIONS = [
  { value: '', label: 'All roles' },
  { value: 'student', label: 'Student' },
  { value: 'owner', label: 'Owner' },
  { value: 'agency', label: 'Agency' },
  { value: 'admin', label: 'Admin' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All accounts' },
  { value: 'active', label: 'Active' },
  { value: 'suspended', label: 'Suspended' },
];

type PendingAction =
  | { kind: 'suspend'; user: AdminUser }
  | { kind: 'reactivate'; user: AdminUser }
  | { kind: 'role'; user: AdminUser; role: string };

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('');
  const [offset, setOffset] = useState(0);
  const [action, setAction] = useState<PendingAction | null>(null);

  const query = useAdminUsers({ search, role, status, pageSize: PAGE_SIZE, offset });
  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  // Any of these can change the row count, and the dashboard shows the
  // suspended-user total, so both are invalidated rather than patched.
  const mutation = useMutation({
    mutationFn: async (pending: NonNullable<typeof action>) => {
      if (pending.kind === 'role') {
        await setUserRole(pending.user.id, pending.role);
      } else {
        await setUserSuspended(pending.user.id, pending.kind === 'suspend');
      }
    },
    onSuccess: (_result, pending) => {
      notify(
        pending.kind === 'role'
          ? `Role updated to ${pending.role}.`
          : pending.kind === 'suspend'
            ? `${pending.user.full_name ?? 'User'} suspended.`
            : `${pending.user.full_name ?? 'User'} reactivated.`,
      );
      setAction(null);
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error: Error) => {
      notify(error.message, 'error');
    },
  });

  const handleConfirm = () => {
    if (!action) return;
    mutation.mutate(action);
  };

  return (
    <>
      <PageHeader
        title="Users"
        description="Search the directory, change roles, and suspend or reinstate accounts."
      />

      <div className="card overflow-hidden">
        <Toolbar>
          <SearchInput
            value={search}
            onChange={(value) => {
              setSearch(value);
              setOffset(0);
            }}
            placeholder="Search by name, email or university..."
          />
          <SelectInput
            value={role}
            onChange={(value) => {
              setRole(value);
              setOffset(0);
            }}
            options={ROLE_OPTIONS}
            ariaLabel="Filter by role"
          />
          <SelectInput
            value={status}
            onChange={(value) => {
              setStatus(value);
              setOffset(0);
            }}
            options={STATUS_OPTIONS}
            ariaLabel="Filter by status"
          />
        </Toolbar>

        {query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : query.isLoading ? (
          <TableSkeleton rows={8} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No users found"
            description={
              search || role || status
                ? 'No accounts match these filters.'
                : 'Accounts appear here as people sign up.'
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>User</Th>
                <Th>Role</Th>
                <Th>Activity</Th>
                <Th>Status</Th>
                <Th>Joined</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <UserRow
                  key={row.id}
                  row={row}
                  isSelf={row.id === currentUser?.id}
                  onAction={setAction}
                />
              ))}
            </tbody>
          </Table>
        )}

        <Pagination
          offset={offset}
          pageSize={PAGE_SIZE}
          count={rows.length}
          total={total}
          onChange={setOffset}
        />
      </div>

      <ConfirmDialog
        open={action !== null}
        title={
          action?.kind === 'suspend'
            ? 'Suspend this account?'
            : action?.kind === 'reactivate'
              ? 'Reactivate this account?'
              : 'Change this role?'
        }
        description={
          action?.kind === 'suspend'
            ? `${action.user.full_name ?? action.user.email} will be hidden from the app and signed out of any active session. Their listings stay online but the profile is no longer visible.`
            : action?.kind === 'reactivate'
              ? `${action.user.full_name ?? action.user.email} will regain full access to the app.`
              : `${action?.user.full_name ?? action?.user.email} will become a ${action?.role}. Changing to admin grants access to this panel.`
        }
        confirmLabel={
          action?.kind === 'suspend' ? 'Suspend' : action?.kind === 'reactivate' ? 'Reactivate' : 'Update role'
        }
        tone={action?.kind === 'suspend' ? 'danger' : 'primary'}
        pending={mutation.isPending}
        error={mutation.isError ? mutation.error.message : null}
        onConfirm={handleConfirm}
        onClose={() => setAction(null)}
      />
    </>
  );
}

function UserRow({
  row,
  isSelf,
  onAction,
}: {
  row: AdminUser;
  isSelf: boolean;
  onAction: (action: PendingAction) => void;
}) {
  return (
    <tr className="hover:bg-fill/60">
      <Td>
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-8 shrink-0 items-center justify-center rounded-full bg-fill text-xs font-semibold text-ink-2"
          >
            {initials(row.full_name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-medium text-ink">
              {row.full_name || 'Unnamed'}
              {isSelf ? <span className="ml-1.5 text-xs text-ink-3">(you)</span> : null}
            </p>
            <p className="truncate text-xs text-ink-2">{row.email ?? '--'}</p>
          </div>
        </div>
      </Td>
      <Td>
        {row.role === 'admin' ? (
          <select
            className="input w-auto py-1 text-xs"
            value={row.role}
            disabled={isSelf}
            aria-label={`Role for ${row.full_name ?? row.email}`}
            onChange={(event) => onAction({ kind: 'role', user: row, role: event.target.value })}
          >
            <option value="student">Student</option>
            <option value="owner">Owner</option>
            <option value="agency">Agency</option>
            <option value="admin">Admin</option>
          </select>
        ) : (
          <Badge tone="neutral">{row.role}</Badge>
        )}
      </Td>
      <Td>
        <p className="text-xs whitespace-nowrap text-ink-2 tabular-nums">
          {row.property_count} properties &middot; {row.product_count} items
        </p>
      </Td>
      <Td>
        {row.is_suspended ? (
          <Badge tone="danger">Suspended</Badge>
        ) : (
          <Badge tone="success">Active</Badge>
        )}
      </Td>
      <Td>
        <span className="text-xs whitespace-nowrap text-ink-2">{formatDate(row.created_at)}</span>
      </Td>
      <Td className="text-right">
        {row.is_suspended ? (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => onAction({ kind: 'reactivate', user: row })}
          >
            Reactivate
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            // The RPC refuses self-suspension, so the control is hidden
            // rather than left to fail on click.
            disabled={isSelf}
            title={isSelf ? 'You cannot suspend your own account' : undefined}
            onClick={() => onAction({ kind: 'suspend', user: row })}
          >
            Suspend
          </button>
        )}
      </Td>
    </tr>
  );
}
