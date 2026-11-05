import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { PanelMessage, RequestRow, SaveResult } from '../shared/types';
import type { Har } from '../shared/har';
import { download, fileStamp, safeFileName } from './download';
import { CompareView } from './CompareView';
import { RequestDetail } from './RequestDetail';
import { useRecorder } from './useRecorder';
import { NameDialog } from './NameDialog';
import { SavedList } from './SavedList';
import { WatchTab } from './WatchTab';
import { isLocalUrl } from '../shared/isLocalUrl';
import { useSaved } from './useSaved';
import { usePanelPresence } from './usePanelPresence';
import { useTheme } from './useTheme';
import { useSplitLayout } from './useSplitLayout';
import { isWindowMode, useWindowMode } from './useWindowMode';

function hostOf(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function App() {
  const { state, start, stop } = useRecorder();
  const { popOut, dock } = useWindowMode();
  const saved = useSaved();
  const { theme, toggle: toggleTheme } = useTheme();
  usePanelPresence(); // panel closed in any way → unsaved recording is cleared (D15)

  // F-003: tabs, save dialog, toast notification.
  const [tab, setTab] = useState<'record' | 'saved' | 'state'>('record');
  const [saving, setSaving] = useState<RequestRow | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const showToast = useCallback((text: string) => {
    setToast(text);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2500);
  }, []);
  const count = state.requests.length;
  // F-010: State tab only for a local page (localhost / 127.0.0.1); otherwise hidden.
  const showState = isLocalUrl(state.target?.url);
  useEffect(() => {
    if (!showState && tab === 'state') setTab('record');
  }, [showState, tab]);

  // ✕: the unsaved "Qeyd" list is deleted (recording stops); saved APIs stay (D15).
  const closePanel = async () => {
    const msg: PanelMessage = { type: 'CLEAR_RECORDING' };
    try {
      await chrome.runtime.sendMessage(msg);
    } finally {
      window.close();
    }
  };

  // 🚫 Təmizlə: empty the "Qeyd" list only (like DevTools); recording keeps going.
  const resetList = async () => {
    const msg: PanelMessage = { type: 'RESET_LIST' };
    await chrome.runtime.sendMessage(msg);
  };

  // F-002: HAR file of the last recording (after Stop), masked (F-005).
  const exportHar = async () => {
    const msg: PanelMessage = { type: 'EXPORT_HAR' };
    const { har, host } = (await chrome.runtime.sendMessage(msg)) as { har: Har; host: string };
    download(`${safeFileName(host)}_${fileStamp()}.har`, JSON.stringify(har, null, 2));
    showToast(t('har_exported', String(har.log.entries.length)));
  };

  // Side panel: several boxes can be open at once (Session #2, Q4).
  // Separate window: only one box — clicking another row opens it and closes the previous (D7).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
      if (isWindowMode) return prev.has(id) ? new Set() : new Set([id]);
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);
  // Split layout (wide separate window, D6): one selected request shown on the right.
  const { split, leftWidth, startResize } = useSplitLayout();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedRow = state.requests.find((r) => r.id === selectedId);

  // F-004 in the "Qeyd" tab: compare two requests of the current recording (only these —
  // the "Saxlanmışlar" tab has its own compare for saved APIs). A = checked first, B = second.
  const [checked, setChecked] = useState<Set<string>>(new Set());
  const [comparing, setComparing] = useState<[string, string] | null>(null);
  const closeCompare = useCallback(() => setComparing(null), []);
  const toggleChecked = (id: string) =>
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  // New recording (list cleared) → forget open boxes / selection / checked rows.
  useEffect(() => {
    if (count === 0) {
      setExpanded(new Set());
      setSelectedId(null);
      setChecked(new Set());
      setComparing(null);
    }
  }, [count]);

  // DevTools-like keys in split layout: ↑ / ↓ change selection, Esc closes the details.
  useEffect(() => {
    if (!split || !selectedId || tab !== 'record' || comparing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') return setSelectedId(null);
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const i = state.requests.findIndex((r) => r.id === selectedId);
      const next = state.requests[e.key === 'ArrowUp' ? i - 1 : i + 1];
      if (next) {
        e.preventDefault();
        setSelectedId(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [split, selectedId, state.requests, tab, comparing]);

  // Toolbar above the "Qeyd" list: Start/Stop, clear the list, compare two checked requests.
  const compareBar = (
    <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 text-xs">
      <RecButton recording={state.recording} onStart={start} onStop={stop} />
      <button
        onClick={resetList}
        disabled={count === 0}
        title={t('list_reset_hint')}
        className="flex items-center gap-1 rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-3.5 w-3.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M5.6 18.4L18.4 5.6" />
        </svg>
        {t('list_reset')}
      </button>
      <span className="text-slate-500">
        {checked.size > 0 && t('list_checked', String(checked.size))}
      </span>
      <button
        onClick={() => setComparing([...checked] as [string, string])}
        disabled={checked.size !== 2}
        title={t('saved_compare_hint')}
        className="ml-auto rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
      >
        ⇄ {t('saved_compare')}
      </button>
    </div>
  );

  return (
    <div className="flex h-full flex-col text-sm">
      {/* Header: title, theme, pop out / dock, close */}
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        <h1 className="font-semibold">{t('panel_title')}</h1>
        <div className="ml-auto flex items-center gap-1">
          <IconButton
            label={theme === 'dark' ? t('theme_light') : t('theme_dark')}
            onClick={toggleTheme}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </IconButton>
          {isWindowMode ? (
            <IconButton label={t('panel_dock')} onClick={dock}>
              ⇥
            </IconButton>
          ) : (
            <IconButton label={t('panel_popout')} onClick={popOut}>
              ⧉
            </IconButton>
          )}
          <IconButton label={t('panel_close')} onClick={closePanel}>
            ✕
          </IconButton>
        </div>
      </header>

      <>
        <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
          <RecStatus recording={state.recording} count={count} />
          <div className="ml-auto flex items-center gap-1.5">
            <button
              onClick={exportHar}
              disabled={state.recording || count === 0}
              title={state.recording ? t('har_hint_recording') : t('har_hint')}
              className="rounded px-2 py-1 text-xs text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              ⬇ {t('har_export')}
            </button>
          </div>
        </div>

        {/* Which tab is being recorded — essential when the panel is in its own window. */}
        {state.recording && state.target && (
          <p
            className="truncate border-b border-slate-200 bg-red-50/50 px-3 py-1 text-xs text-slate-600"
            title={state.target.url}
          >
            {t('rec_target', hostOf(state.target.url))}
            {state.target.title && <span className="text-slate-400"> — {state.target.title}</span>}
          </p>
        )}

        {state.error && (
          <p className="border-b border-red-200 bg-red-50 px-3 py-2 text-red-700">
            {t('rec_error_attach', state.error)}
          </p>
        )}

        {/* Tabs (F-003, Session #3 Q1; F-010): current recording | saved APIs | data-watch state */}
        <nav className="flex border-b border-slate-200 px-2 text-xs" role="tablist">
          {(showState ? (['record', 'saved', 'state'] as const) : (['record', 'saved'] as const)).map((id) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={`-mb-px border-b-2 px-3 py-1.5 ${
                tab === id
                  ? 'border-blue-600 font-semibold text-blue-700'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {id === 'record'
                ? t('tab_record', String(count))
                : id === 'saved'
                  ? t('tab_saved', String(saved.items.length))
                  : t('tab_state', String(state.watched.length))}
            </button>
          ))}
        </nav>

        {tab === 'state' && showState ? (
          <main className="min-h-0 flex-1">
            <WatchTab recording={state.recording} active={state.watchActive} items={state.watched} />
          </main>
        ) : tab === 'saved' ? (
          <main className="min-h-0 flex-1">
            <SavedList items={saved.items} onToast={showToast} />
          </main>
        ) : comparing ? (
          <main className="min-h-0 flex-1">
            <CompareView source="record" ids={comparing} onBack={closeCompare} />
          </main>
        ) : count === 0 ? (
          <main className="flex min-h-0 flex-1 flex-col">
            {compareBar}
            <p className="overflow-y-auto px-3 py-6 text-center text-slate-400">
              {state.recording ? t('list_empty_recording') : t('list_empty_idle')}
            </p>
          </main>
        ) : split ? (
          /* Wide separate window (D6): list left, details right — like DevTools Network. */
          <main className="flex min-h-0 flex-1 flex-col">
            {compareBar}
            <div className="flex min-h-0 flex-1">
              <div
                className="min-w-0 overflow-y-auto"
                style={selectedRow ? { width: leftWidth, flexShrink: 0 } : { flex: 1 }}
              >
                <ul className="divide-y divide-slate-100">
                  {state.requests.map((r) => (
                    <RequestListRow
                      key={r.id}
                      row={r}
                      mode="select"
                      open={r.id === selectedId}
                      onToggle={() => setSelectedId(r.id === selectedId ? null : r.id)}
                      checked={checked.has(r.id)}
                      onCheck={() => toggleChecked(r.id)}
                      onSave={() => setSaving(r)}
                    />
                  ))}
                </ul>
              </div>
              {selectedRow && (
                <>
                  <div
                    role="separator"
                    aria-orientation="vertical"
                    onPointerDown={startResize}
                    className="w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-blue-400"
                  />
                  <section className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5">
                      <span className="min-w-0 flex-1 truncate font-mono text-xs font-semibold">
                        {requestName(selectedRow.url)}
                      </span>
                      <IconButton label={t('detail_close')} onClick={() => setSelectedId(null)}>
                        ✕
                      </IconButton>
                    </div>
                    <div className="min-h-0 flex-1">
                      <RequestDetail key={selectedRow.id} row={selectedRow} variant="pane" />
                    </div>
                  </section>
                </>
              )}
            </div>
          </main>
        ) : (
          <main className="flex min-h-0 flex-1 flex-col">
            {compareBar}
            <div className="min-h-0 flex-1 overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {state.requests.map((r) => (
                  <RequestListRow
                    key={r.id}
                    row={r}
                    mode="accordion"
                    open={expanded.has(r.id)}
                    onToggle={() => toggleRow(r.id)}
                    checked={checked.has(r.id)}
                    onCheck={() => toggleChecked(r.id)}
                    onSave={() => setSaving(r)}
                  />
                ))}
              </ul>
            </div>
          </main>
        )}
      </>

      {saving && (
        <NameDialog
          title={t('save_title')}
          subtitle={`${requestName(saving.url)} · ${saving.method} · ${saving.status ?? saving.failed ?? ''}`}
          submitLabel={t('save_submit')}
          onSubmit={async (name) => {
            const msg: PanelMessage = { type: 'SAVE_API', requestId: saving.id, name };
            const r = (await chrome.runtime.sendMessage(msg)) as SaveResult;
            if (r.ok) showToast(t('save_done', r.saved.name));
            return r;
          }}
          onClose={() => setSaving(null)}
        />
      )}

      {toast && (
        <div
          role="status"
          className="pointer-events-none fixed inset-x-0 bottom-3 z-50 flex justify-center px-3"
        >
          <span className="rounded bg-gray-800 px-3 py-1.5 text-xs text-white shadow-lg dark:bg-gray-700">
            {toast}
          </span>
        </div>
      )}
    </div>
  );
}

function RecStatus({ recording, count }: { recording: boolean; count: number }) {
  return (
    <span className="flex items-center gap-1.5 text-xs">
      <span
        className={`h-2.5 w-2.5 rounded-full ${recording ? 'animate-pulse bg-red-500' : 'bg-slate-300'}`}
      />
      <span
        className={recording ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-500'}
      >
        {recording ? t('rec_status_recording') : t('rec_status_idle')}
      </span>
      <span className="text-slate-500">· {t('rec_count', String(count))}</span>
    </span>
  );
}

function RecButton(props: { recording: boolean; onStart: () => void; onStop: () => void }) {
  return props.recording ? (
    <button
      onClick={props.onStop}
      className="rounded bg-gray-800 px-3 py-1 text-xs font-medium text-white hover:bg-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500"
    >
      {t('rec_stop')}
    </button>
  ) : (
    <button
      onClick={props.onStart}
      className="rounded bg-[oklch(0.27_0.11_263.35)] px-3 py-1 text-xs font-medium text-white hover:bg-[oklch(0.4_0.17_263.22)]"
    >
      {t('rec_start')}
    </button>
  );
}

function IconButton(props: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      title={props.label}
      aria-label={props.label}
      onClick={props.onClick}
      className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800"
    >
      {props.children}
    </button>
  );
}

/**
 * Row: name (DevTools "Name") · method · status · duration · save.
 *  - mode 'accordion': click → detail box opens below the row (max 300px); click again → closes
 *  - mode 'select':    click → row is selected, details open in the right-hand pane (D6)
 * 💾 → name dialog (F-003).
 */
function RequestListRow(props: {
  row: RequestRow;
  mode: 'accordion' | 'select';
  open: boolean;
  onToggle: () => void;
  checked: boolean;
  onCheck: () => void;
  onSave: () => void;
}) {
  const { row, mode, open, onToggle, onSave } = props;
  const selected = mode === 'select' && open;

  // Separate window: keep the newly opened / selected row visible (the previous box closing
  // above it shifts the list; ↑ / ↓ may move the selection off-screen).
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!open || !isWindowMode) return;
    const id = requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [open]);
  const isError = row.failed !== undefined || (row.status !== undefined && row.status >= 400);
  const statusText =
    row.failed !== undefined
      ? row.failed === 'CORS'
        ? 'CORS'
        : t('list_failed')
      : row.status !== undefined
        ? String(row.status)
        : t('list_pending');

  return (
    <li ref={ref} className={selected ? 'bg-blue-100' : open ? 'bg-slate-50/60' : ''}>
      <div
        onClick={onToggle}
        className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 ${selected ? '' : 'hover:bg-slate-50'}`}
        title={row.url}
      >
        <input
          type="checkbox"
          aria-label={t('saved_select')}
          checked={props.checked}
          onChange={props.onCheck}
          onClick={(e) => e.stopPropagation()}
        />
        <button aria-expanded={open} className="flex min-w-0 flex-1 items-center gap-2 text-left">
          {mode === 'accordion' && <span className="text-slate-400">{open ? '▾' : '▸'}</span>}
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{requestName(row.url)}</span>
        </button>
        <span className="w-12 shrink-0 text-xs text-slate-500">{row.method}</span>
        <span
          className={`w-16 shrink-0 text-xs ${isError ? 'font-semibold text-red-600 dark:text-red-400' : row.status && row.status >= 300 ? 'text-slate-400' : 'text-slate-700'}`}
        >
          {statusText}
        </span>
        <span className="w-14 shrink-0 text-right text-xs text-slate-500">
          {row.durationMs !== undefined ? `${row.durationMs} ms` : ''}
        </span>
        <button
          title={t('list_save')}
          aria-label={t('list_save')}
          onClick={(e) => {
            e.stopPropagation(); // do not also open / select the row
            onSave();
          }}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-500 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white"
        >
          {/* Bookmark icon — "save this API" */}
          <svg
            viewBox="0 0 24 24"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
          </svg>
        </button>
      </div>
      {mode === 'accordion' && open && <RequestDetail row={row} />}
    </li>
  );
}
