import { useEffect, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { AppearanceMenu } from './AppearanceMenu';
import { BrandWordmark } from './BrandWordmark';
import { LanguageSwitcher } from './LanguageSwitcher';
import { UserMenu } from './UserMenu';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-tab px-3 py-2 text-sm font-semibold ${
    isActive ? 'nav-tab-active text-emphasis' : 'text-slate-400 hover:text-emphasis'
  }`;

const mobileLinkClass = ({ isActive }: { isActive: boolean }) =>
  `block rounded-lg px-3 py-2.5 text-sm font-semibold ${
    isActive
      ? 'bg-accent-600/10 text-emphasis'
      : 'text-slate-300 hover:bg-slate-800 hover:text-emphasis'
  }`;

export function NavBar() {
  const { user } = useAuth();
  const { t } = useLocale();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mobileNavRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mobileNavOpen) return;

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileNavOpen(false);
    }

    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (mobileNavRef.current?.contains(target)) return;
      setMobileNavOpen(false);
    }

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('pointerdown', onPointerDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('pointerdown', onPointerDown);
    };
  }, [mobileNavOpen]);

  function closeMobileNav() {
    setMobileNavOpen(false);
  }

  return (
    <header className="poster-nav sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl min-w-0 items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2 sm:gap-6">
          {user && (
            <button
              type="button"
              className="inline-flex shrink-0 items-center justify-center rounded-lg border border-slate-600 p-2 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis md:hidden"
              aria-expanded={mobileNavOpen}
              aria-controls="mobile-nav"
              aria-label={t('nav.menu')}
              onClick={() => setMobileNavOpen((open) => !open)}
            >
              <MenuIcon open={mobileNavOpen} />
            </button>
          )}
          <BrandWordmark className="shrink-0 text-2xl sm:text-3xl" />
          {user && (
            <nav className="hidden gap-1 md:flex">
              <NavLink to="/" end className={linkClass}>
                {t('nav.bands')}
              </NavLink>
              <NavLink to="/songs" className={linkClass}>
                {t('nav.songs')}
              </NavLink>
              <NavLink to="/practice" className={linkClass}>
                {t('nav.practice')}
              </NavLink>
              <NavLink to="/community" className={linkClass}>
                {t('nav.community')}
              </NavLink>
            </nav>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1.5 text-sm sm:gap-3">
          <LanguageSwitcher />
          <AppearanceMenu />
          {user && <UserMenu />}
        </div>
      </div>

      {user && mobileNavOpen && (
        <div ref={mobileNavRef} id="mobile-nav" className="border-t border-slate-700/80 md:hidden">
          <nav className="mx-auto flex max-w-5xl flex-col gap-0.5 px-3 py-2 sm:px-4">
            <NavLink to="/" end className={mobileLinkClass} onClick={closeMobileNav}>
              {t('nav.bands')}
            </NavLink>
            <NavLink to="/songs" className={mobileLinkClass} onClick={closeMobileNav}>
              {t('nav.songs')}
            </NavLink>
            <NavLink to="/practice" className={mobileLinkClass} onClick={closeMobileNav}>
              {t('nav.practice')}
            </NavLink>
            <NavLink to="/community" className={mobileLinkClass} onClick={closeMobileNav}>
              {t('nav.community')}
            </NavLink>
          </nav>
        </div>
      )}
    </header>
  );
}

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      {open ? (
        <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
      ) : (
        <path
          fillRule="evenodd"
          d="M2 4.75A.75.75 0 012.75 4h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 4.75zm0 5.5A.75.75 0 012.75 10h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 5.5a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z"
          clipRule="evenodd"
        />
      )}
    </svg>
  );
}
