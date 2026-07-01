import { useLocale } from '../../hooks/useLocale';
import type { Locale } from '../../lib/i18n/locale';

interface Props {
  compact?: boolean;
  className?: string;
}

export function LanguageSwitcher({ compact = false, className = '' }: Props) {
  const { locale, setLocale, t } = useLocale();

  function toggle() {
    const next: Locale = locale === 'zh' ? 'en' : 'zh';
    setLocale(next);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1.5 rounded-lg border border-slate-600 px-2.5 py-1.5 text-slate-300 hover:border-slate-500 hover:bg-slate-800 hover:text-emphasis ${className}`.trim()}
      aria-label={t('nav.language')}
      title={t('nav.language')}
    >
      <span aria-hidden className="text-base leading-none">
        🌐
      </span>
      <span className="text-xs font-semibold tracking-wide">
        {locale === 'zh' ? t('nav.switchToEn') : t('nav.switchToZh')}
      </span>
      {!compact && (
        <span className="sr-only">
          {locale === 'zh' ? t('nav.switchToEn') : t('nav.switchToZh')}
        </span>
      )}
    </button>
  );
}
