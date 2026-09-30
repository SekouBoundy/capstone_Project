import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAdminReports } from '@/hooks/useAdminData';
import { updateReport } from '@/lib/api';
import { formatDate, formatRelative, humanize } from '@/lib';
import type { AdminReport, ReportStatus } from '@/lib/types';
import {
  PageHeader,
  Pagination,
  SelectInput,
  Table,
  Td,
  Th,
  Toolbar,
} from '@/components/ui/Data';
import { Badge, statusTone } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loader';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: 'unresolved', label: 'Unresolved' },
  { value: 'open', label: 'Open' },
  { value: 'investigating', label: 'Investigating' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'dismissed', label: 'Dismissed' },
  { value: '', label: 'All' },
];

const REASON_OPTIONS = [
  { value: '', label: 'All reasons' },
  { value: 'fake_listing', label: 'Fake listing' },
  { value: 'scam', label: 'Scam' },
  { value: 'inappropriate', label: 'Inappropriate' },
  { value: 'spam', label: 'Spam' },
  { value: 'other', label: 'Other' },
];

const STATUS_ACTIONS: Array<{ status: ReportStatus; label: string; variant: string }> = [
  { status: 'investigating', label: 'Investigate', variant: 'btn-secondary' },
  { status: 'resolved', label: 'Resolve', variant: 'btn-primary' },
  { status: 'dismissed', label: 'Dismiss', variant: 'btn-secondary' },
];

