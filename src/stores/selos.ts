import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type { SeloSistema } from "@/types";

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

interface SelosState {
  selos: SeloSistema[];
  addSelo: (selo: Omit<SeloSistema, "id"> & { id?: string }) => void;
  updateSelo: (id: string, data: Partial<SeloSistema>) => void;
  removeSelo: (id: string) => void;
}

const defaultSelos: SeloSistema[] = [
  { id: "gen", nome: "Genérico", ativo: true, corFundo: "#fadb14", corTexto: "#000000" },
  { id: "servico", nome: "Serviço", ativo: true, corFundo: "#3b82f6", corTexto: "#ffffff" },
];

export const useSelos = create<SelosState>()(
  persist(
    (set) => ({
      selos: defaultSelos,
      addSelo: (selo) => set((state) => ({
        selos: [...state.selos, { ...selo, id: selo.id || Math.random().toString(36).substring(2, 9) }],
      })),
      updateSelo: (id, data) => set((state) => ({
        selos: state.selos.map((s) => (s.id === id ? { ...s, ...data } : s)),
      })),
      removeSelo: (id) => set((state) => ({
        selos: state.selos.filter((s) => s.id !== id),
      })),
    }),
    {
      name: "fa-admin-selos",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
