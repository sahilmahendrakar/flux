export const THEME_STORAGE_KEY = 'flux-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function getStoredTheme(): ThemePreference {
  try {
    const v = localStorage.getItem(THEME_STORAGE_KEY);
    if (v === 'light' || v === 'dark' || v === 'system') return v;
  } catch {
    // ignore
  }
  return 'dark';
}

export function prefersDarkScheme(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function isVisuallyDark(preference: ThemePreference): boolean {
  if (preference === 'dark') return true;
  if (preference === 'light') return false;
  return prefersDarkScheme();
}

/** Applies `.dark` on `<html>` when the effective appearance is dark. */
export function applyThemeClass(preference: ThemePreference): boolean {
  const dark = isVisuallyDark(preference);
  document.documentElement.classList.toggle('dark', dark);
  return dark;
}
