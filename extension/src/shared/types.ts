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
  /** Why the body could not be read (e.g. redirect, evicted from cache). */
  responseError?: string;
}

export interface RecorderState {
  recording: boolean;
  tabId: number | null;
  requests: RequestRow[];
  error?: string;
}

/** Messages: side panel → background */
export type PanelMessage =
  | { type: 'GET_STATE' }
  | { type: 'GET_DETAIL'; id: string }
  | { type: 'START'; tabId: number }
  | { type: 'STOP' };

/** Messages: background → side panel (broadcast) */
export type BackgroundMessage = { type: 'STATE'; state: RecorderState };

export function toRow(r: RequestRecord): RequestRow {
  const { id, rev, seq, url, method, type, status, failed, startedAt, durationMs } = r;
  return { id, rev, seq, url, method, type, status, failed, startedAt, durationMs };
}
