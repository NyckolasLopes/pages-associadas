import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { supabaseStorage } from "@/lib/supabaseStorage";

export interface FiltroOpcao {
  id: string;
  nome: string;
  cor?: string;
  imagem?: string;
}

export interface Filtro {
  id: string;
  nome: string;
  opcoes: FiltroOpcao[];
  buscavel: boolean;
  categoriasVinculadas?: string[];
}

interface FiltroStore {
  filtros: Filtro[];
  storeFiltros: Record<string, Filtro[]>;
  getStoreFiltros: (lojaId?: string | null) => Filtro[];
  addFiltro: (filtro: Filtro, lojaId?: string | null) => void;
  updateFiltro: (id: string, filtro: Partial<Filtro>, lojaId?: string | null) => void;
  removeFiltro: (id: string, lojaId?: string | null) => void;
}

export const useAdminFiltros = create<FiltroStore>()(
  persist(
    (set, get) => ({
      filtros: [
        {
          id: "gen",
          nome: "Genérico",
          buscavel: true,
          opcoes: [
            { id: "gen-sim", nome: "Sim" },
            { id: "gen-nao", nome: "Não" }
          ]
        },
        {
          id: "rec",
          nome: "Receita Médica",
          buscavel: true,
          opcoes: [
            { id: "rec-retem", nome: "Retém receita" },
            { id: "rec-naoretem", nome: "Não requer receita" }
          ]
        },
        {
          id: "tarja",
          nome: "Tarja",
          buscavel: true,
          opcoes: [
            { id: "tarja-sem", nome: "Sem Tarja" },
            { id: "tarja-verm", nome: "Vermelha", cor: "#ef4444" },
            { id: "tarja-preta", nome: "Preta", cor: "#000000" },
            { id: "tarja-amar", nome: "Amarela", cor: "#eab308" }
          ]
        },
        {
          id: "price",
          nome: "Faixa de Preço",
          buscavel: true,
          opcoes: [
            { id: "price-1", nome: "Até R$ 49,99" },
            { id: "price-2", nome: "R$ 50,00 a R$ 99,99" },
            { id: "price-3", nome: "R$ 100,00 a R$ 149,99" },
            { id: "price-4", nome: "Acima de R$ 150,00" }
          ]
        },
        {
          id: "brand",
          nome: "Marca",
          buscavel: true,
          opcoes: []
        }
      ],
      storeFiltros: {},
      getStoreFiltros: (lojaId) => {
        const state = get();
        if (!lojaId) return state.filtros || [];
        const storeSpecific = state.storeFiltros[lojaId];
        if (storeSpecific && storeSpecific.length > 0) {
          return storeSpecific;
        }
        return state.filtros || [];
      },
      addFiltro: (filtro, lojaId) => set((state) => {
        if (!lojaId) return { filtros: [...(state.filtros || []), filtro] };
        const current = state.storeFiltros[lojaId] || state.filtros || [];
        return { storeFiltros: { ...state.storeFiltros, [lojaId]: [...current, filtro] } };
      }),
      updateFiltro: (id, updated, lojaId) =>
        set((state) => {
          if (!lojaId) {
            return { filtros: (state.filtros || []).map((f) => (f.id === id ? { ...f, ...updated } : f)) };
          }
          const current = state.storeFiltros[lojaId] || state.filtros || [];
          return { storeFiltros: { ...state.storeFiltros, [lojaId]: current.map((f) => (f.id === id ? { ...f, ...updated } : f)) } };
        }),
      removeFiltro: (id, lojaId) =>
        set((state) => {
          if (!lojaId) {
            return { filtros: (state.filtros || []).filter((f) => f.id !== id) };
          }
          const current = state.storeFiltros[lojaId] || state.filtros || [];
          return { storeFiltros: { ...state.storeFiltros, [lojaId]: current.filter((f) => f.id !== id) } };
        }),
    }),
    {
      name: "admin-filtros-storage",
      storage: createJSONStorage(() => supabaseStorage),
      version: 1,
      migrate: (persistedState: any, version: number) => {
        if (version === 0) {
          // Add default filters if they are missing
          const defaultFiltros = [
            {
              id: "gen",
              nome: "Genérico",
              buscavel: true,
              opcoes: [
                { id: "gen-sim", nome: "Sim" },
                { id: "gen-nao", nome: "Não" }
              ]
            },
            {
              id: "rec",
              nome: "Receita Médica",
              buscavel: true,
              opcoes: [
                { id: "rec-retem", nome: "Retém receita" },
                { id: "rec-naoretem", nome: "Não requer receita" }
              ]
            },
            {
              id: "tarja",
              nome: "Tarja",
              buscavel: true,
              opcoes: [
                { id: "tarja-sem", nome: "Sem Tarja" },
                { id: "tarja-verm", nome: "Vermelha", cor: "#ef4444" },
                { id: "tarja-preta", nome: "Preta", cor: "#000000" },
                { id: "tarja-amar", nome: "Amarela", cor: "#eab308" }
              ]
            },
            {
              id: "price",
              nome: "Faixa de Preço",
              buscavel: true,
              opcoes: [
                { id: "price-1", nome: "Até R$ 49,99" },
                { id: "price-2", nome: "R$ 50,00 a R$ 99,99" },
                { id: "price-3", nome: "R$ 100,00 a R$ 149,99" },
                { id: "price-4", nome: "Acima de R$ 150,00" }
              ]
            },
            {
              id: "brand",
              nome: "Marca",
              buscavel: true,
              opcoes: []
            }
          ];
          
          return {
            ...persistedState,
            filtros: [
              ...defaultFiltros,
              ...(persistedState.filtros || []).filter((f: any) => 
                !["gen", "rec", "tarja", "price", "brand"].includes(f.id)
              )
            ]
          };
        }
        return persistedState;
      }
    }
  )
);
