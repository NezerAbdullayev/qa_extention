/** HTTP headers as delivered by CDP: name → value (multi-values joined by "\n"). */
export type Headers = Record<string, string>;

/** One captured XHR / Fetch request, as shown in the side panel list (F-008). Light — no bodies. */
export interface RequestRow {
  /** CDP requestId */
  id: string;
  /** Revision — increases on every change, so an open detail box knows to refetch. */
  rev: number;
  /** Capture order (stable sort key, survives service-worker restarts). */
  seq: number;
  url: string;
  method: string;
  /** CDP resource type: only 'XHR' | 'Fetch' are recorded (Session #2, Q11). */
  type: 'XHR' | 'Fetch';
  /** HTTP status; undefined while pending. */
  status?: number;
  /** Failure reason (net::ERR_*, CORS, canceled) when the request failed. */
  failed?: string;
  /** CDP monotonic timestamp (seconds) when the request started. */
  startedAt: number;
  /** Total duration in ms; undefined until loadingFinished / loadingFailed. */
  durationMs?: number;
}

/** Full request data shown in the expanded box (F-008) and stored in IndexedDB (F-001). */
export interface RequestRecord extends RequestRow {
  requestHeaders: Headers;
  responseHeaders: Headers;
  mimeType?: string;
  /** Raw request body (POST/PUT/PATCH…); undefined when the request has none. */
  postData?: string;
  /** Response body as text; undefined until loaded or when unavailable. */
  responseBody?: string;
  /** True when the body was binary and kept as base64. */
  responseBase64?: boolean;
  /** True when the body exceeded the size limit (NFR-03) and was cut. */
  responseTruncated?: boolean;
  /** Epoch seconds when the request started (HAR startedDateTime, F-002). */
  wallTime?: number;
  /** HTTP status text and protocol (`h2`, `http/1.1`) — for HAR. */
  statusText?: string;
  protocol?: string;
  /** Why the body could not be read (e.g. redirect, evicted from cache). */
  responseError?: string;
}

export interface RecorderState {
  recording: boolean;
  tabId: number | null;
  requests: RequestRow[];
  error?: string;
  /** The tab being recorded — shown in the panel (important in separate-window mode). */
  target?: { title: string; url: string };
}

/** A request saved with 💾 (F-003). Stored in IndexedDB → `savedApis`; never auto-deleted. */
export interface SavedApi {
  /** Own unique id (UUID) — independent of the CDP requestId. */
  id: string;
  /** Unique (case-insensitive) user name, or a random 6-digit number. */
  name: string;
  /** Epoch ms. */
  savedAt: number;
  /** Page the request was recorded on. */
  source?: { title: string; url: string };
  /** Full copy of the captured request at save time. */
  request: RequestRecord;
}

/** Light list item for the "Saxlanmışlar" tab. */
export interface SavedApiSummary {
  id: string;
  name: string;
  savedAt: number;
  url: string;
  method: string;
  status?: number;
  failed?: string;
}

export function toSummary(s: SavedApi): SavedApiSummary {
  const { url, method, status, failed } = s.request;
  return { id: s.id, name: s.name, savedAt: s.savedAt, url, method, status, failed };
}

export type SaveResult =
  { ok: true; saved: SavedApiSummary } | { ok: false; error: 'duplicate' | 'not_found' };

/** Messages: side panel → background */
export type PanelMessage =
  | { type: 'GET_STATE' }
  | { type: 'GET_DETAIL'; id: string }
  | { type: 'START'; tabId: number }
  | { type: 'STOP' }
  /** Open the panel in a separate window (or focus it if already open). */
  | { type: 'POP_OUT' }
  /** F-002: HAR of the last recording. */
  | { type: 'EXPORT_HAR' }
  // ---- F-003 saved APIs
  | { type: 'SAVE_API'; requestId: string; name: string }
  | { type: 'LIST_SAVED' }
  | { type: 'GET_SAVED'; id: string }
  | { type: 'RENAME_SAVED'; id: string; name: string }
  | { type: 'DELETE_SAVED'; id: string }
  | { type: 'DELETE_ALL_SAVED' };

/** Messages: background → side panel (broadcast) */
export type BackgroundMessage = { type: 'STATE'; state: RecorderState } | { type: 'SAVED_CHANGED' };

export function toRow(r: RequestRecord): RequestRow {
  const { id, rev, seq, url, method, type, status, failed, startedAt, durationMs } = r;
  return { id, rev, seq, url, method, type, status, failed, startedAt, durationMs };
}
