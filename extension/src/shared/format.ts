import type { Headers } from './types';

export interface FormattedText {
  text: string;
  isJson: boolean;
}

/** Pretty-print JSON (2-space indent, F-008); non-JSON text is returned as-is. */
export function formatJson(raw: string): FormattedText {
  try {
    return { text: JSON.stringify(JSON.parse(raw), null, 2), isJson: true };
  } catch {
    return { text: raw, isJson: false };
  }
}

export function formatObject(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

/** Case-insensitive header lookup. */
export function header(headers: Headers, name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) if (k.toLowerCase() === lower) return v;
  return undefined;
}

/** URLSearchParams → object; repeated keys become arrays. */
function paramsToObject(params: URLSearchParams): Record<string, string | string[]> {
  const out: Record<string, string | string[]> = {};
  for (const [k, v] of params) {
    const prev = out[k];
    out[k] = prev === undefined ? v : Array.isArray(prev) ? [...prev, v] : [prev, v];
  }
  return out;
}

export interface Payload {
  /** Query string parameters (`?page=1` → { page: "1" }). */
  query?: Record<string, string | string[]>;
  /** Request body (POST/PUT/PATCH…). */
  body?: FormattedText;
}

/**
 * Payload like the DevTools "Payload" tab (F-008, Session #2 Q5a):
 * query string parameters + request body. Returns null when there is neither.
 */
export function buildPayload(
  url: string,
  postData: string | undefined,
  requestHeaders: Headers,
): Payload | null {
  const payload: Payload = {};

  try {
    const params = new URL(url).searchParams;
    if ([...params.keys()].length > 0) payload.query = paramsToObject(params);
  } catch {
    // invalid URL — no query
  }

  if (postData !== undefined && postData !== '') {
    const contentType = header(requestHeaders, 'content-type') ?? '';
    if (contentType.includes('application/x-www-form-urlencoded')) {
      payload.body = {
        text: formatObject(paramsToObject(new URLSearchParams(postData))),
        isJson: true,
      };
    } else {
      payload.body = formatJson(postData);
    }
  }

  return payload.query || payload.body ? payload : null;
}

const TEXT_MIME = /json|text|xml|javascript|x-www-form-urlencoded/i;

/** Decode a base64 body to UTF-8 text when the MIME type is textual; otherwise null. */
export function decodeBase64Text(body: string, mimeType: string | undefined): string | null {
  if (!mimeType || !TEXT_MIME.test(mimeType)) return null;
  try {
    const bytes = Uint8Array.from(atob(body), (c) => c.charCodeAt(0));
    return new TextDecoder('utf-8').decode(bytes);
  } catch {
    return null;
  }
}
