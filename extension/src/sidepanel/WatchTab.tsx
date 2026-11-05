import { useState } from 'react';
import { t } from '../shared/i18n';
import type { PanelMessage, WatchItem } from '../shared/types';
import { activeTabId } from './activeTab';
import { JsonTree } from './JsonTree';

/**
 * F-010 "İzləmə" tab: live values of everything with a `data-watch` prop or registered with
 * `$watch` in a local page. Turned on / off ONLY by the button on the left of its toolbar —
 * Record / Stop do not touch it.
 */
export function WatchTab(props: { active: boolean; items: WatchItem[] }) {
  const { active, items } = props;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggle = async () => {
    setBusy(true);
    setError(null);
    try {
      if (active) {
        const msg: PanelMessage = { type: 'STOP_WATCH' };
        await chrome.runtime.sendMessage(msg);
      } else {
        const id = await activeTabId();
        if (id === undefined) return;
        const msg: PanelMessage = { type: 'START_WATCH', tabId: id };
        const res = (await chrome.runtime.sendMessage(msg)) as { ok: boolean; error?: string };
        if (!res?.ok) {
          setError(res?.error === 'not_local' ? t('watch_not_local') : (res?.error ?? ''));
        }
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 text-xs">
        <button
          onClick={toggle}
          disabled={busy}
          className="rounded bg-slate-500 px-3 py-1 font-medium text-white hover:bg-slate-600 disabled:opacity-40"
        >
          {active ? t('watch_stop') : t('watch_start')}
        </button>
        {active && (
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
            {t('watch_status_on')}
          </span>
        )}
      </div>
      {error && (
        <p className="border-b border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">{error}</p>
      )}

      <div className="min-h-0 flex-1 overflow-y-auto">
        {!active ? (
          <p className="px-3 py-6 text-center text-xs text-slate-400">{t('watch_off_hint')}</p>
        ) : items.length === 0 ? (
          <p className="px-3 py-6 text-center text-slate-400">{t('watch_empty_recording')}</p>
        ) : (
          <div className="space-y-2 p-3">
            {items.map((item) => (
              <section key={item.name} className="rounded border border-slate-200">
                <header className="flex flex-wrap items-baseline gap-1.5 border-b border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs">
                  <span className="font-mono font-semibold">{item.name}</span>
                  <span className="rounded-full border border-blue-600 px-1.5 text-[11px] text-blue-700">
                    {item.component ? `${item.kind} · ${item.component}` : item.kind}
                  </span>
                  <span className="ml-auto text-[11px] text-slate-500">
                    {[item.source, new Date(item.ts).toLocaleTimeString()]
                      .filter(Boolean)
                      .join(' · ')}
                  </span>
                </header>
                <div className="max-h-[300px] overflow-auto p-2.5">
                  <JsonTree value={item.value} />
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
