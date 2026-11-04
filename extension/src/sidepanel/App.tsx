import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { RequestRow } from '../shared/types';
import { RequestDetail } from './RequestDetail';
import { usePanelCollapsed } from './usePanelCollapsed';
import { useRecorder } from './useRecorder';
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
  // New recording (list cleared) → forget open boxes.
  useEffect(() => {
    if (count === 0) setExpanded(new Set());
  }, [count]);

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

          <main className="flex-1 overflow-y-auto">
            {count === 0 ? (
              <p className="px-3 py-6 text-center text-slate-400">
                {state.recording ? t('list_empty_recording') : t('list_empty_idle')}
              </p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {state.requests.map((r) => (
                  <RequestListRow
                    key={r.id}
                    row={r}
                    open={expanded.has(r.id)}
                    onToggle={() => toggleRow(r.id)}
                  />
                ))}
              </ul>
            )}
          </main>
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
 * Click → expands the detail box below (F-008); click again → collapses.
 * TODO (F-003): save button opens the name dialog.
 */
function RequestListRow(props: { row: RequestRow; open: boolean; onToggle: () => void }) {
  const { row, open, onToggle } = props;
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
    <li className={open ? 'bg-slate-50/60' : ''}>
      <div className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50" title={row.url}>
        <button
          onClick={onToggle}
          aria-expanded={open}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="text-slate-400">{open ? '▾' : '▸'}</span>
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
      {open && <RequestDetail row={row} />}
    </li>
  );
}
