import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import {
  getUnreadNotificationCount,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../api/notifications';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import type { AppNotification } from '../../api/notifications';

const POLL_MS = 45_000;

export function NotificationBell() {
  const { user } = useAuth();
  const { t, locale } = useLocale();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const count = await getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // ignore polling errors
    }
  }, [user]);

  const loadPanel = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const notifications = await listNotifications();
      setItems(notifications);
      await refreshUnreadCount();
    } finally {
      setLoading(false);
    }
  }, [user, refreshUnreadCount]);

  useEffect(() => {
    if (!user) return;
    void refreshUnreadCount();
    const timer = window.setInterval(() => void refreshUnreadCount(), POLL_MS);
    return () => window.clearInterval(timer);
  }, [user, refreshUnreadCount]);

  useEffect(() => {
    if (!open) return;
    void loadPanel();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open, loadPanel]);

  if (!user) return null;

  async function handleOpenPanel() {
    setOpen((value) => !value);
  }

  async function handleItemClick(notification: AppNotification) {
    if (!notification.readAt) {
      await markNotificationRead(notification.id);
      setUnreadCount((count) => Math.max(0, count - 1));
      setItems((prev) =>
        prev.map((item) =>
          item.id === notification.id
            ? { ...item, readAt: new Date().toISOString() }
            : item,
        ),
      );
    }
    setOpen(false);
    navigate(notification.linkPath);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setUnreadCount(0);
    setItems((prev) =>
      prev.map((item) => ({ ...item, readAt: item.readAt ?? new Date().toISOString() })),
    );
  }

  function formatMessage(notification: AppNotification): string {
    const { type, metadata } = notification;
    if (type === 'PRACTICE_CHECKIN') {
      return t('notifications.practiceCheckin', {
        name: metadata.actorName ?? t('notifications.someone'),
        band: metadata.bandName ?? t('common.bandFallback'),
        minutes: metadata.durationMinutes ?? 0,
      });
    }
    if (type === 'POST_RESPONSE') {
      return t('notifications.postResponse', {
        name: metadata.actorName ?? t('notifications.someone'),
        title: metadata.postTitle ?? '',
      });
    }
    if (type === 'REHEARSAL_PLAN_CREATED') {
      return t('notifications.rehearsalPlanCreated', {
        name: metadata.actorName ?? t('notifications.someone'),
        band: metadata.bandName ?? t('common.bandFallback'),
      });
    }
    if (type === 'REHEARSAL_PLAN_UPDATED') {
      return t('notifications.rehearsalPlanUpdated', {
        name: metadata.actorName ?? t('notifications.someone'),
        band: metadata.bandName ?? t('common.bandFallback'),
      });
    }
    return t('notifications.generic');
  }

  function formatWhen(iso: string) {
    return new Date(iso).toLocaleString(locale === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  const triggerRect = triggerRef.current?.getBoundingClientRect();
  const panelStyle =
    open && triggerRect
      ? {
          top: triggerRect.bottom + 8,
          right: Math.max(8, window.innerWidth - triggerRect.right),
          width: Math.min(360, window.innerWidth - 16),
        }
      : undefined;

  const badgeLabel =
    unreadCount > 99 ? '99+' : unreadCount > 0 ? String(unreadCount) : null;

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => void handleOpenPanel()}
        className="relative flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis"
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t('notifications.openPanel')}
        title={t('notifications.panelTitle')}
      >
        <span aria-hidden className="inline-flex h-4 w-4 shrink-0 items-center justify-center text-base leading-none">
          🔔
        </span>
        <span className="hidden text-xs font-medium sm:inline">{t('notifications.panelTitle')}</span>
        {badgeLabel && (
          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
            {badgeLabel}
          </span>
        )}
      </button>

      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={t('notifications.panelTitle')}
            className="fixed z-[200] overflow-hidden rounded-xl border border-slate-700 bg-slate-900 shadow-xl"
            style={panelStyle}
          >
            <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
              <h2 className="text-sm font-semibold text-emphasis">{t('notifications.panelTitle')}</h2>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => void handleMarkAllRead()}
                  className="text-xs text-accent-500 hover:underline"
                >
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>

            <div className="max-h-[min(24rem,60vh)] overflow-y-auto">
              {loading && (
                <p className="px-4 py-6 text-sm text-slate-500">{t('common.loading')}</p>
              )}
              {!loading && items.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-slate-500">
                  {t('notifications.empty')}
                </p>
              )}
              {!loading &&
                items.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => void handleItemClick(notification)}
                    className={`block w-full border-b border-slate-800 px-4 py-3 text-left hover:bg-slate-800/70 ${
                      notification.readAt ? 'opacity-75' : 'bg-accent-600/5'
                    }`}
                  >
                    <p className="text-sm text-slate-200">{formatMessage(notification)}</p>
                    <p className="mt-1 text-xs text-slate-500">{formatWhen(notification.createdAt)}</p>
                  </button>
                ))}
            </div>

            <div className="border-t border-slate-700 px-4 py-2 text-center">
              <Link
                to="/community/gear"
                className="text-xs text-slate-500 hover:text-accent-500"
                onClick={() => setOpen(false)}
              >
                {t('notifications.promoHint')}
              </Link>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
