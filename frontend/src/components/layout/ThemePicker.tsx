import { THEMES, type ThemeId } from '../../lib/theme';
import { useLocale } from '../../hooks/useLocale';

interface Props {
  theme: ThemeId;
  onSelect: (theme: ThemeId) => void;
  hint?: string;
}

export function ThemePicker({ theme, onSelect, hint }: Props) {
  const { t } = useLocale();

  return (
    <div className="space-y-2">
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
      <ul className="space-y-2">
        {THEMES.map((option) => {
          const selected = theme === option.id;
          return (
            <li key={option.id}>
              <button
                type="button"
                onClick={() => onSelect(option.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                  selected
                    ? 'border-accent-600 bg-accent-600/10'
                    : 'border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                }`}
              >
                <span className="flex overflow-hidden rounded-md border border-slate-600">
                  <span className="h-8 w-8" style={{ backgroundColor: option.swatches[0] }} />
                  <span className="h-8 w-8" style={{ backgroundColor: option.swatches[1] }} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-emphasis">
                    {option.label}
                    {selected && (
                      <span className="ml-2 text-xs font-normal text-accent-500">
                        {t('settings.appearance.current')}
                      </span>
                    )}
                  </span>
                  <span className="block text-xs text-slate-400">
                    {t(`settings.themes.${option.id}`)}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
