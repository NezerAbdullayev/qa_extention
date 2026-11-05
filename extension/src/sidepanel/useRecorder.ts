import { useCallback, useEffect, useState } from 'react';
import type { BackgroundMessage, PanelMessage, RecorderState } from '../shared/types';
import { activeTabId } from './activeTab';

const INITIAL: RecorderState = {
  recording: false,
  tabId: null,
  requests: [],
  watched: [],
  watchActive: false,
  postmanEnabled: false,
  postman: [],
};

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
    const id = await activeTabId();
    if (id !== undefined) setState(await send({ type: 'START', tabId: id }));
  }, []);

  const stop = useCallback(async () => {
    setState(await send({ type: 'STOP' }));
  }, []);

  return { state, start, stop };
}
