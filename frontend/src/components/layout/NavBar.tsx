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

export function NavBar() {
  const { user } = useAuth();
  const { t } = useLocale();

  return (
    <header className="poster-nav sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <BrandWordmark className="text-3xl" />
          {user && (
            <nav className="flex gap-1">
              <NavLink to="/" end className={linkClass}>
                {t('nav.bands')}
              </NavLink>
              <NavLink to="/songs" className={linkClass}>
                {t('nav.songs')}
              </NavLink>
              <NavLink to="/practice" className={linkClass}>
                {t('nav.practice')}
              </NavLink>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <LanguageSwitcher />
          <AppearanceMenu />
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
