/**
 * Saved APIs (F-003) — rules from Session #3:
 *  - name is unique (case-insensitive); empty name → unique random 6-digit number
 *  - never deleted automatically
 */
import { savedDb } from './db';
import type { RequestRecord, SavedApi, SaveResult, SavedApiSummary } from '../shared/types';
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
