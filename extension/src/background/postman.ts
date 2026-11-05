/**
 * F-011 "Postman" tab — send an edited request again.
 *
 * The request is sent from INSIDE the page of the active tab (R1): CDP `Runtime.evaluate`
 * runs a `fetch` there, like typing it into the DevTools console. So the page's cookies /
 * session go along, the Origin is the app's own (CORS behaves as for the app itself), no
 * extra permission is needed and the request also shows up in "Qeyd" while recording.
 */
import { requestName } from '../shared/requestName';
import type { PostmanRequest, PostmanResponse, RequestRecord } from '../shared/types';

/** Same limit as recorded response bodies (NFR-03). */
const BODY_LIMIT = 5 * 1024 * 1024;

/** Headers the browser sets itself / does not allow fetch() to set — hidden in the form. */
const FORBIDDEN = new Set([
  'accept-charset',
  'accept-encoding',
  'access-control-request-headers',
  'access-control-request-method',
  'connection',
  'content-length',
  'cookie',
  'cookie2',
  'date',
  'dnt',
  'expect',
  'host',
  'keep-alive',
  'origin',
  'referer',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'user-agent',
  'via',
]);

function allowedHeader(name: string): boolean {
  const n = name.toLowerCase();
  return !n.startsWith(':') && !n.startsWith('sec-') && !n.startsWith('proxy-') && !FORBIDDEN.has(n);
}

/** Recorded / saved request → editable form values. */
export function toPostmanRequest(r: RequestRecord): PostmanRequest {
  return {
    method: r.method,
    url: r.url,
    // CDP joins repeated headers with "\n" — fetch needs a single line.
    headers: Object.entries(r.requestHeaders)
      .filter(([name]) => allowedHeader(name))
      .map(([name, value]) => [name, value.replace(/\n/g, ', ')]),
    body: r.postData ?? '',
  };
}

export function postmanName(r: PostmanRequest): string {
  return requestName(r.url);
}

/** The code that runs in the page. Arguments travel as JSON, never spliced into code. */
function fetchExpression(req: PostmanRequest): string {
  const method = req.method.toUpperCase();
  const args = {
    url: req.url,
    method,
    headers: req.headers.filter(([name]) => name.trim() !== ''),
    body: method === 'GET' || method === 'HEAD' || req.body === '' ? undefined : req.body,
    limit: BODY_LIMIT,
  };
  return `(async (a) => {
  const t0 = performance.now();
  try {
    const res = await fetch(a.url, { method: a.method, headers: a.headers, body: a.body, credentials: 'include' });
    let body = await res.text();
    if (body.length > a.limit) body = body.slice(0, a.limit);
    const headers = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    return { status: res.status, statusText: res.statusText, headers, body, ms: Math.round(performance.now() - t0) };
  } catch (e) {
    return { error: String((e && e.message) || e), ms: Math.round(performance.now() - t0) };
  }
})(${JSON.stringify(args)})`;
}

/**
 * Runs the request in the tab. `shared` = the recorder / watcher already holds the debugger
 * session of this tab; otherwise attach just for this request and detach right after.
 */
export async function sendInTab(
  tabId: number,
  req: PostmanRequest,
  shared: boolean,
): Promise<PostmanResponse> {
  const debuggee = { tabId };
  const at = Date.now();
  try {
    if (!shared) await chrome.debugger.attach(debuggee, '1.3');
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ms: 0, at };
  }
  try {
    const res = (await chrome.debugger.sendCommand(debuggee, 'Runtime.evaluate', {
      expression: fetchExpression(req),
      awaitPromise: true,
      returnByValue: true,
    })) as {
      result?: { value?: Omit<PostmanResponse, 'at'> };
      exceptionDetails?: { text: string; exception?: { description?: string } };
    };
    if (res.exceptionDetails) {
      const d = res.exceptionDetails;
      return { error: d.exception?.description ?? d.text, ms: 0, at };
    }
    return { ms: 0, ...res.result?.value, at };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ms: 0, at };
  } finally {
    if (!shared) await chrome.debugger.detach(debuggee).catch(() => {});
  }
}
