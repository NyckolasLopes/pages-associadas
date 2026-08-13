import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { idbStorage } from "@/lib/idb";

export interface AbandonedCart {
  id: string;
  createdAt: string;
  client: string;
  email: string;
  phone: string;
  address: string;
  abandonedAt: string;
  recoveryStatus: string;
  total: number;
  type: 'sem_transacao' | 'pagamento_nao_aprovado';
  notes?: string;
  lojaId?: string;
  lojaNome?: string;
  items: { nome: string; qtd: number; valorUnitario: number; foto: string }[];
}

interface AbandonedCartsState {
  carts: AbandonedCart[];
  addCart: (cart: AbandonedCart) => void;
  removeCart: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCarts: () => void;
}

const initialMockCarts: AbandonedCart[] = [];

export const useAbandonedCartsStore = create<AbandonedCartsState>()(
  persist(
    (set) => ({
      carts: initialMockCarts,
      addCart: (cart) => set((state) => ({ carts: [...state.carts, cart] })),
      removeCart: (id) => set((state) => ({ carts: state.carts.filter(c => c.id !== id) })),
      updateNotes: (id, notes) => set((state) => ({
        carts: state.carts.map(c => c.id === id ? { ...c, notes, recoveryStatus: "Em tratativa" } : c)
      })),
      clearCarts: () => set({ carts: [] }),
    }),
    {
      name: "abandoned-carts-storage",
      storage: createJSONStorage(() => idbStorage)
    }
  )
);
