/**
 * IndexedDB storage for the current recording (F-001, NFR-02).
 * The MV3 service worker can be suspended; everything captured is written here
 * immediately so the list and bodies survive a restart.
 */
import type { RequestRecord } from '../shared/types';

const DB_NAME = 'api-lens';
const DB_VERSION = 1;
const STORE = 'requests';

let dbPromise: Promise<IDBDatabase> | null = null;

function open(): Promise<IDBDatabase> {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'id' });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function run<T>(
  mode: IDBTransactionMode,
  fn: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(STORE, mode);
        const req = fn(tx.objectStore(STORE));
        tx.oncomplete = () => resolve(req.result);
        tx.onerror = () => reject(tx.error);
        tx.onabort = () => reject(tx.error);
      }),
  );
}

export const db = {
  put: (record: RequestRecord) => run('readwrite', (s) => s.put(record)).then(() => undefined),
  get: (id: string) => run<RequestRecord | undefined>('readonly', (s) => s.get(id)),
  getAll: () =>
    run<RequestRecord[]>('readonly', (s) => s.getAll()).then((all) =>
      all.sort((a, b) => a.seq - b.seq),
    ),
  clear: () => run('readwrite', (s) => s.clear()).then(() => undefined),
};
