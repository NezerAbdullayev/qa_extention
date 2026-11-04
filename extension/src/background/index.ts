/**
 * Background service worker — recorder (F-001).
 *
 * - Clicking the extension icon opens the side panel.
 * - START: attach chrome.debugger to the tab, enable the Network domain.
 * - Only XHR / Fetch requests are recorded (Session #2, Q11).
 * - Captured per request: URL, method, status, request/response headers, payload,
 *   response body (≤ 5 MB, NFR-03), duration, failure reason.
 * - Every record is written to IndexedDB immediately (service worker may sleep).
 * - The list is broadcast to the side panel live (Session #2, Q2); full detail is
 *   fetched on demand (GET_DETAIL) so broadcasts stay small.
 *
 * TODO (F-001): console errors / exceptions, redirect chain, masking (F-005).
 */
import { db } from './db';
import { buildHar } from '../shared/har';
import { deleteAllSaved, deleteSaved, getSaved, listSaved, renameSaved, saveApi } from './saved';
import type {
  BackgroundMessage,
  Headers,
  PanelMessage,
  RecorderState,
  RequestRecord,
} from '../shared/types';
import { PANEL_PORT, toRow } from '../shared/types';

const CDP_VERSION = '1.3';
const RECORDED_TYPES = new Set(['XHR', 'Fetch']);
/** NFR-03: response body limit per request (characters). */
const BODY_LIMIT = 5 * 1024 * 1024;
const SESSION_KEY = 'recorder';

let recording = false;
let tabId: number | null = null;
let lastError: string | undefined;
let target: RecorderState['target'];
let seq = 0;
const records = new Map<string, RequestRecord>();
/** ExtraInfo events can arrive before the main event — keep their headers until then. */
const extraRequestHeaders = new Map<string, Headers>();
const extraResponseHeaders = new Map<string, Headers>();

chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((err) => console.error('[API Lens] setPanelBehavior failed', err));

// ---------------------------------------------------------------- state & persistence

function snapshot(): RecorderState {
  return {
    recording,
    tabId,
    error: lastError,
    target,
    requests: [...records.values()].map(toRow),
  };
}

let broadcastTimer: ReturnType<typeof setTimeout> | undefined;
/** Coalesce bursts of CDP events into one message (~20 fps). */
/** Tell every open panel (side panel + separate window) to reload the saved list. */
function notifySavedChanged(): void {
  const msg: BackgroundMessage = { type: 'SAVED_CHANGED' };
  chrome.runtime.sendMessage(msg).catch(() => {});
}

function scheduleBroadcast(): void {
  if (broadcastTimer !== undefined) return;
  broadcastTimer = setTimeout(() => {
    broadcastTimer = undefined;
    const msg: BackgroundMessage = { type: 'STATE', state: snapshot() };
    chrome.runtime.sendMessage(msg).catch(() => {}); // side panel closed → no listener
  }, 50);
}

function persist(record: RequestRecord): void {
  record.rev++;
  db.put(record).catch((err) => console.error('[API Lens] IndexedDB put failed', err));
}

function saveSession(): Promise<void> {
  return chrome.storage.session.set({ [SESSION_KEY]: { recording, tabId, seq } });
}

/** Restore after a service-worker restart: list from IndexedDB, recording flag from session storage. */
const ready: Promise<void> = (async () => {
  try {
    for (const r of await db.getAll()) records.set(r.id, r);
    const saved = (await chrome.storage.session.get(SESSION_KEY))[SESSION_KEY] as
      { recording: boolean; tabId: number | null; seq: number } | undefined;
    seq = Math.max(saved?.seq ?? 0, ...[...records.values()].map((r) => r.seq + 1), 0);
    if (saved?.recording && saved.tabId !== null) {
      try {
        // Succeeds only if our debugger session is still attached to the tab.
        await chrome.debugger.sendCommand({ tabId: saved.tabId }, 'Network.enable');
        recording = true;
        tabId = saved.tabId;
        target = await describeTab(saved.tabId);
      } catch {
        recording = false;
        tabId = null;
        await saveSession();
      }
    }
  } catch (err) {
    console.error('[API Lens] restore failed', err);
  }
})();

