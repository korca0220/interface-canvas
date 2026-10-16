// 마지막으로 연 파일 핸들을 IndexedDB에 보관해서, 새로고침 후에도 Cmd+S로 같은 파일에 저장할 수 있게 한다.
const DB_NAME = 'interface-canvas'
const STORE = 'handles'
const KEY = 'current'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

async function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveHandle(handle: FileSystemFileHandle | null): Promise<void> {
  try {
    if (handle) await tx('readwrite', (s) => s.put(handle, KEY))
    else await tx('readwrite', (s) => s.delete(KEY))
  } catch {
    // IndexedDB를 쓸 수 없으면 세션 동안만 기억한다
  }
}

export async function loadHandle(): Promise<FileSystemFileHandle | null> {
  try {
    const h = await tx<FileSystemFileHandle | undefined>('readonly', (s) => s.get(KEY))
    return h ?? null
  } catch {
    return null
  }
}
