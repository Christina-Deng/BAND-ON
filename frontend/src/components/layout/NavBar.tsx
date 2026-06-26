import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { AppearanceMenu } from './AppearanceMenu';
import { UserMenu } from './UserMenu';

const linkClass = ({ isActive }: { isActive: boolean }) =>
  `nav-tab px-3 py-2 text-sm font-semibold ${
    isActive ? 'nav-tab-active text-emphasis' : 'text-slate-400 hover:text-emphasis'
  }`;

export function NavBar() {
  const { user } = useAuth();

  return (
    <header className="poster-nav sticky top-0 z-40 border-b border-slate-700/80 bg-slate-900/88 backdrop-blur-md">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="font-display-heavy text-3xl tracking-widest text-accent-600">BandMate</span>
          {user && (
            <nav className="flex gap-1">
              <NavLink to="/" end className={linkClass}>
                乐队
              </NavLink>
              <NavLink to="/songs" className={linkClass}>
                歌单
                <span className="badge-stamp">即将上线</span>
              </NavLink>
              <NavLink to="/practice" className={linkClass}>
                打卡
              </NavLink>
            </nav>
          )}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <AppearanceMenu />
          {user && <UserMenu />}
        </div>
      </div>
    </header>
  );
}
