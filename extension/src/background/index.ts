/**
 * Background service worker — recorder skeleton (F-001).
 *
 * - Clicking the extension icon opens the side panel.
 * - START: attach chrome.debugger to the tab, enable Network domain.
 * - Only XHR / Fetch requests are recorded (Session #2, Q11).
 * - Every change is broadcast to the side panel immediately (live list, Session #2, Q2).
 *
 * TODO (F-001): persist to IndexedDB (service worker can sleep), request/response
 * headers, payload, response body, redirects, console errors.
 */
import type { BackgroundMessage, PanelMessage, RecorderState, RequestRow } from '../shared/types';

const CDP_VERSION = '1.3';
const RECORDED_TYPES = new Set(['XHR', 'Fetch']);

const state: RecorderState = { recording: false, tabId: null, requests: [] };
const byId = new Map<string, RequestRow>();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('[QA Debugger] setPanelBehavior failed', err));

function broadcast(): void {
  const msg: BackgroundMessage = { type: 'STATE', state };
  // No listener (side panel closed) is not an error.
  chrome.runtime.sendMessage(msg).catch(() => {});
}

async function start(tabId: number): Promise<void> {
  if (state.recording) await stop();

  // New Start clears the previous (unsaved) list — Session #2, Q12.
  state.requests = [];
  byId.clear();
  state.error = undefined;

  try {
    await chrome.debugger.attach({ tabId }, CDP_VERSION);
    await chrome.debugger.sendCommand({ tabId }, 'Network.enable');
    state.recording = true;
    state.tabId = tabId;
  } catch (err) {
    state.recording = false;
    state.tabId = null;
    state.error = err instanceof Error ? err.message : String(err);
  }
  broadcast();
}

async function stop(): Promise<void> {
  const tabId = state.tabId;
  state.recording = false;
  state.tabId = null;
  if (tabId !== null) {
    try {
      await chrome.debugger.detach({ tabId });
    } catch {
      // already detached (tab closed or user cancelled the debugging bar)
    }
  }
  broadcast();
}

type CdpParams = Record<string, any>;

function onCdpEvent(source: chrome.debugger.Debuggee, method: string, params?: object): void {
  if (!state.recording || source.tabId !== state.tabId || !params) return;
  const p = params as CdpParams;

  switch (method) {
    case 'Network.requestWillBeSent': {
      if (!RECORDED_TYPES.has(p.type)) return;
      const existing = byId.get(p.requestId);
      if (existing) {
        // Redirect: same requestId, new URL.
        existing.url = p.request.url;
        existing.method = p.request.method;
      } else {
        const row: RequestRow = {
          id: p.requestId,
          url: p.request.url,
          method: p.request.method,
          type: p.type,
          startedAt: p.timestamp,
        };
        byId.set(row.id, row);
        state.requests.push(row);
      }
      break;
    }
    case 'Network.responseReceived': {
      const row = byId.get(p.requestId);
      if (!row) return;
      row.status = p.response.status;
      break;
    }
    case 'Network.loadingFinished': {
      const row = byId.get(p.requestId);
      if (!row) return;
      row.durationMs = Math.round((p.timestamp - row.startedAt) * 1000);
      break;
    }
    case 'Network.loadingFailed': {
      const row = byId.get(p.requestId);
      if (!row) return;
      row.failed = p.corsErrorStatus
        ? 'CORS'
        : p.blockedReason
          ? `blocked:${p.blockedReason}`
          : p.canceled
            ? 'canceled'
            : p.errorText;
      row.durationMs = Math.round((p.timestamp - row.startedAt) * 1000);
      break;
    }
    default:
      return;
  }
  broadcast();
}

chrome.debugger.onEvent.addListener(onCdpEvent);

chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId === state.tabId) {
    state.recording = false;
    state.tabId = null;
    broadcast();
  }
});

chrome.runtime.onMessage.addListener((msg: PanelMessage, _sender, sendResponse) => {
  switch (msg.type) {
    case 'GET_STATE':
      sendResponse(state);
      return false;
    case 'START':
      start(msg.tabId).then(() => sendResponse(state));
      return true; // async response
    case 'STOP':
      stop().then(() => sendResponse(state));
      return true;
  }
});
