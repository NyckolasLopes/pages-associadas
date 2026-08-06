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
  storeCategories: Record<string, Categoria[]>;
  isStoreUsingCustomCategories: Record<string, boolean>;
  addOrUpdateCategory: (c: Categoria) => void;
  removeCategory: (id: string) => void;
  importNetworkCategoriesToStore: (lojaId: string) => void;
  addOrUpdateStoreCategory: (lojaId: string, c: Categoria) => void;
  removeStoreCategory: (lojaId: string, id: string) => void;
  resetStoreToNetwork: (lojaId: string) => void;
  getStoreCategories: (lojaId?: string | null) => Categoria[];
}

export const useAdminCategories = create<CategoriesState>()(
  persist(
    (set, get) => ({
      categories: categoriesJson as Categoria[],
      storeCategories: {},
      isStoreUsingCustomCategories: {},
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
      }),
      importNetworkCategoriesToStore: (lojaId: string) => set((s) => {
        const networkCats = JSON.parse(JSON.stringify(s.categories));
        return {
          storeCategories: {
            ...s.storeCategories,
            [lojaId]: networkCats
          },
          isStoreUsingCustomCategories: {
            ...s.isStoreUsingCustomCategories,
            [lojaId]: true
          }
        };
      }),
      addOrUpdateStoreCategory: (lojaId: string, c: Categoria) => set((s) => {
        const current = s.storeCategories[lojaId] || JSON.parse(JSON.stringify(s.categories));
        const exists = current.find((x: Categoria) => x.id === c.id);
        let updated: Categoria[];
        if (exists) {
          updated = current.map((x: Categoria) => x.id === c.id ? c : x);
        } else {
          updated = [...current, c];
        }
        return {
          storeCategories: {
            ...s.storeCategories,
            [lojaId]: updated
          },
          isStoreUsingCustomCategories: {
            ...s.isStoreUsingCustomCategories,
            [lojaId]: true
          }
        };
      }),
      removeStoreCategory: (lojaId: string, id: string) => set((s) => {
        const current = s.storeCategories[lojaId] || JSON.parse(JSON.stringify(s.categories));
        const childrenIds = current.filter((x: Categoria) => x.parentId === id).map((x: Categoria) => x.id);
        const updated = current.filter((x: Categoria) => x.id !== id && !childrenIds.includes(x.id));
        return {
          storeCategories: {
            ...s.storeCategories,
            [lojaId]: updated
          },
          isStoreUsingCustomCategories: {
            ...s.isStoreUsingCustomCategories,
            [lojaId]: true
          }
        };
      }),
      resetStoreToNetwork: (lojaId: string) => set((s) => {
        const newStoreCategories = { ...s.storeCategories };
        delete newStoreCategories[lojaId];
        const newIsCustom = { ...s.isStoreUsingCustomCategories };
        delete newIsCustom[lojaId];
        return {
          storeCategories: newStoreCategories,
          isStoreUsingCustomCategories: newIsCustom
        };
      }),
      getStoreCategories: (lojaId?: string | null) => {
        const state = get();
        if (lojaId && state.storeCategories && state.storeCategories[lojaId]) {
          return state.storeCategories[lojaId];
        }
        return state.categories || [];
      }
    }),
    {
      name: "fa-admin-categories",
      storage: createJSONStorage(() => idbStorage),
      skipHydration: true,
    }
  )
);
