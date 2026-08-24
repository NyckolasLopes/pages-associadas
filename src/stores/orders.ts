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
      .select('*, pedido_itens(*, produtos(imagens, foto)), pedido_historico_status(*)')
      .order('created_at', { ascending: false });

    // Restringir a query se não for admin global
    if (!profile?.is_admin) {
      if (profile?.lojas_vinculadas && profile.lojas_vinculadas.length > 0) {
        // Associado: vê as ordens das suas lojas
        const lojaIds = Array.isArray(profile.lojas_vinculadas)
          ? profile.lojas_vinculadas
          : Object.keys(profile.lojas_vinculadas);
        query = query.in('loja_id', lojaIds);
      } else {
        // Cliente final: vê apenas as suas ordens
        query = query.eq('user_id', user.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error("Supabase Error fetching orders:", error);
    }

    if (!error && data) {
      const mappedOrders: Pedido[] = data.map((d: any) => {
        const extractJSON = (field: any) => {
          if (Array.isArray(field)) return field;
          if (typeof field === "string") {
            try { return JSON.parse(field); } catch { return []; }
          }
          return [];
        };
        
        const rawItens = extractJSON(d.itens).length > 0 ? extractJSON(d.itens) : 
                        extractJSON(d.produtos).length > 0 ? extractJSON(d.produtos) : 
                        extractJSON(d.items);

        const mappedRawItens = rawItens.map((i: any) => {
          const sku = i.sku || i.produto_id || i.id;
          return {
            ...i,
            nome: i.nome || i.name || i.title || 'Produto sem nome',
            sku: sku,
            ean: i.ean || i.barcode,
            qtd: i.qtd || i.quantidade || i.qty || 1,
            quantidade: i.qtd || i.quantidade || i.qty || 1,
            valorUnitario: i.valorUnitario || i.preco_unit || i.price || i.preco || 0,
            preco: i.preco || (i.valorUnitario || i.preco_unit || i.price || 0) * (i.qtd || i.quantidade || i.qty || 1),
            foto: i.foto || i.image || i.imageUrl || (sku ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${sku.substring(0, 2)}/${sku.substring(2, 4)}/${sku}_m1_1.jpg` : undefined),
          };
        });

        const parsedItens = (d.pedido_itens && d.pedido_itens.length > 0) 
          ? d.pedido_itens.map((i: any) => {
              let foto = undefined;
              if (i.produtos) {
                if (Array.isArray(i.produtos.imagens) && i.produtos.imagens.length > 0) {
                  foto = i.produtos.imagens[0]?.caminhoImagem || i.produtos.imagens[0];
                }
                if (!foto && i.produtos.foto) {
                  foto = i.produtos.foto;
                }
              }
              if (!foto && i.produto_id) {
                foto = `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${i.produto_id.substring(0, 2)}/${i.produto_id.substring(2, 4)}/${i.produto_id}_m1_1.jpg`;
              }

              return {
                id: i.produto_id || i.id,
                nome: i.nome,
                sku: i.produto_id,
                ean: i.ean,
                qtd: i.qty,
                quantidade: i.qty,
                valorUnitario: i.preco_unit,
                preco: i.preco_unit * i.qty,
                foto: foto,
              };
            })
          : mappedRawItens;

        return {
          id: d.numero ? `FA-${d.numero}` : d.id,
          lojaId: d.loja_id,
          data: d.created_at,
          status: d.status,
          modalidade: d.metodo_entrega,
          cupomAplicado: d.cupom_codigo,
          cliente: {
            nome: d.nome_cliente || 'Cliente',
            email: d.email_cliente || '',
            telefone: d.telefone_cliente || '',
            cpf: d.cpf_cliente || '',
            endereco: d.endereco_entrega,
          },
          pagamento: {
            metodo: d.metodo_pagamento,
          },
          envio: {
            metodo: d.metodo_entrega,
            rastreio: d.rastreio || undefined,
          },
          itens: parsedItens,
          produtos: parsedItens,
          valores: {
          subtotal: d.subtotal,
          produtos: d.subtotal,
          frete: d.frete,
          desconto: d.desconto,
          total: d.total,
        },
        historico: Array.isArray(d.pedido_historico_status)
          ? d.pedido_historico_status
              .sort((a: any, b: any) => new Date(a.data).getTime() - new Date(b.data).getTime())
              .map((h: any) => ({ data: h.data, situacao: h.situacao, autor: h.autor }))
          : [],
        anotacoes: d.observacoes,
        rawId: d.id,
        };
      });
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
      // Dados do cliente gravados diretamente no pedido (evita join problemático com profiles)
      nome_cliente: order.cliente?.nome || '',
      telefone_cliente: order.cliente?.telefone || '',
      email_cliente: order.cliente?.email || '',
      cpf_cliente: order.cliente?.cpf || ''
    }).select('id').single();

    if (orderError) {
      console.error("Error inserting order:", orderError);
      throw new Error(orderError.message);
    }

    if (!orderError && insertedOrder) {
      const itens = order.produtos || order.itens || [];
      if (itens.length > 0) {
        // Verifica quais produtos existem no banco para evitar erro de Foreign Key
        const productIds = itens.map(i => i.id || i.sku).filter(Boolean);
        const { data: existingProducts } = await supabase
          .from('produtos')
          .select('id')
          .in('id', productIds);
          
        const existingProductIds = new Set(existingProducts?.map(p => p.id) || []);

        const orderItemsRows = itens.map(i => {
            const potentialId = i.id || i.sku;
            return {
              pedido_id: insertedOrder.id,
              produto_id: existingProductIds.has(potentialId) ? potentialId : null,
              nome: i.nome,
              qty: i.qtd || i.quantidade || 1,
              preco_unit: i.valorUnitario || i.preco || 0
            };
        });

        const { error: itemsError } = await supabase.from('pedido_itens').insert(orderItemsRows as any);
        if (itemsError) {
          console.error("Error inserting order items:", itemsError);
        }
      }
    }

    // Refresh orders from DB for consistency
    await get().loadOrders();
  },

  updateOrderStatus: async (id, status) => {
    // Resolver UUID real do pedido
    let rawId = id;
    if (id.startsWith('FA-')) {
      const { data } = await supabase.from('pedidos').select('id').eq('numero', id.replace('FA-', '')).single();
      if (data) rawId = data.id;
    } else {
      // Pode ser o numero formatado FA-XXXX ou o UUID direto
      const pedido = get().orders.find(o => o.id === id);
      if ((pedido as any)?.rawId) rawId = (pedido as any).rawId;
    }

    const { error } = await supabase.from('pedidos').update({ status }).eq('id', rawId);
    if (!error) {
      // Gravar histórico de status
      const { data: userData } = await supabase.auth.getUser();
      const { data: profileData } = await supabase
        .from('profiles' as any)
        .select('nome')
        .eq('id', userData?.user?.id || '')
        .single();
      const autorNome = (profileData as any)?.nome || userData?.user?.email || 'Administrador';

      await supabase.from('pedido_historico_status' as any).insert({
        pedido_id: rawId,
        situacao: status,
        autor: autorNome,
        data: new Date().toISOString()
      });

      // Atualizar state local
      set((state) => ({
        orders: state.orders.map(o => o.id === id ? {
          ...o,
          status,
          historico: [
            ...(o.historico || []),
            { data: new Date().toISOString(), situacao: status, autor: autorNome }
          ]
        } : o),
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
    // 1. Resolve o ID real se for numero (FA-XXX)
    let finalId = id;
    if (id.startsWith('FA-')) {
      const { data } = await supabase.from('pedidos').select('id').eq('numero', id.replace('FA-', '')).single();
      if (data) finalId = data.id;
    }

    // 2. Deleta itens do pedido
    await supabase.from('pedido_itens').delete().eq('pedido_id', finalId);

    // 3. Deleta o pedido
    const { error } = await supabase.from('pedidos').delete().eq('id', finalId);
    
    if (error) {
      console.error("Error deleting order:", error);
      throw error;
    }
    set((state) => ({
      orders: state.orders.filter(o => o.id !== id),
    }));
  },
}));
