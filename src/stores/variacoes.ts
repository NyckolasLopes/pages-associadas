import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idb";

export interface Variacao {
  id: string;
  nome: string;
  opcoes: string[];
}

interface VariacoesState {
  variacoes: Variacao[];
  addVariacao: (v: Variacao) => void;
  updateVariacao: (v: Variacao) => void;
  removeVariacao: (id: string) => void;
}

const initialVariacoes: Variacao[] = [
  { id: "v1", nome: "Dosagem", opcoes: [] },
  { id: "v2", nome: "Quantidade", opcoes: [] },
  { id: "v3", nome: "Sabor", opcoes: [] },
  { id: "v4", nome: "Tamanho", opcoes: [] },
  { id: "v5", nome: "Volume", opcoes: [] },
  { id: "v6", nome: "Cor", opcoes: [] }
];

export const useVariacoesStore = create<VariacoesState>()(
  persist(
    (set) => ({
      variacoes: initialVariacoes,
      addVariacao: (v) => set((state) => ({ variacoes: [...state.variacoes, v] })),
      updateVariacao: (v) => set((state) => ({ variacoes: state.variacoes.map(x => x.id === v.id ? v : x) })),
      removeVariacao: (id) => set((state) => ({ variacoes: state.variacoes.filter(x => x.id !== id) })),
    }),
    {
      name: "fa-variacoes-storage",
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
