// Dữ liệu "của tôi" (hợp đồng, ví, buổi học...) và thông báo của người dùng đang đăng nhập.
import { get, patch } from './httpClient';
import type { PageResponse } from '../types/page';

export type Row = Record<string, unknown>;

export interface NotificationItem {
  id: string;
  title: string;
  content: string;
  type: string;
  eventType: string;
  referenceType: string | null;
  referenceId: string | null;
  isRead: boolean;
  createdAt: string;
}

export function getAccountData<T = Row>(path: string, signal?: AbortSignal): Promise<T> {
  return get<T>(path, { signal });
}

/** Trả danh sách dù backend trả mảng hay trang ({ content }). */
export async function getAccountRows(path: string, signal?: AbortSignal): Promise<Row[]> {
  const data = await get<Row[] | PageResponse<Row>>(path, { signal });
  return Array.isArray(data) ? data : data.content;
}

export const listNotifications = (signal?: AbortSignal) =>
  get<PageResponse<NotificationItem>>('/api/v1/users/me/notifications?size=50', { signal });

export const getUnreadCount = (signal?: AbortSignal) =>
  get<{ unreadCount: number }>('/api/v1/users/me/notifications/unread-count', { signal });

export const markNotificationRead = (id: string) =>
  patch<NotificationItem>(`/api/v1/users/me/notifications/${id}/read`);

export const markAllNotificationsRead = () => patch<{ updated: number }>('/api/v1/users/me/notifications/read-all');
