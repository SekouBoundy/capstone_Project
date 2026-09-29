/**
 * Formats a numeric amount for display.
 *
 * The listings store `NUMERIC`, which PostgREST returns as a *string*, so
 * this coerces before formatting. Without the coercion `Intl.NumberFormat`
 * throws on a string input.
 *
 * Fraction digits are dropped: rent and second-hand prices are never
 * quoted to the cent in this app, and a trailing ",00" on every card
 * would be noise. The `maximumFractionDigits: 0` also gives the
 * thousands separator for free, which is the point -- "€1450" reads as
 * a typo, "€1,450" reads as a price.
 */
export function formatPrice(value: string | number | null | undefined, currency = 'EUR'): string {
  if (value === null || value === undefined) return '';

  const amount = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(amount)) return '';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}
