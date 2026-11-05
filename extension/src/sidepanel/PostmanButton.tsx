import { t } from '../shared/i18n';
import type { PanelMessage } from '../shared/types';

/**
 * F-011 ✈ "Postman-a göndər" — in "Qeyd" and "Saxlanmışlar" rows, next to 💾 and styled the
 * same. Shown only while the Postman tab is enabled (R6, R7).
 */
export function PostmanButton(props: {
  from: 'record' | 'saved';
  id: string;
  onToast: (text: string) => void;
}) {
  const add = async () => {
    const msg: PanelMessage = { type: 'POSTMAN_ADD', from: props.from, id: props.id };
    const res = (await chrome.runtime.sendMessage(msg)) as { ok: boolean } | null;
    if (res?.ok) props.onToast(t('postman_added'));
  };
  return (
    <button
      title={t('postman_add')}
      aria-label={t('postman_add')}
      onClick={(e) => {
        e.stopPropagation(); // do not also open / select the row
        void add();
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-slate-300 text-slate-500 transition-colors hover:border-blue-600 hover:bg-blue-600 hover:text-white"
    >
      {/* Paper plane — "send" */}
      <svg
        viewBox="0 0 24 24"
        className="h-3.5 w-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M22 2L11 13" />
        <path d="M22 2l-7 20-4-9-9-4 20-7z" />
      </svg>
    </button>
  );
}
