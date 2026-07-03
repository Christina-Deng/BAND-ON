/** Read localStorage key, migrating from a legacy key when present. */
export function readStorageWithLegacy(primary: string, legacy: string): string | null {
  try {
    const value = localStorage.getItem(primary);
    if (value !== null) return value;
    const legacyValue = localStorage.getItem(legacy);
    if (legacyValue !== null) {
      localStorage.setItem(primary, legacyValue);
      return legacyValue;
    }
  } catch {
    /* ignore */
  }
  return null;
}
