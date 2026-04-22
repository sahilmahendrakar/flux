import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  THEME_STORAGE_KEY,
  type ThemePreference,
  applyThemeClass,
  getStoredTheme,
  isVisuallyDark,
} from './theme';

function syncNativeChrome(visuallyDark: boolean): void {
  void window.electronAPI.theme.syncChrome({ visuallyDark });
}

export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => getStoredTheme());

  useLayoutEffect(() => {
    const dark = applyThemeClass(preference);
    syncNativeChrome(dark);
  }, [preference]);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if (getStoredTheme() !== 'system') return;
      const dark = applyThemeClass('system');
      syncNativeChrome(dark);
      window.dispatchEvent(new CustomEvent('flux-theme-changed'));
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // ignore
    }
    const dark = applyThemeClass(next);
    setPreferenceState(next);
    syncNativeChrome(dark);
    window.dispatchEvent(new CustomEvent('flux-theme-changed'));
  }, []);

  const visuallyDark = isVisuallyDark(preference);

  return { preference, setPreference, visuallyDark };
}
