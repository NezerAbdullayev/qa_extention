import { useEffect, useState, type ReactNode } from 'react';
import { buildPayload, decodeBase64Text } from '../shared/format';
import { t } from '../shared/i18n';
import { JsonTree } from './JsonTree';
import { ResizableBox } from './ResizableBox';
import type { PanelMessage, RequestRecord, RequestRow, SavedApi } from '../shared/types';

/**
 * Request details (F-008, Session #2 Q5 / 5a / 5c):
 * URL → method → status → Payload → Response (no headers, D4),
 * JSON shown as a collapsible tree like DevTools Preview (D3).
 *
 * variant:
 *  - 'inline' → box under the row, height follows content up to 300px (D1), scrolls inside
 *  - 'pane'   → full-height right-hand pane of the wide split layout (D6), like DevTools
 */
type Variant = 'inline' | 'pane';

/** Details of a request in the current recording ("Qeyd" tab). */
export function RequestDetail({ row, variant = 'inline' }: { row: RequestRow; variant?: Variant }) {
  const [detail, setDetail] = useState<RequestRecord | null>(null);

  // Refetch whenever the row changes (status, headers, body arriving later).
  useEffect(() => {
    let cancelled = false;
    const msg: PanelMessage = { type: 'GET_DETAIL', id: row.id };
    chrome.runtime.sendMessage(msg).then((d: RequestRecord | null) => {
      if (!cancelled) setDetail(d);
    });
    return () => {
      cancelled = true;
    };
  }, [row.id, row.rev]);

  return <DetailBox detail={detail} variant={variant} />;
}

