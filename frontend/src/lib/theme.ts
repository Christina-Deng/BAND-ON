import { readStorageWithLegacy } from './storage';

export type ThemeId = 'indigo' | 'rock' | 'paper' | 'light';

export const THEME_STORAGE_KEY = 'band-on-theme';
const LEGACY_THEME_STORAGE_KEY = 'bandmate-theme';

export const THEMES: {
  id: ThemeId;
  label: string;
  description: string;
  swatches: [string, string];
}[] = [
  {
    id: 'indigo',
    label: 'Indigo',
    description: '中性深色 · 靛蓝点缀',
    swatches: ['#131316', '#6366f1'],
  },
  {
    id: 'rock',
    label: 'Rock',
    description: '红 · 黑 · 白 · 灰',
    swatches: ['#121212', '#dc2626'],
  },
  {
    id: 'light',
    label: 'Day',
    description: '日间 · 靛蓝点缀',
    swatches: ['#f1f5f9', '#6366f1'],
  },
  {
    id: 'paper',
    label: 'Paper',
    description: '纸色日间 · 红色点缀',
    swatches: ['#f7f5f2', '#dc2626'],
  },
];

/** Map legacy theme ids (e.g. amber) to current ids. */
export function normalizeThemeId(value: string | null | undefined): ThemeId | null {
  if (!value) return null;
  if (value === 'amber') return 'paper';
  return isThemeId(value) ? value : null;
}

export function isThemeId(value: string | null): value is ThemeId {
  return value === 'indigo' || value === 'rock' || value === 'paper' || value === 'light';
}

export function getStoredTheme(): ThemeId {
  try {
    const stored = readStorageWithLegacy(THEME_STORAGE_KEY, LEGACY_THEME_STORAGE_KEY);
    const normalized = normalizeThemeId(stored);
    if (normalized) {
      if (stored !== normalized) {
        localStorage.setItem(THEME_STORAGE_KEY, normalized);
      }
      return normalized;
    }
  } catch {
    /* ignore */
  }
  return 'rock';
}

export function applyTheme(theme: ThemeId) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyTheme(getStoredTheme());
}
