import { useCallback, useEffect, useState } from 'react';
import type { BackgroundMessage, PanelMessage, SavedApiSummary } from '../shared/types';

/** Saved API list (F-003); reloads when any panel saves / renames / deletes / imports. */
export function useSaved() {
  const [items, setItems] = useState<SavedApiSummary[]>([]);

  const reload = useCallback(() => {
    const msg: PanelMessage = { type: 'LIST_SAVED' };
    chrome.runtime.sendMessage(msg).then((list: SavedApiSummary[] | null) => setItems(list ?? []));
  }, []);

  useEffect(() => {
    reload();
    const onMessage = (msg: BackgroundMessage) => {
      if (msg.type === 'SAVED_CHANGED') reload();
    };
    chrome.runtime.onMessage.addListener(onMessage);
    return () => chrome.runtime.onMessage.removeListener(onMessage);
  }, [reload]);

  return { items, reload };
}