export function ReportsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') ?? 'unresolved');
  const [reason, setReason] = useState('');
  const [offset, setOffset] = useState(0);
  const [editing, setEditing] = useState<{ row: AdminReport; status: ReportStatus } | null>(null);
  const [viewing, setViewing] = useState<AdminReport | null>(null);

  const query = useAdminReports({ status, reason, pageSize: PAGE_SIZE, offset });
  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  const mutation = useMutation({
    mutationFn: (input: { row: AdminReport; status: ReportStatus; notes: string }) =>
      updateReport({ reportId: input.row.id, status: input.status, notes: input.notes }),
    onSuccess: (_result, input) => {
      notify(`Report marked ${input.status}.`);
      setEditing(null);
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error: Error) => {
      notify(error.message, 'error');
    },
  });

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setOffset(0);
    const next = new URLSearchParams(searchParams);
    if (value) next.set('status', value);
    else next.delete('status');
    setSearchParams(next, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Reports"
        description="Triage user reports and record what was done about each one."
      />

      <div className="card overflow-hidden">
        <Toolbar>
          <SelectInput
            value={status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            ariaLabel="Filter by status"
          />
          <SelectInput
            value={reason}
            onChange={(value) => {
              setReason(value);
              setOffset(0);
            }}
            options={REASON_OPTIONS}
            ariaLabel="Filter by reason"
          />
        </Toolbar>

        {query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : query.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title="No reports here"
            description={
              status === 'unresolved' && !reason
                ? 'Nothing needs attention right now.'
                : 'No reports match these filters.'
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Reported item</Th>
                <Th>Reason</Th>
                <Th>Reporter</Th>
                <Th>Filed</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-fill/60">
                  <Td className="max-w-xs">
                    <p className="truncate font-medium text-ink">{row.target_title}</p>
                    <p className="text-xs text-ink-2">{humanize(row.target_type)}</p>
                  </Td>
                  <Td>
                    <Badge tone={row.reason === 'scam' ? 'danger' : 'neutral'}>
                      {humanize(row.reason)}
                    </Badge>
                  </Td>
                  <Td>
                    <p className="text-xs text-ink-2">{row.reporter_name || row.reporter_email}</p>
                  </Td>
                  <Td>
                    <span className="text-xs whitespace-nowrap text-ink-2">
                      {formatRelative(row.created_at)}
                    </span>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setViewing(row)}
                      >
                        View
                      </button>
                      {STATUS_ACTIONS.filter((action) => action.status !== row.status).map(
                        (action) => (
                          <button
                            key={action.status}
                            type="button"
                            className={`btn ${action.variant} btn-sm`}
                            onClick={() => setEditing({ row, status: action.status })}
                          >
                            {action.label}
                          </button>
                        ),
                      )}
                    </div>
                  </Td>
                </tr>
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

      <ReportNotesDialog
        state={editing}
        pending={mutation.isPending}
        error={mutation.isError ? mutation.error.message : null}
        onConfirm={(notes) => {
          if (editing) mutation.mutate({ row: editing.row, status: editing.status, notes });
        }}
        onClose={() => setEditing(null)}
      />

      <Modal
        open={viewing !== null}
        title={viewing?.target_title ?? 'Report'}
        description={
          viewing
            ? `${humanize(viewing.reason)} · filed ${formatDate(viewing.created_at)}`
            : undefined
        }
        onClose={() => setViewing(null)}
        width="max-w-xl"
        footer={
          <button type="button" className="btn btn-secondary" onClick={() => setViewing(null)}>
            Close
          </button>
        }
      >
        {viewing ? (
          <div className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-ink-2">Reporter</p>
                <p className="font-medium text-ink">{viewing.reporter_name || '--'}</p>
                <p className="text-xs text-ink-2">{viewing.reporter_email}</p>
              </div>
              <div>
                <p className="text-xs text-ink-2">Target</p>
                <p className="font-medium text-ink">{humanize(viewing.target_type)}</p>
              </div>
              <div>
                <p className="text-xs text-ink-2">Status</p>
                <p className="font-medium text-ink">{humanize(viewing.status)}</p>
              </div>
            </div>

            <div>
              <p className="mb-1 text-xs text-ink-2">What the reporter said</p>
              <p className="rounded-lg bg-fill px-3 py-2 whitespace-pre-wrap text-ink-2">
                {viewing.description || 'No description given.'}
              </p>
            </div>

            {viewing.admin_notes ? (
              <div>
                <p className="mb-1 text-xs text-ink-2">Internal notes</p>
                <p className="rounded-lg bg-fill px-3 py-2 whitespace-pre-wrap text-ink-2">
                  {viewing.admin_notes}
                </p>
              </div>
            ) : null}

            <p className="text-xs text-ink-3">
              Target id <code className="font-mono">{viewing.target_id}</code>
            </p>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

/**
 * Report notes are optional: `admin_update_report` keeps the existing
 * note when the argument is null, so an admin can move a report forward
 * without retyping context every time.
 */
function ReportNotesDialog({
  state,
  pending,
  error,
  onConfirm,
  onClose,
}: {
  state: { row: AdminReport; status: ReportStatus } | null;
  pending: boolean;
  error: string | null;
  onConfirm: (notes: string) => void;
  onClose: () => void;
}) {
  const [notes, setNotes] = useState('');

  return (
    <Modal
      open={state !== null}
      title={`Mark as ${state?.status ?? ''}`}
      description={
        state
          ? `${state.row.target_title} — the reporter is notified when the status changes.`
          : undefined
      }
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={pending}>
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => onConfirm(notes)}
            disabled={pending}
          >
            {pending ? 'Saving...' : 'Save'}
          </button>
        </>
      }
    >
      <label htmlFor="report-notes" className="mb-1.5 block text-xs font-semibold text-ink">
        Internal note <span className="font-normal text-ink-3">(optional)</span>
      </label>
      <textarea
        id="report-notes"
        className="input resize-y"
        rows={3}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Checked the listing against the original photos; confirmed fraudulent."
        disabled={pending}
      />
      <p className="mt-1.5 text-xs text-ink-3">
        Leave blank to keep the existing note.
      </p>
      {error ? (
        <p className="mt-3 rounded-lg bg-bad-bg px-3 py-2 text-sm text-[#c0271d]">{error}</p>
      ) : null}
    </Modal>
  );
}
