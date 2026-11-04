/**
 * F-004 — response body comparison (A = expected, B = checked).
 *
 * Produces two things from one walk over both JSON values:
 *  - `diffs`: the report list (path + kind), counted in the summary;
 *  - `rows`:  aligned side-by-side JSON lines (A left, B right). A key that exists on one
 *             side only leaves an empty line on the other side, so both columns stay aligned.
 */

export type CompareMode = 'keys' | 'values' | 'full';

/**
 * missing – key only in A (➖) · added – key only in B (➕) · changed – different value (✏️)
 * empty – value does not come in B: null, "", [] or {} (∅) · type – type changed (⚠️)
 */
export type DiffKind = 'missing' | 'added' | 'changed' | 'empty' | 'type';

export const DIFF_KINDS: DiffKind[] = ['missing', 'added', 'changed', 'empty', 'type'];

/** Which kinds each mode reports and highlights (Session #2, Q6). */
export const MODE_KINDS: Record<CompareMode, DiffKind[]> = {
  keys: ['missing', 'added'],
  values: ['changed', 'empty', 'type'],
  full: DIFF_KINDS,
};

export interface Diff {
  kind: DiffKind;
  /** Dot path, e.g. `data.items[0].price`; '' is the root. */
  path: string;
  a?: unknown;
  b?: unknown;
}

export interface Line {
  depth: number;
  text: string;
}

export interface Row {
  a: Line | null;
  b: Line | null;
  kind?: DiffKind;
}

export interface CompareOptions {
  mode: CompareMode;
  /** Key names (any depth) or full paths that are not compared. Case-insensitive. */
  ignore?: string[];
  /** Arrays of objects with a unique `id` are matched by id instead of by index. */
  matchById?: boolean;
}

export interface CompareResult {
  rows: Row[];
  diffs: Diff[];
  counts: Record<DiffKind, number>;
}

type JsonType = 'null' | 'array' | 'object' | 'string' | 'number' | 'boolean';

export function jsonType(v: unknown): JsonType {
  if (v === null) return 'null';
  if (Array.isArray(v)) return 'array';
  return typeof v as JsonType;
}

/** "Value does not come": null, "", [] or {} (Session #2, Q8 — variant A). */
export function isEmptyValue(v: unknown): boolean {
  if (v === null || v === '') return true;
  if (Array.isArray(v)) return v.length === 0;
  if (typeof v === 'object') return Object.keys(v as object).length === 0;
  return false;
}

const isContainer = (v: unknown) => typeof v === 'object' && v !== null;

/** Short one-line value for the report list. */
export function preview(v: unknown, max = 60): string {
  const s = JSON.stringify(v) ?? String(v);
  return s.length > max ? s.slice(0, max - 1) + '…' : s;
}

function childPath(base: string, key: string): string {
  return base ? `${base}.${key}` : key;
}

/** All JSON lines of one value on one side. */
function lines(label: string | null, v: unknown, depth: number, comma: boolean): Line[] {
  const prefix = label === null ? '' : `${JSON.stringify(label)}: `;
  const end = comma ? ',' : '';
  if (!isContainer(v) || isEmptyValue(v)) {
    return [{ depth, text: prefix + JSON.stringify(v) + end }];
  }
  if (Array.isArray(v)) {
    return [
      { depth, text: prefix + '[' },
      ...v.flatMap((item, i) => lines(null, item, depth + 1, i < v.length - 1)),
      { depth, text: ']' + end },
    ];
  }
  const keys = Object.keys(v as object);
  return [
    { depth, text: prefix + '{' },
    ...keys.flatMap((k, i) =>
      lines(k, (v as Record<string, unknown>)[k], depth + 1, i < keys.length - 1),
    ),
    { depth, text: '}' + end },
  ];
}

/** Matches array items: by unique `id` when asked and possible, otherwise by index. */
function pairItems(
  a: unknown[],
  b: unknown[],
  matchById: boolean,
): { ai?: number; bi?: number; seg: string }[] {
  const idOf = (x: unknown) =>
    isContainer(x) && !Array.isArray(x) ? (x as Record<string, unknown>).id : undefined;
  const usable = (arr: unknown[]) => {
    const ids = arr.map(idOf);
    return (
      ids.every((id) => typeof id === 'string' || typeof id === 'number') &&
      new Set(ids).size === ids.length
    );
  };

  if (matchById && a.length > 0 && b.length > 0 && usable(a) && usable(b)) {
    const bIndex = new Map(b.map((x, i) => [idOf(x), i]));
    const pairs: { ai?: number; bi?: number; seg: string }[] = a.map((x, ai) => ({
      ai,
      bi: bIndex.get(idOf(x)),
      seg: `[id=${String(idOf(x))}]`,
    }));
    const usedB = new Set(pairs.map((p) => p.bi));
    b.forEach((x, bi) => {
      if (!usedB.has(bi)) pairs.push({ bi, seg: `[id=${String(idOf(x))}]` });
    });
    return pairs;
  }

  return Array.from({ length: Math.max(a.length, b.length) }, (_, i) => ({
    ai: i < a.length ? i : undefined,
    bi: i < b.length ? i : undefined,
    seg: `[${i}]`,
  }));
}

