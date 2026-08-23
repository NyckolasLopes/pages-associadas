import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Pedido } from '@/stores/orders';

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
          query = query.in('loja_id', lojaIds);
        } else {
          query = query.eq('user_id', user.id);
        }
      }

      // Filtros
      if (lojaId) {
        query = query.eq('loja_id', lojaId);
      }
      
      if (status && status !== 'todos') {
        query = query.eq('status', status);
      }
      
      if (dateStart) {
        query = query.gte('created_at', `${dateStart} 00:00:00`);
      }
      
      if (dateEnd) {
        query = query.lte('created_at', `${dateEnd} 23:59:59`);
      }
      
      if (search) {
        if (!isNaN(Number(search))) {
           query = query.eq('numero', Number(search));
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

      const mappedOrders: Pedido[] = (data || []).map((d: any) => ({
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
        itens: d.pedido_itens?.map((i: any) => ({
          nome: i.nome,
          sku: i.produto_id,
          ean: i.ean,
          qtd: i.qty,
          quantidade: i.qty,
          valorUnitario: i.preco_unit,
          preco: i.preco_unit * i.qty,
          foto: i.produto_id ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${i.produto_id.substring(0, 2)}/${i.produto_id.substring(2, 4)}/${i.produto_id}_m1_1.jpg` : undefined,
        })) || [],
        produtos: d.pedido_itens?.map((i: any) => ({
          nome: i.nome,
          sku: i.produto_id,
          ean: i.ean,
          qtd: i.qty,
          quantidade: i.qty,
          valorUnitario: i.preco_unit,
          preco: i.preco_unit * i.qty,
          foto: i.produto_id ? `https://dce0cc66r7yee.cloudfront.net/Custom/Content/Products/${i.produto_id.substring(0, 2)}/${i.produto_id.substring(2, 4)}/${i.produto_id}_m1_1.jpg` : undefined,
        })) || [],
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
      }));

      return { data: mappedOrders, count: count || 0 };
    },
    staleTime: 1000 * 60, // 1 minute
  });
}
