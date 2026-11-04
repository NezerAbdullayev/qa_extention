import { useCallback, useEffect, useRef } from 'react';
import type { PanelMessage } from '../shared/types';

/** True when this page runs in the separate API Lens window (sidepanel.html?mode=window). */
export const isWindowMode = new URLSearchParams(location.search).get('mode') === 'window';

/**
 * Switch between side panel and separate window (like DevTools "Undock" / "Dock").
 *  - popOut: open (or focus) the separate window, then close this side panel.
 *  - dock:   open the side panel in the last used browser window, then close this window.
 */
export function useWindowMode() {
  // chrome.sidePanel.open() must be called directly inside the click handler (user gesture),
  // so the target browser window id is looked up in advance and kept up to date.
  const dockWindowId = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (!isWindowMode) return;
    const refresh = () =>
      chrome.windows
        .getLastFocused({ windowTypes: ['normal'] })
        .then((w) => (dockWindowId.current = w.id))
        .catch(() => {});
    refresh();
    chrome.windows.onFocusChanged.addListener(refresh);
    return () => chrome.windows.onFocusChanged.removeListener(refresh);
  }, []);

  const popOut = useCallback(async () => {
    const msg: PanelMessage = { type: 'POP_OUT' };
    await chrome.runtime.sendMessage(msg);
    window.close(); // close the side panel — the separate window takes over
  }, []);

  const dock = useCallback(() => {
    const windowId = dockWindowId.current;
    if (windowId === undefined) return;
    chrome.sidePanel
      .open({ windowId })
      .then(() => window.close())
      .catch((err) => console.error('[API Lens] dock failed', err));
  }, []);

  return { popOut, dock };
}
