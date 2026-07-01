import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';

export function UserMenu() {
  const { user, logout } = useAuth();
  const { t } = useLocale();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (menuRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [open]);

  if (!user) return null;

  async function handleLogout() {
    setOpen(false);
    await logout();
  }

  const triggerRect = triggerRef.current?.getBoundingClientRect();
  const panelStyle =
    open && triggerRect
      ? {
          top: triggerRect.bottom + 8,
          left: Math.max(8, triggerRect.right - 160),
        }
      : undefined;

  return (
    <div ref={menuRef} className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 hover:border-slate-500 hover:bg-slate-800"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={t('nav.accountMenu')}
      >
        <span className="text-sm font-semibold text-emphasis">{user.displayName}</span>
        <ChevronIcon open={open} />
      </button>

      {open &&
        panelStyle &&
        createPortal(
          <div
            ref={panelRef}
            role="menu"
            className="fixed z-[200] min-w-[10rem] rounded-xl border border-slate-700 bg-slate-900 py-1 shadow-xl"
            style={panelStyle}
          >
            <Link
              to="/settings"
              role="menuitem"
              className="block px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-emphasis"
              onClick={() => setOpen(false)}
            >
              {t('nav.accountSettings')}
            </Link>
            <button
              type="button"
              role="menuitem"
              onClick={() => void handleLogout()}
              className="block w-full px-4 py-2.5 text-left text-sm text-slate-300 hover:bg-slate-800 hover:text-emphasis"
            >
              {t('nav.logout')}
            </button>
          </div>,
          document.body,
        )}
    </div>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 10.94l3.71-3.71a.75.75 0 111.06 1.06l-4.25 4.25a.75.75 0 01-1.06 0L5.21 8.27a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
