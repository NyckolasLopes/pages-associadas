import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type { Categoria } from "@/types";
import categoriesJson from "@/data/categories.json";

// IndexedDB storage adapter to avoid localStorage limits
const idbStorage: StateStorage = {
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

interface CategoriesState {
  categories: Categoria[];
  addOrUpdateCategory: (c: Categoria) => void;
  removeCategory: (id: string) => void;
}

export const useAdminCategories = create<CategoriesState>()(
  persist(
    (set) => ({
      categories: categoriesJson as Categoria[],
      addOrUpdateCategory: (c) => set((s) => {
        const exists = s.categories.find(x => x.id === c.id);
        if (exists) {
          return { categories: s.categories.map(x => x.id === c.id ? c : x) };
        }
        return { categories: [...s.categories, c] };
      }),
      removeCategory: (id) => set((s) => {
        // Also remove children when parent is removed
        const childrenIds = s.categories.filter(x => x.parentId === id).map(x => x.id);
        return { 
          categories: s.categories.filter(x => x.id !== id && !childrenIds.includes(x.id)) 
        };
      })
    }),
    {
      name: "fa-admin-categories",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    }
  )
);
