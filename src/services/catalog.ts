import Fuse from "fuse.js";
import { useAdminCategories } from "@/stores/categories";
import { useMarcasStore } from "@/stores/marcas";

import { useAdmin } from "@/stores/admin";
import type { Produto, Categoria, Loja } from "@/types";
import { removeAccents, isCampanhaAtiva } from "@/lib/utils";
import { checkIsGenerico } from "@/lib/format";
import { useAdminProducts, mapRowToProduto } from "@/stores/products";
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

  const finalProducts = data.map((rawP: any) => {
    // 1. Mapeia a linha crua do banco para o tipo Produto (isso conserta os preços zerados, pois p.preco_por -> p.precoPor)
    const p = mapRowToProduto(rawP);

    // 2. Vincula os preços das lojas
    const pPrecos = precosMap.get(p.id);
    if (pPrecos && pPrecos.length > 0) {
       p.precosPorLoja = {};
       p.estoquesPorLoja = {};
       pPrecos.forEach((pr: any) => {
          if (pr.loja_id) {
             p.precosPorLoja![pr.loja_id] = { precoDe: pr.preco_de || 0, precoPor: pr.preco_por || 0, ativo: pr.ativo ?? true };
             p.estoquesPorLoja![pr.loja_id] = pr.estoque || 0;
          }
       });
    }

    // 3. Aplica regras e overrides locais
    const ov = lojaId ? overrides[p.id] || {} : {};
    const storePrice = lojaId ? p.precosPorLoja?.[lojaId] : null;
    const storeStock = lojaId ? p.estoquesPorLoja?.[lojaId] : null;

    const storeP = { ...p, ...ov };
    if (lojaId) {
       storeP.precoPor = storePrice?.precoPor !== undefined ? storePrice.precoPor : (ov.precoPor !== undefined ? ov.precoPor : p.precoPor);
       storeP.precoDe = storePrice?.precoDe !== undefined ? storePrice.precoDe : (ov.precoDe !== undefined ? ov.precoDe : p.precoDe);
       // Use store stock if > 0, otherwise fall back to global estoque
       const resolvedStock = (storeStock !== undefined && storeStock !== null && storeStock > 0) 
         ? storeStock 
         : (ov.estoque !== undefined && ov.estoque > 0 ? ov.estoque : (p.estoque || 0));
       storeP.estoque = resolvedStock;
       storeP.ativo = storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true));
       storeP.destaque = storePrice?.destaque !== undefined ? storePrice.destaque : (ov.destaque !== undefined ? ov.destaque : (p.destaque ?? false));
    }
    
    (storeP as any)._searchString = String(storeP.nome || "").toLowerCase();
    
    if (!(storeP as any).imagemPrincipal && Array.isArray(storeP.imagens) && storeP.imagens.length > 0) {
       (storeP as any).imagemPrincipal = storeP.imagens[0];
    }
    
    return enforceHealthServicesCategory(enhanceProduct(storeP as Produto));
  }).filter((p: any) => p && p.ativo !== false);

  return finalProducts;
}

export const getCategorias = () => {
  const baseCats = useAdminCategories.getState().categories;
  const marcas = useMarcasStore.getState().marcas.filter(m => m.ativo);
  
  // Transform marcas into categories (parentId: "300")
  const marcasCats = marcas.map(m => ({
    id: m.id,
    nome: m.nome,
    slug: m.seoUrl || m.slug,
    parentId: "300",
    descricaoHtml: `<p>${m.descricao}</p>`,
    ativa: m.ativo,
    destaque: m.destaque
  }));

  // Remove old hardcoded marcas (id 301-306) and any custom ones under 300
  const filteredBase = baseCats.filter(c => c.parentId !== "300");
  
  return [...filteredBase, ...marcasCats];
};

// Products now come entirely from useAdminProducts store (backed by Supabase)

