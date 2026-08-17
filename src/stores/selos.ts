import { create } from "zustand";
import { persist, createJSONStorage, StateStorage } from "zustand/middleware";
import type { SeloSistema } from "@/types";

import { supabaseStorage } from "@/lib/supabaseStorage";

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
      storage: createJSONStorage(() => supabaseStorage),
    }
  )
);
