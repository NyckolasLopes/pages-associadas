import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { productImage } from '@/lib/format';
import { mapRowToProduto, useAdminProducts } from '@/stores/products';

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
  imagens?: string[];
}

export interface Pedido {
  id: string;
  rawId?: string;
  numero?: string;
  lojaId?: string;
  lojaNome?: string;
  data: string;
  origem?: "whatsapp" | "site" | string;
  cupomAplicado?: string;
  observacoes?: string;
  motivoCancelamento?: string;
  modalidade?: "Entrega" | "Retirada" | string;
  cliente: {
    nome: string;
    email?: string;
    telefone: string;
    tipoPessoa?: 'PF' | 'PJ';
    cpf?: string;
    cnpj?: string;
    razaoSocial?: string;
    nomeFantasia?: string;
    responsavelCompra?: string;
    inscricaoEstadual?: string;
    isentoIE?: boolean;
    informacoesTributarias?: string;
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
  updateOrderStatus: (id: string, status: string, motivo?: string) => Promise<void>;
  updateOrderTracking: (id: string, tracking: string) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  clearAllOrders: (lojaId?: string) => Promise<void>;
}

function getInitialOrders(): Pedido[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("associadas-orders-storage");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveOrdersLocally(orders: Pedido[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("associadas-orders-storage", JSON.stringify(orders));
    window.dispatchEvent(new StorageEvent("storage", { key: "associadas-orders-storage" }));
  } catch {}
}

export const useOrders = create<OrdersState>((set, get) => ({
  orders: getInitialOrders(),

  loadOrders: async () => {
    const localOrders = getInitialOrders();
    const currentOrders = get().orders.length > 0 ? get().orders : localOrders;

    // Obter sessão atual do usuário
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    
    if (!user) {
      set({ orders: currentOrders });
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
      .select('*, pedido_itens(*, produtos(*)), pedido_historico_status(*)')
      .order('created_at', { ascending: false })
      .limit(1000);

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
      console.warn("Supabase Error fetching orders, mantendo pedidos locais:", error.message);
      set({ orders: currentOrders });
      return;
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
          const skuStr = sku ? String(sku) : undefined;
          const resolvedImg = i.foto || i.imagem || i.image || i.imageUrl || (skuStr && skuStr.length >= 4 && !skuStr.startsWith('prod-') ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${skuStr.substring(0, 2)}/${skuStr.substring(2, 4)}/${skuStr}_m1_1.jpg` : productImage(i));
          return {
            ...i,
            nome: i.nome || i.name || i.title || 'Produto sem nome',
            sku: sku,
            ean: i.ean || i.barcode,
            qtd: i.qtd || i.quantidade || i.qty || 1,
            quantidade: i.qtd || i.quantidade || i.qty || 1,
            valorUnitario: i.valorUnitario || i.preco_unit || i.price || i.preco || 0,
            preco: i.preco || (i.valorUnitario || i.preco_unit || i.price || 0) * (i.qtd || i.quantidade || i.qty || 1),
            foto: resolvedImg,
            imagem: resolvedImg,
          };
        });

        const parsedItens = (d.pedido_itens && d.pedido_itens.length > 0) 
          ? d.pedido_itens.map((i: any) => {
              let foto = undefined;
              if (i.produtos) {
                foto = productImage(mapRowToProduto(i.produtos));
              }
              if (!foto && (i.foto || i.imagem)) {
                foto = i.foto || i.imagem;
              }
              if (!foto && i.produto_id) {
                const localProd = useAdminProducts.getState().customProducts?.find((p: any) => p.id === i.produto_id || p.nome === i.nome);
                if (localProd) {
                  foto = productImage(localProd);
                }
              }
              if (!foto && i.produto_id) {
                const pidStr = String(i.produto_id);
                if (pidStr.length >= 4 && !pidStr.startsWith('prod-')) {
                  foto = `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${pidStr.substring(0, 2)}/${pidStr.substring(2, 4)}/${pidStr}_m1_1.jpg`;
                }
              }
              if (!foto) {
                foto = productImage(i);
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
                imagem: foto,
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
        observacoes: d.observacoes,
        motivoCancelamento: d.motivo_cancelamento || d.observacoes,
        rawId: d.id,
        };
      });

      // Mescla pedidos remotos e locais
      const existingIds = new Set(mappedOrders.map(o => o.id));
      const mergedOrders = [...mappedOrders];
      for (const loc of localOrders) {
        if (!existingIds.has(loc.id)) {
          mergedOrders.push(loc);
        }
      }

      set({ orders: mergedOrders });
      saveOrdersLocally(mergedOrders);
    }
  },

  addOrder: async (order) => {
    // 1. Salva imediatamente no LocalStorage (UI Instantânea)
    const orderNumber = generateOrderNumber();
    const finalOrder: Pedido = {
      ...order,
      id: order.id || orderNumber,
      numero: order.numero || orderNumber.replace(/^FA-/, '')
    };

    const currentOrders = get().orders;
    const updatedOrders = [finalOrder, ...currentOrders.filter(o => o.id !== finalOrder.id && o.numero !== finalOrder.numero)];
    set({ orders: updatedOrders });
    saveOrdersLocally(updatedOrders);

    // 2. Tenta registrar no backend de forma não-bloqueante
    try {
      const { data: userAuth } = await supabase.auth.getUser().catch(() => ({ data: null }));

      const apiRes = await fetch('/api/pedidos/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: { ...finalOrder, userId: userAuth?.user?.id || null } })
      });

      if (!apiRes.ok) {
        const errData = await apiRes.json().catch(() => ({}));
        console.warn("[orders.addOrder] Aviso do servidor (pedido garantido localmente):", errData);
      }

      // Remove ou converte o carrinho abandonado no Supabase
      if (userAuth?.user?.id) {
        await supabase
          .from('carrinhos_abandonados' as any)
          .update({ status: 'convertido', updated_at: new Date().toISOString() })
          .eq('user_id', userAuth.user.id)
          .eq('status', 'abandonado')
          .catch(() => {});
      }
    } catch (apiErr: any) {
      console.warn("[orders.addOrder] Erro de rede na sincronização (pedido já salvo e seguro localmente):", apiErr.message);
    }

    // Tenta recarregar lista atualizada sem limpar o que acabou de ser inserido
    try {
      await get().loadOrders();
    } catch {}
  },

  updateOrderStatus: async (id, status, motivo) => {
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

    const updatePayload: any = { status };
    if (motivo) {
      updatePayload.observacoes = motivo;
    }

    const { error } = await supabase.from('pedidos').update(updatePayload).eq('id', rawId);
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
      }).catch(() => {});

      // Atualizar state local e storage
      const updatedOrders = get().orders.map(o => o.id === id ? {
        ...o,
        status,
        motivoCancelamento: motivo || o.motivoCancelamento,
        observacoes: motivo || o.observacoes,
        historico: [
          ...(o.historico || []),
          { data: new Date().toISOString(), situacao: status, autor: autorNome }
        ]
      } : o);

      set({ orders: updatedOrders });
      saveOrdersLocally(updatedOrders);
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

  clearAllOrders: async (lojaId?: string) => {
    try {
      if (lojaId) {
        // 1. Obter IDs dos pedidos da loja
        const { data: storeOrders } = await supabase.from('pedidos').select('id').eq('loja_id', lojaId);
        const ids = storeOrders?.map(o => o.id) || [];
        if (ids.length > 0) {
          await supabase.from('pedido_itens').delete().in('pedido_id', ids);
          await supabase.from('pedido_historico_status' as any).delete().in('pedido_id', ids);
          const { error } = await supabase.from('pedidos').delete().in('id', ids);
          if (error) throw error;
        }
        set((state) => ({
          orders: state.orders.filter(o => o.lojaId !== lojaId),
        }));
      } else {
        // Limpar todos os pedidos (Global)
        await supabase.from('pedido_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        await supabase.from('pedido_historico_status' as any).delete().neq('id', '00000000-0000-0000-0000-000000000000');
        const { error } = await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
        if (error) {
          console.error("Error clearing all orders:", error);
          throw error;
        }
        set({ orders: [] });
      }
    } catch (err) {
      console.error("Error clearing orders:", err);
      throw err;
    }
  },
}));