// ---------------------------------------------------------------- start / stop

/** Forgets the current (unsaved) recording: memory + IndexedDB `requests`. Saved APIs stay. */
async function clearRecords(): Promise<void> {
  records.clear();
  extraRequestHeaders.clear();
  extraResponseHeaders.clear();
  seq = 0;
  lastError = undefined;
  target = undefined;
  await db.clear();
}

/** ✕ in the panel header: stop recording and delete the unsaved "Qeyd" list (D15). */
async function closeAndClear(): Promise<void> {
  if (recording) await stop();
  await clearRecords();
  await saveSession();
  scheduleBroadcast();
}

async function start(targetTab: number): Promise<void> {
  if (recording) await stop();

  // New Start clears the previous (unsaved) list — Session #2, Q12.
  await clearRecords();

  try {
    await chrome.debugger.attach({ tabId: targetTab }, CDP_VERSION);
    await chrome.debugger.sendCommand({ tabId: targetTab }, 'Network.enable', {
      maxPostDataSize: BODY_LIMIT,
    });
    recording = true;
    tabId = targetTab;
    target = await describeTab(targetTab);
  } catch (err) {
    recording = false;
    tabId = null;
    lastError = err instanceof Error ? err.message : String(err);
  }
  await saveSession();
  scheduleBroadcast();
}

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return '';
  }
}

async function stop(): Promise<void> {
  const attached = tabId;
  recording = false;
  tabId = null;
  await saveSession();
  if (attached !== null) {
    try {
      await chrome.debugger.detach({ tabId: attached });
    } catch {
      // already detached (tab closed or user cancelled the debugging bar)
    }
  }
  scheduleBroadcast();
}

/**
 * Title + URL of the recorded tab. Uses chrome.debugger.getTargets(), so no extra
 * "tabs" permission is needed.
 */
