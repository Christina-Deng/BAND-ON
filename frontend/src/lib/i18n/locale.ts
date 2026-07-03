export type Locale = 'zh' | 'en';

import { readStorageWithLegacy } from '../storage';

export const LOCALE_STORAGE_KEY = 'band-on-locale';
const LEGACY_LOCALE_STORAGE_KEY = 'bandmate-locale';
export const DEFAULT_LOCALE: Locale = 'zh';
export const VALID_LOCALES = new Set<Locale>(['zh', 'en']);

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (value === 'zh' || value === 'en') return value;
  return null;
}

export function getStoredLocale(): Locale {
  try {
    return (
      normalizeLocale(readStorageWithLegacy(LOCALE_STORAGE_KEY, LEGACY_LOCALE_STORAGE_KEY)) ??
      DEFAULT_LOCALE
    );
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function applyLocale(locale: Locale) {
  document.documentElement.lang = locale === 'zh' ? 'zh-CN' : 'en';
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function detectBrowserLocale(): Locale | null {
  if (typeof navigator === 'undefined') return null;
  const lang = navigator.language.toLowerCase();
  if (lang.startsWith('zh')) return 'zh';
  if (lang.startsWith('en')) return 'en';
  return null;
}
