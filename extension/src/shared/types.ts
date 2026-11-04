/** One captured XHR / Fetch request, as shown in the side panel list (F-008). */
export interface RequestRow {
  /** CDP requestId */
  id: string;
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

export interface RecorderState {
  recording: boolean;
  tabId: number | null;
  requests: RequestRow[];
  error?: string;
}

/** Messages: side panel → background */
export type PanelMessage =
  | { type: 'GET_STATE' }
  | { type: 'START'; tabId: number }
  | { type: 'STOP' };

/** Messages: background → side panel (broadcast) */
export type BackgroundMessage = { type: 'STATE'; state: RecorderState };