async function describeTab(id: number): Promise<RecorderState['target']> {
  try {
    const t = (await chrome.debugger.getTargets()).find((x) => x.tabId === id);
    return t ? { title: t.title, url: t.url } : undefined;
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------- separate window (pop-out)
//
// The panel can be opened in its own window (like DevTools "Undock") so it can live on a
// second monitor while the site keeps its full width. The window's position and size are
// remembered, so it reopens on the same monitor.

const POPOUT_ID_KEY = 'popoutWindowId';
const POPOUT_BOUNDS_KEY = 'popoutBounds';
const DEFAULT_BOUNDS = { width: 520, height: 820 };

type Bounds = { left?: number; top?: number; width?: number; height?: number };

async function popoutWindowId(): Promise<number | undefined> {
  return (await chrome.storage.session.get(POPOUT_ID_KEY))[POPOUT_ID_KEY] as number | undefined;
}

async function popOut(): Promise<void> {
  const existing = await popoutWindowId();
  if (existing !== undefined) {
    try {
      await chrome.windows.update(existing, { focused: true });
      return;
    } catch {
      // window was closed — create a new one
    }
  }
  const saved = (await chrome.storage.local.get(POPOUT_BOUNDS_KEY))[POPOUT_BOUNDS_KEY] as
    Bounds | undefined;
  const win = await chrome.windows.create({
    url: chrome.runtime.getURL('sidepanel.html?mode=window'),
    type: 'popup',
    focused: true,
    ...DEFAULT_BOUNDS,
    ...saved,
  });
  await chrome.storage.session.set({ [POPOUT_ID_KEY]: win?.id });
}

chrome.windows.onBoundsChanged.addListener(async (win) => {
  if (win.id === undefined || win.id !== (await popoutWindowId())) return;
  const bounds: Bounds = { left: win.left, top: win.top, width: win.width, height: win.height };
  await chrome.storage.local.set({ [POPOUT_BOUNDS_KEY]: bounds });
});

chrome.windows.onRemoved.addListener(async (id) => {
  if (id === (await popoutWindowId())) await chrome.storage.session.remove(POPOUT_ID_KEY);
});

// ---------------------------------------------------------------- CDP events

type CdpParams = Record<string, any>;

function cdp<T = CdpParams>(method: string, params: object): Promise<T> {
  return chrome.debugger.sendCommand({ tabId: tabId! }, method, params) as Promise<T>;
}

async function loadPostData(record: RequestRecord): Promise<void> {
  try {
    const res = await cdp<{ postData: string }>('Network.getRequestPostData', {
      requestId: record.id,
    });
    record.postData = res.postData;
    persist(record);
    scheduleBroadcast();
  } catch {
    // body not available (e.g. streamed upload) — leave undefined
  }
}

async function loadResponseBody(record: RequestRecord): Promise<void> {
  try {
    const res = await cdp<{ body: string; base64Encoded: boolean }>('Network.getResponseBody', {
      requestId: record.id,
    });
    record.responseBase64 = res.base64Encoded;
    if (res.body.length > BODY_LIMIT) {
      record.responseBody = res.body.slice(0, BODY_LIMIT);
      record.responseTruncated = true;
    } else {
      record.responseBody = res.body;
    }
  } catch (err) {
    record.responseError = err instanceof Error ? err.message : String(err);
  }
  persist(record);
  scheduleBroadcast();
}

function elapsedMs(record: RequestRecord, timestamp: number): number {
  return Math.round((timestamp - record.startedAt) * 1000);
}

function onCdpEvent(source: chrome.debugger.Debuggee, method: string, params?: object): void {
  if (!recording || source.tabId !== tabId || !params) return;
  const p = params as CdpParams;

  switch (method) {
    case 'Network.requestWillBeSent': {
      if (!RECORDED_TYPES.has(p.type)) return;
      const existing = records.get(p.requestId);
      if (existing) {
        // Redirect: same requestId, new URL.
        existing.url = p.request.url;
        existing.method = p.request.method;
        existing.requestHeaders = { ...p.request.headers, ...extraRequestHeaders.get(p.requestId) };
        persist(existing);
        break;
      }
      const record: RequestRecord = {
        id: p.requestId,
        rev: 0,
        seq: seq++,
        url: p.request.url,
        method: p.request.method,
        type: p.type,
        startedAt: p.timestamp,
        wallTime: p.wallTime,
        requestHeaders: { ...p.request.headers, ...extraRequestHeaders.get(p.requestId) },
        responseHeaders: {},
        postData: p.request.postData,
      };
      extraRequestHeaders.delete(p.requestId);
      records.set(record.id, record);
      persist(record);
      if (p.request.hasPostData && record.postData === undefined) void loadPostData(record);
      void saveSession(); // keep seq in sync
      break;
    }
    case 'Network.requestWillBeSentExtraInfo': {
      // Full request headers as sent on the wire (incl. Cookie).
      const record = records.get(p.requestId);
      if (record) {
        record.requestHeaders = { ...record.requestHeaders, ...p.headers };
        persist(record);
      } else {
        extraRequestHeaders.set(p.requestId, p.headers);
      }
      return; // nothing visible changed in the list
    }
    case 'Network.responseReceived': {
      const record = records.get(p.requestId);
      if (!record) return;
      record.status = p.response.status;
      record.mimeType = p.response.mimeType;
      record.statusText = p.response.statusText;
      record.protocol = p.response.protocol;
      record.responseHeaders = {
        ...p.response.headers,
        ...record.responseHeaders,
        ...extraResponseHeaders.get(p.requestId),
      };
      extraResponseHeaders.delete(p.requestId);
      persist(record);
      break;
    }
    case 'Network.responseReceivedExtraInfo': {
      // Raw response headers (incl. Set-Cookie).
      const record = records.get(p.requestId);
      if (record) {
        record.responseHeaders = { ...record.responseHeaders, ...p.headers };
        persist(record);
      } else {
        extraResponseHeaders.set(p.requestId, p.headers);
      }
      return;
    }
    case 'Network.loadingFinished': {
      const record = records.get(p.requestId);
      if (!record) return;
      record.durationMs = elapsedMs(record, p.timestamp);
      persist(record);
      void loadResponseBody(record);
      break;
    }
    case 'Network.loadingFailed': {
      const record = records.get(p.requestId);
      if (!record) return;
      record.failed = p.corsErrorStatus
        ? 'CORS'
        : p.blockedReason
          ? `blocked:${p.blockedReason}`
          : p.canceled
            ? 'canceled'
            : p.errorText;
      record.durationMs = elapsedMs(record, p.timestamp);
      persist(record);
      break;
    }
    default:
      return;
  }
  scheduleBroadcast();
}

chrome.debugger.onEvent.addListener(onCdpEvent);

chrome.debugger.onDetach.addListener((source) => {
  if (source.tabId === tabId) {
    recording = false;
    tabId = null;
    void saveSession();
    scheduleBroadcast();
  }
});

// ---------------------------------------------------------------- messages from the side panel

// ---------------------------------------------------------------- panel closed → clear (D15)

/**
 * Every open panel (side panel or separate window) holds a port. When the last one closes —
 * however it was closed, incl. Chrome's own "Close side panel" — the recording stops and the
 * unsaved "Qeyd" list is deleted. Saved APIs stay. A short grace period keeps the data when
 * the panel only moves (⧉ pop out / ⇥ dock / reload): the new panel connects within it.
 */
const CLOSE_GRACE_MS = 3000;
let openPanels = 0;
let clearTimer: ReturnType<typeof setTimeout> | undefined;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== PANEL_PORT) return;
  openPanels++;
  clearTimeout(clearTimer);
  port.onDisconnect.addListener(() => {
    openPanels = Math.max(0, openPanels - 1);
    if (openPanels > 0) return;
    clearTimeout(clearTimer);
    clearTimer = setTimeout(() => {
      if (openPanels === 0) void ready.then(closeAndClear);
    }, CLOSE_GRACE_MS);
  });
});

