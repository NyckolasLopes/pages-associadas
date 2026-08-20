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
  numero?: string;
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
    // Obter sessão atual do usuário
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      set({ orders: [] });
      return;
    }
    
    // Obter perfil para checar se é admin global ou tem lojas vinculadas
    const { data: rawProfile } = await supabase
      .from('profiles' as any)
      .select('is_admin, lojas_vinculadas')
      .eq('id', user.id)
      .single();

    const profile = rawProfile as any;

    let query = supabase
      .from('pedidos')
      .select('*, pedido_itens(*, produtos(ean)), profiles(*)')
      .order('created_at', { ascending: false });

    // Restringir a query se não for admin global
    if (!profile?.is_admin) {
      if (profile?.lojas_vinculadas && profile.lojas_vinculadas.length > 0) {
        // Associado: vê as ordens das suas lojas
        query = query.in('loja_id', profile.lojas_vinculadas);
      } else {
        // Cliente final: vê apenas as suas ordens
        query = query.eq('user_id', user.id);
      }
    }

    const { data, error } = await query;

    if (!error && data) {
      const mappedOrders: Pedido[] = data.map((d: any) => ({
        id: d.numero ? `FA-${d.numero}` : d.id,
        lojaId: d.loja_id,
        data: d.created_at,
        origem: d.origem || "site",
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
          sku: i.produto_id,
          ean: i.produtos?.ean,
          qtd: i.qty,
          valorUnitario: i.preco_unit,
          preco: i.preco_unit * i.qty,
          foto: i.produto_id ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${i.produto_id.substring(0, 2)}/${i.produto_id.substring(2, 4)}/${i.produto_id}_m1_1.jpg` : undefined,
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
      user_id: userId as string,
      loja_id: order.lojaId,
      status: order.status || 'novo',
      subtotal: order.valores?.subtotal || order.valores?.produtos || 0,
      desconto: order.valores?.desconto || 0,
      frete: order.valores?.frete || 0,
      total: order.valores?.total || 0,
      cep_entrega: order.cliente?.endereco?.cep || order.envio?.cep || null,
      endereco_entrega: order.cliente?.endereco || order.envio || {},
      metodo_entrega: order.modalidade || order.envio?.metodo,
      metodo_pagamento: order.pagamento?.metodo,
      observacoes: order.anotacoes || order.observacoes || '',
    }).select('id').single();

    if (orderError) {
      console.error("Error inserting order:", orderError);
      throw new Error(orderError.message);
    }

    if (!orderError && insertedOrder) {
      const itens = order.produtos || order.itens || [];
      if (itens.length > 0) {
        const orderItemsRows = itens.map(i => ({
            pedido_id: insertedOrder.id,
            produto_id: i.id || i.sku || null,
            nome: i.nome,
            qty: i.qtd || i.quantidade || 1,
            preco_unit: i.valorUnitario || i.preco || 0
          }));
        await supabase.from('pedido_itens').insert(orderItemsRows as any);
      }
    }

    // Refresh orders from DB for consistency
    await get().loadOrders();
  },

  updateOrderStatus: async (id, status) => {
    const query = id.startsWith('FA-') 
      ? supabase.from('pedidos').update({ status }).eq('numero', id.replace('FA-', ''))
      : supabase.from('pedidos').update({ status }).eq('id', id);
    const { error } = await query;
    if (!error) {
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? { ...o, status } : o),
      }));
    }
  },

  updateOrderTracking: async (id, tracking) => {
    const query = id.startsWith('FA-') 
      ? supabase.from('pedidos').update({ rastreio: tracking } as any).eq('numero', id.replace('FA-', ''))
      : supabase.from('pedidos').update({ rastreio: tracking } as any).eq('id', id);
    await query;
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
    const query = id.startsWith('FA-') 
      ? supabase.from('pedidos').delete().eq('numero', id.replace('FA-', ''))
      : supabase.from('pedidos').delete().eq('id', id);
    const { error } = await query;
    if (!error) {
      set((state) => ({
        orders: state.orders.filter(o => o.id !== id),
      }));
    }
  },
}));
