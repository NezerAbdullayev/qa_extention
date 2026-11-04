import { useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  apiSignature,
  compareJson,
  DIFF_KINDS,
  jsonType,
  matchApis,
  preview,
  type CompareMode,
  type Diff,
  type DiffKind,
  type Line,
} from '../shared/compare';
import { decodeBase64Text, header } from '../shared/format';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { PanelMessage, RequestRecord, SavedApi } from '../shared/types';

const send = <T,>(msg: PanelMessage) => chrome.runtime.sendMessage(msg) as Promise<T>;

const OPTIONS_KEY = 'compareOptions';

interface StoredOptions {
  mode: CompareMode;
  matchById: boolean;
}

const DEFAULT_OPTIONS: StoredOptions = { mode: 'full', matchById: false };

export const KIND_ICON: Record<DiffKind, string> = {
  missing: '➖',
  added: '➕',
  changed: '✏️',
  empty: '∅',
  type: '⚠️',
};

/** Row colours (F-004): ➖ red · ➕ green · ✏️ yellow · ⚠️ orange · ∅ grey. Work in both themes. */
const KIND_BG: Record<DiffKind, string> = {
  missing: 'bg-red-500/15',
  added: 'bg-green-500/15',
  changed: 'bg-yellow-400/20',
  empty: 'bg-slate-500/20',
  type: 'bg-orange-500/20',
};

type Body = { ok: true; value: unknown } | { ok: false; contentType: string };

/** Response body as parsed JSON, or why it cannot be compared (Session #2, Q14). */
function responseJson(r: RequestRecord): Body {
  const contentType = header(r.responseHeaders, 'content-type') ?? r.mimeType ?? '?';
  let text = r.failed === undefined ? r.responseBody : undefined;
  if (text !== undefined && r.responseBase64)
    text = decodeBase64Text(text, r.mimeType) ?? undefined;
  if (!text || r.responseTruncated) return { ok: false, contentType };
  try {
    return { ok: true, value: JSON.parse(text) };
  } catch {
    return { ok: false, contentType };
  }
}

/** One side of the comparison: a name and the recorded request. */
interface CompareItem {
  name: string;
  request: RequestRecord;
}

/** Loads one side: a request of the current recording ("Qeyd") or a saved API. */
async function loadItem(source: CompareSource, id: string): Promise<CompareItem | null> {
  if (source === 'saved') return (await send<SavedApi | null>({ type: 'GET_SAVED', id })) ?? null;
  const request = await send<RequestRecord | null>({ type: 'GET_DETAIL', id });
  return request ? { name: requestName(request.url), request } : null;
}

export type CompareSource = 'record' | 'saved';

/**
 * F-004 — compares the response bodies of two APIs of the SAME tab: two requests of the
 * current recording ("Qeyd") or two saved APIs ("Saxlanmışlar").
 * A = expected (first selected), B = checked.
 */
