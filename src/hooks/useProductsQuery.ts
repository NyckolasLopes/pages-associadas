import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Product } from '@/stores/products';

interface UseProductsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  categoria?: string;
  marca?: string;
  lojaId?: string;
  isVirtualStore?: boolean;
}

export function useProductsQuery({
  page = 1,
  limit = 50,
  search,
  categoria,
  marca,
  lojaId,
  isVirtualStore,
}: UseProductsQueryParams = {}) {
  return useQuery({
    queryKey: ['products', { page, limit, search, categoria, marca, lojaId, isVirtualStore }],
    queryFn: async () => {
      let query = supabase.from('produtos').select('*', { count: 'exact' });

      // Filtros
      if (search) {
        query = query.ilike('nome', `%${search}%`);
      }
      if (categoria) {
        query = query.eq('categoria', categoria);
      }
      if (marca) {
        query = query.eq('marca', marca);
      }
      
      // Se estamos num painel de associado, ele quer ver tudo ou os dele?
      // O banco de dados tem produtos globais e customizados.
      // Neste momento da refatoração, vamos assumir a filtragem básica. A regra de negócios completa será ajustada ao longo da migração.
      if (lojaId && !isVirtualStore) {
        query = query.eq('loja_id', lojaId);
      }

      // Paginação
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      // Ordenação
      query = query.order('nome', { ascending: true });

      const { data, error, count } = await query;

      if (error) throw error;

      const mappedProducts: Product[] = (data || []).map((d: any) => ({
        id: d.id,
        nome: d.nome,
        ean: d.ean,
        sku: d.ean || d.id,
        preco: d.preco_de || d.preco_por || 0,
        precoPor: d.preco_por,
        estoque: 999, // default
        imagem: d.imagem_url,
        categoria: d.categoria,
        marca: d.marca,
        descricao: d.descricao,
        url: d.slug,
        lojaId: d.loja_id,
        ativo: d.ativo !== false,
      }));

      return { data: mappedProducts, count: count || 0 };
    },
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}
