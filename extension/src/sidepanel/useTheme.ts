import { useCallback, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
const KEY = 'theme';

function apply(theme: Theme): void {
  document.documentElement.classList.toggle('dark', theme === 'dark');
}

/**
 * Dark / light theme. Default: dark (sidepanel.html starts with class="dark" — no flash).
 * The choice is stored in chrome.storage.local and shared by the side panel and the
 * separate window (both update live).
 */
export function useTheme() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    chrome.storage.local.get(KEY).then((v) => {
      const saved: Theme = v[KEY] === 'light' ? 'light' : 'dark';
      setTheme(saved);
      apply(saved);
    });
    const onChange = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area !== 'local' || !changes[KEY]) return;
      const next: Theme = changes[KEY].newValue === 'light' ? 'light' : 'dark';
      setTheme(next);
      apply(next);
    };
    chrome.storage.onChanged.addListener(onChange);
    return () => chrome.storage.onChanged.removeListener(onChange);
  }, []);

  const toggle = useCallback(() => {
    setTheme((prev) => {
      const next: Theme = prev === 'dark' ? 'light' : 'dark';
      apply(next);
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  return { theme, toggle };
}
