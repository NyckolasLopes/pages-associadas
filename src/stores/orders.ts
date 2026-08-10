import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';

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

interface OrdersState {
  orders: Pedido[];
  loadOrders: () => Promise<void>;
  addOrder: (order: Pedido) => Promise<void>;
  updateOrderStatus: (id: string, status: string) => Promise<void>;
  updateOrderTracking: (id: string, tracking: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
}

export const useOrders = create<OrdersState>((set, get) => ({
  orders: [],

  loadOrders: async () => {
    const { data, error } = await supabase
      .from('pedidos')
      .select('*, pedido_itens(*), profiles(*)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      const mappedOrders: Pedido[] = data.map((d: any) => ({
        id: d.id,
        lojaId: d.loja_id,
        data: d.created_at,
        origem: "site",
        status: d.status,
        modalidade: d.metodo_entrega,
        cupomAplicado: d.cupom_codigo,
        cliente: {
          nome: d.profiles?.nome || 'Cliente',
          email: d.profiles?.email || '',
          telefone: d.profiles?.telefone || '',
          cpf: d.profiles?.cpf || '',
          endereco: d.endereco_entrega,
        },
        pagamento: {
          metodo: d.metodo_pagamento,
        },
        envio: {
          metodo: d.metodo_entrega,
          rastreio: d.rastreio || undefined,
        },
        itens: d.pedido_itens?.map((i: any) => ({
          nome: i.nome,
          sku: i.sku,
          ean: i.ean,
          quantidade: i.quantidade,
          qtd: i.quantidade,
          valorUnitario: i.preco_unitario,
          preco: i.preco_unitario * i.quantidade,
          foto: i.imagem_url,
        })),
        valores: {
          subtotal: d.subtotal,
          produtos: d.subtotal,
          frete: d.frete,
          desconto: d.desconto,
          total: d.total,
        },
        historico: [],
        anotacoes: d.observacoes,
      }));
      set({ orders: mappedOrders });
    }
  },

  addOrder: async (order) => {
    const { data: userAuth } = await supabase.auth.getUser();
    const userId = userAuth?.user?.id || null;

    const { data: insertedOrder, error: orderError } = await supabase.from('pedidos').insert({
      numero: order.id.replace('FA-', ''),
      user_id: userId,
      loja_id: order.lojaId,
      status: order.status || 'novo',
      subtotal: order.valores.subtotal || 0,
      desconto: order.valores.desconto || 0,
      frete: order.valores.frete || 0,
      total: order.valores.total || 0,
      cep_entrega: order.cliente?.endereco?.cep || null,
      endereco_entrega: order.cliente?.endereco || {},
      metodo_entrega: order.modalidade,
      metodo_pagamento: order.pagamento?.metodo,
      observacoes: order.anotacoes || '',
    }).select('id').single();

    if (!orderError && insertedOrder) {
      const itens = order.produtos || order.itens || [];
      if (itens.length > 0) {
        const orderItemsRows = itens.map(i => ({
          pedido_id: insertedOrder.id,
          nome: i.nome,
          sku: i.sku,
          ean: i.ean,
          quantidade: i.qtd || i.quantidade || 1,
          preco_unitario: i.valorUnitario || i.preco || 0,
          imagem_url: i.foto || i.imagem || '',
        }));
        await supabase.from('pedido_itens').insert(orderItemsRows);
      }
    }

    // Refresh orders from DB for consistency
    await get().loadOrders();
  },

  updateOrderStatus: async (id, status) => {
    const { error } = await supabase.from('pedidos').update({ status }).eq('id', id);
    if (!error) {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o),
      }));
    }
  },

  updateOrderTracking: async (id, tracking) => {
    await supabase.from('pedidos').update({ rastreio: tracking } as any).eq('id', id);
    set((state) => ({
      orders: state.orders.map(o => o.id === id ? {
        ...o,
        envio: {
          metodo: o.envio?.metodo || "entrega",
          ...o.envio,
          rastreio: tracking,
        },
      } : o),
    }));
  },

  deleteOrder: async (id) => {
    const { error } = await supabase.from('pedidos').delete().eq('id', id);
    if (!error) {
      set((state) => ({
        orders: state.orders.filter(o => o.id !== id),
      }));
    }
  },
}));
