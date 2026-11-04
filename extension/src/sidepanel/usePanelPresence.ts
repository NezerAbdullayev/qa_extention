import { useEffect } from 'react';
import { PANEL_PORT } from '../shared/types';

/**
 * Keeps a port open to the background while the panel is open (D15).
 * When the panel closes — our ✕, Chrome's own "Close side panel", the toolbar icon or the
 * separate window's ✕ — the port disconnects and the background clears the unsaved recording.
 * If the service worker restarts, the port drops on our side too → reconnect.
 */
export function usePanelPresence(): void {
  useEffect(() => {
    let port: chrome.runtime.Port | undefined;
    let closed = false;
    let retry: ReturnType<typeof setTimeout> | undefined;

    const connect = () => {
      port = chrome.runtime.connect({ name: PANEL_PORT });
      port.onDisconnect.addListener(() => {
        if (!closed) retry = setTimeout(connect, 200);
      });
    };
    connect();

    return () => {
      closed = true;
      clearTimeout(retry);
      port?.disconnect();
    };
  }, []);
}
