import { api } from './client';

export type NotificationType =
  | 'PRACTICE_CHECKIN'
  | 'POST_RESPONSE'
  | 'REHEARSAL_PLAN_CREATED'
  | 'REHEARSAL_PLAN_UPDATED';

export interface NotificationMetadata {
  actorName?: string;
  bandName?: string;
  postTitle?: string;
  durationMinutes?: number;
}

export interface AppNotification {
  id: string;
  type: NotificationType;
  metadata: NotificationMetadata;
  linkPath: string;
  readAt: string | null;
  createdAt: string;
}

export async function listNotifications(limit = 30) {
  const { data } = await api.get<{ notifications: AppNotification[] }>('/notifications', {
    params: { limit },
  });
  return data.notifications;
}

export async function getUnreadNotificationCount() {
  const { data } = await api.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string) {
  await api.patch(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead() {
  await api.post('/notifications/mark-all-read');
}
