import { useState, type ReactNode } from 'react';

/**
 * Collapsible JSON viewer — same rules as DevTools → Network → Preview (2026-11-04, D3):
 *  - only the root is expanded; nested objects / arrays start collapsed
 *  - a collapsed object shows a one-line preview:  {id: "AZE", nameAz: "Azərbaycan", …}
 *  - a collapsed array shows its length + preview:  (250) [{…}, {…}, {…}, …]
 *  - arrays with more than 100 items are grouped into ranges:  [0 … 99], [100 … 199], …
 *  - colours: key = purple, string = red, number / boolean = blue, null = grey (dark: index.css)
 */

type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

const RANGE_SIZE = 100;
const PREVIEW_MAX_CHARS = 100;
const PREVIEW_STRING_MAX = 40;

export function JsonTree({ value }: { value: unknown }) {
  return (
    <div className="font-mono text-xs leading-5">
      <Node value={value as Json} defaultOpen />
    </div>
  );
}

function isContainer(v: Json): v is Json[] | { [key: string]: Json } {
  return v !== null && typeof v === 'object';
}

// ------------------------------------------------------------------ preview text

function previewInner(v: Json): string {
  if (Array.isArray(v)) return `Array(${v.length})`;
  if (isContainer(v)) return '{…}';
  if (typeof v === 'string') {
    const s = v.length > PREVIEW_STRING_MAX ? `${v.slice(0, PREVIEW_STRING_MAX)}…` : v;
    return `"${s}"`;
  }
  return String(v);
}

function joinPreview(parts: string[], total: number): string {
  let out = '';
  let shown = 0;
  for (const p of parts) {
    const next = out ? `${out}, ${p}` : p;
    if (next.length > PREVIEW_MAX_CHARS) break;
    out = next;
    shown++;
  }
  return shown < total ? (out ? `${out}, …` : '…') : out;
}

function preview(v: Json[] | { [key: string]: Json }): string {
  if (Array.isArray(v)) {
    const parts = v.slice(0, 20).map(previewInner);
    return `(${v.length}) [${joinPreview(parts, v.length)}]`;
  }
  const keys = Object.keys(v);
  const parts = keys.slice(0, 20).map((k) => `${k}: ${previewInner(v[k])}`);
  return `{${joinPreview(parts, keys.length)}}`;
}

// ------------------------------------------------------------------ nodes

function Node(props: { name?: string; value: Json; defaultOpen?: boolean }) {
  const { name, value } = props;
  const [open, setOpen] = useState(Boolean(props.defaultOpen));

  if (!isContainer(value)) {
    return (
      <div className="pl-3.5">
        {name !== undefined && <Key name={name} />}
        <Primitive value={value} />
      </div>
    );
  }

  const entries: [string, Json][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value);
  const empty = entries.length === 0;

  return (
    <div>
      <Toggle open={open} disabled={empty} onClick={() => setOpen(!open)}>
        {name !== undefined && <Key name={name} />}
        <span className="text-slate-600">{preview(value)}</span>
      </Toggle>
      {open && !empty && (
        <div className="pl-4">
          {Array.isArray(value) && value.length > RANGE_SIZE ? (
            <Ranges items={value} />
          ) : (
            entries.map(([k, v]) => <Node key={k} name={k} value={v} />)
          )}
        </div>
      )}
    </div>
  );
}

/** Large arrays: [0 … 99], [100 … 199], … — each range expands to its items. */
function Ranges({ items }: { items: Json[] }) {
  const ranges: [number, number][] = [];
  for (let start = 0; start < items.length; start += RANGE_SIZE) {
    ranges.push([start, Math.min(start + RANGE_SIZE, items.length) - 1]);
  }
  return (
    <>
      {ranges.map(([from, to]) => (
        <Range key={from} items={items} from={from} to={to} />
      ))}
    </>
  );
}

function Range({ items, from, to }: { items: Json[]; from: number; to: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Toggle open={open} onClick={() => setOpen(!open)}>
        <span className="text-slate-600">
          [{from} … {to}]
        </span>
      </Toggle>
      {open && (
        <div className="pl-4">
          {items.slice(from, to + 1).map((v, i) => (
            <Node key={from + i} name={String(from + i)} value={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function Toggle(props: {
  open: boolean;
  disabled?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      aria-expanded={props.open}
      onClick={props.disabled ? undefined : props.onClick}
      onKeyDown={(e) => {
        if (!props.disabled && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          props.onClick();
        }
      }}
      className={`flex cursor-pointer select-text items-start rounded hover:bg-slate-200/60 ${props.disabled ? 'cursor-default' : ''}`}
    >
      <span className="inline-block w-3.5 shrink-0 select-none text-[10px] leading-5 text-slate-400">
        {props.disabled ? '' : props.open ? '▾' : '▸'}
      </span>
      <span className="min-w-0 break-all">{props.children}</span>
    </div>
  );
}

function Key({ name }: { name: string }) {
  return (
    <>
      <span className="text-[var(--json-key)]">{name}</span>
      <span className="text-slate-500">: </span>
    </>
  );
}

function Primitive({ value }: { value: null | boolean | number | string }) {
  if (value === null) return <span className="text-slate-500">null</span>;
  if (typeof value === 'string')
    return <span className="break-all text-[var(--json-string)]">"{value}"</span>;
  return <span className="text-[var(--json-number)]">{String(value)}</span>;
}
