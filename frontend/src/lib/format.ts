import { format, formatDistanceToNowStrict, parseISO } from 'date-fns';

export function fmtDate(iso: string | null | undefined, pattern = 'd MMM yyyy'): string {
  if (!iso) return '—';
  try { return format(parseISO(iso), pattern); } catch { return '—'; }
}

export function fmtDateTime(iso: string | null | undefined): string {
  return fmtDate(iso, 'd MMM yyyy, HH:mm');
}

export function fmtRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  try { return formatDistanceToNowStrict(parseISO(iso), { addSuffix: true }); } catch { return '—'; }
}

export function fmtNumber(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return new Intl.NumberFormat('hr-HR').format(n);
}

export function fmtPercent(value: number | string | null | undefined): string {
  if (value === null || value === undefined) return '—';
  const n = typeof value === 'string' ? Number(value) : value;
  if (Number.isNaN(n)) return '—';
  return `${n.toFixed(1)}%`;
}

/** Renders a UUID compactly for tables: 'a1b2c3…ef89'. */
export function shortId(id: string | null | undefined): string {
  if (!id) return '—';
  if (id.length <= 12) return id;
  return `${id.slice(0, 6)}…${id.slice(-4)}`;
}