export function CompareView({
  source,
  ids,
  onBack,
}: {
  source: CompareSource;
  ids: [string, string];
  onBack: () => void;
}) {
  const [order, setOrder] = useState(ids);
  const [items, setItems] = useState<Record<string, CompareItem | null>>({});
  const [options, setOptions] = useState<StoredOptions>(DEFAULT_OPTIONS);
  const [view, setView] = useState<'json' | 'list'>('json');

  useEffect(() => {
    let alive = true;
    Promise.all(ids.map((id) => loadItem(source, id))).then((r) => {
      if (alive) setItems({ [ids[0]]: r[0] ?? null, [ids[1]]: r[1] ?? null });
    });
    return () => {
      alive = false;
    };
  }, [source, ids]);

  // Mode and id matching are remembered.
  useEffect(() => {
    chrome.storage.local.get(OPTIONS_KEY).then((v) => {
      const saved = v[OPTIONS_KEY] as Partial<StoredOptions> | undefined;
      // Only known fields — an old "ignore" list (removed, D17) is dropped.
      if (saved)
        setOptions({
          mode: saved.mode ?? DEFAULT_OPTIONS.mode,
          matchById: saved.matchById ?? DEFAULT_OPTIONS.matchById,
        });
    });
  }, []);

  const update = (patch: Partial<StoredOptions>) =>
    setOptions((prev) => {
      const next = { ...prev, ...patch };
      chrome.storage.local.set({ [OPTIONS_KEY]: next });
      return next;
    });

  // Esc → back to the list.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !(e.target instanceof HTMLInputElement)) onBack();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onBack]);

  const a = items[order[0]];
  const b = items[order[1]];
  const loaded = order[0] in items && order[1] in items;

  const bodies = useMemo(
    () => (a && b ? { a: responseJson(a.request), b: responseJson(b.request) } : null),
    [a, b],
  );

  const result = useMemo(() => {
    if (!bodies?.a.ok || !bodies.b.ok) return null;
    return compareJson(bodies.a.value, bodies.b.value, {
      mode: options.mode,
      matchById: options.matchById,
    });
  }, [bodies, options]);

  const sigA = a ? apiSignature(a.request.method, a.request.url) : '';
  const sigB = b ? apiSignature(b.request.method, b.request.url) : '';
  // Same API with different path parameters (`objects/{id}`) is not a "different API".
  const match =
    a && b ? matchApis(a.request.method, a.request.url, b.request.method, b.request.url) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5 text-xs">
        <button
          onClick={onBack}
          title={t('compare_back_hint')}
          className="rounded px-2 py-1 text-slate-700 hover:bg-slate-200"
        >
          ← {t('compare_back')}
        </button>
        <span className="font-semibold">{t('compare_title')}</span>
        <span className="text-slate-500">({t('compare_body_only')})</span>
        <button
          onClick={() => setOrder(([x, y]) => [y, x])}
          title={t('compare_swap')}
          aria-label={t('compare_swap')}
          className="ml-auto rounded px-2 py-1 text-slate-700 hover:bg-slate-200"
        >
          ⇆ A/B
        </button>
      </div>

      {!loaded ? (
        <p className="p-4 text-slate-400">{t('detail_loading')}</p>
      ) : !a || !b ? (
        <p className="p-4 text-slate-500">{t('compare_item_missing')}</p>
      ) : (
        <>
          <div className="space-y-1.5 border-b border-slate-200 px-3 py-2 text-xs">
            <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 py-1">
              <SideLabel side="A" item={a} />
              <SideLabel side="B" item={b} />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Segmented
                value={options.mode}
                onChange={(mode) => update({ mode })}
                options={[
                  ['keys', t('compare_mode_keys')],
                  ['values', t('compare_mode_values')],
                  ['full', t('compare_mode_full')],
                ]}
              />
              <Segmented
                value={view}
                onChange={setView}
                options={[
                  ['json', t('compare_view_json')],
                  ['list', t('compare_view_list')],
                ]}
              />
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              {/* "Nəzərə alma" field removed (D17) — its space is kept empty on purpose. */}
              <div aria-hidden="true" className="h-[20.25px] min-w-48 flex-1" />
              <label className="flex items-center gap-1.5 text-slate-600">
                <input
                  type="checkbox"
                  checked={options.matchById}
                  onChange={(e) => update({ matchById: e.target.checked })}
                />
                {t('compare_match_by_id')}
              </label>
            </div>
          </div>

          {match && !match.same && <Warning>{t('compare_different_api', [sigA, sigB])}</Warning>}
          {match && match.params.length > 0 && (
            <div className="border-b border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-xs text-blue-700">
              ℹ️ {t('compare_param_diff')}{' '}
              <span className="font-mono">
                {match.params.map((p) => `${p.a} ↔ ${p.b}`).join(', ')}
              </span>
            </div>
          )}

          {bodies && (!bodies.a.ok || !bodies.b.ok) ? (
            <Warning>
              <p className="font-semibold">{t('compare_not_json')}</p>
              {!bodies.a.ok && (
                <p>{t('compare_not_json_side', ['A', a.name, bodies.a.contentType])}</p>
              )}
              {!bodies.b.ok && (
                <p>{t('compare_not_json_side', ['B', b.name, bodies.b.contentType])}</p>
              )}
            </Warning>
          ) : (
            result && (
              <>
                <Summary counts={result.counts} />
                <div className="min-h-0 flex-1 overflow-auto">
                  {view === 'json' ? (
                    <SideBySide rows={result.rows} a={a.name} b={b.name} />
                  ) : (
                    <DiffList diffs={result.diffs} />
                  )}
                </div>
              </>
            )
          )}
        </>
      )}
    </div>
  );
}

function SideLabel({ side, item }: { side: 'A' | 'B'; item: CompareItem }) {
  return (
    <>
      <span className="font-semibold text-slate-500">{side}</span>
      <span className="min-w-0 truncate" title={item.request.url}>
        <span className="font-semibold">{item.name}</span>
        <span className="ml-2 font-mono text-slate-500">
          {apiSignature(item.request.method, item.request.url)}
        </span>
      </span>
    </>
  );
}

