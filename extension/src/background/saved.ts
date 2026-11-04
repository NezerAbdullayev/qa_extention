/**
 * Saved APIs (F-003) — rules from Session #3:
 *  - name is unique (case-insensitive); empty name → unique random 6-digit number
 *  - never deleted automatically
 *  - export masks sensitive data (Q4); import renames name clashes to "name (2)", skips known ids
 */
import { savedDb } from './db';
import { maskRecord } from '../shared/mask';
import type {
  RequestRecord,
  SavedApi,
  SavedApiExport,
  SaveResult,
  SavedApiSummary,
} from '../shared/types';
import { toSummary } from '../shared/types';

const norm = (name: string) => name.trim().toLowerCase();

async function takenNames(exceptId?: string): Promise<Set<string>> {
  const all = await savedDb.getAll();
  return new Set(all.filter((s) => s.id !== exceptId).map((s) => norm(s.name)));
}

/** Random integer 100000–999999 that is not used as a name yet. */
function randomName(taken: Set<string>): string {
  const buf = new Uint32Array(1);
  for (;;) {
    crypto.getRandomValues(buf);
    const name = String(100000 + (buf[0] % 900000));
    if (!taken.has(name)) return name;
  }
}

export async function saveApi(
  record: RequestRecord,
  rawName: string,
  source: SavedApi['source'],
): Promise<SaveResult> {
  const taken = await takenNames();
  let name = rawName.trim();
  if (name === '') name = randomName(taken);
  else if (taken.has(norm(name))) return { ok: false, error: 'duplicate' };

  const item: SavedApi = {
    id: crypto.randomUUID(),
    name,
    savedAt: Date.now(),
    source,
    request: structuredClone(record),
  };
  await savedDb.put(item);
  return { ok: true, saved: toSummary(item) };
}

export async function renameSaved(id: string, rawName: string): Promise<SaveResult> {
  const item = await savedDb.get(id);
  if (!item) return { ok: false, error: 'not_found' };
  const taken = await takenNames(id);
  let name = rawName.trim();
  if (name === '') name = randomName(taken);
  else if (taken.has(norm(name))) return { ok: false, error: 'duplicate' };
  item.name = name;
  await savedDb.put(item);
  return { ok: true, saved: toSummary(item) };
}

export async function listSaved(): Promise<SavedApiSummary[]> {
  return (await savedDb.getAll()).map(toSummary);
}

export const getSaved = (id: string) => savedDb.get(id);
export const deleteSaved = (id: string) => savedDb.delete(id);

/** Selected items (or all when `ids` is empty), with sensitive data masked. */
export async function exportSaved(ids: string[]): Promise<SavedApiExport> {
  const all = await savedDb.getAll();
  const chosen = ids.length > 0 ? all.filter((s) => ids.includes(s.id)) : all;
  return {
    format: 'api-lens/saved-apis',
    version: 1,
    exportedAt: new Date().toISOString(),
    items: chosen.map((s) => ({ ...s, request: maskRecord(s.request) })),
  };
}

function isSavedApi(x: unknown): x is SavedApi {
  const s = x as SavedApi;
  return (
    !!s &&
    typeof s.id === 'string' &&
    typeof s.name === 'string' &&
    typeof s.savedAt === 'number' &&
    !!s.request &&
    typeof s.request.url === 'string' &&
    typeof s.request.method === 'string'
  );
}

export async function importSaved(
  items: unknown[],
): Promise<{ imported: number; skipped: number; invalid: number }> {
  const all = await savedDb.getAll();
  const ids = new Set(all.map((s) => s.id));
  const taken = new Set(all.map((s) => norm(s.name)));
  let imported = 0;
  let skipped = 0;
  let invalid = 0;

  for (const raw of items) {
    if (!isSavedApi(raw)) {
      invalid++;
      continue;
    }
    if (ids.has(raw.id)) {
      skipped++;
      continue;
    }
    let name = raw.name.trim() || randomName(taken);
    for (let n = 2; taken.has(norm(name)); n++) name = `${raw.name.trim()} (${n})`;
    const item: SavedApi = {
      ...raw,
      name,
      request: {
        ...raw.request,
        requestHeaders: raw.request.requestHeaders ?? {},
        responseHeaders: raw.request.responseHeaders ?? {},
      },
    };
    await savedDb.put(item);
    ids.add(item.id);
    taken.add(norm(name));
    imported++;
  }
  return { imported, skipped, invalid };
}
