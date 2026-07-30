import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import { Marca } from "@/types";

// IndexedDB storage adapter
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
        } catch {
          resolve();
        }
      };
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

interface MarcasState {
  marcas: Marca[];
  addMarca: (m: Marca) => void;
  updateMarca: (m: Marca) => void;
  removeMarca: (id: string) => void;
}

const initialMarcas: Marca[] = [
  { id: "301", nome: "Revitart", slug: "revitart", descricao: "Produtos da linha Revitart.", logo: "/marcas/revitart.png", ativo: true, destaque: true, seoUrl: "revitart", marcaPropria: true },
  { id: "302", nome: "Santo Hábito", slug: "santo-habito", descricao: "Produtos da linha Santo Hábito.", logo: "/marcas/santo-habito.png", ativo: true, destaque: true, seoUrl: "santo-habito", marcaPropria: true },
  { id: "303", nome: "Revigore", slug: "revigore", descricao: "Produtos da linha Revigore.", logo: "/marcas/revigore.png", ativo: true, destaque: true, seoUrl: "revigore", marcaPropria: true },
  { id: "304", nome: "Revimel", slug: "revimel", descricao: "Produtos da linha Revimel.", logo: "/marcas/revimel.png", ativo: true, destaque: true, seoUrl: "revimel", marcaPropria: true },
  { id: "305", nome: "Crescendo", slug: "crescendo", descricao: "Produtos da linha Crescendo.", logo: "/marcas/crescendo.png", ativo: true, destaque: true, seoUrl: "crescendo", marcaPropria: true },
  { id: "306", nome: "Vita Magna", slug: "vita-magna", descricao: "Produtos da linha Vita Magna.", logo: "/marcas/vita-magna.png", ativo: true, destaque: true, seoUrl: "vita-magna", marcaPropria: true },
  { id: "m1", nome: "CIMED", slug: "cimed", descricao: "Produtos Cimed.", logo: "/marcas/cimed.png", ativo: true, destaque: true, seoUrl: "cimed" },
  { id: "m2", nome: "NEO QUÍMICA", slug: "neo-quimica", descricao: "Produtos Neo Química.", logo: "/marcas/neo-quimica.png", ativo: true, destaque: true, seoUrl: "neo-quimica" },
  { id: "m3", nome: "PFIZER", slug: "pfizer", descricao: "Produtos Pfizer.", logo: "/marcas/pfizer.png", ativo: true, destaque: true, seoUrl: "pfizer" },
  { id: "m4", nome: "ROCHE", slug: "roche", descricao: "Produtos Roche.", logo: "/marcas/roche.png", ativo: true, destaque: true, seoUrl: "roche" },
  { id: "m5", nome: "L'ORÉAL", slug: "loreal", descricao: "Produtos L'Oréal.", logo: "/marcas/loreal.png", ativo: true, destaque: true, seoUrl: "loreal" },
  { id: "m6", nome: "NIVEA", slug: "nivea", descricao: "Produtos Nivea.", logo: "/marcas/nivea.png", ativo: true, destaque: true, seoUrl: "nivea" },
  { id: "m7", nome: "VICK", slug: "vick", descricao: "Produtos Vick.", logo: "/marcas/vick.png", ativo: true, destaque: true, seoUrl: "vick" },
  { id: "m8", nome: "REXONA", slug: "rexona", descricao: "Produtos Rexona.", logo: "/marcas/rexona.png", ativo: true, destaque: true, seoUrl: "rexona" },
  { id: "m9", nome: "JOHNSON'S", slug: "johnsons", descricao: "Produtos Johnson's.", logo: "/marcas/johnsons.png", ativo: true, destaque: true, seoUrl: "johnsons" }
];

export const useMarcasStore = create<MarcasState>()(
  persist(
    (set) => ({
      marcas: initialMarcas,
      addMarca: (m) => set((state) => ({ marcas: [...state.marcas, m] })),
      updateMarca: (m) => set((state) => ({ marcas: state.marcas.map(x => x.id === m.id ? m : x) })),
      removeMarca: (id) => set((state) => ({ marcas: state.marcas.filter(x => x.id !== id) })),
    }),
    {
      name: "fa-marcas-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