// Helper to format product names (Sentence case)
function formatProductName(name: any): string {
  if (!name || typeof name !== 'string') return String(name || '');
  const lower = name.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

// Helper to inject variations and fix properties dynamically
function enhanceProduct(p: Produto): Produto {
  if (!p) return p;
  const newP = { ...p, nome: formatProductName(p?.nome) };

  // Create search variations
  const tags: string[] = Array.isArray(newP.internalTags) ? [...newP.internalTags] : [];
  const n = String(newP.nome || "").toLowerCase();

  // Variations dictionary (can be expanded easily)
  const variations: Record<string, string[]> = {
    "mounjaro": ["caneta emagrecedora", "emagrecer", "emagrecimento", "diabetes"],
    "ozempic": ["caneta emagrecedora", "emagrecer", "emagrecimento", "diabetes"],
    "saxenda": ["caneta emagrecedora", "emagrecer", "emagrecimento"],
    "wegovy": ["caneta emagrecedora", "emagrecer", "emagrecimento"],
    "neosoro": ["nariz entupido", "descongestionante nasal", "solução nasal"],
    "naridrin": ["nariz entupido", "descongestionante nasal", "solução nasal"],
    "aerolin": ["falta de ar", "asma", "bombinha", "salbutamol", "bronquite"],
    "dipirona": ["dor de cabeca", "febre", "analgesico", "dor no corpo"],
    "dorflex": ["dor muscular", "relaxante muscular", "dor nas costas"],
    "epocler": ["figado", "ressaca", "digestao", "estomago"],
  };

  for (const [key, aliases] of Object.entries(variations)) {
    if (n.includes(key)) {
      tags.push(...aliases);
    }
  }

  newP.internalTags = Array.from(new Set(tags));

  // Fix Mounjaro properties (Tarja Vermelha e Retenção)
  if (n.includes("mounjaro")) {
    newP.tarja = "Vermelha";
    newP.retemReceita = true;
  }

  if (newP.url === "energy-guarana-santo-habito-com-60-saches-de-5g-42882620792") {
    newP.videoUrl = "https://cdn.awsli.com.br/2289/2289034/arquivos/saveclip-app_aqol6trxb9k_tgxhjtuskvxokt9bbfjzc2nyrr21fzq1u22-sihbqpia2hzq68evzkb.webm";
    newP.imagens = [
      "/produtos/energy-guarana-1.webp",
      "/produtos/energy-guarana-2.webp",
      "/produtos/energy-guarana-3.webp"
    ];
  }

  // --- Mapeamento para Filtros Dinâmicos ---
  const dynamicFiltrosValores = Array.isArray(newP.filtrosValores) ? [...newP.filtrosValores] : [];
  
  // Genérico
  if (newP.generico !== undefined) {
    if (newP.generico === true) {
      if (!dynamicFiltrosValores.some(f => f.filtroId === 'gen')) dynamicFiltrosValores.push({ filtroId: 'gen', opcaoId: 'gen-sim' });
    } else {
      if (!dynamicFiltrosValores.some(f => f.filtroId === 'gen')) dynamicFiltrosValores.push({ filtroId: 'gen', opcaoId: 'gen-nao' });
    }
  }

  // Receita Médica
  if (newP.retemReceita !== undefined) {
    if (newP.retemReceita === true) {
      if (!dynamicFiltrosValores.some(f => f.filtroId === 'rec')) dynamicFiltrosValores.push({ filtroId: 'rec', opcaoId: 'rec-retem' });
    } else {
      if (!dynamicFiltrosValores.some(f => f.filtroId === 'rec')) dynamicFiltrosValores.push({ filtroId: 'rec', opcaoId: 'rec-naoretem' });
    }
  }

  // Tarja
  if (newP.tarja) {
    const tLow = newP.tarja.toLowerCase().trim();
    if (!dynamicFiltrosValores.some(f => f.filtroId === 'tarja')) {
      if (tLow.includes('vermelha')) dynamicFiltrosValores.push({ filtroId: 'tarja', opcaoId: 'tarja-verm' });
      else if (tLow.includes('preta')) dynamicFiltrosValores.push({ filtroId: 'tarja', opcaoId: 'tarja-preta' });
      else if (tLow.includes('amarela')) dynamicFiltrosValores.push({ filtroId: 'tarja', opcaoId: 'tarja-amar' });
      else if (tLow === 'n' || tLow.includes('sem tarja')) dynamicFiltrosValores.push({ filtroId: 'tarja', opcaoId: 'tarja-sem' });
    }
  } else if (!dynamicFiltrosValores.some(f => f.filtroId === 'tarja')) {
    dynamicFiltrosValores.push({ filtroId: 'tarja', opcaoId: 'tarja-sem' });
  }

  newP.filtrosValores = dynamicFiltrosValores;

  return newP;
}

// Helper to enforce Health Services logic on ANY product
function enforceHealthServicesCategory(p: Produto): Produto {
  if (!p || !p.nome) return p;
  const n = String(p.nome).toLowerCase();
  
  if ((n.includes("covid") || n.includes("vacina") || (/\bteste\b/.test(n) && !n.includes("gravidez") && !n.includes("(teste)"))) && !n.includes("aparelho") && !n.includes("medidor")) {
    p.categoriaId = "200";
    if (n.includes("vacina")) {
      p.subcategoriaId = "201";
    } else if (/\bteste\b/.test(n) || n.includes("covid")) {
      p.subcategoriaId = "202";
    }
  }
  return p;
}



// Await hydration helper
async function ensureHydrated() {
  if (!useAdminProducts.persist || useAdminProducts.persist.hasHydrated()) {
    return;
  }
  return new Promise<void>((resolve) => {
    const unsub = useAdminProducts.persist.onFinishHydration(() => {
      resolve();
      unsub();
    });
    // Fallback in case it hangs
    setTimeout(() => {
      resolve();
      unsub();
    }, 500);
  });
}

let cachedProdutos: Produto[] | null = null;
let cachedFuse: Fuse<Produto> | null = null;
let lastCustomProductsRef: any = null;

let storeCacheMap = new Map<string, {
  customProductsRef: any;
  removedRef: any;
  overridesRef: any;
  storeCustomRef: any;
  produtos: Produto[];
}>();

// Helper to get all merged products dynamically
export const getAllProdutos = (lojaId?: string | null): Produto[] => {
  const storeState = useAdminProducts.getState();
  
  if (!lojaId) {
    if (cachedProdutos && lastCustomProductsRef === storeState.customProducts) {
      return cachedProdutos;
    }
  } else {
    const cached = storeCacheMap.get(lojaId);
    if (
      cached &&
      cached.customProductsRef === storeState.customProducts &&
      cached.removedRef === storeState.storeRemovedProductIds?.[lojaId] &&
      cached.overridesRef === storeState.storeProductOverrides?.[lojaId] &&
      cached.storeCustomRef === storeState.storeCustomProducts?.[lojaId]
    ) {
      return cached.produtos;
    }
  }
  
  const storeEffective = storeState.getStoreEffectiveProducts(lojaId) || [];
  
  // Products now come directly from the store (Supabase-backed)
  const map = new Map<string, Produto>();
  
  // Apply store effective products (general from Supabase + store custom + store overrides)
  storeEffective.filter(p => p && p.ativo !== false).forEach(p => {
    const enhanced = enhanceProduct(p);
    map.set(enhanced.id, enforceHealthServicesCategory(enhanced));
  });
  
  const merged = Array.from(map.values())
    .filter(p => p && p.id)
    .sort((a, b) => (b.nivelRelevancia || 0) - (a.nivelRelevancia || 0));
  
  // Pre-calculate search strings for faster exact matching
  merged.forEach((p: any) => {
    const n = removeAccents(String(p.nome || "").toLowerCase());
    const tags = (p.internalTags || []).map((t: string) => removeAccents(String(t || "").toLowerCase()));
    const pa = removeAccents(String(p.principiosAtivos || "").toLowerCase());
    const fab = removeAccents(String(p.marca || "").toLowerCase());
    const terms = removeAccents(String(p.termosPesquisa || "").toLowerCase());
    const desc = removeAccents(String(p.descricao || "").toLowerCase());
    const brand = removeAccents(String(p.marca || "").toLowerCase());
    p._searchString = [n, ...tags, pa, fab, terms, desc, brand].join(" ");
  });
  
  if (!lojaId) {
    cachedProdutos = merged;
    cachedFuse = null; // Invalidate fuse when products change
    lastCustomProductsRef = storeState.customProducts;
  } else {
    storeCacheMap.set(lojaId, {
      customProductsRef: storeState.customProducts,
      removedRef: storeState.storeRemovedProductIds?.[lojaId],
      overridesRef: storeState.storeProductOverrides?.[lojaId],
      storeCustomRef: storeState.storeCustomProducts?.[lojaId],
      produtos: merged
    });
  }
  
  return merged;
};

const wait = <T,>(v: T, ms = 0) => new Promise<T>((r) => setTimeout(() => r(v), ms));

// Fuzzy search index — typo-tolerant
const getFuse = () => {
  const produtos = getAllProdutos();
  if (cachedFuse) return cachedFuse;

  cachedFuse = new Fuse(produtos, {
    keys: [
      { name: "nome", weight: 4.0 },
      { name: "termosPesquisa", weight: 3.5 },
      { name: "internalTags", weight: 3.0 },
      { name: "principiosAtivos", weight: 2.5 },
      { name: "ean", weight: 2.0 },
      { name: "marca", weight: 1.5 },
      { name: "marca", weight: 1.0 },
      { name: "descricao", weight: 0.5 },
      { name: "resumoDescricao", weight: 0.5 },
    ],
    threshold: 0.45, // Mais tolerante a erros de ortografia
    ignoreLocation: true, // Ignora a posição da palavra
    ignoreFieldNorm: true, // Não penaliza campos muito grandes como a descrição inteira
    minMatchCharLength: 2,
    useExtendedSearch: true,
  });
  return cachedFuse;
};

export interface FilterOptions {
  marcas?: string[];
  generico?: string; // "sim" or "nao"
  receita?: string; // "retem" or "nao_retem"
  tarjas?: string[]; // "Preta", "Vermelha", "Sem Tarja", etc.
  minPrice?: number;
  maxPrice?: number;
  dinamicos?: Record<string, string[]>; // { filtroId: [opcaoId1, opcaoId2] }
  page?: number;
  pageSize?: number;
}

function applyFilters(produtos: Produto[], filters?: FilterOptions): Produto[] {
  if (!filters) return produtos;

  return produtos.filter((p) => {
    // 1. Marca
    if (filters.marcas && filters.marcas.length > 0) {
      const pMarca = String(p.marca || p.marca || "").toLowerCase().trim();
      const matchBrand = filters.marcas.some(m => pMarca === String(m).toLowerCase().trim());
      if (!matchBrand) return false;
    }

    // 2. Genérico
    if (filters.generico) {
      if (filters.generico === "sim" && !checkIsGenerico(p)) return false;
      if (filters.generico === "nao" && checkIsGenerico(p)) return false;
    }

    // 3. Receita
    if (filters.receita) {
      if (filters.receita === "retem" && !p.retemReceita) return false;
      if (filters.receita === "nao_retem" && p.retemReceita) return false;
    }

    // 4. Tarja
    if (filters.tarjas && filters.tarjas.length > 0) {
      const pTarja = String(p.tarja || "Sem Tarja").toLowerCase().trim();
      const matchTarja = filters.tarjas.some(t => {
        const tLow = String(t).toLowerCase().trim();
        if (tLow === "sem tarja" && (pTarja === "n" || pTarja === "sem tarja" || pTarja === "")) return true;
        return pTarja.includes(tLow);
      });
      if (!matchTarja) return false;
    }

    // 5. Preço
    if (filters.minPrice !== undefined && p.precoPor < filters.minPrice) return false;
    if (filters.maxPrice !== undefined && p.precoPor > filters.maxPrice) return false;

    // 6. Filtros Dinâmicos
    if (filters.dinamicos) {
      for (const [filtroId, opcoesSelecionadas] of Object.entries(filters.dinamicos)) {
        if (!opcoesSelecionadas || opcoesSelecionadas.length === 0) continue;
        
        // Verifica se o produto tem alguma das opcoes selecionadas para este filtroId
        const matchDynamic = (p.filtrosValores || []).some(fv => 
          fv.filtroId === filtroId && opcoesSelecionadas.includes(fv.opcaoId)
        );
        
        if (!matchDynamic) return false;
      }
    }

    return true;
  });
}

export const catalog = {
  listProducts: async (filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;

    let query = supabase.from('produtos').select('*').range(page * pageSize, (page + 1) * pageSize - 1);
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    
    // Prioritizes products with stock > 0
    products.sort((a, b) => {
      const stockA = a.estoque || 0;
      const stockB = b.estoque || 0;
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockB > 0 && stockA <= 0) return 1;
      return 0;
    });

    return applyFilters(products, filters);
  },
  async listCategories(includeEmpty = true): Promise<Categoria[]> {
    await ensureHydrated();
    const categorias = getCategorias();
    if (includeEmpty) return wait(categorias);
    const usedIds = new Set(await catalog.getUsedCategoriesIds());
    return wait(categorias.filter((c) => usedIds.has(c.id)));
  },
  async listMainCategories(includeEmpty = true): Promise<Categoria[]> {
    await ensureHydrated();
    const categorias = getCategorias();
    if (includeEmpty) return wait(categorias.filter((c) => !c.parentId));
    const usedIds = new Set(await catalog.getUsedCategoriesIds());
    return wait(categorias.filter((c) => !c.parentId && usedIds.has(c.id)));
  },
  async listSubcategories(parentId: string, includeEmpty = true): Promise<Categoria[]> {
    await ensureHydrated();
    const categorias = getCategorias();
    if (includeEmpty) return wait(categorias.filter((c) => c.parentId === parentId));
    const usedIds = new Set(await catalog.getUsedCategoriesIds());
    return wait(categorias.filter((c) => c.parentId === parentId && usedIds.has(c.id)));
  },
  async getCategoryBySlug(slug: string): Promise<Categoria | null> {
    await ensureHydrated();
    const categorias = getCategorias();
    return wait(categorias.find((c) => c && c.slug === slug) ?? null);
  },
  async getCategoryById(id: string): Promise<Categoria | null> {
    await ensureHydrated();
    const categorias = getCategorias();
    return wait(categorias.find((c) => c && c.id === id) ?? null);
  },
  getProductBySlug: async (slugOrId: string, lojaId?: string | null) => {
    await ensureHydrated();

    // Search by URL first
    let query = supabase.from('produtos').select('*').eq('slug', slugOrId).limit(1);
    let products = await fetchFromSupabaseWithPrices(query, lojaId);
    
    if (products.length === 0) {
      // Try by ID
      query = supabase.from('produtos').select('*').eq('id', slugOrId).limit(1);
      products = await fetchFromSupabaseWithPrices(query, lojaId);
    }
    
    if (products.length > 0) return { ...products[0] };

    const local = useAdminProducts.getState().customProducts.find(p => p.url === slugOrId || String(p.id) === slugOrId);
    if (local) return enforceHealthServicesCategory(enhanceProduct(local));

    return null;
  },
  getProductById: async (id: string, lojaId?: string | null) => {
    await ensureHydrated();

    const query = supabase.from('produtos').select('*').eq('id', id).limit(1);
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    if (products.length > 0) return { ...products[0] };

    const local = useAdminProducts.getState().customProducts.find(p => String(p.id) === id);
    if (local) return enforceHealthServicesCategory(enhanceProduct(local));

    return null;
  },
  getProduct: async (id: string, lojaId?: string | null) => {
    await ensureHydrated();

    const query = supabase.from('produtos').select('*').eq('id', id).limit(1);
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    if (products.length > 0) return { ...products[0] };

    const local = useAdminProducts.getState().customProducts.find(p => String(p.id) === id);
    if (local) return enforceHealthServicesCategory(enhanceProduct(local));

    return null;
  },
  productsByCategory: async (categoryId: string, filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();
    const categorias = getCategorias();
    const cat = categorias.find(c => c.id === categoryId);
    if (!cat) return [];

    let query = supabase.from('produtos').select('*');
    
    // Pagination params
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;
    const isOfertas = String(cat.nome || "").toLowerCase().includes("oferta") || String(cat.nome || "").toLowerCase().includes("promoç");

    if (categoryId === "300") {
        // Nossas marcas (Nativo) - Limitar pela marca no javascript por complexidade
        query = query.limit(500); 
    } else if (cat.parentId === "300") {
        query = query.ilike('nome', `%${cat.nome}%`);
    } else {
        const validCategoryIds = [categoryId, ...categorias.filter(c => c.parentId === categoryId).map(c => c.id)];
        query = query.in('categoria_id', validCategoryIds);
    }
    
    // Filtros base Supabase (para otimizar)
    if (isOfertas) {
      // query = query.eq('emCampanha', true);
    }

    // Aplica range
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    const activeProducts = products;
    
    // Prioritizes products with stock > 0
    activeProducts.sort((a, b) => {
      const stockA = a.estoque || 0;
      const stockB = b.estoque || 0;
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockB > 0 && stockA <= 0) return 1;
      return 0;
    });

    let results = activeProducts;
    if (categoryId === "300") {
        const subCategorias = categorias.filter(c => c.parentId === "300");
        const namesToMatch = subCategorias.map(c => removeAccents(c.nome.toLowerCase()));
        results = activeProducts.filter(p => {
          const nome = removeAccents(String(p.nome).toLowerCase());
          return namesToMatch.some(brand => nome.includes(brand));
        });
    }
    
    return applyFilters(results, filters);
  },
  productsByVitrine: async (vitrineId: string, categoriaId: string, filters?: FilterOptions, produtoIds?: string[], lojaId?: string | null) => {
    await ensureHydrated();
    
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;

    let query = supabase.from('produtos').select('*');

    if (produtoIds && produtoIds.length > 0) {
      query = query.in('id', produtoIds);
    } else if (categoriaId === "destaques") {
      query = query.eq('destaque', true).order('nivel_relevancia', { ascending: false, nullsFirst: false });
    } else if (categoriaId === "novidades") {
      query = query.order('id', { ascending: false });
    } else if (categoriaId === "ofertas" || categoriaId === "campanha" || categoriaId === "all") {
      query = query.order('nivel_relevancia', { ascending: false, nullsFirst: false });
    } else if (categoriaId === "protetores") {
      query = query.ilike('nome', '%protetor%'); // or %solar%
    } else {
      const categorias = getCategorias();
      const validCategoryIds = [categoriaId, ...categorias.filter(c => String(c.parentId) === String(categoriaId)).map(c => c.id)];
      query = query.in('categoria_id', validCategoryIds);
    }

    // Aplica paginação
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const baseProducts = await fetchFromSupabaseWithPrices(query, lojaId);

    // Filtra inativos
    const activeProducts = baseProducts.filter(p => p && p.ativo !== false);

    // Prioritizes products with stock > 0
    activeProducts.sort((a, b) => {
      const stockA = a.estoque || 0;
      const stockB = b.estoque || 0;
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockB > 0 && stockA <= 0) return 1;
      return 0;
    });

    return applyFilters(activeProducts, filters);
  },
  productsByBrand: async (brandName: string, filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;
    
    let query = supabase.from('produtos').select('*').ilike('marca', brandName).range(page * pageSize, (page + 1) * pageSize - 1);
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    return applyFilters(products, filters);
  },
  // Uses deterministic seed so results are stable across re-renders
  crossSell: async (cartIds: string[], limit = 4, referenceCategoryId?: string) => {
    await ensureHydrated();
    const settings = useAdmin.getState().compreJuntoSettings;
    
    if (settings && !settings.active) {
      return wait([]);
    }

    let query = supabase.from('produtos').select('*').neq('categoria_id', '142');
    if (cartIds.length > 0) {
      // Supabase not.in filter doesn't support empty arrays, so check first
      query = query.not('id', 'in', `(${cartIds.join(',')})`);
    }

    if (settings) {
      query = query.lte('preco_por', settings.maxPrice);
      
      if (settings.categoryId !== "all") {
        query = query.ilike('subcategoria_id', `${settings.categoryId}%`);
      } else if (referenceCategoryId && referenceCategoryId !== "142") {
        query = query.eq('categoria_id', referenceCategoryId);
      }
    }

    // Limit to 50 and then shuffle locally for randomness
    query = query.limit(50);
    const products = await fetchFromSupabaseWithPrices(query);
    let others = products;

    const seedStr = cartIds.sort().join(",");
    let seed = 0;
    for (let i = 0; i < seedStr.length; i++) {
      seed = seedStr.charCodeAt(i) + ((seed << 5) - seed);
    }
    const seededRandom = () => {
      seed = (seed * 16807 + 0) % 2147483647;
      return (seed & 0x7fffffff) / 0x7fffffff;
    };
    for (let i = others.length - 1; i > 0; i--) {
      const j = Math.floor(seededRandom() * (i + 1));
      [others[i], others[j]] = [others[j], others[i]];
    }
    return wait(others.slice(0, limit));
  },
  getOrderBumps: async (): Promise<Produto[]> => {
    await ensureHydrated();
    
    let query = supabase.from('produtos').select('*').contains('internal_tags', ['orderBump']).limit(4);
    const tagged = await fetchFromSupabaseWithPrices(query);
    if (tagged.length > 0) return wait(tagged);

    const settings = useAdmin.getState().orderBumpSettings;
    if (settings && settings.active) {
      let q2 = supabase.from('produtos').select('*')
        .lte('preco_por', settings.maxPrice)
        .gt('preco_por', 0);
      
      if (settings.categoryId !== "all") {
        q2 = q2.ilike('subcategoria_id', `${settings.categoryId}%`);
      }
      const pList = await fetchFromSupabaseWithPrices(q2);
      return wait(pList.slice(0, 4));
    }
    
    return wait([]);
  },
  searchWithSuggestions: async (q: string, filters?: FilterOptions, lojaId?: string | null): Promise<{ results: Produto[], didYouMean?: string }> => {
    await ensureHydrated();
    
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;

    if (!q || q.length < 2) {
      if (filters && Object.keys(filters).length > 0) {
        let query = supabase.from('produtos').select('*').range(page * pageSize, (page + 1) * pageSize - 1);
        const products = await fetchFromSupabaseWithPrices(query, lojaId);
        return { results: applyFilters(products, filters) };
      }
      return { results: [] };
    }

    let query = supabase.from('produtos').select('*');
    if (/^\d+$/.test(q)) {
      query = query.or(`ean.eq.${q},id.eq.${q}`);
    } else {
      query = query.ilike('nome', `%${q}%`);
    }
    
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);
    
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    return { results: applyFilters(products, filters), didYouMean: undefined };
  },
  adminSearchProducts: async (params: { search: string, page: number, pageSize: number, listFilter: string, lojaId?: string | null }) => {
    let query = supabase.from('produtos').select('*', { count: 'exact' });
    
    if (params.search) {
      if (/^\d+$/.test(params.search)) {
        query = query.or(`ean.eq.${params.search},id.eq.${params.search}`);
      } else {
        query = query.ilike('nome', `%${params.search}%`);
      }
    }

    if (params.listFilter === "active") {
      query = query.eq('ativo', true);
    } else if (params.listFilter === "inactive") {
      query = query.eq('ativo', false);
    } else if (params.listFilter === "featured") {
      query = query.eq('destaque', true);
    } else if (params.listFilter === "prescription") {
      query = query.eq('retem_receita', true);
    } else if (params.listFilter === "generic") {
      query = query.eq('generico', true);
    } else if (params.listFilter === "cat1") {
      query = query.eq('categoria_id', '142');
    } else if (params.listFilter === "not-cat1") {
      query = query.neq('categoria_id', '142');
    }

    query = query.range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1).order('id', { ascending: false });

    const { data, error, count } = await query;
    if (error || !data) return { results: [], count: 0 };
    
    // Convert to Produto and inject prices without filtering out stock
    const products = await fetchFromSupabaseWithPrices(
      // We pass a dummy query to fetchFromSupabaseWithPrices since we already fetched data.
      // Wait, fetchFromSupabaseWithPrices takes a query builder.
      // We can just create a new query with `.in('id', data.map(d => d.id))` to let it do the price joining.
      supabase.from('produtos').select('*').in('id', data.map(d => d.id)).order('id', { ascending: false }),
      params.lojaId
    );

    // Reorder products back to match `data` order (if needed, but id desc is fine)
    
    // For stock filtering, since it's hard to do purely via Supabase without RPC:
    // If the user wants `out-of-stock`, we should ideally just do local filtering if we can't do it server side easily. 
    // But since `loadProducts` is removed, we'll return what we have for now and handle `out-of-stock` locally by fetching more pages if needed, 
    // or just say "stock filter requires full export" for now. The simplest is to return the paginated items.
    
    return { results: products, count: count || 0 };
  },
  search: async (q: string, filters?: FilterOptions, lojaId?: string | null) => {
    const { results } = await catalog.searchWithSuggestions(q, filters, lojaId);
    return results;
  },
  featured: async (lojaId?: string | null) => {
    await ensureHydrated();
    let query = supabase.from('produtos').select('*').eq('destaque', true).limit(12);
    const comDestaqueAll = await fetchFromSupabaseWithPrices(query, lojaId);
    const comDestaque = comDestaqueAll;
    
    if (comDestaque.length < 12) {
      const needed = 12 - comDestaque.length;
      let queryFallback = supabase.from('produtos').select('*').eq('destaque', false).limit(needed * 2); // fetch more to account for stock filtering
      const fallbackAll = await fetchFromSupabaseWithPrices(queryFallback, lojaId);
      const fallback = fallbackAll.slice(0, needed);
      return [...comDestaque, ...fallback];
    }
    
    return comDestaque;
  },
  getUsedCategoriesIds: async (): Promise<string[]> => {
    await ensureHydrated();
    const categorias = getCategorias();
    return categorias.map(c => c.id);
  },
  listStores: (): Promise<Loja[]> => {
    // Typecast from Pharmacy to Loja is mostly compatible for the mockup purposes,
    // but they might have slight differences.
    const pharmacies = useAdmin.getState().pharmacies;
    const active = pharmacies.filter((p: any) => p.ativo !== false) as unknown as Loja[];
    return wait(active);
  },
  activeStore: (): Promise<Loja> => {
    const pharmacies = useAdmin.getState().pharmacies;
    const active = pharmacies.filter((p: any) => p.ativo !== false) as unknown as Loja[];
    return wait(active[0] || (pharmacies[0] as unknown as Loja));
  },
};

