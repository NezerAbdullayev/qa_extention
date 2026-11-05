import { t } from '../shared/i18n';
import type { PanelMessage, WatchItem } from '../shared/types';
import { JsonTree } from './JsonTree';

/**
 * F-010 "State" tab: live values of everything with a `data-watch` prop in the recorded page
 * (React component props + state, react-hook-form form / field, or `data-watch-value`).
 */
export function WatchTab(props: { recording: boolean; active: boolean; items: WatchItem[] }) {
  const { recording, active, items } = props;

  // Nothing is injected until the user turns the watcher on here.
  if (!active) {
    const activate = () => {
      const msg: PanelMessage = { type: 'START_WATCH' };
      void chrome.runtime.sendMessage(msg);
    };
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-6 text-center">
        <button
          onClick={activate}
          disabled={!recording}
          className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
        >
          {t('watch_activate')}
        </button>
        <p className="text-xs text-slate-400">
          {recording ? t('watch_activate_hint') : t('watch_need_recording')}
        </p>
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="px-3 py-6 text-center text-slate-400">
        {recording ? t('watch_empty_recording') : t('list_empty_idle')}
      </p>
    );
  }
  return (
    <div className="h-full space-y-2 overflow-y-auto p-3">
      {items.map((item) => (
        <section key={item.name} className="rounded border border-slate-200">
          <header className="flex flex-wrap items-baseline gap-1.5 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
            <span className="font-mono font-semibold">{item.name}</span>
            <span className="rounded-full border border-blue-600 px-1.5 text-[11px] text-blue-700">
              {item.component ? `${item.kind} · ${item.component}` : item.kind}
            </span>
            <span className="ml-auto text-[11px] text-slate-500">
              {[item.source, new Date(item.ts).toLocaleTimeString()].filter(Boolean).join(' · ')}
            </span>
          </header>
          <div className="max-h-[300px] overflow-auto p-2.5">
            <JsonTree value={item.value} />
          </div>
        </section>
      ))}
    </div>
  );
}
