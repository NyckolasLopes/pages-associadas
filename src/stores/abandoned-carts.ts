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
  items: { nome: string; qtd: number; valorUnitario: number; foto: string }[];
}

interface AbandonedCartsState {
  carts: AbandonedCart[];
  addCart: (cart: AbandonedCart) => void;
  removeCart: (id: string) => void;
  updateNotes: (id: string, notes: string) => void;
  clearCarts: () => void;
}

const initialMockCarts: AbandonedCart[] = [
  {
    id: "#A1002",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleDateString('pt-BR') + " " + new Date(Date.now() - 1000 * 60 * 60 * 2).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
    client: "Marcos Paulo",
    email: "marcos.paulo@email.com",
    phone: "(51) 98888-7777",
    address: "Rua das Flores, 123",
    abandonedAt: "Há 2 horas",
    recoveryStatus: "Aguardando disparo autom.",
    total: 125.90,
    type: 'sem_transacao',
    notes: "",
    lojaId: "loja-poa-zonasul",
    items: [
      { nome: "Vitamina C 1g Targifor C 30 Comprimidos", qtd: 1, valorUnitario: 45.90, foto: "https://placehold.co/100" },
      { nome: "Protetor Solar Neostrata", qtd: 1, valorUnitario: 80.00, foto: "https://placehold.co/100" }
    ]
  },
  {
    id: "#A1003",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleDateString('pt-BR') + " " + new Date(Date.now() - 1000 * 60 * 60 * 24).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
    client: "Ana Júlia",
    email: "anajulia_1990@email.com",
    phone: "(51) 99123-4567",
    address: "Av. Ipiranga, 4500",
    abandonedAt: "Ontem",
    recoveryStatus: "Aguardando disparo autom.",
    total: 89.90,
    type: 'pagamento_nao_aprovado',
    notes: "Cartão recusado pelo banco",
    lojaId: "loja-caxias-centro",
    items: [
      { nome: "Whey Protein Isolado Integralmédica", qtd: 1, valorUnitario: 89.90, foto: "https://placehold.co/100" }
    ]
  },
  {
    id: "#A1004",
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleDateString('pt-BR') + " " + new Date(Date.now() - 1000 * 60 * 60 * 48).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
    client: "Roberto Carlos",
    email: "roberto.c@email.com",
    phone: "(11) 97777-6666",
    address: "Não informado",
    abandonedAt: "Há 2 dias",
    recoveryStatus: "Em tratativa",
    total: 45.00,
    type: 'sem_transacao',
    notes: "Ficou de ver com a esposa e finalizar depois.",
    lojaId: "loja-poa-centro",
    items: [
      { nome: "Desodorante Rexona Clinical", qtd: 3, valorUnitario: 15.00, foto: "https://placehold.co/100" }
    ]
  },
  {
    id: "#A1005",
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toLocaleDateString('pt-BR') + " " + new Date(Date.now() - 1000 * 60 * 30).toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
    client: "Fernanda Costa",
    email: "nanda.costa@email.com",
    phone: "(51) 98111-2222",
    address: "Rua Mostardeiro, 321",
    abandonedAt: "Há 30 minutos",
    recoveryStatus: "Aguardando disparo autom.",
    total: 210.50,
    type: 'pagamento_nao_aprovado',
    notes: "Pix não foi pago até o vencimento do checkout.",
    lojaId: "loja-poa-zonasul",
    items: [
      { nome: "Kit Skincare La Roche-Posay", qtd: 1, valorUnitario: 210.50, foto: "https://placehold.co/100" }
    ]
  }
];

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