function Segmented<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: [T, string][];
}) {
  return (
    <div className="flex overflow-hidden rounded border border-slate-300">
      {options.map(([v, label]) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          aria-pressed={v === value}
          className={`px-2 py-0.5 ${v === value ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function Warning({ children }: { children: ReactNode }) {
  return (
    <div className="border-b border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs text-amber-700">
      {children}
    </div>
  );
}

function Summary({ counts }: { counts: Record<DiffKind, number> }) {
  const parts = DIFF_KINDS.filter((k) => counts[k] > 0);
  return (
    <div className="flex flex-wrap gap-x-3 gap-y-0.5 border-b border-slate-200 px-3 py-1.5 text-xs">
      <span className="font-semibold">{t('compare_summary')}:</span>
      {parts.length === 0 ? (
        <span className="text-green-600 dark:text-green-400">✅ {t('compare_no_diff')}</span>
      ) : (
        parts.map((k) => (
          <span key={k} className={`rounded px-1 ${KIND_BG[k]}`}>
            {KIND_ICON[k]} {t(`compare_count_${k}`, String(counts[k]))}
          </span>
        ))
      )}
    </div>
  );
}

/** JSON line with DevTools-like colours: key, string, number, keyword. */
function JsonLine({ line }: { line: Line }) {
  const m = /^("(?:[^"\\]|\\.)*")(: )(.*)$/.exec(line.text);
  const key = m ? m[1] : null;
  const rest = m ? m[3] : line.text;
  const value = /^(.*?)(,?)$/.exec(rest)!;
  const v = value[1];
  const color = v.startsWith('"')
    ? 'var(--json-string)'
    : /^-?\d/.test(v)
      ? 'var(--json-number)'
      : undefined;
  return (
    <>
      {key && (
        <>
          <span style={{ color: 'var(--json-key)' }}>{key}</span>
          {': '}
        </>
      )}
      <span style={color ? { color } : undefined} className={color ? '' : 'text-slate-600'}>
        {v}
      </span>
      {value[2]}
    </>
  );
}

/** A left, B right; one scroll container, so both sides always scroll together (F-004). */
function SideBySide({
  rows,
  a,
  b,
}: {
  rows: ReturnType<typeof compareJson>['rows'];
  a: string;
  b: string;
}) {
  const cell = (line: Line | null, kind: DiffKind | undefined, right: boolean) => (
    <div
      className={`flex min-w-0 gap-1 py-px pr-1 ${right ? 'border-l border-slate-200' : ''} ${line && kind ? KIND_BG[kind] : ''}`}
    >
      <span
        className="min-w-0 flex-1 break-all whitespace-pre-wrap"
        style={{ paddingLeft: 6 + (line?.depth ?? 0) * 14 }}
      >
        {line && <JsonLine line={line} />}
      </span>
      <span className="w-4 shrink-0 text-center">{line && kind ? KIND_ICON[kind] : ''}</span>
    </div>
  );

  return (
    <div className="font-mono text-[11px] leading-[18px]">
      <div className="sticky top-0 z-10 grid grid-cols-2 border-b border-slate-200 bg-slate-100 text-xs font-semibold">
        <div className="truncate px-2 py-1">A: {a}</div>
        <div className="truncate border-l border-slate-200 px-2 py-1">B: {b}</div>
      </div>
      {rows.map((r, i) => (
        <div key={i} className="grid grid-cols-2">
          {cell(r.a, r.kind, false)}
          {cell(r.b, r.kind, true)}
        </div>
      ))}
    </div>
  );
}

/** Report list: "Key-lər" (➖ ➕) and "Dəyərlər" (✏️ ∅ ⚠️). */
function DiffList({ diffs }: { diffs: Diff[] }) {
  const keys = diffs.filter((d) => d.kind === 'missing' || d.kind === 'added');
  const values = diffs.filter((d) => d.kind !== 'missing' && d.kind !== 'added');
  if (diffs.length === 0) {
    return <p className="px-3 py-6 text-center text-slate-400">✅ {t('compare_no_diff')}</p>;
  }

  const detail = (d: Diff) => {
    if (d.kind === 'missing') return t('compare_only_a');
    if (d.kind === 'added') return t('compare_only_b');
    if (d.kind === 'type') return `${jsonType(d.a)} → ${jsonType(d.b)}`;
    return `${preview(d.a)} → ${preview(d.b)}`;
  };

  const group = (title: string, list: Diff[]) =>
    list.length > 0 && (
      <section className="px-3 py-2">
        <h3 className="mb-1 text-xs font-semibold text-slate-500">{title}</h3>
        <ul className="space-y-0.5 font-mono text-[11px]">
          {list.map((d, i) => (
            <li key={i} className={`flex gap-2 rounded px-1.5 py-0.5 ${KIND_BG[d.kind]}`}>
              <span className="w-4 shrink-0 text-center">{KIND_ICON[d.kind]}</span>
              <span className="shrink-0 font-semibold">{d.path || t('compare_root')}</span>
              <span className="min-w-0 break-all text-slate-600">{detail(d)}</span>
            </li>
          ))}
        </ul>
      </section>
    );

  return (
    <>
      {group(t('compare_group_keys'), keys)}
      {group(t('compare_group_values'), values)}
    </>
  );
}
