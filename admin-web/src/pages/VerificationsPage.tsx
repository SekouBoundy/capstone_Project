import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useAdminVerifications } from '@/hooks/useAdminData';
import { reviewVerification } from '@/lib/api';
import { formatDate, formatRelative, humanize } from '@/lib';
import type { AdminVerification } from '@/lib/types';
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
import { ConfirmDialog, Modal } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loader';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: '', label: 'All' },
];

type Decision = { row: AdminVerification; decision: 'approved' | 'rejected' };

export function VerificationsPage() {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  // Seeded from the dashboard tile, so the two stay in step.
  const [searchParams, setSearchParams] = useSearchParams();
  const [status, setStatus] = useState(searchParams.get('status') ?? 'pending');
  const [offset, setOffset] = useState(0);
  const [decision, setDecision] = useState<Decision | null>(null);
  const [details, setDetails] = useState<AdminVerification | null>(null);

  const query = useAdminVerifications({ status, pageSize: PAGE_SIZE, offset });
  const rows = query.data?.rows ?? [];
  const total = query.data?.total ?? 0;

  const mutation = useMutation({
    mutationFn: (input: { row: AdminVerification; decision: Decision['decision']; notes: string }) =>
      reviewVerification({
        requestId: input.row.id,
        decision: input.decision,
        notes: input.notes,
      }),
    onSuccess: (_result, input) => {
      notify(
        input.decision === 'approved'
          ? `${input.row.applicant_name ?? 'Applicant'} approved as ${input.row.role_type}.`
          : `Verification rejected for ${input.row.applicant_name ?? 'applicant'}.`,
      );
      setDecision(null);
      // The dashboard counts pending verifications, so the whole admin
      // namespace is invalidated rather than just this list.
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error: Error) => {
      notify(error.message, 'error');
    },
  });

  const handleStatusChange = (value: string) => {
    setStatus(value);
    setOffset(0);
    setSearchParams(value ? { status: value } : {}, { replace: true });
  };

  return (
    <>
      <PageHeader
        title="Verifications"
        description="Review owner and agency applications. Approving also grants the requested role."
      />

      <div className="card overflow-hidden">
        <Toolbar>
          <SelectInput
            value={status}
            onChange={handleStatusChange}
            options={STATUS_OPTIONS}
            ariaLabel="Filter by status"
          />
        </Toolbar>

        {query.isError ? (
          <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
        ) : query.isLoading ? (
          <TableSkeleton rows={6} cols={5} />
        ) : rows.length === 0 ? (
          <EmptyState
            title={status === 'pending' ? 'Nothing waiting' : 'No requests found'}
            description={
              status === 'pending'
                ? 'The verification queue is empty.'
                : 'No requests match this filter.'
            }
          />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Applicant</Th>
                <Th>Type</Th>
                <Th>Documents</Th>
                <Th>Submitted</Th>
                <Th>Status</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-fill/60">
                  <Td>
                    <p className="font-medium text-ink">
                      {row.agency_name || row.applicant_name || 'Unnamed'}
                    </p>
                    <p className="text-xs text-ink-2">{row.applicant_email ?? '--'}</p>
                  </Td>
                  <Td>
                    <Badge tone={row.role_type === 'agency' ? 'info' : 'neutral'}>
                      {humanize(row.role_type)}
                    </Badge>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1.5">
                      {row.id_document_url ? <Badge tone="success">ID</Badge> : null}
                      {row.business_reg_url ? <Badge tone="success">Registration</Badge> : null}
                      {!row.id_document_url && !row.business_reg_url ? (
                        <span className="text-xs text-ink-3">None attached</span>
                      ) : null}
                    </div>
                  </Td>
                  <Td>
                    <p className="text-xs whitespace-nowrap text-ink-2">
                      {formatRelative(row.created_at)}
                    </p>
                  </Td>
                  <Td>
                    <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge>
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        onClick={() => setDetails(row)}
                      >
                        Details
                      </button>
                      {row.status === 'pending' ? (
                        <>
                          <button
                            type="button"
                            className="btn btn-secondary btn-sm"
                            onClick={() =>
                              setDecision({ row, decision: 'rejected' })
                            }
                          >
                            Reject
                          </button>
                          <button
                            type="button"
                            className="btn btn-primary btn-sm"
                            onClick={() => setDecision({ row, decision: 'approved' })}
                          >
                            Approve
                          </button>
                        </>
                      ) : null}
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

      <ConfirmDialog
        open={decision !== null}
        title={decision?.decision === 'approved' ? 'Approve this verification?' : 'Reject this verification?'}
        description={
          decision?.decision === 'approved'
            ? `${decision.row.applicant_name ?? 'This applicant'} will be promoted to ${decision?.row.role_type}. This takes effect in the app immediately.`
            : `${decision?.row.applicant_name ?? 'This applicant'} will be told the request was rejected. The reason below is included in that message.`
        }
        confirmLabel={decision?.decision === 'approved' ? 'Approve' : 'Reject'}
        tone={decision?.decision === 'approved' ? 'primary' : 'danger'}
        // A rejection without a reason tells the applicant nothing
        // actionable, so the note is mandatory there. Approval speaks
        // for itself.
        requireNote={decision?.decision === 'rejected'}
        noteLabel="Reason for rejection"
        notePlaceholder="The ID document was unreadable, please re-upload."
        pending={mutation.isPending}
        error={mutation.isError ? mutation.error.message : null}
        onConfirm={(note) => {
          if (decision) {
            mutation.mutate({ row: decision.row, decision: decision.decision, notes: note });
          }
        }}
        onClose={() => setDecision(null)}
      />

      <VerificationDetails row={details} onClose={() => setDetails(null)} />
    </>
  );
}

function VerificationDetails({
  row,
  onClose,
}: {
  row: AdminVerification | null;
  onClose: () => void;
}) {
  if (!row) return null;

  return (
    <Modal
      open
      title={row.agency_name || row.applicant_name || 'Verification request'}
      description={`Submitted ${formatDate(row.created_at)}`}
      onClose={onClose}
      width="max-w-xl"
      footer={
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Close
        </button>
      }
    >
      <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm sm:grid-cols-3">
        <Field label="Applicant" value={row.applicant_name} />
        <Field label="Email" value={row.applicant_email} />
        <Field label="Phone" value={row.applicant_phone} />
        <Field label="Requesting" value={humanize(row.role_type)} />
        <Field label="Agency name" value={row.agency_name} />
        <Field label="Contact person" value={row.contact_person} />
        <Field label="Submitted" value={formatDate(row.created_at)} />
        <Field label="Reviewed" value={row.reviewed_at ? formatDate(row.reviewed_at) : '--'} />
        <Field label="Status" value={humanize(row.status)} />
      </dl>

      {row.applicant_suspended ? (
        <p className="mt-4 rounded-lg bg-bad-bg px-3 py-2 text-sm text-[#c0271d]">
          This account is suspended. Resolve that before approving.
        </p>
      ) : null}

      <div className="mt-5 space-y-3">
        <DocumentLink label="Identity document" url={row.id_document_url} />
        <DocumentLink label="Business registration" url={row.business_reg_url} />
      </div>

      {row.admin_notes ? (
        <div className="mt-5">
          <p className="mb-1 text-xs font-semibold text-ink">Previous note</p>
          <p className="rounded-lg bg-fill px-3 py-2 text-sm whitespace-pre-wrap text-ink-2">
            {row.admin_notes}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs text-ink-2">{label}</dt>
      <dd className="truncate font-medium text-ink">{value || '--'}</dd>
    </div>
  );
}

function DocumentLink({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm">
        <span className="text-ink-2">{label}</span>
        <span className="text-xs text-ink-3">Not attached</span>
      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className="flex items-center justify-between rounded-lg border border-line px-3 py-2 text-sm transition-colors hover:bg-fill"
    >
      <span className="text-ink">{label}</span>
      <span className="text-xs font-semibold text-ink-2">Open &#8599;</span>
    </a>
  );
}
