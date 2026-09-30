import type { ReactNode } from 'react';

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
        {description ? <p className="mt-1 text-sm text-ink-2">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">{children}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = '',
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <input
      type="search"
      className={`input max-w-xs ${className}`}
      value={value}
      placeholder={placeholder}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

export function SelectInput({
  value,
  onChange,
  options,
  className = '',
  ariaLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <select
      className={`input w-auto ${className}`}
      value={value}
      aria-label={ariaLabel}
      onChange={(event) => onChange(event.target.value)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className = '',
}: {
  children?: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`border-b border-line bg-fill px-4 py-2.5 text-left text-xs font-semibold tracking-wide text-ink-2 uppercase ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, className = '' }: { children?: ReactNode; className?: string }) {
  return <td className={`border-b border-line px-4 py-3 align-middle ${className}`}>{children}</td>;
}

/**
 * Offset pagination.
 *
 * Page numbers are not rendered: the queues here are small and an admin
 * mostly works the newest rows, so previous/next plus a live count is
 * both sufficient and one less thing to get wrong at page boundaries.
 */
export function Pagination({
  offset,
  pageSize,
  count,
  total,
  onChange,
}: {
  offset: number;
  pageSize: number;
  count: number;
  total: number;
  onChange: (offset: number) => void;
}) {
  const from = count === 0 ? 0 : offset + 1;
  const to = offset + count;
  const hasPrev = offset > 0;
  const hasNext = to < total;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line px-4 py-3">
      <p className="text-xs text-ink-2">
        {total === 0 ? (
          'No results'
        ) : (
          <>
            Showing <span className="font-semibold text-ink">{from}</span>–
            <span className="font-semibold text-ink">{to}</span> of{' '}
            <span className="font-semibold text-ink">{total}</span>
          </>
        )}
      </p>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(Math.max(0, offset - pageSize))}
          disabled={!hasPrev}
        >
          Previous
        </button>
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={() => onChange(offset + pageSize)}
          disabled={!hasNext}
        >
          Next
        </button>
      </div>
    </div>
  );
}
