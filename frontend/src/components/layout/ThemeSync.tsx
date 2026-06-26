import { useEffect } from 'react';
import { useAuth, useAuthThemePreference } from '../../hooks/useAuth';
import { useTheme } from '../../hooks/useTheme';

export function ThemeSync() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const accountTheme = useAuthThemePreference(user);

  useEffect(() => {
    if (accountTheme) {
      setTheme(accountTheme, { skipAccountSync: true });
    }
  }, [accountTheme, setTheme]);

  return null;
}
