import { Outlet } from 'react-router-dom';
import { APP_BACKGROUND } from '../../lib/appBackground';
import { NavBar } from './NavBar';

function PosterBackgroundPrint() {
  return (
    <>
      <span className="poster-bg-halftone" />
      <span className="poster-bg-bleed poster-bg-bleed-tr" />
      <span className="poster-bg-bleed poster-bg-bleed-bl" />
      <span className="poster-bg-regmark" />
      <span className="poster-bg-watermark">
        <span className="poster-bg-watermark-main">LIVE</span>
        <span className="poster-bg-watermark-sub">ON TOUR</span>
      </span>
    </>
  );
}

function PosterBackgroundInk() {
  return (
    <>
      <span className="poster-bg-ink-wash" />
      <span className="poster-bg-ink-splash poster-bg-ink-splash-a" />
      <span className="poster-bg-ink-splash poster-bg-ink-splash-b" />
      <span className="poster-bg-ink-fleck poster-bg-ink-fleck-a" />
      <span className="poster-bg-ink-fleck poster-bg-ink-fleck-b" />
      <span className="poster-bg-ink-brush poster-bg-ink-brush-main" />
      <span className="poster-bg-ink-brush poster-bg-ink-brush-secondary" />
    </>
  );
}

export function AppLayout() {
  return (
    <div className="app-shell min-h-screen">
      <div className={`poster-bg poster-bg--${APP_BACKGROUND}`} aria-hidden="true">
        {APP_BACKGROUND === 'print' ? <PosterBackgroundPrint /> : <PosterBackgroundInk />}
      </div>
      <NavBar />
      <main className="relative z-[1] mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
