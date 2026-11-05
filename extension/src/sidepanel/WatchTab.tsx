import { useState } from 'react';
import { t } from '../shared/i18n';
import type { PanelMessage, WatchItem } from '../shared/types';
import { activeTabId } from './activeTab';
import { JsonTree } from './JsonTree';

/**
 * F-010 "State" tab: live values of everything with a `data-watch` prop or registered with
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
          className={`rounded border px-3 py-1 font-medium text-white disabled:opacity-40 ${
            active
              ? // Unwatch — grey, like the recorder's Stop
                'border-gray-900 bg-gray-800 hover:bg-gray-700 dark:border-gray-700 dark:bg-gray-600 dark:hover:bg-gray-500'
              : // Watch — same colour as Record, slightly darker border
                'border-[oklch(0.18_0.08_263.35)] bg-[oklch(0.27_0.11_263.35)] hover:bg-[oklch(0.4_0.17_263.22)]'
          }`}
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
      <WatchHelp />
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

/** How to mark values in the app code — the ways the watcher understands (F-010). */
const HELP_USAGES: { code: string; text: string }[] = [
  { code: "value?.$watch?.('name', value)", text: 'watch_help_method' },
  { code: "window.$watch?.('name', value)", text: 'watch_help_window' },
  { code: '<Profile data-watch="profile" />', text: 'watch_help_component' },
  { code: '<FormProvider {...methods} data-watch="form">', text: 'watch_help_form' },
  { code: '<div data-watch="step" data-watch-value={step} />', text: 'watch_help_value' },
];
const HELP_NOTES = ['watch_help_note_local', 'watch_help_note_reload', 'watch_help_note_update'];

/** Short end-to-end example shown at the bottom of the guide. */
const HELP_EXAMPLE = `function Profile() {
  const [user, setUser] = useState({ name: 'Həsən' });

  user?.$watch?.('user', user);   // ← one line

  return (
    <button onClick={() => setUser({ name: 'Əli' })}>
      Change
    </button>
  );
}

// State → "user" card: { name: "Həsən" }
// click → { name: "Əli" }  (instantly)`;

/** Collapsible usage guide under the toolbar — closed by default, opens downwards. */
function WatchHelp() {
  return (
    <details className="group border-b border-slate-200 text-xs">
      <summary className="flex cursor-pointer select-none list-none items-center gap-1 px-3 py-1.5 text-slate-500 hover:text-slate-800 [&::-webkit-details-marker]:hidden">
        <span className="inline-block w-3 text-[10px] transition-transform group-open:rotate-90">
          ▸
        </span>
        {t('watch_help_title')}
      </summary>
      <div className="space-y-2 px-3 pb-3">
        <ul className="space-y-1.5">
          {HELP_USAGES.map((u) => (
            <li key={u.code}>
              <code className="block rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] break-all">
                {u.code}
              </code>
              <span className="text-slate-500">{t(u.text)}</span>
            </li>
          ))}
        </ul>
        <ul className="list-disc space-y-0.5 pl-4 text-slate-500">
          {HELP_NOTES.map((k) => (
            <li key={k}>{t(k)}</li>
          ))}
        </ul>
        <div>
          <p className="mb-1 font-semibold text-slate-600">{t('watch_help_example')}</p>
          <pre className="overflow-x-auto rounded bg-slate-100 p-2 font-mono text-[11px] leading-4">
            {HELP_EXAMPLE}
          </pre>
        </div>
      </div>
    </details>
  );
}
