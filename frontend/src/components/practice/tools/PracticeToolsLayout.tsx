import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useMediaQuery } from '../../../hooks/useMediaQuery';
import { useLocale } from '../../../hooks/useLocale';
import { Metronome } from './Metronome';
import { Tuner } from './Tuner';

export type PracticeToolId = 'metronome' | 'tuner';

const DESKTOP_TOOLS_QUERY = '(min-width: 1280px)';

interface Props {
  children: ReactNode;
}

function ToolContent({ tool }: { tool: PracticeToolId }) {
  return tool === 'metronome' ? <Metronome /> : <Tuner />;
}

export function PracticeToolsLayout({ children }: Props) {
  const { t } = useLocale();
  const isDesktop = useMediaQuery(DESKTOP_TOOLS_QUERY);
  const [activeTool, setActiveTool] = useState<PracticeToolId | null>(null);

  const tools = useMemo(
    () =>
      [
        { id: 'metronome' as const, label: t('practice.tools.metronome'), short: '♩' },
        { id: 'tuner' as const, label: t('practice.tools.tuner'), short: '♯' },
      ],
    [t],
  );

  useEffect(() => {
    if (!activeTool) return undefined;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setActiveTool(null);
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeTool]);

  function toggleTool(id: PracticeToolId) {
    setActiveTool((prev) => (prev === id ? null : id));
  }

  function closeTool() {
    setActiveTool(null);
  }

  const panelOpen = activeTool !== null;

  return (
    <div className={`practice-tools-layout ${isDesktop ? 'practice-tools-layout--desktop' : 'practice-tools-layout--mobile'}`}>
      <div className="practice-tools-main">{children}</div>

      {isDesktop ? (
        <>
          <aside className="practice-tools-rail" aria-label={t('practice.toolsLabel')}>
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                title={tool.label}
                aria-label={tool.label}
                aria-pressed={activeTool === tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`practice-tools-rail-btn ${
                  activeTool === tool.id ? 'practice-tools-rail-btn-active' : ''
                }`}
              >
                <span className="practice-tools-rail-icon">{tool.short}</span>
                <span className="practice-tools-rail-label">{tool.label}</span>
              </button>
            ))}
          </aside>

          {panelOpen && activeTool && (
            <div className="practice-tools-panel practice-tools-panel-open" role="dialog" aria-modal="true">
              <div className="practice-tools-panel-inner poster-card rounded-xl p-5">
                <button
                  type="button"
                  onClick={closeTool}
                  className="mb-4 text-xs text-slate-500 hover:text-slate-300"
                >
                  {t('common.close')} ✕
                </button>
                <ToolContent tool={activeTool} />
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="practice-tools-mobile-bar">
            {tools.map((tool) => (
              <button
                key={tool.id}
                type="button"
                aria-pressed={activeTool === tool.id}
                onClick={() => toggleTool(tool.id)}
                className={`practice-tools-mobile-btn ${
                  activeTool === tool.id ? 'practice-tools-mobile-btn-active' : ''
                }`}
              >
                {tool.label}
              </button>
            ))}
          </div>

          {panelOpen && activeTool && (
            <div className="practice-tools-mobile-overlay" role="presentation">
              <button
                type="button"
                className="practice-tools-mobile-backdrop"
                aria-label={t('practice.tools.closePanel')}
                onClick={closeTool}
              />
              <div className="practice-tools-mobile-sheet poster-card" role="dialog" aria-modal="true">
                <div className="mb-4 flex items-center justify-between">
                  <p className="rock-kicker">TOOLS</p>
                  <button
                    type="button"
                    onClick={closeTool}
                    className="text-xs text-slate-500 hover:text-slate-300"
                  >
                    {t('common.close')}
                  </button>
                </div>
                <ToolContent tool={activeTool} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
