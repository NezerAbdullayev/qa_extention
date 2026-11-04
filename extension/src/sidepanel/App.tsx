import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { RequestRow } from '../shared/types';
import { RequestDetail } from './RequestDetail';
import { usePanelCollapsed } from './usePanelCollapsed';
import { useRecorder } from './useRecorder';
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
  const { collapsed, toggle } = usePanelCollapsed();
  const { popOut, dock } = useWindowMode();
  const count = state.requests.length;

  // Several boxes can be open at once (Session #2, Q4).
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleRow = useCallback((id: string) => {
    setExpanded((prev) => {
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

  // New recording (list cleared) → forget open boxes / selection.
  useEffect(() => {
    if (count === 0) {
      setExpanded(new Set());
      setSelectedId(null);
    }
  }, [count]);

  // DevTools-like keys in split layout: ↑ / ↓ change selection, Esc closes the details.
  useEffect(() => {
    if (!split || !selectedId) return;
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
  }, [split, selectedId, state.requests]);

  return (
    <div className="flex h-full flex-col text-sm">
      {/* Header: title (full mode) or compact status bar, collapse + close buttons */}
      <header className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-2">
        {collapsed ? (
          <RecStatus recording={state.recording} count={count} />
        ) : (
          <h1 className="font-semibold">{t('panel_title')}</h1>
        )}
        <div className="ml-auto flex items-center gap-1">
          {collapsed && <RecButton recording={state.recording} onStart={start} onStop={stop} />}
          {isWindowMode ? (
            <IconButton label={t('panel_dock')} onClick={dock}>
              ⇥
            </IconButton>
          ) : (
            <IconButton label={t('panel_popout')} onClick={popOut}>
              ⧉
            </IconButton>
          )}
          <IconButton label={collapsed ? t('panel_expand') : t('panel_collapse')} onClick={toggle}>
            {collapsed ? '▢' : '—'}
          </IconButton>
          <IconButton label={t('panel_close')} onClick={() => window.close()}>
            ✕
          </IconButton>
        </div>
      </header>

      {!collapsed && (
        <>
          <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-2">
            <RecStatus recording={state.recording} count={count} />
            <div className="ml-auto">
              <RecButton recording={state.recording} onStart={start} onStop={stop} />
            </div>
          </div>

          {/* Which tab is being recorded — essential when the panel is in its own window. */}
          {state.recording && state.target && (
            <p
              className="truncate border-b border-slate-200 bg-red-50/50 px-3 py-1 text-xs text-slate-600"
              title={state.target.url}
            >
              {t('rec_target', hostOf(state.target.url))}
              {state.target.title && (
                <span className="text-slate-400"> — {state.target.title}</span>
              )}
            </p>
          )}

          {state.error && (
            <p className="border-b border-red-200 bg-red-50 px-3 py-2 text-red-700">
              {t('rec_error_attach', state.error)}
            </p>
          )}

          {count === 0 ? (
            <main className="flex-1 overflow-y-auto">
              <p className="px-3 py-6 text-center text-slate-400">
                {state.recording ? t('list_empty_recording') : t('list_empty_idle')}
              </p>
            </main>
          ) : split ? (
            /* Wide separate window (D6): list left, details right — like DevTools Network. */
            <main className="flex min-h-0 flex-1">
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
                      <RequestDetail row={selectedRow} variant="pane" />
                    </div>
                  </section>
                </>
              )}
            </main>
          ) : (
            <main className="flex-1 overflow-y-auto">
              <ul className="divide-y divide-slate-100">
                {state.requests.map((r) => (
                  <RequestListRow
                    key={r.id}
                    row={r}
                    mode="accordion"
                    open={expanded.has(r.id)}
                    onToggle={() => toggleRow(r.id)}
                  />
                ))}
              </ul>
            </main>
          )}
        </>
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
      <span className={recording ? 'font-semibold text-red-600' : 'text-slate-500'}>
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
      className="rounded bg-slate-800 px-3 py-1 text-xs font-medium text-white hover:bg-slate-700"
    >
      {t('rec_stop')}
    </button>
  ) : (
    <button
      onClick={props.onStart}
      className="rounded bg-red-600 px-3 py-1 text-xs font-medium text-white hover:bg-red-500"
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
 * TODO (F-003): save button opens the name dialog.
 */
function RequestListRow(props: {
  row: RequestRow;
  mode: 'accordion' | 'select';
  open: boolean;
  onToggle: () => void;
}) {
  const { row, mode, open, onToggle } = props;
  const selected = mode === 'select' && open;
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
    <li className={selected ? 'bg-blue-100' : open ? 'bg-slate-50/60' : ''}>
      <div
        className={`flex items-center gap-2 px-3 py-1.5 ${selected ? '' : 'hover:bg-slate-50'}`}
        title={row.url}
      >
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {mode === 'accordion' && <span className="text-slate-400">{open ? '▾' : '▸'}</span>}
          <span className="min-w-0 flex-1 truncate font-mono text-xs">{requestName(row.url)}</span>
        </button>
        <span className="w-12 shrink-0 text-xs text-slate-500">{row.method}</span>
        <span
          className={`w-16 shrink-0 text-xs ${isError ? 'font-semibold text-red-600' : row.status && row.status >= 300 ? 'text-slate-400' : 'text-slate-700'}`}
        >
          {statusText}
        </span>
        <span className="w-14 shrink-0 text-right text-xs text-slate-500">
          {row.durationMs !== undefined ? `${row.durationMs} ms` : ''}
        </span>
        <button
          title={t('list_save')}
          aria-label={t('list_save')}
          disabled
          className="shrink-0 rounded px-1 opacity-40"
        >
          💾
        </button>
      </div>
      {mode === 'accordion' && open && <RequestDetail row={row} />}
    </li>
  );
}
