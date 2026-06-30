import type { ReactNode } from 'react';
import { AppearanceMenu } from './AppearanceMenu';
import { BrandWordmark } from './BrandWordmark';
import { PosterBackground } from './PosterBackground';

interface Props {
  title: string;
  lead?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthPageLayout({ title, lead, children, footer }: Props) {
  return (
    <div className="auth-shell relative min-h-screen px-4 py-8 md:py-12">
      <PosterBackground variant="auth" />
      <div className="relative z-[1] mx-auto grid max-w-5xl gap-10 md:grid-cols-[1fr,min(100%,24rem)] md:items-center md:gap-16 lg:grid-cols-[1.1fr,min(100%,26rem)]">
        <aside className="auth-brand relative hidden md:block">
          <BrandWordmark className="text-5xl leading-none lg:text-6xl" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-500">
            Your band, on. Rehearsals in sync.
          </p>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
            乐队的排练小助手 — 选对歌，记录练习，看见队友。
          </p>
          <p className="auth-watermark" aria-hidden>
            BAND·ON
          </p>
        </aside>

        <div className="relative z-[1] w-full justify-self-end">
          <div className="mb-6 flex items-center justify-between md:justify-end">
            <BrandWordmark className="text-2xl md:hidden" />
            <AppearanceMenu />
          </div>

          <div className="poster-card rounded-xl p-6 md:p-8">
            <h1 className="page-title text-3xl">{title}</h1>
            {lead && <p className="page-lead mt-2">{lead}</p>}
            <div className="mt-6">{children}</div>
          </div>

          {footer && <div className="mt-4 text-center text-sm text-slate-400">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