chrome.runtime.onMessage.addListener((msg: PanelMessage, _sender, sendResponse) => {
  const handle = async (): Promise<unknown> => {
    await ready;
    switch (msg.type) {
      case 'GET_STATE':
        return snapshot();
      case 'GET_DETAIL':
        return records.get(msg.id) ?? (await db.get(msg.id)) ?? null;
      case 'START':
        await start(msg.tabId);
        return snapshot();
      case 'POP_OUT':
        await popOut();
        return null;
      case 'STOP':
        await stop();
        return snapshot();
      case 'CLEAR_RECORDING':
        await closeAndClear();
        return null;

      // ---- F-002 HAR export (masked, F-005)
      case 'EXPORT_HAR': {
        const list = [...records.values()].sort((a, b) => a.seq - b.seq);
        const har = buildHar(list, {
          creatorVersion: chrome.runtime.getManifest().version,
          page: target,
        });
        // File name host: the recorded tab, or the first request when the tab is unknown.
        const host = hostOf(target?.url ?? list[0]?.url ?? '') || 'api-lens';
        return { har, host };
      }

      // ---- F-003 saved APIs
      case 'SAVE_API': {
        const record = records.get(msg.requestId) ?? (await db.get(msg.requestId));
        if (!record) return { ok: false, error: 'not_found' };
        const result = await saveApi(record, msg.name, target);
        if (result.ok) notifySavedChanged();
        return result;
      }
      case 'LIST_SAVED':
        return listSaved();
      case 'GET_SAVED':
        return (await getSaved(msg.id)) ?? null;
      case 'RENAME_SAVED': {
        const result = await renameSaved(msg.id, msg.name);
        if (result.ok) notifySavedChanged();
        return result;
      }
      case 'DELETE_SAVED':
        await deleteSaved(msg.id);
        notifySavedChanged();
        return null;
      case 'DELETE_ALL_SAVED':
        await deleteAllSaved();
        notifySavedChanged();
        return null;
    }
  };
  handle().then(sendResponse, (err) => {
    console.error('[API Lens] message failed', msg, err);
    sendResponse(null);
  });
  return true; // async response
});
