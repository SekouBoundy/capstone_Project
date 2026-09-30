/** Presentation helpers shared across the panel. */

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const dateTimeFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatDate(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : dateFormat.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '--';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '--' : dateTimeFormat.format(date);
}

/** "3 days ago". Falls back to an absolute date past a month. */
export function formatRelative(value: string | null | undefined): string {
  if (!value) return '--';
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return '--';

  const seconds = Math.round((Date.now() - then) / 1000);
  if (seconds < 60) return 'just now';

  const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
    ['minute', 60],
    ['hour', 60],
    ['day', 24],
    ['month', 30],
  ];

  let amount = seconds / 60;
  for (let i = 0; i < units.length; i += 1) {
    const [unit, step] = units[i];
    if (amount < step || unit === 'month') {
      return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
        -Math.round(amount),
        unit,
      );
    }
    amount /= step;
  }
  return formatDate(value);
}

/**
 * Postgres NUMERIC arrives as a JSON number here, but the driver may hand
 * back a string for large values. Coerce once so arithmetic and display
 * do not have to care.
 */
export function formatMoney(amount: number | string | null | undefined, currency?: string | null): string {
  const value = typeof amount === 'string' ? Number(amount) : amount;
  if (value === null || value === undefined || Number.isNaN(value)) return '--';
  return new Intl.NumberFormat('en-IE', {
    style: 'currency',
    currency: currency || 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? Number(value) : value;
  if (num === null || num === undefined || Number.isNaN(num)) return '--';
  return new Intl.NumberFormat('en-GB').format(num);
}

export function initials(name: string | null | undefined, fallback = '?'): string {
  if (!name) return fallback;
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return fallback;
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Turn snake_case / kebab-case enum values into readable labels. */
export function humanize(value: string | null | undefined): string {
  if (!value) return '--';
  const spaced = value.replace(/[_-]/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
