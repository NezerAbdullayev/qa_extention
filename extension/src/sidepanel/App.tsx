import type { ReactNode } from 'react';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { RequestRow } from '../shared/types';
import { usePanelCollapsed } from './usePanelCollapsed';
import { useRecorder } from './useRecorder';

export function App() {
  const { state, start, stop } = useRecorder();
  const { collapsed, toggle } = usePanelCollapsed();
  const count = state.requests.length;

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
          <IconButton
            label={collapsed ? t('panel_expand') : t('panel_collapse')}
            onClick={toggle}
          >
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
                  <RequestListRow key={r.id} row={r} />
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
 * Collapsed row: name (DevTools "Name") · method · status · duration · save.
 * TODO (F-008): expandable box (URL, method, status, headers, payload, response; max 500px).
 * TODO (F-003): save button opens the name dialog.
 */
function RequestListRow({ row }: { row: RequestRow }) {
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
    <li className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50" title={row.url}>
      <span className="text-slate-400">▸</span>
      <span className="min-w-0 flex-1 truncate font-mono text-xs">{requestName(row.url)}</span>
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
    </li>
  );
}
