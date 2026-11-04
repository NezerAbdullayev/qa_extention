import { useCallback, useEffect, useState } from 'react';

const KEY = 'panelCollapsed';

/** Compact ↔ full mode of the side panel, remembered in chrome.storage.local (F-008). */
export function usePanelCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    chrome.storage.local.get(KEY).then((v) => setCollapsed(Boolean(v[KEY])));
  }, []);

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      chrome.storage.local.set({ [KEY]: next });
      return next;
    });
  }, []);

  return { collapsed, toggle };
}
