import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { get, set, del } from "idb-keyval";
import type { Avaliacao } from "@/types";

const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    if (typeof window === "undefined") return null;
    return (await get(name)) || null;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await set(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    if (typeof window === "undefined") return;
    await del(name);
  },
};

interface ReviewsStore {
  avaliacoes: Avaliacao[];
  addAvaliacao: (avaliacao: Omit<Avaliacao, "id" | "data">) => void;
  removeAvaliacao: (id: string) => void;
  updateAvaliacao: (id: string, updates: Partial<Avaliacao>) => void;
  getAvaliacoesPorProduto: (produtoId: string) => Avaliacao[];
  updateAvaliacaoStatus: (id: string, status: "aprovada" | "recusada" | "pendente") => void;
  duplicateAvaliacaoToProducts: (avaliacaoId: string, productIds: string[]) => void;
}

const mockAvaliacoes: Avaliacao[] = [
  {
    id: "rev-1",
    produtoId: "sku-protetor-facial-isdin",
    usuario: "Ana Paula Silva",
    nota: 5,
    texto: "Melhor protetor solar que já usei, textura super sequinha e não deixa o rosto branco. Recomendo muito!",
    data: "2023-11-15",
  },
  {
    id: "rev-2",
    produtoId: "sku-protetor-facial-isdin",
    usuario: "Mariana Costa",
    nota: 4,
    texto: "Gostei bastante, absorve rápido. Só achei o preço um pouco elevado, mas vale a pena.",
    data: "2023-12-02",
  },
  {
    id: "rev-3",
    produtoId: "sku-serum-vitc-tracta",
    usuario: "Juliana Santos",
    nota: 5,
    texto: "A pele fica iluminada na primeira semana. Amei o produto, compraria novamente com certeza.",
    data: "2024-01-20",
  },
  {
    id: "rev-4",
    produtoId: "sku-shampoo-darrow-doctar",
    usuario: "Carlos Eduardo",
    nota: 5,
    texto: "Acabou com a minha caspa nas primeiras lavagens. O cheiro é um pouco forte, mas resolve o problema.",
    data: "2024-02-10",
  },
  {
    id: "rev-5",
    produtoId: "sku-shampoo-darrow-doctar",
    usuario: "Felipe Almeida",
    nota: 3,
    texto: "Pra mim ressecou um pouco o cabelo, mas ajudou com a oleosidade do couro cabeludo.",
    data: "2024-03-05",
  },
  {
    id: "rev-6",
    produtoId: "sku-creme-cerave-locao",
    usuario: "Camila Rodrigues",
    nota: 5,
    texto: "Uso no corpo todo, hidrata absurdamente sem ficar pegajoso. Aprovado!",
    data: "2024-04-12",
  }
];

export const useReviews = create<ReviewsStore>()(
  persist(
    (set, get) => ({
      avaliacoes: mockAvaliacoes,
      
      addAvaliacao: (avaliacao) => set((state) => ({
        avaliacoes: [
          {
            ...avaliacao,
            id: `rev-${Date.now()}`,
            data: new Date().toISOString().split("T")[0],
            status: avaliacao.status || "pendente",
          },
          ...state.avaliacoes
        ]
      })),
      
      removeAvaliacao: (id) => set((state) => ({
        avaliacoes: state.avaliacoes.filter((a) => a.id !== id)
      })),
      
      updateAvaliacao: (id, updates) => set((state) => ({
        avaliacoes: state.avaliacoes.map(a => a.id === id ? { ...a, ...updates } : a)
      })),
      
      updateAvaliacaoStatus: (id, status) => set((state) => ({
        avaliacoes: state.avaliacoes.map(a => a.id === id ? { ...a, status } : a)
      })),

      duplicateAvaliacaoToProducts: (avaliacaoId, productIds) => set((state) => {
        const source = state.avaliacoes.find(a => a.id === avaliacaoId);
        if (!source) return state;
        
        const newAvaliacoes = productIds.map((pid, idx) => ({
          ...source,
          id: `rev-${Date.now()}-${idx}`,
          produtoId: pid,
          status: source.status
        }));

        return { avaliacoes: [...newAvaliacoes, ...state.avaliacoes] };
      }),
      
      getAvaliacoesPorProduto: (produtoId) => {
        return get().avaliacoes.filter((a) => a.produtoId === produtoId && a.status !== "recusada" && a.status !== "pendente");
      }
    }),
    {
      name: "reviews-storage",
      storage: createJSONStorage(() => idbStorage),
    }
  )
);