/** Details of a saved API ("Saxlanmışlar" tab, F-003). */
export function SavedDetail({ id, variant = 'inline' }: { id: string; variant?: Variant }) {
  const [detail, setDetail] = useState<RequestRecord | null>(null);

  useEffect(() => {
    let cancelled = false;
    const msg: PanelMessage = { type: 'GET_SAVED', id };
    chrome.runtime.sendMessage(msg).then((s: SavedApi | null) => {
      if (!cancelled) setDetail(s?.request ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  return <DetailBox detail={detail} variant={variant} />;
}

function DetailBox({ detail, variant }: { detail: RequestRecord | null; variant: Variant }) {
  const content =
    detail === null ? (
      <p className="text-slate-400">{t('detail_loading')}</p>
    ) : (
      <DetailContent d={detail} />
    );
  // Split pane (wide window) fills its column; the inline box is 300px and resizable by hand.
  return variant === 'pane' ? (
    <div className="h-full overflow-auto p-4 font-mono text-xs">{content}</div>
  ) : (
    <ResizableBox
      outerClassName="mx-3 mb-2"
      className="rounded border border-slate-200 bg-slate-50 p-3 font-mono text-xs"
    >
      {content}
    </ResizableBox>
  );
}

function DetailContent({ d }: { d: RequestRecord }) {
  const payload = buildPayload(d.url, d.postData, d.requestHeaders);
  const status =
    d.failed !== undefined
      ? `${t('list_failed')} ${d.failed}`
      : d.status !== undefined
        ? String(d.status)
        : t('list_pending');

  return (
    <div className="space-y-3">
      <div className="space-y-0.5">
        <p className="break-all text-slate-900">{d.url}</p>
        <p>
          <span className="text-slate-500">method:</span> {d.method}
        </p>
        <p>
          <span className="text-slate-500">status:</span>{' '}
          <span
            className={
              d.failed !== undefined || (d.status ?? 0) >= 400
                ? 'text-red-600 dark:text-red-400'
                : ''
            }
          >
            {status}
          </span>
        </p>
      </div>

      {/* No headers section (D4, 2026-11-04). All headers are still recorded —
          needed for HAR export (F-002). */}

      {payload && (
        <Section title={t('detail_payload')} copyText={payloadText(payload)}>
          {payload.query && (
            <>
              {payload.body && <SubTitle>{t('detail_payload_query')}</SubTitle>}
              <JsonTree value={payload.query} />
            </>
          )}
          {payload.body && (
            <>
              {payload.query && <SubTitle>{t('detail_payload_body')}</SubTitle>}
              <JsonOrText text={payload.body.text} />
            </>
          )}
        </Section>
      )}

      <Section title={t('detail_response')} copyText={responseText(d) ?? undefined}>
        <ResponseBody d={d} />
      </Section>
    </div>
  );
}

/** Response body as text (base64 text decoded); null when there is nothing to show / copy. */
function responseText(d: RequestRecord): string | null {
  if (d.failed !== undefined || d.responseError !== undefined || d.responseBody === undefined)
    return null;
  const text = d.responseBase64 ? decodeBase64Text(d.responseBody, d.mimeType) : d.responseBody;
  return text ? text : null;
}

/** What 📋 copies for Payload: the body, or the query parameters when there is no body. */
function payloadText(p: NonNullable<ReturnType<typeof buildPayload>>): string {
  return p.body ? p.body.text : JSON.stringify(p.query, null, 2);
}

/** JSON is copied pretty-printed (2 spaces) — readable when pasted; other text as-is. */
function pretty(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback when the Clipboard API is not allowed (e.g. panel not focused).
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand('copy');
    area.remove();
    return ok;
  }
}

/** Copy icon button; shows ✓ for a moment after copying. */
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const id = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(id);
  }, [copied]);

  const label = copied ? t('detail_copied') : t('detail_copy');
  return (
    <button
      title={label}
      aria-label={label}
      onClick={async (e) => {
        e.stopPropagation();
        if (await copyToClipboard(pretty(text))) setCopied(true);
      }}
      className={`flex h-5 items-center gap-1 rounded px-1 font-sans text-[11px] normal-case tracking-normal ${copied ? 'text-green-600 dark:text-green-400' : 'text-slate-400 hover:bg-slate-200 hover:text-slate-700'}`}
    >
      {copied ? (
        <>✓ {t('detail_copied')}</>
      ) : (
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
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

function ResponseBody({ d }: { d: RequestRecord }) {
  if (d.failed !== undefined) return <Muted>{t('detail_body_failed')}</Muted>;
  if (d.responseError !== undefined)
    return <Muted>{t('detail_body_unavailable', d.responseError)}</Muted>;
  if (d.responseBody === undefined) return <Muted>{t('list_pending')}</Muted>;

  let text = d.responseBody;
  if (d.responseBase64) {
    const decoded = decodeBase64Text(d.responseBody, d.mimeType);
    if (decoded === null) return <Muted>{t('detail_body_binary', d.mimeType ?? '?')}</Muted>;
    text = decoded;
  }
  if (text === '') return <Muted>{t('detail_empty')}</Muted>;

  return (
    <>
      {d.responseTruncated && <p className="mb-1 text-amber-700">{t('detail_body_truncated')}</p>}
      <JsonOrText text={text} />
    </>
  );
}

function Section({
  title,
  copyText,
  children,
}: {
  title: string;
  /** When set, a copy button is shown next to the title. */
  copyText?: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-1 flex items-center gap-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
        {copyText !== undefined && <CopyButton text={copyText} />}
      </h3>
      {children}
    </section>
  );
}

function SubTitle({ children }: { children: ReactNode }) {
  return <p className="mb-0.5 mt-1 font-sans text-[11px] text-slate-400">{children}</p>;
}

function Code({ text }: { text: string }) {
  return <pre className="whitespace-pre-wrap break-all text-slate-800">{text}</pre>;
}

function Muted({ children }: { children: ReactNode }) {
  return <p className="text-slate-400">{children}</p>;
}

/** JSON → collapsible tree (DevTools Preview style); anything else → plain text. */
function JsonOrText({ text }: { text: string }) {
  try {
    return <JsonTree value={JSON.parse(text)} />;
  } catch {
    return <Code text={text} />;
  }
}
