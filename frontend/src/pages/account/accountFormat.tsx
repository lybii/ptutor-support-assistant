import type { ReactNode } from 'react';
import { StatusBadge } from '../admin/components/AdminUi';
import { formatDate, formatDateTime, formatMoney, formatTime, type StatusMeta } from '../admin/adminFormat';
import type { Row } from '../../services/accountApi';

const STATUS: Record<string, StatusMeta> = {
  ACTIVE: { label: 'Đang hiệu lực', tone: 'success' },
  OPEN: { label: 'Đang mở', tone: 'info' },
  PENDING: { label: 'Đang chờ', tone: 'pending' },
  PENDING_REVIEW: { label: 'Chờ duyệt', tone: 'pending' },
  PENDING_CONFIRMATION: { label: 'Chờ xác nhận', tone: 'pending' },
  AWAITING_EVIDENCE: { label: 'Chờ bổ sung bằng chứng', tone: 'pending' },
  PROCESSING: { label: 'Đang xử lý', tone: 'info' },
  SCHEDULED: { label: 'Đã lên lịch', tone: 'info' },
  CONFIRMED: { label: 'Đã xác nhận', tone: 'success' },
  ACCEPTED: { label: 'Đã chấp nhận', tone: 'success' },
  VERIFIED: { label: 'Đã xác minh', tone: 'success' },
  COMPLETED: { label: 'Hoàn thành', tone: 'success' },
  PAID: { label: 'Đã thanh toán', tone: 'success' },
  CANCELLED: { label: 'Đã huỷ', tone: 'neutral' },
  REJECTED: { label: 'Bị từ chối', tone: 'danger' },
  FAILED: { label: 'Thất bại', tone: 'danger' }
};

const LABELS: Record<string, string> = {
  ONLINE: 'Trực tuyến',
  OFFLINE: 'Tại nhà',
  MONTHLY: 'Theo tháng',
  CREDIT: 'Tiền vào',
  DEBIT: 'Tiền ra',
  TUITION_PAYMENT: 'Thanh toán học phí',
  WALLET_TOP_UP: 'Nạp ví'
};

export function Status({ value }: { value: unknown }) {
  const key = String(value ?? '');
  return <StatusBadge meta={STATUS[key] ?? { label: key || '—', tone: 'neutral' }} />;
}

export function text(value: unknown): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'string') return LABELS[value] ?? value;
  if (Array.isArray(value)) return value.map(text).join(', ');
  return String(value);
}

export const money = (value: unknown) => formatMoney(typeof value === 'number' ? value : null);
export const day = (value: unknown) => formatDate(typeof value === 'string' ? value : null);
export const moment = (value: unknown) => formatDateTime(typeof value === 'string' ? value : null);
export const clock = (value: unknown) => formatTime(typeof value === 'string' ? value : null);

export function personName(row: Row, prefix: 'student' | 'tutor'): string {
  return [row[`${prefix}LastName`], row[`${prefix}FirstName`]].filter(Boolean).join(' ') || '—';
}

export interface Column {
  header: string;
  render: (row: Row) => ReactNode;
  align?: 'right';
}

export function RecordTable({ rows, columns, empty }: { rows: Row[]; columns: Column[]; empty: string }) {
  if (rows.length === 0) return <div className="empty-state">{empty}</div>;
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column.header} style={column.align ? { textAlign: column.align } : undefined}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? row.transactionId ?? row.withdrawalId ?? index)}>
              {columns.map((column) => (
                <td key={column.header} className={column.align ? 'num' : undefined} style={column.align ? { textAlign: column.align } : undefined}>
                  {column.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function FieldList({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="field-grid">
      {items.map(([label, value]) => (
        <div key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
