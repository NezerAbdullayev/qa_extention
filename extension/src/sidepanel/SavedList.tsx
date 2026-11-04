import { useCallback, useEffect, useRef, useState, type ChangeEvent } from 'react';
import { t } from '../shared/i18n';
import { requestName } from '../shared/requestName';
import type { PanelMessage, SavedApiExport, SavedApiSummary, SaveResult } from '../shared/types';
import { CompareView } from './CompareView';
import { NameDialog } from './NameDialog';
import { SavedDetail } from './RequestDetail';
import { useSplitLayout } from './useSplitLayout';
import { isWindowMode } from './useWindowMode';

const send = <T,>(msg: PanelMessage) => chrome.runtime.sendMessage(msg) as Promise<T>;

const dateFmt = new Intl.DateTimeFormat('az', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function fileStamp(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}-${p(d.getMinutes())}`;
}

function download(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * "Saxlanmışlar" tab (F-003): saved APIs, newest first.
 * Click → details · ✏️ rename · 🗑 delete (confirm) · ☐ select → export · 2 selected → compare (F-004).
 */
export function SavedList({
  items,
  onToast,
}: {
  items: SavedApiSummary[];
  onToast: (text: string) => void;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [renaming, setRenaming] = useState<SavedApiSummary | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // F-004: two selected APIs (A = selected first, B = second) → comparison screen.
  const [comparing, setComparing] = useState<[string, string] | null>(null);
  const closeCompare = useCallback(() => setComparing(null), []);

  // Drop selection / open boxes of items that no longer exist.
  useEffect(() => {
    const ids = new Set(items.map((i) => i.id));
    setSelected((prev) => new Set([...prev].filter((id) => ids.has(id))));
    setExpanded((prev) => new Set([...prev].filter((id) => ids.has(id))));
    setActiveId((prev) => (prev && ids.has(prev) ? prev : null));
  }, [items]);

  const toggle = (set: Set<string>, id: string, single = false) => {
    if (single) return set.has(id) ? new Set<string>() : new Set([id]);
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    return next;
  };

  const allSelected = items.length > 0 && selected.size === items.length;

  const exportItems = async () => {
    const data = await send<SavedApiExport>({ type: 'EXPORT_SAVED', ids: [...selected] });
    download(`api-lens_saved_${fileStamp()}.json`, JSON.stringify(data, null, 2));
    onToast(t('saved_exported', String(data.items.length)));
  };

  const importFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-importing the same file
    if (!file) return;
    try {
      const data = JSON.parse(await file.text()) as Partial<SavedApiExport>;
      if (data.format !== 'api-lens/saved-apis' || !Array.isArray(data.items)) throw new Error();
      const r = await send<{ imported: number; skipped: number; invalid: number }>({
        type: 'IMPORT_SAVED',
        items: data.items,
      });
      onToast(t('saved_imported', [String(r.imported), String(r.skipped + r.invalid)]));
    } catch {
      onToast(t('saved_import_invalid'));
    }
  };

  // Wide separate window → DevTools-like split view, same as the "Qeyd" tab (D6).
  const { split, leftWidth, startResize } = useSplitLayout();
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeItem = split ? items.find((i) => i.id === activeId) : undefined;

  // ↑ / ↓ change the selected API, Esc closes the details (split view only).
  useEffect(() => {
    if (!split || !activeId) return;
    const onKey = (e: KeyboardEvent) => {
      if (renaming) return; // keys belong to the rename dialog
      if (e.key === 'Escape') return setActiveId(null);
      if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
      const i = items.findIndex((s) => s.id === activeId);
      const next = items[e.key === 'ArrowUp' ? i - 1 : i + 1];
      if (next) {
        e.preventDefault();
        setActiveId(next.id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [split, activeId, items, renaming]);

  const list = (
    <ul className="divide-y divide-slate-100">
      {items.map((s) => (
        <SavedRow
          key={s.id}
          s={s}
          mode={split ? 'select' : 'accordion'}
          open={split ? s.id === activeId : expanded.has(s.id)}
          checked={selected.has(s.id)}
          confirmingDelete={confirmDelete === s.id}
          onToggle={() =>
            split
              ? setActiveId(s.id === activeId ? null : s.id)
              : setExpanded((p) => toggle(p, s.id, isWindowMode))
          }
          onCheck={() => setSelected((p) => toggle(p, s.id))}
          onRename={() => setRenaming(s)}
          onAskDelete={() => setConfirmDelete(s.id)}
          onCancelDelete={() => setConfirmDelete(null)}
          onDelete={async () => {
            await send({ type: 'DELETE_SAVED', id: s.id });
            setConfirmDelete(null);
            onToast(t('saved_deleted', s.name));
          }}
        />
      ))}
    </ul>
  );

  if (comparing) return <CompareView ids={comparing} onBack={closeCompare} />;

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-slate-200 px-3 py-1.5 text-xs">
        <label className="flex items-center gap-1.5 text-slate-600">
          <input
            type="checkbox"
            checked={allSelected}
            disabled={items.length === 0}
            onChange={() => setSelected(allSelected ? new Set() : new Set(items.map((i) => i.id)))}
          />
          {t('saved_select_all')}
        </label>
        <div className="ml-auto flex gap-1">
          <button
            onClick={() => setComparing([...selected] as [string, string])}
            disabled={selected.size !== 2}
            title={t('saved_compare_hint')}
            className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            ⇄ {t('saved_compare')}
          </button>
          <button
            onClick={exportItems}
            disabled={items.length === 0}
            title={selected.size > 0 ? t('saved_export_selected') : t('saved_export_all')}
            className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100 disabled:opacity-40"
          >
            ⬇ {t('saved_export')}
            {selected.size > 0 && ` (${selected.size})`}
          </button>
          <button
            onClick={() => fileInput.current?.click()}
            className="rounded px-2 py-1 text-slate-700 hover:bg-slate-100"
          >
            ⬆ {t('saved_import')}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={importFile}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="px-3 py-6 text-center text-slate-400">{t('saved_empty')}</p>
        </div>
      ) : split ? (
        /* Wide separate window (D6): list left, details right — same as the "Qeyd" tab. */
        <div className="flex min-h-0 flex-1">
          <div
            className="min-w-0 overflow-y-auto"
            style={activeItem ? { width: leftWidth, flexShrink: 0 } : { flex: 1 }}
          >
            {list}
          </div>
          {activeItem && (
            <>
              <div
                role="separator"
                aria-orientation="vertical"
                onPointerDown={startResize}
                className="w-1 shrink-0 cursor-col-resize bg-slate-200 hover:bg-blue-400"
              />
              <section className="flex min-w-0 flex-1 flex-col">
                <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-3 py-1.5">
                  <span className="min-w-0 flex-1 truncate text-xs">
                    <span className="font-semibold">{activeItem.name}</span>
                    <span className="ml-2 font-mono text-slate-500">
                      {activeItem.method} {requestName(activeItem.url)}
                    </span>
                  </span>
                  <button
                    title={t('detail_close')}
                    aria-label={t('detail_close')}
                    onClick={() => setActiveId(null)}
                    className="flex h-6 w-6 items-center justify-center rounded text-slate-500 hover:bg-slate-200 hover:text-slate-800"
                  >
                    ✕
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <SavedDetail key={activeItem.id} id={activeItem.id} variant="pane" />
                </div>
              </section>
            </>
          )}
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">{list}</div>
      )}

      {renaming && (
        <NameDialog
          title={t('saved_rename_title')}
          subtitle={`${renaming.method} ${requestName(renaming.url)}`}
          initialName={renaming.name}
          submitLabel={t('saved_rename')}
          onSubmit={async (name) => {
            const r = await send<SaveResult>({ type: 'RENAME_SAVED', id: renaming.id, name });
            if (r.ok) onToast(t('saved_renamed', r.saved.name));
            return r;
          }}
          onClose={() => setRenaming(null)}
        />
      )}
    </div>
  );
}

/** One saved API row. 'accordion' → details open below; 'select' → details in the right pane. */
function SavedRow(props: {
  s: SavedApiSummary;
  mode: 'accordion' | 'select';
  open: boolean;
  checked: boolean;
  confirmingDelete: boolean;
  onToggle: () => void;
  onCheck: () => void;
  onRename: () => void;
  onAskDelete: () => void;
  onCancelDelete: () => void;
  onDelete: () => void;
}) {
  const { s, mode, open } = props;
  const selected = mode === 'select' && open;
  const isError = s.failed !== undefined || (s.status ?? 0) >= 400;

  // Separate window: keep the opened / selected row visible.
  const ref = useRef<HTMLLIElement>(null);
  useEffect(() => {
    if (!open || !isWindowMode) return;
    const id = requestAnimationFrame(() => ref.current?.scrollIntoView({ block: 'nearest' }));
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <li ref={ref} className={selected ? 'bg-blue-100' : open ? 'bg-slate-50/60' : ''}>
      <div
        onClick={props.onToggle}
        className={`flex cursor-pointer items-center gap-2 px-3 py-1.5 ${selected ? '' : 'hover:bg-slate-50'}`}
      >
        <input
          type="checkbox"
          aria-label={t('saved_select')}
          checked={props.checked}
          onChange={props.onCheck}
          onClick={(e) => e.stopPropagation()}
        />
        <button
          aria-expanded={open}
          title={s.url}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          {mode === 'accordion' && <span className="text-slate-400">{open ? '▾' : '▸'}</span>}
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{s.name}</span>
            <span className="block truncate font-mono text-[11px] text-slate-500">
              {s.method} {requestName(s.url)}
            </span>
          </span>
        </button>
        <span
          className={`w-12 shrink-0 text-xs ${isError ? 'font-semibold text-red-600 dark:text-red-400' : 'text-slate-700'}`}
        >
          {s.failed !== undefined ? t('list_failed') : (s.status ?? '')}
        </span>
        <span className="w-20 shrink-0 text-right text-[11px] text-slate-400">
          {dateFmt.format(s.savedAt)}
        </span>
        {props.confirmingDelete ? (
          <span className="flex shrink-0 items-center gap-1 text-xs">
            <span className="text-red-600 dark:text-red-400">{t('saved_delete_confirm')}</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onDelete();
              }}
              className="rounded bg-red-600 px-1.5 py-0.5 text-white hover:bg-red-500"
            >
              {t('common_yes')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                props.onCancelDelete();
              }}
              className="rounded px-1.5 py-0.5 text-slate-600 hover:bg-slate-200"
            >
              {t('common_no')}
            </button>
          </span>
        ) : (
          <>
            <button
              title={t('saved_rename')}
              aria-label={t('saved_rename')}
              onClick={(e) => {
                e.stopPropagation();
                props.onRename();
              }}
              className="shrink-0 rounded px-1 hover:bg-slate-200"
            >
              ✏️
            </button>
            <button
              title={t('saved_delete')}
              aria-label={t('saved_delete')}
              onClick={(e) => {
                e.stopPropagation();
                props.onAskDelete();
              }}
              className="shrink-0 rounded px-1 hover:bg-slate-200"
            >
              🗑
            </button>
          </>
        )}
      </div>
      {mode === 'accordion' && open && <SavedDetail id={s.id} />}
    </li>
  );
}
