import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/stores/orders';
import { useAdmin } from '@/stores/admin';

function expandLojaIds(ids: string[] | string): string[] {
  const list = Array.isArray(ids) ? ids : [ids];
  const pharmacies = useAdmin.getState().pharmacies || [];
  const expanded = new Set<string>();

  list.forEach(id => {
    if (!id) return;
    expanded.add(id);
    const ph = pharmacies.find(p => p.id === id || p.slug === id);
    if (ph) {
      if (ph.id) expanded.add(ph.id);
      if (ph.slug) {
        expanded.add(ph.slug);
        expanded.add(`loja-${ph.slug}`);
      }
    }
  });

  return Array.from(expanded);
}

interface UseOrdersQueryParams {
  page?: number;
  limit?: number;
  lojaId?: string;
  status?: string;
  search?: string;
  dateStart?: string;
  dateEnd?: string;
  fetchAll?: boolean;
}

export function useOrdersQuery({
  page = 1,
  limit = 20,
  lojaId,
  status,
  search,
  dateStart,
  dateEnd,
  fetchAll = false,
}: UseOrdersQueryParams = {}) {
  return useQuery({
    queryKey: ['orders', { page, limit, lojaId, status, search, dateStart, dateEnd, fetchAll }],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        return { data: [], count: 0 };
      }

      // Obter perfil para checar permissões
      const { data: rawProfile } = await supabase
        .from('profiles' as any)
        .select('is_admin, lojas_vinculadas')
        .eq('id', user.id)
        .single();

      const profile = rawProfile as any;
      let query = supabase.from('pedidos').select('*, pedido_itens(*)', { count: 'exact' });

      // Permissões
      if (!profile?.is_admin) {
        if (profile?.lojas_vinculadas && profile.lojas_vinculadas.length > 0) {
          const lojaIds = Array.isArray(profile.lojas_vinculadas)
            ? profile.lojas_vinculadas
            : Object.keys(profile.lojas_vinculadas);
          query = query.in('loja_id', expandLojaIds(lojaIds));
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      // Filtros
      if (lojaId) {
        query = query.in('loja_id', expandLojaIds(lojaId));
      }
      
      if (status && status !== 'todos') {
        if (status === 'Pendente') {
           query = query.not('status', 'ilike', '%conclu%').not('status', 'ilike', '%cancel%').not('status', 'ilike', '%entregue%');
        } else if (status === 'Concluído' || status === 'Concluido') {
           query = query.or('status.ilike.%conclu%,status.ilike.%entregue%');
        } else {
           query = query.eq('status', status);
        }
      }
      
      if (dateStart) {
        query = query.gte('created_at', `${dateStart} 00:00:00`);
      }
      
      if (dateEnd) {
        query = query.lte('created_at', `${dateEnd} 23:59:59`);
      }
      
      if (search) {
        if (!isNaN(Number(search))) {
           query = query.eq('numero', String(search).trim());
        } else {
           query = query.ilike('nome_cliente', `%${search}%`);
        }
      }

      // Paginação
      if (!fetchAll) {
        const from = (page - 1) * limit;
        const to = from + limit - 1;
        query = query.range(from, to);
      }

      // Ordenação
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) throw error;

      const mappedOrders: Pedido[] = (data || []).map((d: any) => {
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
          ? d.pedido_itens.map((i: any) => ({
              nome: i.nome,
              sku: i.produto_id,
              ean: i.ean,
              qtd: i.qty,
              quantidade: i.qty,
              valorUnitario: i.preco_unit,
              preco: i.preco_unit * i.qty,
              foto: i.produto_id ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${i.produto_id.substring(0, 2)}/${i.produto_id.substring(2, 4)}/${i.produto_id}_m1_1.jpg` : undefined,
            }))
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
        historico: [],
        anotacoes: d.observacoes,
        rawId: d.id,
      };
    });

      return { data: mappedOrders, count: count || 0 };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
export function useOrdersKpis(lojaId?: string) {
  return useQuery({
    queryKey: ['orders-kpis', lojaId],
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (!user) {
        return { concluidos: 0, pendentes: 0, cancelados: 0, total: 0 };
      }

      const { data: rawProfile } = await supabase
        .from('profiles' as any)
        .select('is_admin, lojas_vinculadas')
        .eq('id', user.id)
        .single();
      const profile = rawProfile as any;

      let query = supabase.from('pedidos').select('status');

      if (!profile?.is_admin) {
        if (profile?.lojas_vinculadas && profile.lojas_vinculadas.length > 0) {
          const lojaIds = Array.isArray(profile.lojas_vinculadas)
            ? profile.lojas_vinculadas
            : Object.keys(profile.lojas_vinculadas);
          query = query.in('loja_id', expandLojaIds(lojaIds));
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      if (lojaId) {
        query = query.in('loja_id', expandLojaIds(lojaId));
      }
      
      const { data, error } = await query;
      if (error) return { concluidos: 0, pendentes: 0, cancelados: 0, total: 0 };
      
      let concluidos = 0;
      let pendentes = 0;
      let cancelados = 0;
      
      (data || []).forEach((d: any) => {
        const st = (d.status || "").toLowerCase();
        if (st.includes("conclu") || st.includes("entregue")) concluidos++;
        else if (st.includes("cancel")) cancelados++;
        else pendentes++;
      });
      
      return { concluidos, pendentes, cancelados, total: (data || []).length };
    },
    staleTime: 1000 * 60,
  });
}

