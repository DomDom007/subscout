// Tiny IndexedDB key-value store for things too big for localStorage, such as photos.
const DB = "hundredfold", STORE = "blobs";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function run<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = fn(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}
export const idbGet = <T = string>(key: string) => run<T | undefined>("readonly", s => s.get(key));
export const idbSet = (key: string, value: unknown) => run("readwrite", s => s.put(value, key));
export const idbDel = (key: string) => run("readwrite", s => s.delete(key));

/** Shrink an uploaded image to a JPEG data URL no wider than `max` pixels. */
export function shrinkImage(file: File, max = 640, quality = 0.72): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      resolve(c.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => reject(new Error("That file is not an image this browser can read."));
    img.src = URL.createObjectURL(file);
  });
}
