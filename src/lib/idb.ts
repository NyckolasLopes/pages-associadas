import { StateStorage } from "zustand/middleware";

export const idbStorage: StateStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined" || !window.indexedDB) return null;
    return new Promise((resolve) => {
      const request = indexedDB.open("fa-admin-db", 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore("keyval");
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        try {
          const tx = db.transaction("keyval", "readonly");
          const store = tx.objectStore("keyval");
          const req = store.get(name);
          req.onsuccess = () => resolve((req.result as string) || null);
          req.onerror = () => resolve(null);
        } catch {
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    return new Promise((resolve) => {
      const request = indexedDB.open("fa-admin-db", 1);
      request.onupgradeneeded = (e: any) => {
        e.target.result.createObjectStore("keyval");
      };
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        try {
          const tx = db.transaction("keyval", "readwrite");
          const store = tx.objectStore("keyval");
          store.put(value, name);
          tx.oncomplete = () => resolve();
          tx.onerror = () => resolve();
        } catch {
          resolve();
        }
      };
      request.onerror = () => resolve();
    });
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined" || !window.indexedDB) return;
    return new Promise((resolve) => {
      const request = indexedDB.open("fa-admin-db", 1);
      request.onsuccess = (e: any) => {
        const db = e.target.result;
        try {
          const tx = db.transaction("keyval", "readwrite");
          const store = tx.objectStore("keyval");
          store.delete(name);
          tx.oncomplete = () => resolve();
        } catch {
          resolve();
        }
      };
    });
  },
};
