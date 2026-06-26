import { Outlet } from 'react-router-dom';
import { NavBar } from './NavBar';

export function AppLayout() {
  return (
    <div className="app-shell min-h-screen">
      <div className="graffiti-bg" aria-hidden="true">
        <span className="graffiti-splat graffiti-splat-primary" />
        <span className="graffiti-splat graffiti-splat-secondary" />
        <span className="graffiti-drip graffiti-drip-a" />
        <span className="graffiti-drip graffiti-drip-b" />
        <span className="graffiti-drip graffiti-drip-c" />
        <span className="graffiti-specks" />
      </div>
      <NavBar />
      <main className="relative z-[1] mx-auto max-w-5xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
}
