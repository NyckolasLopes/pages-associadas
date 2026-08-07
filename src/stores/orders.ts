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

const INITIAL_ORDERS: Pedido[] = [
  {
    id: "FA-20260807-8492",
    lojaId: "1",
    lojaNome: "Farmácias Associadas — POA Centro",
    data: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    origem: "whatsapp",
    status: "Concluído",
    modalidade: "Entrega",
    cliente: {
      nome: "Juliana Silveira",
      telefone: "(51) 99876-5432",
      email: "juliana.silveira@email.com",
      cpf: "123.456.789-00",
      endereco: { rua: "Rua dos Andradas", numero: "1234", bairro: "Centro Histórico", cidade: "Porto Alegre", cep: "90020-008" }
    },
    pagamento: { metodo: "Pix via WhatsApp" },
    itens: [
      { nome: "Dorflex 36 Comprimidos", qtd: 2, quantidade: 2, valorUnitario: 18.90, preco: 18.90 },
      { nome: "Vitamina C 1g Cewin Efervescente", qtd: 1, quantidade: 1, valorUnitario: 24.50, preco: 24.50 },
      { nome: "Neosaldina 30 Drágeas", qtd: 1, quantidade: 1, valorUnitario: 32.00, preco: 32.00 }
    ],
    valores: { subtotal: 94.30, produtos: 94.30, frete: 0, total: 94.30 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 25).toISOString(), situacao: "Pedido Realizado via WhatsApp", autor: "Cliente" }
    ]
  },
  {
    id: "FA-20260807-6119",
    lojaId: "2",
    lojaNome: "Farmácias Associadas — Zona Norte",
    data: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    origem: "whatsapp",
    status: "Concluído",
    modalidade: "Retirada",
    cliente: {
      nome: "Carlos Eduardo Mendes",
      telefone: "(51) 98765-4321",
      email: "carlos.mendes@email.com",
      cpf: "987.654.321-99"
    },
    pagamento: { metodo: "Cartão de Crédito" },
    itens: [
      { nome: "Whey Protein 100% Max Titanium 900g", qtd: 1, quantidade: 1, valorUnitario: 119.90, preco: 119.90 },
      { nome: "Creatina Creapure 300g", qtd: 1, quantidade: 1, valorUnitario: 89.90, preco: 89.90 }
    ],
    valores: { subtotal: 209.80, produtos: 209.80, frete: 0, total: 209.80 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 75).toISOString(), situacao: "Pedido Realizado via WhatsApp", autor: "Cliente" }
    ]
  },
  {
    id: "FA-20260807-3321",
    lojaId: "1",
    lojaNome: "Farmácias Associadas — POA Centro",
    data: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    origem: "site",
    status: "Pendente",
    modalidade: "Entrega",
    cliente: {
      nome: "Mariana Costa",
      telefone: "(51) 99111-2233",
      email: "mari.costa@email.com"
    },
    pagamento: { metodo: "Pix" },
    itens: [
      { nome: "Protetor Solar Anthelios Airlicium FPS 80", qtd: 1, quantidade: 1, valorUnitario: 92.50, preco: 92.50 }
    ],
    valores: { subtotal: 92.50, produtos: 92.50, frete: 10.00, total: 102.50 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 180).toISOString(), situacao: "Aguardando pagamento", autor: "Sistema" }
    ]
  },
  {
    id: "FA-20260806-9042",
    lojaId: "3",
    lojaNome: "Farmácias Associadas — Caxias do Sul",
    data: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    origem: "whatsapp",
    status: "Concluído",
    modalidade: "Entrega",
    cliente: {
      nome: "Roberto Fonseca",
      telefone: "(54) 99654-1122",
      email: "roberto.fonseca@email.com"
    },
    pagamento: { metodo: "Dinheiro na Entrega" },
    itens: [
      { nome: "Fralda Pampers Confort Sec G 60 Tiras", qtd: 2, quantidade: 2, valorUnitario: 79.90, preco: 79.90 },
      { nome: "Lenços Umedecidos Johnson's Baby", qtd: 3, quantidade: 3, valorUnitario: 14.50, preco: 14.50 }
    ],
    valores: { subtotal: 203.30, produtos: 203.30, frete: 5.00, total: 208.30 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), situacao: "Entregue", autor: "Loja" }
    ]
  },
  {
    id: "FA-20260806-1188",
    lojaId: "2",
    lojaNome: "Farmácias Associadas — Zona Norte",
    data: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    origem: "site",
    status: "Pendente",
    modalidade: "Retirada",
    cliente: {
      nome: "Lucas Alencastro",
      telefone: "(51) 98222-3344",
      email: "lucas.a@email.com"
    },
    pagamento: { metodo: "Cartão de Débito" },
    itens: [
      { nome: "Shampoo Anticaspa Dercos Vichy 200ml", qtd: 1, quantidade: 1, valorUnitario: 84.90, preco: 84.90 }
    ],
    valores: { subtotal: 84.90, produtos: 84.90, frete: 0, total: 84.90 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), situacao: "Pendente", autor: "Sistema" }
    ]
  }
];

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
