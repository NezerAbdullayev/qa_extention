import { useEffect, useRef, useState, type FormEvent } from 'react';
import { t } from '../shared/i18n';
import type { SaveResult } from '../shared/types';

/**
 * Name popup (F-003) — used for "save" and "rename".
 * Only a name field (Session #3, Q7). Empty → random 6-digit number (decided in background).
 * Duplicate name → warning, dialog stays open (Q2).
 */
export function NameDialog(props: {
  title: string;
  /** e.g. "passports · GET · 200" */
  subtitle: string;
  initialName?: string;
  submitLabel: string;
  onSubmit: (name: string) => Promise<SaveResult>;
  onClose: () => void;
}) {
  const [name, setName] = useState(props.initialName ?? '');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    input.current?.focus();
    input.current?.select();
  }, []);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    const result = await props.onSubmit(name);
    setBusy(false);
    if (result.ok) props.onClose();
    else
      setError(result.error === 'duplicate' ? t('save_error_duplicate') : t('save_error_failed'));
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/30 p-4 pt-16"
      onMouseDown={(e) => e.target === e.currentTarget && props.onClose()}
      onKeyDown={(e) => e.key === 'Escape' && props.onClose()}
    >
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="name-dialog-title"
        className="w-full max-w-sm rounded-lg bg-white p-4 shadow-xl"
      >
        <h2 id="name-dialog-title" className="font-semibold">
          {props.title}
        </h2>
        <p className="mt-0.5 truncate font-mono text-xs text-slate-500">{props.subtitle}</p>

        <label
          className="mt-3 block text-xs font-medium text-slate-600"
          htmlFor="name-dialog-input"
        >
          {t('save_name_label')}
        </label>
        <input
          id="name-dialog-input"
          ref={input}
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError(null);
          }}
          maxLength={120}
          placeholder={t('save_name_placeholder')}
          className={`mt-1 w-full rounded border px-2 py-1.5 text-sm outline-none focus:ring-2 ${
            error ? 'border-red-400 focus:ring-red-200' : 'border-slate-300 focus:ring-blue-200'
          }`}
        />
        <p className={`mt-1 text-xs ${error ? 'text-red-600' : 'text-slate-400'}`}>
          {error ?? t('save_name_hint')}
        </p>

        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={props.onClose}
            className="rounded px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100"
          >
            {t('common_cancel')}
          </button>
          <button
            type="submit"
            disabled={busy}
            className="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {props.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
