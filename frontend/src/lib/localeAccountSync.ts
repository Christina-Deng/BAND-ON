import type { Locale } from './i18n/locale';

let syncLocaleToAccount: ((locale: Locale) => Promise<void>) | null = null;

export function registerLocaleAccountSync(fn: ((locale: Locale) => Promise<void>) | null) {
  syncLocaleToAccount = fn;
}

export function syncLocaleToAccountIfRegistered(locale: Locale) {
  if (syncLocaleToAccount) {
    void syncLocaleToAccount(locale);
  }
}
