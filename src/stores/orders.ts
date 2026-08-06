import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PedidoItem {
  id?: string;
  nome: string;
  sku?: string;
  ean?: string;
  cores?: string;
  disponibilidade?: string;
  qtd?: number;
  quantidade?: number;
  valorUnitario?: number;
  preco?: number;
  precoRegular?: number;
  foto?: string;
  imagem?: string;
}

export interface Pedido {
  id: string;
  lojaId?: string;
  lojaNome?: string;
  data: string;
  origem?: "whatsapp" | "site" | string;
  cupomAplicado?: string;
  observacoes?: string;
  modalidade?: "Entrega" | "Retirada" | string;
  cliente: {
    nome: string;
    email?: string;
    telefone: string;
    cpf?: string;
    ip?: string;
    tipo?: string;
    endereco?: {
      rua: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      cep: string;
    };
  };
  pagamento: {
    metodo: string;
    trocoPara?: string;
    idTransacao?: string;
    cartaoFinal?: string;
    parcelas?: number;
  };
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
  };
  envio?: {
    metodo?: "entrega" | "retirada" | string;
    rastreio?: string;
    prazo?: string;
    endereco?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    cep?: string;
  };
  status: string;
  produtos?: PedidoItem[];
  itens?: PedidoItem[];
  valores: {
    produtos?: number;
    subtotal?: number;
    desconto?: number;
    descontos?: number;
    frete: number;
    total: number;
  };
  historico?: Array<{
    data: string;
    situacao: string;
    autor: string;
  }>;
  anotacoes?: string;
}

export function generateOrderNumber(): string {
  const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `FA-${dateStr}-${randomSuffix}`;
}

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
            ...(o.historico || []),
            { data: new Date().toISOString(), situacao: status, autor: "Loja / Admin" }
          ]
        } : o)
      })),
      updateOrderTracking: (id, tracking) => set((state) => ({
        orders: state.orders.map(o => o.id === id ? { 
          ...o, 
          envio: { 
            metodo: o.envio?.metodo || "entrega",
            ...o.envio, 
            rastreio: tracking 
          } 
        } : o)
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
