import { useEffect, useState, type ReactNode } from 'react';
import { buildPayload, decodeBase64Text } from '../shared/format';
import { t } from '../shared/i18n';
import { JsonTree } from './JsonTree';
import type { PanelMessage, RequestRecord, RequestRow } from '../shared/types';

/**
 * Expanded box (F-008, Session #2 Q5 / 5a / 5b / 5c / Q15):
 * URL → method → status → Payload → Response (no headers, D4),
 * JSON shown as a collapsible tree like DevTools Preview (D3); height follows content up to 300px (2026-11-04), then scrolls inside.
 */
export function RequestDetail({ row }: { row: RequestRow }) {
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

  return (
    <div className="mx-3 mb-2 max-h-[300px] overflow-auto rounded border border-slate-200 bg-slate-50 p-3 font-mono text-xs">
      {detail === null ? (
        <p className="text-slate-400">{t('detail_loading')}</p>
      ) : (
        <DetailContent d={detail} />
      )}
    </div>
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
          <span className={d.failed !== undefined || (d.status ?? 0) >= 400 ? 'text-red-600' : ''}>
            {status}
          </span>
        </p>
      </div>

      {/* No headers section (D4, 2026-11-04). All headers are still recorded —
          needed for HAR export (F-002). */}

      {payload && (
        <Section title={t('detail_payload')}>
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

      <Section title={t('detail_response')}>
        <ResponseBody d={d} />
      </Section>
    </div>
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-1 font-sans text-[11px] font-semibold uppercase tracking-wide text-slate-500">
        {title}
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
