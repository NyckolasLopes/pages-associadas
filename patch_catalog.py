import sys

def patch():
    with open('src/services/catalog.ts', 'r', encoding='utf-8') as f:
        content = f.read()
        
    helper_code = """
import { supabase } from "@/integrations/supabase/client";

async function fetchFromSupabaseWithPrices(queryBuilder: any, lojaId?: string | null): Promise<Produto[]> {
  const { data } = await queryBuilder;
  if (!data || data.length === 0) return [];

  const ids = data.map((p: any) => p.id);
  const { data: precos } = await supabase.from('produto_precos_loja').select('*').in('produto_id', ids);

  const state = useAdminProducts.getState();
  const overrides = state.storeProductOverrides?.[lojaId || ""] || {};

  const precosMap = new Map();
  if (precos) {
    precos.forEach(pr => {
      if (!precosMap.has(pr.produto_id)) precosMap.set(pr.produto_id, []);
      precosMap.get(pr.produto_id).push(pr);
    });
  }

  const finalProducts = data.map((p: any) => {
    const pPrecos = precosMap.get(p.id);
    if (pPrecos && pPrecos.length > 0) {
       p.precosPorLoja = {};
       p.estoquesPorLoja = {};
       pPrecos.forEach((pr: any) => {
          if (pr.loja_id) {
             p.precosPorLoja[pr.loja_id] = { precoDe: pr.preco_de || 0, precoPor: pr.preco_por || 0, ativo: pr.ativo ?? true };
             p.estoquesPorLoja[pr.loja_id] = pr.estoque || 0;
          }
       });
    }

    // Apply overrides
    const ov = lojaId ? overrides[p.id] || {} : {};
    const storePrice = lojaId ? p.precosPorLoja?.[lojaId] : null;
    const storeStock = lojaId ? p.estoquesPorLoja?.[lojaId] : null;

    const storeP = {
       ...p,
       ...ov,
    };
    if (lojaId) {
       storeP.precoPor = storePrice?.precoPor !== undefined ? storePrice.precoPor : (ov.precoPor !== undefined ? ov.precoPor : p.precoPor);
       storeP.precoDe = storePrice?.precoDe !== undefined ? storePrice.precoDe : (ov.precoDe !== undefined ? ov.precoDe : p.precoDe);
       storeP.estoque = storeStock !== undefined ? storeStock : (ov.estoque !== undefined ? ov.estoque : p.estoque);
       storeP.ativo = storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true));
       storeP.destaque = storePrice?.destaque !== undefined ? storePrice.destaque : (ov.destaque !== undefined ? ov.destaque : (p.destaque ?? false));
    }
    
    // Add default search string to avoid crashing other components
    storeP._searchString = String(storeP.nome || "").toLowerCase();
    
    // Fallback image mapping
    if (!storeP.imagemPrincipal && Array.isArray(storeP.imagens) && storeP.imagens.length > 0) {
       storeP.imagemPrincipal = storeP.imagens[0];
    }
    
    return storeP as Produto;
  });

  return finalProducts;
}
"""
    
    if "fetchFromSupabaseWithPrices" not in content:
        content = content.replace('import { useAdminProducts } from "@/stores/products";', 'import { useAdminProducts } from "@/stores/products";\n' + helper_code)

    old_vitrine = """  productsByVitrine: async (vitrineId: string, categoriaId: string, filters?: FilterOptions, produtoIds?: string[], lojaId?: string | null) => {
    await ensureHydrated();
    const all = getAllProdutos(lojaId);
    
    // If manual product IDs are provided, use those
    if (produtoIds && produtoIds.length > 0) {
      const idSet = new Set(produtoIds);
      const results = all.filter(p => idSet.has(p.id));
      return wait(applyFilters(results, filters));
    }

    let results = [];
    
    if (categoriaId === "all") {
      results = all;
    } else if (categoriaId === "ofertas" || categoriaId === "campanha") {
      results = all.filter(p => isCampanhaAtiva(p));
    } else if (categoriaId === "destaques") {
      results = all.filter(p => p.destaque);
    } else if (categoriaId === "novidades") {
      results = all.filter(p => p.isNovo);
    } else if (categoriaId === "protetores") {
      results = all.filter(p => String(p.nome).toLowerCase().includes("protetor") || String(p.nome).toLowerCase().includes("solar"));
    } else {
      const categorias = getCategorias();
      const validCategoryIds = [categoriaId, ...categorias.filter(c => c.parentId === categoriaId).map(c => c.id)];
      results = all.filter(
        (p) =>
          validCategoryIds.includes(p.categoriaId) ||
          (p.subcategoriaId && validCategoryIds.includes(p.subcategoriaId))
      );
    }
    
    // Default sorting for vitrines: newest first, unless it's a specific logic
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return wait(applyFilters(results, filters).slice(0, 50)); // Limit to 50 items for vitrines
  },"""
  
    new_vitrine = """  productsByVitrine: async (vitrineId: string, categoriaId: string, filters?: FilterOptions, produtoIds?: string[], lojaId?: string | null) => {
    await ensureHydrated();
    const allLoaded = useAdminProducts.getState()._loaded;

    if (!allLoaded) {
      let query = supabase.from('produtos').select('*');
      if (produtoIds && produtoIds.length > 0) {
        query = query.in('id', produtoIds);
      } else if (categoriaId === "destaques") {
        query = query.eq('destaque', true).limit(50);
      } else if (categoriaId === "novidades") {
        query = query.eq('isNovo', true).limit(50);
      } else if (categoriaId === "ofertas" || categoriaId === "campanha") {
        query = query.eq('emCampanha', true).limit(50);
      } else if (categoriaId === "all") {
        query = query.order('nivelRelevancia', { ascending: false }).limit(50);
      } else {
        query = query.eq('categoriaId', categoriaId).limit(50);
      }
      
      const products = await fetchFromSupabaseWithPrices(query, lojaId);
      return wait(applyFilters(products, filters));
    }

    const all = getAllProdutos(lojaId);
    
    // If manual product IDs are provided, use those
    if (produtoIds && produtoIds.length > 0) {
      const idSet = new Set(produtoIds);
      const results = all.filter(p => idSet.has(p.id));
      return wait(applyFilters(results, filters));
    }

    let results = [];
    
    if (categoriaId === "all") {
      results = all;
    } else if (categoriaId === "ofertas" || categoriaId === "campanha") {
      results = all.filter(p => isCampanhaAtiva(p));
    } else if (categoriaId === "destaques") {
      results = all.filter(p => p.destaque);
    } else if (categoriaId === "novidades") {
      results = all.filter(p => p.isNovo);
    } else if (categoriaId === "protetores") {
      results = all.filter(p => String(p.nome).toLowerCase().includes("protetor") || String(p.nome).toLowerCase().includes("solar"));
    } else {
      const categorias = getCategorias();
      const validCategoryIds = [categoriaId, ...categorias.filter(c => c.parentId === categoriaId).map(c => c.id)];
      results = all.filter(
        (p) =>
          validCategoryIds.includes(p.categoriaId) ||
          (p.subcategoriaId && validCategoryIds.includes(p.subcategoriaId))
      );
    }
    
    // Default sorting for vitrines: newest first, unless it's a specific logic
    results.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    return wait(applyFilters(results, filters).slice(0, 50)); // Limit to 50 items for vitrines
  },"""
  
    content = content.replace(old_vitrine, new_vitrine)
    
    with open('src/services/catalog.ts', 'w', encoding='utf-8') as f:
        f.write(content)

patch()
