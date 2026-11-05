import { useEffect, useState } from 'react';
import type { PanelMessage } from '../shared/types';

/**
 * Active tab of the last focused *normal* browser window — so the panel works the same from
 * the side panel and from the separate API Lens window (which is a "popup" window).
 */
export async function activeTabId(): Promise<number | undefined> {
  const win = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
  return tab?.id;
}

/** F-010: is the active tab a local page? Re-checked on tab switch, load and window focus. */
export function useActiveTabLocal(): boolean {
  const [local, setLocal] = useState(false);

  useEffect(() => {
    let alive = true;
    const check = async () => {
      const id = await activeTabId().catch(() => undefined);
      if (id === undefined) return alive && setLocal(false);
      const msg: PanelMessage = { type: 'IS_LOCAL_TAB', tabId: id };
      const result = (await chrome.runtime.sendMessage(msg).catch(() => false)) as boolean;
      if (alive) setLocal(Boolean(result));
    };
    const onUpdated = (_id: number, info: { status?: string }) => {
      if (info.status === 'complete') void check();
    };
    const onEvent = () => void check();

    void check();
    chrome.tabs.onActivated.addListener(onEvent);
    chrome.tabs.onUpdated.addListener(onUpdated);
    chrome.windows.onFocusChanged.addListener(onEvent);
    return () => {
      alive = false;
      chrome.tabs.onActivated.removeListener(onEvent);
      chrome.tabs.onUpdated.removeListener(onUpdated);
      chrome.windows.onFocusChanged.removeListener(onEvent);
    };
  }, []);

  return local;
}
