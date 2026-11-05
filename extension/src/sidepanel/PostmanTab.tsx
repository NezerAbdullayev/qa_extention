import { useEffect, useRef, useState } from 'react';
import { t } from '../shared/i18n';
import type {
  PanelMessage,
  PostmanItem,
  PostmanRequest,
  PostmanResponse,
  PostmanRow,
} from '../shared/types';
import { activeTabId } from './activeTab';
import { JsonTree } from './JsonTree';
import { ResizableBox } from './ResizableBox';

const send = <T,>(msg: PanelMessage) => chrome.runtime.sendMessage(msg) as Promise<T>;
const METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * F-011 "Postman" tab: requests sent here with ✈ (from "Qeyd" / "Saxlanmışlar") — edit and
 * send again from inside the page of the active tab. Enabled / disabled ONLY by its own
 * button (like the State tab); the list lives in memory and is gone on Disable / panel close.
 */
export function PostmanTab({ enabled, rows }: { enabled: boolean; rows: PostmanRow[] }) {
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggleOpen = (id: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 text-xs">
        <button
          onClick={() => send({ type: enabled ? 'POSTMAN_DISABLE' : 'POSTMAN_ENABLE' })}
          className={`rounded border px-3 py-1 font-medium text-white ${
            enabled
              ? 'border-gray-900 bg-gray-800 hover:bg-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500'
              : 'border-[oklch(0.18_0.08_263.35)] bg-[oklch(0.27_0.11_263.35)] hover:bg-[oklch(0.4_0.17_263.22)]'
          }`}
        >
          {enabled ? t('postman_disable') : t('postman_enable')}
        </button>
        {enabled && (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            {t('postman_status_on')}
          </span>
        )}
      </div>
      <PostmanHelp />

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!enabled ? (
          <p className="px-3 py-6 text-center text-xs text-slate-400">{t('postman_off_hint')}</p>
        ) : rows.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-slate-400">{t('postman_empty')}</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {rows.map((row) => (
              <li key={row.id} className={open.has(row.id) ? 'bg-slate-50/60' : ''}>
                <div
                  onClick={() => toggleOpen(row.id)}
                  title={row.url}
                  className="flex cursor-pointer items-center gap-2 px-3 py-1.5 hover:bg-slate-50"
                >
                  <span className="text-slate-400">{open.has(row.id) ? '▾' : '▸'}</span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{row.name}</span>
                  <span className="w-14 shrink-0 text-xs text-slate-500">{row.method}</span>
                  <StatusText status={row.status} failed={row.failed} />
                  <button
                    title={t('postman_delete')}
                    aria-label={t('postman_delete')}
                    onClick={(e) => {
                      e.stopPropagation();
                      void send({ type: 'POSTMAN_DELETE', id: row.id });
                    }}
                    className="shrink-0 rounded px-1 hover:bg-slate-200"
                  >
                    🗑
                  </button>
                </div>
                {open.has(row.id) && <PostmanEditor id={row.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatusText({ status, failed }: { status?: number; failed?: boolean }) {
  const isError = failed || (status ?? 0) >= 400;
  return (
    <span
      className={`w-10 shrink-0 text-xs ${isError ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-700'}`}
    >
      {failed ? t('list_failed') : (status ?? '—')}
    </span>
  );
}

/** Edit form + Send + last response of one item. Edits are kept (R3), saved as you type. */
function PostmanEditor({ id }: { id: string }) {
  const [req, setReq] = useState<PostmanRequest | null>(null);
  const [last, setLast] = useState<PostmanResponse | undefined>();
  const [sending, setSending] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    send<PostmanItem | null>({ type: 'POSTMAN_GET', id }).then((item) => {
      if (!item) return;
      setReq(item.edited);
      setLast(item.last);
    });
    return () => clearTimeout(saveTimer.current);
  }, [id]);

  if (!req) return null;

  const update = (next: PostmanRequest) => {
    setReq(next);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(
      () => void send({ type: 'POSTMAN_UPDATE', id, request: next }),
      300,
    );
  };
  const setHeader = (i: number, pair: [string, string]) =>
    update({ ...req, headers: req.headers.map((h, j) => (j === i ? pair : h)) });

  const onSend = async () => {
    clearTimeout(saveTimer.current);
    setSending(true);
    try {
      await send({ type: 'POSTMAN_UPDATE', id, request: req });
      const tabId = await activeTabId();
      if (tabId === undefined) {
        setLast({ error: t('postman_no_tab'), ms: 0, at: Date.now() });
        return;
      }
      setLast(await send<PostmanResponse>({ type: 'POSTMAN_SEND', id, tabId }));
    } finally {
      setSending(false);
    }
  };

  const onReset = async () => {
    clearTimeout(saveTimer.current);
    const item = await send<PostmanItem | null>({ type: 'POSTMAN_RESET', id });
    if (item) setReq(item.edited);
  };

  const trimmed = req.body.trim();
  const looksJson = trimmed.startsWith('{') || trimmed.startsWith('[');
  const invalidJson = looksJson && !isJson(trimmed);
  const input =
    'rounded border border-slate-300 bg-transparent px-2 py-1 font-mono text-xs focus:border-blue-500 focus:outline-none';

  return (
    <div className="mx-3 mb-3 space-y-2 rounded border border-slate-200 p-2.5 text-xs">
      <div className="flex gap-1.5">
        <select
          value={req.method}
          onChange={(e) => update({ ...req, method: e.target.value })}
          className={`${input} w-24 shrink-0`}
        >
          {(METHODS.includes(req.method) ? METHODS : [req.method, ...METHODS]).map((m) => (
            <option key={m} value={m} className="bg-white text-slate-900">
              {m}
            </option>
          ))}
        </select>
        <input
          value={req.url}
          onChange={(e) => update({ ...req, url: e.target.value })}
          className={`${input} min-w-0 flex-1`}
          spellCheck={false}
        />
      </div>

      <section className="space-y-1">
        <h3 className="font-semibold text-slate-600">{t('postman_headers')}</h3>
        {req.headers.map(([name, value], i) => (
          <div key={i} className="flex gap-1">
            <input
              value={name}
              onChange={(e) => setHeader(i, [e.target.value, value])}
              className={`${input} w-2/5 min-w-0`}
              spellCheck={false}
            />
            <input
              value={value}
              onChange={(e) => setHeader(i, [name, e.target.value])}
              className={`${input} min-w-0 flex-1`}
              spellCheck={false}
            />
            <button
              title={t('postman_remove_header')}
              aria-label={t('postman_remove_header')}
              onClick={() => update({ ...req, headers: req.headers.filter((_, j) => j !== i) })}
              className="shrink-0 rounded px-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-800"
            >
              ✕
            </button>
          </div>
        ))}
        <button
          onClick={() => update({ ...req, headers: [...req.headers, ['', '']] })}
          className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-100"
        >
          + {t('postman_add_header')}
        </button>
      </section>

      <section className="space-y-1">
        <h3 className="font-semibold text-slate-600">{t('postman_body')}</h3>
        <textarea
          value={req.body}
          onChange={(e) => update({ ...req, body: e.target.value })}
          rows={6}
          spellCheck={false}
          className={`${input} block w-full resize-y`}
        />
        {invalidJson && (
          <p className="text-amber-700 dark:text-amber-400">{t('postman_invalid_json')}</p>
        )}
      </section>

      <div className="flex items-center gap-2">
        <button
          onClick={onSend}
          disabled={sending}
          className="rounded border border-[oklch(0.18_0.08_263.35)] bg-[oklch(0.27_0.11_263.35)] px-3 py-1 font-medium text-white hover:bg-[oklch(0.4_0.17_263.22)] disabled:opacity-40"
        >
          {sending ? t('postman_sending') : t('postman_send')}
        </button>
        <button onClick={onReset} className="rounded px-2 py-1 text-slate-600 hover:bg-slate-100">
          ↺ {t('postman_reset')}
        </button>
      </div>

      {last && <PostmanResult res={last} />}
    </div>
  );
}

function isJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

function PostmanResult({ res }: { res: PostmanResponse }) {
  if (res.error !== undefined) {
    return (
      <div className="rounded border border-red-200 bg-red-50 p-2 text-red-700">
        <p className="font-semibold">{t('postman_error')}</p>
        <p className="break-all font-mono">{res.error}</p>
        <p className="mt-1 text-red-600/80">{t('postman_error_hint')}</p>
      </div>
    );
  }
  const body = res.body ?? '';
  const isError = (res.status ?? 0) >= 400;
  return (
    <div className="space-y-1">
      <p>
        <span className={`font-semibold ${isError ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
          {res.status} {res.statusText}
        </span>
        <span className="text-slate-500"> · {res.ms} ms</span>
      </p>
      <ResizableBox className="rounded border border-slate-200 bg-slate-50 p-2.5 font-mono text-xs">
        {body === '' ? (
          <span className="text-slate-400">—</span>
        ) : isJson(body) ? (
          <JsonTree value={JSON.parse(body)} />
        ) : (
          <pre className="whitespace-pre-wrap break-all">{body}</pre>
        )}
      </ResizableBox>
    </div>
  );
}

const HELP_NOTES = [
  'postman_help_1',
  'postman_help_2',
  'postman_help_3',
  'postman_help_4',
  'postman_help_5',
];

/** Collapsible usage guide under the toolbar (same as the State tab's). */
function PostmanHelp() {
  return (
    <details className="group border-b border-slate-200 text-xs">
      <summary className="flex cursor-pointer select-none list-none items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
        <span className="inline-block w-3 text-[10px] transition-transform group-open:rotate-90">
          ▸
        </span>
        {t('watch_help_title')}
      </summary>
      <ol className="list-decimal space-y-1 px-3 pb-3 pl-7 text-slate-500">
        {HELP_NOTES.map((k) => (
          <li key={k}>{t(k)}</li>
        ))}
      </ol>
    </details>
  );
}
