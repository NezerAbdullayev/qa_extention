/**
 * IndexedDB storage (F-001, F-003, NFR-02).
 *  - `requests`  — current recording; cleared on every Start (Session #2, Q12).
 *  - `savedApis` — requests saved with 💾; never cleared automatically (Session #3, Q3).
 * The MV3 service worker can be suspended; everything is written here immediately.
 */
import type { RequestRecord, SavedApi } from '../shared/types';

const DB_NAME = 'api-lens';
const DB_VERSION = 2;
type StoreName = 'requests' | 'savedApis';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('requests'))
        db.createObjectStore('requests', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('savedApis'))
        db.createObjectStore('savedApis', { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run<T>(
  store: StoreName,
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(store, mode);
        const req = fn(tx.objectStore(store));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

/** Current recording. */
export const db = {
  put: (record: RequestRecord) =>
    run('requests', 'readwrite', (s) => s.put(record)).then(() => undefined),
  get: (id: string) => run<RequestRecord | undefined>('requests', 'readonly', (s) => s.get(id)),
  getAll: () =>
    run<RequestRecord[]>('requests', 'readonly', (s) => s.getAll()).then((all) =>
      all.sort((a, b) => a.seq - b.seq),
    ),
  clear: () => run('requests', 'readwrite', (s) => s.clear()).then(() => undefined),
};

/** Saved APIs (F-003). Newest first. */
export const savedDb = {
  put: (item: SavedApi) => run('savedApis', 'readwrite', (s) => s.put(item)).then(() => undefined),
  get: (id: string) => run<SavedApi | undefined>('savedApis', 'readonly', (s) => s.get(id)),
  getAll: () =>
    run<SavedApi[]>('savedApis', 'readonly', (s) => s.getAll()).then((all) =>
      all.sort((a, b) => b.savedAt - a.savedAt),
    ),
  delete: (id: string) => run('savedApis', 'readwrite', (s) => s.delete(id)).then(() => undefined),
};
