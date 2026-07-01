import { useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useLocale } from '../../hooks/useLocale';
import { getStoredLocale, normalizeLocale } from '../../lib/i18n/locale';

export function LocaleSync() {
  const { user, loading } = useAuth();
  const { setLocale } = useLocale();

  useEffect(() => {
    if (loading) return;

    if (user) {
      const accountLocale = normalizeLocale(user.localePreference);
      if (accountLocale) {
        setLocale(accountLocale, { skipAccountSync: true });
        return;
      }
    }

    setLocale(getStoredLocale(), { skipAccountSync: true });
  }, [loading, user?.id, user?.localePreference, setLocale]);

  return null;
}
