/**
 * Masking of sensitive data (F-005). Applied ONLY to export files (JSON, later HAR) —
 * inside the extension real values are shown (Session #3, Q4).
 */
import type { Headers, RequestRecord } from './types';

export const MASK = '***';

/** F-005 defaults (case-insensitive). */
const SENSITIVE_HEADERS = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key']);
const SENSITIVE_KEYS = new Set(['password', 'token', 'accesstoken', 'refreshtoken', 'secret']);

const isSensitiveKey = (k: string) => SENSITIVE_KEYS.has(k.toLowerCase());

export function maskHeaders(headers: Headers): Headers {
  const out: Headers = {};
  for (const [k, v] of Object.entries(headers))
    out[k] = SENSITIVE_HEADERS.has(k.toLowerCase()) ? MASK : v;
  return out;
}

/** Recursively replace values of sensitive keys in parsed JSON. */
export function maskValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(maskValue);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = isSensitiveKey(k) ? MASK : maskValue(v);
    return out;
  }
  return value;
}

function maskParams(params: URLSearchParams): boolean {
  let changed = false;
  for (const key of [...new Set(params.keys())]) {
    if (isSensitiveKey(key)) {
      params.set(key, MASK);
      changed = true;
    }
  }
  return changed;
}

/** JSON body → masked JSON; `a=1&token=x` form body → masked form; anything else unchanged. */
export function maskBody(text: string | undefined): string | undefined {
  if (text === undefined || text === '') return text;
  try {
    return JSON.stringify(maskValue(JSON.parse(text)));
  } catch {
    // not JSON
  }
  if (/^[^=&\s]+=[^&]*(&[^=&\s]+=[^&]*)*$/.test(text)) {
    const params = new URLSearchParams(text);
    if (maskParams(params)) return params.toString();
  }
  return text;
}

export function maskUrl(url: string): string {
  try {
    const u = new URL(url);
    return maskParams(u.searchParams) ? u.toString() : url;
  } catch {
    return url;
  }
}

export function maskRecord(r: RequestRecord): RequestRecord {
  return {
    ...r,
    url: maskUrl(r.url),
    requestHeaders: maskHeaders(r.requestHeaders),
    responseHeaders: maskHeaders(r.responseHeaders),
    postData: maskBody(r.postData),
    responseBody: r.responseBase64 ? r.responseBody : maskBody(r.responseBody),
  };
}
