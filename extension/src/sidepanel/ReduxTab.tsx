import { useEffect, useState } from 'react';
import { t } from '../shared/i18n';
import type { PanelMessage, ReduxActionRecord, ReduxActionRow } from '../shared/types';
import { REDUX_SCOPES_KEY } from '../shared/types';
import { JsonTree } from './JsonTree';

/**
 * F-009 "Redux" tab: the state paths the user watches (scopes, R2) + the list of Redux
 * actions of the current recording. Click a row → payload and the scopes' state after it.
 */
export function ReduxTab(props: { recording: boolean; ready: boolean; actions: ReduxActionRow[] }) {
  const { recording, ready, actions } = props;
  const [open, setOpen] = useState<Set<number>>(new Set());
  const toggle = (id: number) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="flex h-full flex-col">
      <ScopeEditor />
      {recording && !ready && (
        <p className="border-b border-amber-200 bg-amber-50 px-3 py-1.5 text-xs text-amber-800">
          {t('redux_reload_hint')}
        </p>
      )}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {actions.length === 0 ? (
          <p className="px-3 py-6 text-center text-slate-400">
            {recording ? t('redux_empty_recording') : t('list_empty_idle')}
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {actions.map((a) => (
              <li key={a.id} className={open.has(a.id) ? 'bg-slate-50/60' : ''}>
                <button
                  onClick={() => toggle(a.id)}
                  aria-expanded={open.has(a.id)}
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-left hover:bg-slate-50"
                >
                  <span className="text-slate-400">{open.has(a.id) ? '▾' : '▸'}</span>
                  <span className="shrink-0 text-xs text-slate-500">
                    {new Date(a.time).toLocaleTimeString()}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-mono text-xs">{a.type}</span>
                </button>
                {open.has(a.id) && <ActionDetail id={a.id} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ActionDetail({ id }: { id: number }) {
  const [record, setRecord] = useState<ReduxActionRecord | null | undefined>(undefined);
  useEffect(() => {
    const msg: PanelMessage = { type: 'GET_REDUX_DETAIL', id };
    chrome.runtime.sendMessage(msg).then(setRecord);
  }, [id]);

  if (record === undefined) return null;
  if (record === null) return <p className="px-3 pb-2 text-xs text-slate-400">—</p>;
  const scopes = Object.keys(record.state);
  return (
    <div className="mx-3 mb-2 max-h-[300px] space-y-2 overflow-auto rounded border border-slate-200 bg-slate-50 p-3">
      <section>
        <h3 className="mb-1 text-xs font-semibold text-slate-600">payload</h3>
        {record.payload === undefined ? (
          <span className="text-xs text-slate-400">—</span>
        ) : (
          <JsonTree value={record.payload} />
        )}
      </section>
      {scopes.map((s) => (
        <section key={s}>
          <h3 className="mb-1 font-mono text-xs font-semibold text-slate-600">{s}</h3>
          <JsonTree value={record.state[s]} />
        </section>
      ))}
    </div>
  );
}

/** Scopes (R2): only the state paths added here are captured. Saved in chrome.storage.local. */
function ScopeEditor() {
  const [scopes, setScopes] = useState<string[]>([]);
  const [draft, setDraft] = useState('');

  useEffect(() => {
    chrome.storage.local.get(REDUX_SCOPES_KEY).then((v) => {
      const list = v[REDUX_SCOPES_KEY];
      if (Array.isArray(list)) setScopes(list);
    });
  }, []);

  const save = (next: string[]) => {
    setScopes(next);
    void chrome.storage.local.set({ [REDUX_SCOPES_KEY]: next });
  };
  const add = () => {
    const s = draft.trim();
    if (s && !scopes.includes(s)) save([...scopes, s]);
    setDraft('');
  };

  return (
    <div className="space-y-1.5 border-b border-slate-200 px-3 py-2 text-xs">
      <form
        className="flex gap-1.5"
        onSubmit={(e) => {
          e.preventDefault();
          add();
        }}
      >
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={t('redux_scope_placeholder')}
          className="min-w-0 flex-1 rounded border border-slate-300 bg-transparent px-2 py-1 font-mono"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
        >
          + {t('redux_scope_add')}
        </button>
      </form>
      {scopes.length === 0 ? (
        <p className="text-slate-400">{t('redux_scope_none')}</p>
      ) : (
        <div className="flex flex-wrap gap-1">
          {scopes.map((s) => (
            <span
              key={s}
              className="flex items-center gap-1 rounded bg-slate-100 px-1.5 py-0.5 font-mono"
            >
              {s}
              <button
                aria-label={t('redux_scope_remove')}
                title={t('redux_scope_remove')}
                onClick={() => save(scopes.filter((x) => x !== s))}
                className="text-slate-400 hover:text-slate-800"
              >
                ✕
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
