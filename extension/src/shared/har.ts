/**
 * F-002 — HAR 1.2 export (http://www.softwareishard.com/blog/har-12-spec/).
 * The file opens in Chrome DevTools → Network (drag & drop / "Import HAR file").
 * Sensitive fields are masked (F-005) — masking is applied only to export files.
 */
import { header } from './format';
import { maskRecord } from './mask';
import type { Headers, RequestRecord } from './types';

interface HarNameValue {
  name: string;
  value: string;
}

export interface HarEntry {
  pageref?: string;
  startedDateTime: string;
  time: number;
  request: {
    method: string;
    url: string;
    httpVersion: string;
    cookies: HarNameValue[];
    headers: HarNameValue[];
    queryString: HarNameValue[];
    postData?: { mimeType: string; text: string };
    headersSize: number;
    bodySize: number;
  };
  response: {
    status: number;
    statusText: string;
    httpVersion: string;
    cookies: HarNameValue[];
    headers: HarNameValue[];
    content: { size: number; mimeType: string; text?: string; encoding?: string; comment?: string };
    redirectURL: string;
    headersSize: number;
    bodySize: number;
    _error?: string;
  };
  cache: Record<string, never>;
  timings: { send: number; wait: number; receive: number };
  _resourceType: 'xhr' | 'fetch';
}

export interface Har {
  log: {
    version: '1.2';
    creator: { name: string; version: string };
    pages: {
      startedDateTime: string;
      id: string;
      title: string;
      pageTimings: Record<string, never>;
    }[];
    entries: HarEntry[];
  };
}

export interface HarSource {
  creatorVersion: string;
  page?: { title: string; url: string };
}

/** CDP joins repeated headers with "\n"; HAR lists them one by one. */
function headerList(headers: Headers): HarNameValue[] {
  return Object.entries(headers).flatMap(([name, value]) =>
    String(value)
      .split('\n')
      .map((v) => ({ name, value: v })),
  );
}

function queryList(url: string): HarNameValue[] {
  try {
    return [...new URL(url).searchParams].map(([name, value]) => ({ name, value }));
  } catch {
    return [];
  }
}

/** `h2` / `http/1.1` (CDP) → `HTTP/2` / `HTTP/1.1` (HAR). */
function httpVersion(protocol: string | undefined): string {
  if (!protocol) return 'HTTP/1.1';
  if (protocol === 'h2') return 'HTTP/2.0';
  if (protocol === 'h3') return 'HTTP/3.0';
  return protocol.toUpperCase();
}

const byteLength = (s: string) => new TextEncoder().encode(s).length;

function toEntry(raw: RequestRecord, pageref: string | undefined): HarEntry {
  const r = maskRecord(raw);
  const time = r.durationMs ?? 0;
  // wallTime is epoch seconds; older records (before 2.4.1) only have the monotonic timestamp.
  const started = new Date(r.wallTime !== undefined ? r.wallTime * 1000 : Date.now());
  const requestType = header(r.requestHeaders, 'content-type') ?? '';
  const responseType = r.mimeType ?? header(r.responseHeaders, 'content-type') ?? '';

  const content: HarEntry['response']['content'] = { size: 0, mimeType: responseType };
  if (r.responseBody !== undefined) {
    content.text = r.responseBody;
    if (r.responseBase64) {
      content.encoding = 'base64';
      content.size =
        Math.floor((r.responseBody.length * 3) / 4) -
        (r.responseBody.match(/=+$/)?.[0].length ?? 0);
    } else {
      content.size = byteLength(r.responseBody);
    }
    if (r.responseTruncated) content.comment = 'API Lens: response > 5 MB, truncated';
  } else if (r.responseError) {
    content.comment = `API Lens: ${r.responseError}`;
  }

  return {
    ...(pageref ? { pageref } : {}),
    startedDateTime: started.toISOString(),
    time,
    request: {
      method: r.method,
      url: r.url,
      httpVersion: httpVersion(r.protocol),
      cookies: [],
      headers: headerList(r.requestHeaders),
      queryString: queryList(r.url),
      ...(r.postData !== undefined
        ? { postData: { mimeType: requestType, text: r.postData } }
        : {}),
      headersSize: -1,
      bodySize: r.postData !== undefined ? byteLength(r.postData) : 0,
    },
    response: {
      // HAR / DevTools use status 0 for requests without a response.
      status: r.failed !== undefined ? 0 : (r.status ?? 0),
      statusText: r.statusText ?? '',
      httpVersion: httpVersion(r.protocol),
      cookies: [],
      headers: headerList(r.responseHeaders),
      content,
      redirectURL: header(r.responseHeaders, 'location') ?? '',
      headersSize: -1,
      bodySize: -1,
      ...(r.failed !== undefined ? { _error: r.failed } : {}),
    },
    cache: {},
    timings: { send: 0, wait: time, receive: 0 },
    _resourceType: r.type === 'XHR' ? 'xhr' : 'fetch',
  };
}

export function buildHar(records: RequestRecord[], source: HarSource): Har {
  const first = records.find((r) => r.wallTime !== undefined);
  const pageStart = new Date(first?.wallTime ? first.wallTime * 1000 : Date.now()).toISOString();
  const pageref = source.page ? 'page_1' : undefined;
  return {
    log: {
      version: '1.2',
      creator: { name: 'API Lens', version: source.creatorVersion },
      pages: source.page
        ? [
            {
              startedDateTime: pageStart,
              id: 'page_1',
              title: source.page.title || source.page.url,
              pageTimings: {},
            },
          ]
        : [],
      entries: records.map((r) => toEntry(r, pageref)),
    },
  };
}
