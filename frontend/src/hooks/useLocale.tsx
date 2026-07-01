import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { applyLocale, getStoredLocale, type Locale } from '../lib/i18n/locale';
import { translate } from '../lib/i18n/translate';
import { syncLocaleToAccountIfRegistered } from '../lib/localeAccountSync';

type SetLocaleOptions = {
  skipAccountSync?: boolean;
};

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale, options?: SetLocaleOptions) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(getStoredLocale);

  const setLocale = useCallback((next: Locale, options?: SetLocaleOptions) => {
    applyLocale(next);
    setLocaleState(next);
    if (!options?.skipAccountSync) {
      syncLocaleToAccountIfRegistered(next);
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(locale, key, params),
    [locale],
  );

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}
