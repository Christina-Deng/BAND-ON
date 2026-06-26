import type { ThemeId } from './theme';

let syncThemeToAccount: ((theme: ThemeId) => Promise<void>) | null = null;

export function registerThemeAccountSync(fn: ((theme: ThemeId) => Promise<void>) | null) {
  syncThemeToAccount = fn;
}

export function syncThemeToAccountIfRegistered(theme: ThemeId) {
  if (syncThemeToAccount) {
    void syncThemeToAccount(theme);
  }
}
