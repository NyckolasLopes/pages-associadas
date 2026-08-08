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
    lojaId: "loja-poa-centro",
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
      { nome: "Paracetamol 500mg 20 Comprimidos", sku: "PARACETAMOL-500", qtd: 40, quantidade: 40, valorUnitario: 8.90, preco: 8.90 },
      { nome: "Dorflex 36 Comprimidos", sku: "DORFLEX-36", qtd: 30, quantidade: 30, valorUnitario: 18.90, preco: 18.90 },
      { nome: "Dipirona Monoidratada 500mg 10 Comprimidos", sku: "DIPIRONA-500", qtd: 25, quantidade: 25, valorUnitario: 5.90, preco: 5.90 },
      { nome: "Vitamina C 1g Cewin Efervescente", sku: "CEWIN-1G", qtd: 15, quantidade: 15, valorUnitario: 24.50, preco: 24.50 },
      { nome: "Neosaldina 30 Drágeas", sku: "NEOSALDINA-30", qtd: 20, quantidade: 20, valorUnitario: 32.00, preco: 32.00 }
    ],
    valores: { subtotal: 1883.50, produtos: 1883.50, frete: 0, total: 1883.50 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 25).toISOString(), situacao: "Pedido Realizado via WhatsApp", autor: "Cliente" }
    ]
  },
  {
    id: "FA-20260807-6119",
    lojaId: "loja-poa-zonasul",
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
      { nome: "Paracetamol 500mg 20 Comprimidos", sku: "PARACETAMOL-500", qtd: 35, quantidade: 35, valorUnitario: 8.90, preco: 8.90 },
      { nome: "Whey Protein 100% Max Titanium 900g", sku: "WHEY-MAX-900", qtd: 12, quantidade: 12, valorUnitario: 119.90, preco: 119.90 },
      { nome: "Creatina Creapure 300g", sku: "CREATINA-300", qtd: 15, quantidade: 15, valorUnitario: 89.90, preco: 89.90 },
      { nome: "Dorflex 36 Comprimidos", sku: "DORFLEX-36", qtd: 25, quantidade: 25, valorUnitario: 18.90, preco: 18.90 },
      { nome: "Dipirona Monoidratada 500mg 10 Comprimidos", sku: "DIPIRONA-500", qtd: 20, quantidade: 20, valorUnitario: 5.90, preco: 5.90 }
    ],
    valores: { subtotal: 3719.30, produtos: 3719.30, frete: 0, total: 3719.30 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 75).toISOString(), situacao: "Pedido Realizado via WhatsApp", autor: "Cliente" }
    ]
  },
  {
    id: "FA-20260807-3321",
    lojaId: "loja-poa-centro",
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
      { nome: "Protetor Solar Anthelios Airlicium FPS 80", sku: "ANTHELIOS-80", qtd: 10, quantidade: 10, valorUnitario: 92.50, preco: 92.50 },
      { nome: "Shampoo Anticaspa Dercos Vichy 200ml", sku: "DERCOS-200", qtd: 8, quantidade: 8, valorUnitario: 84.90, preco: 84.90 },
      { nome: "Sabonete Líquido Granado Bebê 250ml", sku: "GRANADO-BEBE", qtd: 20, quantidade: 20, valorUnitario: 21.90, preco: 21.90 }
    ],
    valores: { subtotal: 2042.20, produtos: 2042.20, frete: 10.00, total: 2052.20 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 180).toISOString(), situacao: "Aguardando pagamento", autor: "Sistema" }
    ]
  },
  {
    id: "FA-20260806-9042",
    lojaId: "loja-caxias-centro",
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
      { nome: "Paracetamol 500mg 20 Comprimidos", sku: "PARACETAMOL-500", qtd: 25, quantidade: 25, valorUnitario: 8.90, preco: 8.90 },
      { nome: "Fralda Pampers Confort Sec G 60 Tiras", sku: "PAMPERS-G-60", qtd: 20, quantidade: 20, valorUnitario: 79.90, preco: 79.90 },
      { nome: "Lenços Umedecidos Johnson's Baby 48 un", sku: "LENCOS-JB-48", qtd: 30, quantidade: 30, valorUnitario: 14.50, preco: 14.50 },
      { nome: "Dorflex 36 Comprimidos", sku: "DORFLEX-36", qtd: 20, quantidade: 20, valorUnitario: 18.90, preco: 18.90 },
      { nome: "Dipirona Monoidratada 500mg 10 Comprimidos", sku: "DIPIRONA-500", qtd: 20, quantidade: 20, valorUnitario: 5.90, preco: 5.90 }
    ],
    valores: { subtotal: 3173.50, produtos: 3173.50, frete: 5.00, total: 3178.50 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(), situacao: "Entregue", autor: "Loja" }
    ]
  },
  {
    id: "FA-20260806-1188",
    lojaId: "loja-poa-zonasul",
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
      { nome: "Whey Protein 100% Max Titanium 900g", sku: "WHEY-MAX-900", qtd: 8, quantidade: 8, valorUnitario: 119.90, preco: 119.90 },
      { nome: "Protetor Solar Anthelios Airlicium FPS 80", sku: "ANTHELIOS-80", qtd: 8, quantidade: 8, valorUnitario: 92.50, preco: 92.50 },
      { nome: "Losartana Potássica 50mg 30 Comprimidos", sku: "LOSARTANA-50", qtd: 35, quantidade: 35, valorUnitario: 9.90, preco: 9.90 },
      { nome: "Omeprazol 20mg 28 Cápsulas", sku: "OMEPRAZOL-20", qtd: 30, quantidade: 30, valorUnitario: 12.50, preco: 12.50 }
    ],
    valores: { subtotal: 2420.70, produtos: 2420.70, frete: 0, total: 2420.70 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(), situacao: "Pendente", autor: "Sistema" }
    ]
  },
  {
    id: "FA-20260805-4421",
    lojaId: "loja-poa-centro",
    lojaNome: "Farmácias Associadas — POA Centro",
    data: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(),
    origem: "whatsapp",
    status: "Concluído",
    modalidade: "Entrega",
    cliente: {
      nome: "Fernanda Ribeiro",
      telefone: "(51) 99345-6789",
      email: "fernanda.r@email.com"
    },
    pagamento: { metodo: "Pix" },
    itens: [
      { nome: "Neosaldina 30 Drágeas", sku: "NEOSALDINA-30", qtd: 30, quantidade: 30, valorUnitario: 32.00, preco: 32.00 },
      { nome: "Vitamina C 1g Cewin Efervescente", sku: "CEWIN-1G", qtd: 30, quantidade: 30, valorUnitario: 24.50, preco: 24.50 },
      { nome: "Desodorante Rexona Clinical Aerosol 150ml", sku: "REXONA-CLIN", qtd: 35, quantidade: 35, valorUnitario: 26.90, preco: 26.90 },
      { nome: "Ivermectina 6mg 4 Comprimidos", sku: "IVERMECTINA-6", qtd: 30, quantidade: 30, valorUnitario: 19.90, preco: 19.90 }
    ],
    valores: { subtotal: 3233.50, produtos: 3233.50, frete: 0, total: 3233.50 },
    historico: [
      { data: new Date(Date.now() - 1000 * 60 * 60 * 50).toISOString(), situacao: "Entregue", autor: "Loja" }
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
