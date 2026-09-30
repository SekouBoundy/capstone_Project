import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAdminProducts, useAdminProperties } from '@/hooks/useAdminData';
import { moderateProduct, moderateProperty } from '@/lib/api';
import { formatMoney, formatRelative, humanize } from '@/lib';
import type { AdminProduct, AdminProperty } from '@/lib/types';
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
import { ConfirmDialog } from '@/components/ui/Modal';
import { TableSkeleton } from '@/components/ui/Loader';
import { EmptyState, ErrorState } from '@/components/ui/States';
import { useToast } from '@/components/ui/Toast';

const PAGE_SIZE = 25;

type Tab = 'properties' | 'products';

/**
 * `next` is the status the listing moves to, which differs per table --
 * properties go back to 'published', products to 'active'. It travels
 * with the action rather than being derived, so the dialog does not need
 * to know which table is open.
 */
type Action = {
  kind: Tab;
  id: string;
  title: string;
  next: 'published' | 'removed' | 'active';
  /** Reason from the dialog, attached at submit time. */
  reason?: string;
};

const PROPERTY_STATUS = [
  { value: '', label: 'All statuses' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Draft' },
  { value: 'unavailable', label: 'Unavailable' },
  { value: 'removed', label: 'Removed' },
];

const PRODUCT_STATUS = [
  { value: '', label: 'All statuses' },
  { value: 'active', label: 'Active' },
  { value: 'sold', label: 'Sold' },
  { value: 'removed', label: 'Removed' },
];

const CITY_OPTIONS = [
  { value: '', label: 'All cities' },
  { value: 'Nicosia', label: 'Nicosia' },
  { value: 'Kyrenia', label: 'Kyrenia' },
  { value: 'Famagusta', label: 'Famagusta' },
  { value: 'Morphou', label: 'Morphou' },
  { value: 'Lefke', label: 'Lefke' },
  { value: 'Iskele', label: 'Iskele' },
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All categories' },
  { value: 'furniture', label: 'Furniture' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'books', label: 'Books' },
  { value: 'kitchen', label: 'Kitchen' },
  { value: 'clothing', label: 'Clothing' },
  { value: 'other', label: 'Other' },
];

export function ModerationPage() {
  const [tab, setTab] = useState<Tab>('properties');
  const [action, setAction] = useState<Action | null>(null);

  return (
    <>
      <PageHeader
        title="Moderation"
        description="Remove listings that break the rules. Removal is reversible and the owner is notified."
      />

      <div className="mb-4 flex gap-1 rounded-lg bg-fill p-1">
        {(['properties', 'products'] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTab(value)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === value ? 'bg-white text-ink shadow-sm' : 'text-ink-2 hover:text-ink'
            }`}
          >
            {value === 'properties' ? 'Housing' : 'Marketplace'}
          </button>
        ))}
      </div>

      {tab === 'properties' ? (
        <PropertiesTable setAction={setAction} />
      ) : (
        <ProductsTable setAction={setAction} />
      )}

      <ModerateDialog state={action} onClose={() => setAction(null)} />
    </>
  );
}

function PropertiesTable({ setAction }: { setAction: (action: Action) => void }) {
  const [status, setStatus] = useState('');
  const [city, setCity] = useState('');
  const [offset, setOffset] = useState(0);

  const query = useAdminProperties({ status, city, pageSize: PAGE_SIZE, offset });
  const rows = query.data?.rows ?? [];

  return (
    <div className="card overflow-hidden">
      <Toolbar>
        <SelectInput
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={PROPERTY_STATUS}
          ariaLabel="Filter by status"
        />
        <SelectInput
          value={city}
          onChange={(value) => {
            setCity(value);
            setOffset(0);
          }}
          options={CITY_OPTIONS}
          ariaLabel="Filter by city"
        />
      </Toolbar>

      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No properties found" description="Nothing matches these filters." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Listing</Th>
              <Th>Owner</Th>
              <Th>Price</Th>
              <Th>City</Th>
              <Th>Status</Th>
              <Th>Listed</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <PropertyRow key={row.id} row={row} onAction={setAction} />
            ))}
          </tbody>
        </Table>
      )}

      <Pagination
        offset={offset}
        pageSize={PAGE_SIZE}
        count={rows.length}
        total={query.data?.total ?? 0}
        onChange={setOffset}
      />
    </div>
  );
}

function ProductsTable({ setAction }: { setAction: (action: Action) => void }) {
  const [status, setStatus] = useState('');
  const [category, setCategory] = useState('');
  const [offset, setOffset] = useState(0);

  const query = useAdminProducts({ status, category, pageSize: PAGE_SIZE, offset });
  const rows = query.data?.rows ?? [];

  return (
    <div className="card overflow-hidden">
      <Toolbar>
        <SelectInput
          value={status}
          onChange={(value) => {
            setStatus(value);
            setOffset(0);
          }}
          options={PRODUCT_STATUS}
          ariaLabel="Filter by status"
        />
        <SelectInput
          value={category}
          onChange={(value) => {
            setCategory(value);
            setOffset(0);
          }}
          options={CATEGORY_OPTIONS}
          ariaLabel="Filter by category"
        />
      </Toolbar>

      {query.isError ? (
        <ErrorState message={query.error.message} onRetry={() => query.refetch()} />
      ) : query.isLoading ? (
        <TableSkeleton rows={8} cols={6} />
      ) : rows.length === 0 ? (
        <EmptyState title="No items found" description="Nothing matches these filters." />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Item</Th>
              <Th>Seller</Th>
              <Th>Price</Th>
              <Th>Condition</Th>
              <Th>Status</Th>
              <Th>Listed</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <ProductRow key={row.id} row={row} onAction={setAction} />
            ))}
          </tbody>
        </Table>
      )}

      <Pagination
        offset={offset}
        pageSize={PAGE_SIZE}
        count={rows.length}
        total={query.data?.total ?? 0}
        onChange={setOffset}
      />
    </div>
  );
}

/**
 * The two tables share an action shape so one dialog drives both. The
 * live/removed pair differs per table -- properties go to 'published',
 * products to 'active' -- which is why `next` is carried on the action
 * rather than derived here.
 */
function ModerateDialog({
  state,
  onClose,
}: {
  state: Action | null;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const { notify } = useToast();

  const mutation = useMutation({
    mutationFn: (input: NonNullable<typeof state>) =>
      input.kind === 'properties'
        ? moderateProperty({
            propertyId: input.id,
            status: input.next as 'published' | 'removed',
            reason: input.reason,
          })
        : moderateProduct({
            productId: input.id,
            status: input.next as 'active' | 'removed',
            reason: input.reason,
          }),
    onSuccess: (_result, input) => {
      notify(input.next === 'removed' ? 'Listing removed.' : 'Listing restored.');
      onClose();
      void queryClient.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (error: Error) => {
      notify(error.message, 'error');
    },
  });

  const removing = state?.next === 'removed';

  return (
    <ConfirmDialog
      open={state !== null}
      title={removing ? 'Remove this listing?' : 'Restore this listing?'}
      description={
        removing
          ? `"${state?.title}" will be hidden from the app. The row is kept so reports against it still resolve, and the owner is told why.`
          : `"${state?.title}" will go back on sale in the app.`
      }
      confirmLabel={removing ? 'Remove listing' : 'Restore listing'}
      tone={removing ? 'danger' : 'primary'}
      // Only removal needs an explanation, and only because it is the
      // one that reaches the user as a notification.
      requireNote={removing}
      noteLabel="Reason shown to the owner"
      notePlaceholder="Photos were taken from another listing."
      pending={mutation.isPending}
      error={mutation.isError ? mutation.error.message : null}
      onConfirm={(note) => {
        if (state) mutation.mutate({ ...state, reason: note });
      }}
      onClose={onClose}
    />
  );
}

function PropertyRow({
  row,
  onAction,
}: {
  row: AdminProperty;
  onAction: (action: Action) => void;
}) {
  const removed = row.status === 'removed';
  return (
    <tr className="hover:bg-fill/60">
      <Td className="max-w-xs">
        <p className="truncate font-medium text-ink">{row.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{humanize(row.property_type)}</Badge>
          {row.report_count > 0 ? (
            <Badge tone="danger">
              {row.report_count} {row.report_count === 1 ? 'report' : 'reports'}
            </Badge>
          ) : null}
        </div>
      </Td>
      <Td>
        <p className="text-xs text-ink">{row.owner_name || '--'}</p>
        {row.owner_suspended ? <Badge tone="danger">Suspended</Badge> : null}
      </Td>
      <Td>
        <span className="whitespace-nowrap tabular-nums">
          {formatMoney(row.price_monthly, row.currency)}
        </span>
      </Td>
      <Td>
        <span className="text-xs text-ink-2">{row.city ?? '--'}</span>
      </Td>
      <Td>
        <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge>
      </Td>
      <Td>
        <span className="text-xs whitespace-nowrap text-ink-2">
          {formatRelative(row.created_at)}
        </span>
      </Td>
      <Td className="text-right">
        <button
          type="button"
          className={`btn btn-sm ${removed ? 'btn-secondary' : 'btn-danger'}`}
          onClick={() =>
            onAction({
              kind: 'properties',
              id: row.id,
              title: row.title,
              next: removed ? 'published' : 'removed',
            })
          }
        >
          {removed ? 'Restore' : 'Remove'}
        </button>
      </Td>
    </tr>
  );
}

function ProductRow({
  row,
  onAction,
}: {
  row: AdminProduct;
  onAction: (action: Action) => void;
}) {
  const removed = row.status === 'removed';
  return (
    <tr className="hover:bg-fill/60">
      <Td className="max-w-xs">
        <p className="truncate font-medium text-ink">{row.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <Badge tone="neutral">{humanize(row.category)}</Badge>
          {row.report_count > 0 ? (
            <Badge tone="danger">
              {row.report_count} {row.report_count === 1 ? 'report' : 'reports'}
            </Badge>
          ) : null}
        </div>
      </Td>
      <Td>
        <p className="text-xs text-ink">{row.seller_name || '--'}</p>
        {row.seller_suspended ? <Badge tone="danger">Suspended</Badge> : null}
      </Td>
      <Td>
        <span className="whitespace-nowrap tabular-nums">
          {formatMoney(row.price, row.currency)}
        </span>
      </Td>
      <Td>
        <span className="text-xs text-ink-2">{humanize(row.condition)}</span>
      </Td>
      <Td>
        <Badge tone={statusTone(row.status)}>{humanize(row.status)}</Badge>
      </Td>
      <Td>
        <span className="text-xs whitespace-nowrap text-ink-2">
          {formatRelative(row.created_at)}
        </span>
      </Td>
      <Td className="text-right">
        <button
          type="button"
          className={`btn btn-sm ${removed ? 'btn-secondary' : 'btn-danger'}`}
          onClick={() =>
            onAction({
              kind: 'products',
              id: row.id,
              title: row.title,
              next: removed ? 'active' : 'removed',
            })
          }
        >
          {removed ? 'Restore' : 'Remove'}
        </button>
      </Td>
    </tr>
  );
}
