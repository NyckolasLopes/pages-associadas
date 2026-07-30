import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Pedido {
  id: string;
  lojaId?: string;
  data: string;
  cliente: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
    ip: string;
    tipo: string;
  };
  pagamento: {
    metodo: string;
    idTransacao?: string;
    cartaoFinal?: string;
    parcelas?: number;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  envio: {
    metodo: string;
    rastreio?: string;
    prazo: string;
    endereco: string;
    cidade: string;
    cep: string;
  };
  status: string;
  produtos: Array<{
    nome: string;
    sku: string;
    cores: string;
    disponibilidade: string;
    qtd: number;
    valorUnitario: number;
    foto: string;
  }>;
  valores: {
    produtos: number;
    desconto: number;
    frete: number;
    total: number;
  };
  historico: Array<{
    data: string;
    situacao: string;
    autor: string;
  }>;
  anotacoes: string;
}

const hojeDateStr = new Date().toLocaleDateString('pt-BR');

const INITIAL_ORDERS: Pedido[] = [];

interface OrdersState {
  orders: Pedido[];
  addOrder: (order: Pedido) => void;
  updateOrderStatus: (id: string, status: string) => void;
  updateOrderTracking: (id: string, tracking: string) => void;
  deleteOrder: (id: string) => void;
}

export const useOrders = create<OrdersState>()(
  persist(
    (set) => ({
      orders: INITIAL_ORDERS,
      addOrder: (order) => set((state) => ({ orders: [order, ...state.orders] })),
      updateOrderStatus: (id, status) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { 
          ...o, 
          status,
          historico: [
            ...o.historico,
            { data: new Date().toISOString(), situacao: status, autor: "Loja / Admin" }
          ]
        } : o)
      })),
      updateOrderTracking: (id, tracking) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, envio: { ...o.envio, rastreio: tracking } } : o)
      })),
      deleteOrder: (id) => set((state) => ({
        orders: state.orders.filter(o => o.id !== id)
      }))
    }),
    {
      name: 'associadas-orders-storage',
    }
  )
);
