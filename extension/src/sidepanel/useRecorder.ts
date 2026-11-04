import { useCallback, useEffect, useState } from 'react';
import type { BackgroundMessage, PanelMessage, RecorderState } from '../shared/types';

const INITIAL: RecorderState = { recording: false, tabId: null, requests: [] };

function send(msg: PanelMessage): Promise<RecorderState> {
  return chrome.runtime.sendMessage(msg);
}

/** Live recorder state from the background service worker. */
export function useRecorder() {
  const [state, setState] = useState<RecorderState>(INITIAL);

  useEffect(() => {
    send({ type: 'GET_STATE' }).then(setState);

    const onMessage = (msg: BackgroundMessage) => {
      if (msg.type === 'STATE') setState(msg.state);
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, []);

  const start = useCallback(async () => {
    // Active tab of the last focused *normal* browser window — so Start works the same from
    // the side panel and from the separate API Lens window (which is a "popup" window).
    const win = await chrome.windows.getLastFocused({ windowTypes: ['normal'] });
    const [tab] = await chrome.tabs.query({ active: true, windowId: win.id });
    if (tab?.id !== undefined) setState(await send({ type: 'START', tabId: tab.id }));
  }, []);

  const stop = useCallback(async () => {
    setState(await send({ type: 'STOP' }));
  }, []);

  return { state, start, stop };
}
