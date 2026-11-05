export type BadgeTone = 'pending' | 'success' | 'danger' | 'neutral' | 'info' | 'brand';

export interface StatusMeta {
  label: string;
  tone: BadgeTone;
}

const dateTime = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short', timeStyle: 'short' });
const date = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'short' });
const money = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 });

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : dateTime.format(parsed);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : date.format(parsed);
}

export function formatMoney(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : money.format(value);
}