export function compareJson(a: unknown, b: unknown, options: CompareOptions): CompareResult {
  const ignore = new Set((options.ignore ?? []).map((s) => s.trim().toLowerCase()).filter(Boolean));
  const matchById = options.matchById ?? false;
  const rows: Row[] = [];
  const diffs: Diff[] = [];

  const isIgnored = (key: string, path: string) =>
    ignore.has(key.toLowerCase()) || ignore.has(path.toLowerCase());

  const report = (quiet: boolean, d: Diff) => {
    if (!quiet) diffs.push(d);
  };

  /** Lines that exist on one side only (the other side stays empty). */
  const oneSide = (side: 'a' | 'b', ls: Line[], kind: DiffKind | undefined) => {
    for (const l of ls) rows.push(side === 'a' ? { a: l, b: null, kind } : { a: null, b: l, kind });
  };

  /** Two different blocks next to each other, padded to the same height. */
  const sideBySide = (as: Line[], bs: Line[], kind: DiffKind | undefined) => {
    for (let i = 0; i < Math.max(as.length, bs.length); i++) {
      rows.push({ a: as[i] ?? null, b: bs[i] ?? null, kind });
    }
  };

  const walk = (
    label: string | null,
    va: unknown,
    vb: unknown,
    path: string,
    depth: number,
    commaA: boolean,
    commaB: boolean,
    quiet: boolean,
  ) => {
    const ta = jsonType(va);
    const tb = jsonType(vb);
    const prefix = label === null ? '' : `${JSON.stringify(label)}: `;
    const kindIf = (k: DiffKind) => (quiet ? undefined : k);

    // ∅ — the value does not come in B.
    if (isEmptyValue(vb) && !isEmptyValue(va)) {
      report(quiet, { kind: 'empty', path, a: va, b: vb });
      return sideBySide(
        lines(label, va, depth, commaA),
        lines(label, vb, depth, commaB),
        kindIf('empty'),
      );
    }

    // ⚠️ — different types (number → string, object → array …).
    if (ta !== tb) {
      report(quiet, { kind: 'type', path, a: va, b: vb });
      return sideBySide(
        lines(label, va, depth, commaA),
        lines(label, vb, depth, commaB),
        kindIf('type'),
      );
    }

    // Primitives and empty containers of the same type.
    if (!isContainer(va) || (isEmptyValue(va) && isEmptyValue(vb))) {
      const same = JSON.stringify(va) === JSON.stringify(vb);
      if (!same) report(quiet, { kind: 'changed', path, a: va, b: vb });
      return rows.push({
        a: lines(label, va, depth, commaA)[0],
        b: lines(label, vb, depth, commaB)[0],
        kind: same ? undefined : kindIf('changed'),
      });
    }

    if (ta === 'array') {
      const arrA = va as unknown[];
      const arrB = vb as unknown[];
      rows.push({ a: { depth, text: prefix + '[' }, b: { depth, text: prefix + '[' } });
      for (const p of pairItems(arrA, arrB, matchById)) {
        const itemPath = path + p.seg;
        const cA = p.ai !== undefined && p.ai < arrA.length - 1;
        const cB = p.bi !== undefined && p.bi < arrB.length - 1;
        if (p.ai !== undefined && p.bi !== undefined) {
          walk(null, arrA[p.ai], arrB[p.bi], itemPath, depth + 1, cA, cB, quiet);
        } else if (p.ai !== undefined) {
          report(quiet, { kind: 'missing', path: itemPath, a: arrA[p.ai] });
          oneSide('a', lines(null, arrA[p.ai], depth + 1, cA), kindIf('missing'));
        } else if (p.bi !== undefined) {
          report(quiet, { kind: 'added', path: itemPath, b: arrB[p.bi] });
          oneSide('b', lines(null, arrB[p.bi], depth + 1, cB), kindIf('added'));
        }
      }
      return rows.push({
        a: { depth, text: ']' + (commaA ? ',' : '') },
        b: { depth, text: ']' + (commaB ? ',' : '') },
      });
    }

    // Objects: A's key order, then keys that exist only in B.
    const objA = va as Record<string, unknown>;
    const objB = vb as Record<string, unknown>;
    const keysA = Object.keys(objA);
    const keysB = Object.keys(objB);
    const inA = new Set(keysA);
    const inB = new Set(keysB);
    const lastA = keysA[keysA.length - 1];
    const lastB = keysB[keysB.length - 1];

    rows.push({ a: { depth, text: prefix + '{' }, b: { depth, text: prefix + '{' } });
    for (const key of [...keysA, ...keysB.filter((k) => !inA.has(k))]) {
      const p = childPath(path, key);
      const q = quiet || isIgnored(key, p);
      const cA = key !== lastA;
      const cB = key !== lastB;
      if (inA.has(key) && inB.has(key)) {
        walk(key, objA[key], objB[key], p, depth + 1, cA, cB, q);
      } else if (inA.has(key)) {
        report(q, { kind: 'missing', path: p, a: objA[key] });
        oneSide('a', lines(key, objA[key], depth + 1, cA), q ? undefined : 'missing');
      } else {
        report(q, { kind: 'added', path: p, b: objB[key] });
        oneSide('b', lines(key, objB[key], depth + 1, cB), q ? undefined : 'added');
      }
    }
    rows.push({
      a: { depth, text: '}' + (commaA ? ',' : '') },
      b: { depth, text: '}' + (commaB ? ',' : '') },
    });
  };

  walk(null, a, b, '', 0, false, false, false);

  // The mode decides what is reported and highlighted; the JSON itself is always shown in full.
  const kinds = new Set(MODE_KINDS[options.mode]);
  const shown = diffs.filter((d) => kinds.has(d.kind));
  const counts = Object.fromEntries(DIFF_KINDS.map((k) => [k, 0])) as Record<DiffKind, number>;
  for (const d of shown) counts[d.kind]++;

  return {
    rows: rows.map((r) => (r.kind && !kinds.has(r.kind) ? { a: r.a, b: r.b } : r)),
    diffs: shown,
    counts,
  };
}

/** `GET /api/v1/passports` — method + path without query (Session #2, Q7). */
export function apiSignature(method: string, url: string): string {
  try {
    return `${method} ${new URL(url).pathname}`;
  } catch {
    return `${method} ${url.split('?')[0]}`;
  }
}
