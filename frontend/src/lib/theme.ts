export type ThemeId = 'indigo' | 'rock' | 'amber' | 'light';

export const THEME_STORAGE_KEY = 'bandmate-theme';

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
    id: 'amber',
    label: 'Amber',
    description: '日间 · 琥珀点缀',
    swatches: ['#fef3c7', '#f59e0b'],
  },
];

export function isThemeId(value: string | null): value is ThemeId {
  return value === 'indigo' || value === 'rock' || value === 'amber' || value === 'light';
}

export function getStoredTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (isThemeId(stored)) return stored;
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
