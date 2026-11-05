export type BadgeTone = 'pending' | 'success' | 'danger' | 'neutral' | 'info' | 'brand';

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

const dateFormat = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
const timeFormat = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit', hour12: false });
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

function parse(value: string | null | undefined): Date | null {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** 14:05 · 05/11/2026 */
export function formatDateTime(value: string | null | undefined): string {
  const parsed = parse(value);
  if (!parsed) return value || '—';
  return `${timeFormat.format(parsed)} · ${dateFormat.format(parsed)}`;
}

/** 05/11/2026 */
export function formatDate(value: string | null | undefined): string {
  const parsed = parse(value);
  return parsed ? dateFormat.format(parsed) : value || '—';
}

/** "19:00:00" → "19:00" */
export function formatTime(value: string | null | undefined): string {
  if (!value) return '—';
  return /^\d{2}:\d{2}/.test(value) ? value.slice(0, 5) : value;
}

export function formatMoney(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : money.format(value);
}
