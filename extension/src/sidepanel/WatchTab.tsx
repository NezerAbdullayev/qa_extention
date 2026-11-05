import { t } from '../shared/i18n';
import type { WatchItem } from '../shared/types';
import { JsonTree } from './JsonTree';

/**
 * F-010 "State" tab: live values of everything with a `data-watch` prop in the recorded page
 * (React component props + state, react-hook-form form / field, or `data-watch-value`).
 */
export function WatchTab({ recording, items }: { recording: boolean; items: WatchItem[] }) {
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
