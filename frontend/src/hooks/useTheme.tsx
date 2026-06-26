import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { applyTheme, getStoredTheme, type ThemeId } from '../lib/theme';
import { syncThemeToAccountIfRegistered } from '../lib/themeAccountSync';

type SetThemeOptions = {
  skipAccountSync?: boolean;
};

type ThemeContextValue = {
  theme: ThemeId;
  setTheme: (theme: ThemeId, options?: SetThemeOptions) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(getStoredTheme);

  const setTheme = useCallback((next: ThemeId, options?: SetThemeOptions) => {
    applyTheme(next);
    setThemeState(next);
    if (!options?.skipAccountSync) {
      syncThemeToAccountIfRegistered(next);
    }
  }, []);

  const value = useMemo(() => ({ theme, setTheme }), [theme, setTheme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
