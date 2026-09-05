import Fuse from "fuse.js";
import { useAdminCategories } from "@/stores/categories";
import { useMarcasStore } from "@/stores/marcas";

import { useAdmin } from "@/stores/admin";
import type { Produto, Categoria, Loja } from "@/types";
import { removeAccents, isCampanhaAtiva } from "@/lib/utils";
import { checkIsGenerico } from "@/lib/format";
import { useAdminProducts, mapRowToProduto } from "@/stores/products";
import { supabase } from "@/integrations/supabase/client";
import { analyzeSearchQuery, rankProductsBySearch } from "@/lib/searchEngine";
import { getDeterministicStock } from "@/lib/stock";

async function fetchFromSupabaseWithPrices(queryBuilder: any, lojaId?: string | null, includeInactive = false): Promise<Produto[]> {
  const timeoutMs = 10000;
  
  try {
    const response: any = await Promise.race([
      queryBuilder,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Query Timeout")), timeoutMs))
    ]);
    
    if (response?.error) {
      console.warn("Supabase fetch error:", response.error);
      return [];
    }
    
    const data = response?.data;
    if (!data || data.length === 0) return [];

    const ids = data.map((p: any) => p.id);
    
    let precosQuery = supabase
      .from('produto_precos_loja')
      .select('produto_id, loja_id, preco_de, preco_por, estoque, ativo, destaque')
      .in('produto_id', ids);
    
    if (lojaId) {
      precosQuery = precosQuery.eq('loja_id', lojaId);
    }

    const precosResponse: any = await Promise.race([
      precosQuery,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Supabase Precos Query Timeout")), timeoutMs))
    ]);

    const precos = precosResponse?.data;

    const state = useAdminProducts.getState();
    const overrides = state.storeProductOverrides?.[lojaId || ""] || {};

    const precosMap = new Map();
    if (precos) {
      precos.forEach((pr: any) => {
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
             const pPor = Number(pr.preco_por) || 0;
             const pDe = Number(pr.preco_de) || 0;
             p.precosPorLoja![pr.loja_id] = {
               precoDe: pDe > 0 ? pDe : (p.precoDe || p.precoPor || p.preco || 0),
               precoPor: pPor > 0 ? pPor : (p.precoPor || p.preco || 0),
               ativo: pr.ativo ?? true
             };
             p.estoquesPorLoja![pr.loja_id] = pr.estoque !== null && pr.estoque !== undefined ? Number(pr.estoque) : 0;
          }
       });
    }

    // 3. Aplica regras e overrides locais
    const ov = lojaId ? overrides[p.id] || {} : {};
    const storePrice = lojaId ? p.precosPorLoja?.[lojaId] : null;
    const storeStock = lojaId ? p.estoquesPorLoja?.[lojaId] : null;

    const storeP = { ...p, ...ov };
    if (lojaId) {
       const resolvedPrecoPor = (storePrice?.precoPor !== undefined && Number(storePrice.precoPor) > 0)
         ? Number(storePrice.precoPor)
         : (ov.precoPor !== undefined && Number(ov.precoPor) > 0 ? Number(ov.precoPor) : (p.precoPor || p.preco || 0));

       const resolvedPrecoDe = (storePrice?.precoDe !== undefined && Number(storePrice.precoDe) > 0)
         ? Number(storePrice.precoDe)
         : (ov.precoDe !== undefined && Number(ov.precoDe) > 0 ? Number(ov.precoDe) : (p.precoDe || resolvedPrecoPor));

       storeP.precoPor = resolvedPrecoPor;
       storeP.precoDe = resolvedPrecoDe;
       // Use store stock if explicitly set, otherwise fall back to global estoque
       const resolvedStock = (storeStock !== undefined && storeStock !== null) 
         ? storeStock 
         : (ov.estoque !== undefined && ov.estoque !== null ? ov.estoque : (p.estoque || 0));
       storeP.estoque = resolvedStock;
       storeP.ativo = storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true));
       storeP.destaque = storePrice?.destaque !== undefined ? storePrice.destaque : (ov.destaque !== undefined ? ov.destaque : (p.destaque ?? false));
    }
    
    (storeP as any)._searchString = String(storeP.nome || "").toLowerCase();
    
    if (!(storeP as any).imagemPrincipal && Array.isArray(storeP.imagens) && storeP.imagens.length > 0) {
       (storeP as any).imagemPrincipal = storeP.imagens[0];
    }
    
    return enforceHealthServicesCategory(enhanceProduct(storeP as Produto));
  }).filter((p: any) => p && (includeInactive || p.ativo !== false));

    return finalProducts;
  } catch (error) {
    console.warn("Unhandled error in fetchFromSupabaseWithPrices:", error);
    return [];
  }
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

// Helper to enforce Health Services logic ONLY when product nature is service
function enforceHealthServicesCategory(p: Produto): Produto {
  if (!p || !p.nome) return p;
  
  // Só deve aplicar categoria/subcategoria de serviços se a natureza do produto for serviço
  const isServico = p.tipoProduto === "servico" || 
    (p as any).produtoNatureza === "servico" || 
    (p as any).produto_natureza === "servico" || 
    (Array.isArray(p.selosIds) && p.selosIds.includes("servico"));

  if (!isServico) {
    // Se a natureza do produto NÃO for serviço, nunca deve ter categoria 200 (Serviços) ou subcategorias 201/202 forçadas
    if (p.categoriaId === "200") {
      p.categoriaId = "";
      if (p.subcategoriaId === "201" || p.subcategoriaId === "202") {
        p.subcategoriaId = "";
      }
    }
    return p;
  }

  // Se for serviço e ainda não tiver categoria definida, atribui categoria 200 (Serviços)
  if (!p.categoriaId) {
    p.categoriaId = "200";
  }
  if (p.categoriaId === "200" && !p.subcategoriaId) {
    const n = String(p.nome).toLowerCase();
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

const searchCacheMap = new Map<string, { data: { results: Produto[]; didYouMean?: string }; timestamp: number }>();

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
  
  // Pre-calculate search strings for faster exact matching across all fields
  merged.forEach((p: any) => {
    const n = removeAccents(String(p.nome || "").toLowerCase());
    const brand = removeAccents(String(p.marca || "").toLowerCase());
    const ean = [
      p.ean, p.ean2, p.ean3, p.sku, p.codigoInterno,
      ...(Array.isArray(p.eansSecundarios) ? p.eansSecundarios : [])
    ].filter(Boolean).map(e => String(e).toLowerCase()).join(" ");
    const anvisa = removeAccents(String(p.registroAnvisa || p.registro_anvisa || "").toLowerCase());
    const tarja = removeAccents(String(p.tarja || "").toLowerCase());
    const pa = Array.isArray(p.principiosAtivos)
      ? p.principiosAtivos.map((x: any) => typeof x === "string" ? x : `${x.nome || ""} ${x.concentracao || ""} ${x.dosagem || ""}`).join(" ")
      : String(p.principiosAtivos || "");
    const paClean = removeAccents(pa.toLowerCase());
    const tags = (p.internalTags || []).map((t: string) => removeAccents(String(t || "").toLowerCase()));
    const terms = removeAccents(String(p.termosPesquisa || "").toLowerCase());
    const desc = removeAccents(String(p.descricao || "").replace(/<[^>]*>?/gm, " ").toLowerCase());
    const resumo = removeAccents(String(p.resumoDescricao || "").toLowerCase());
    const ind = removeAccents(String(p.indicacaoTerapeutica || "").toLowerCase());
    const cls = removeAccents(String(p.classeTerapeutica || "").toLowerCase());
    const chars = Array.isArray(p.caracteristicas)
      ? p.caracteristicas.map((c: any) => typeof c === "string" ? c : `${c.titulo || ""} ${c.descricao || ""}`).join(" ")
      : "";
    const charsClean = removeAccents(chars.toLowerCase());

    p._searchString = [n, brand, ean, anvisa, tarja, paClean, ...tags, terms, desc, resumo, ind, cls, charsClean].join(" ");
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

// Fuzzy search index — typo-tolerant across all product fields
const getFuse = () => {
  const produtos = getAllProdutos();
  if (cachedFuse) return cachedFuse;

  cachedFuse = new Fuse(produtos, {
    keys: [
      { name: "nome", weight: 4.0 },
      { name: "ean", weight: 3.5 },
      { name: "eansSecundarios", weight: 3.0 },
      { name: "codigoInterno", weight: 3.0 },
      { name: "sku", weight: 3.0 },
      { name: "registroAnvisa", weight: 3.5 },
      { name: "marca", weight: 3.0 },
      { name: "principiosAtivos", weight: 3.5 },
      { name: "termosPesquisa", weight: 3.0 },
      { name: "tarja", weight: 2.5 },
      { name: "indicacaoTerapeutica", weight: 2.5 },
      { name: "classeTerapeutica", weight: 2.0 },
      { name: "caracteristicas.titulo", weight: 2.0 },
      { name: "caracteristicas.descricao", weight: 2.0 },
      { name: "internalTags", weight: 2.0 },
      { name: "resumoDescricao", weight: 1.5 },
      { name: "descricao", weight: 1.0 },
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

const vitrineCacheMap = new Map<string, { data: Produto[]; timestamp: number }>();
const VITRINE_CACHE_TTL = 45_000; // 45 segundos

const categoryCacheMap = new Map<string, { data: Produto[]; timestamp: number }>();
const CATEGORY_CACHE_TTL = 120_000; // 2 minutos

const topOrderedCacheMap = new Map<string, { data: string[]; timestamp: number }>();
const TOP_ORDERED_TTL = 60_000; // 1 minuto

export async function getTopOrderedProductIds(lojaId?: string | null): Promise<string[]> {
  const cacheKey = `top-ordered:${lojaId || 'all'}`;
  const cached = topOrderedCacheMap.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < TOP_ORDERED_TTL)) {
    return cached.data;
  }

  try {
    const res = await fetch(`/api/produtos/mais-pedidos${lojaId ? `?lojaId=${encodeURIComponent(lojaId)}` : ''}`);
    if (res.ok) {
      const json = await res.json();
      if (json && Array.isArray(json.productIds) && json.productIds.length > 0) {
        topOrderedCacheMap.set(cacheKey, { data: json.productIds, timestamp: Date.now() });
        return json.productIds;
      }
    }
  } catch (err) {
    // Ignore network/SSR error
  }

  // Fallback para pedidos salvos localmente
  if (typeof window !== "undefined") {
    try {
      const raw = localStorage.getItem("associadas-orders-storage");
      if (raw) {
        const localOrders = JSON.parse(raw);
        if (Array.isArray(localOrders) && localOrders.length > 0) {
          const salesMap = new Map<string, number>();
          localOrders.forEach((o: any) => {
            const status = (o.status || '').toLowerCase();
            if (status === 'cancelado' || status === 'recusado') return;
            if (lojaId && o.lojaId && o.lojaId !== lojaId) return;
            const items = o.itens || o.produtos || [];
            items.forEach((it: any) => {
              const pid = it.id || it.produto_id || it.sku;
              if (pid && typeof pid === 'string' && !pid.startsWith('SKU-')) {
                salesMap.set(pid, (salesMap.get(pid) || 0) + (it.qtd || it.quantidade || 1));
              }
            });
          });
          const localTopIds = Array.from(salesMap.entries())
            .sort((a, b) => b[1] - a[1])
            .map(e => e[0]);
          if (localTopIds.length > 0) {
            topOrderedCacheMap.set(cacheKey, { data: localTopIds, timestamp: Date.now() });
            return localTopIds;
          }
        }
      }
    } catch {}
  }

  return [];
}

const productDetailCache = new Map<string, { product: Produto; timestamp: number }>();
const PRODUCT_DETAIL_TTL = 180_000; // 3 minutos de cache instantâneo

const crossSellCache = new Map<string, { data: Produto[]; timestamp: number }>();
const CROSS_SELL_TTL = 300_000; // 5 minutos de cache

export const catalog = {
  listProducts: async (filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || (filters ? 24 : 1000);

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
  listAllProducts: async (lojaId?: string | null) => {
    await ensureHydrated();
    let query = supabase.from('produtos').select('*').limit(2000).order('nome', { ascending: true });
    return await fetchFromSupabaseWithPrices(query, lojaId, true);
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
    if (!slug) return wait(null);

    const cleanSlug = removeAccents(slug).toLowerCase().replace(/[^a-z0-9]/g, "");

    // 1. Match exato de slug
    let found = categorias.find((c) => c && c.slug === slug);
    if (found) return wait(found);

    // 2. Match por ID
    found = categorias.find((c) => c && String(c.id) === slug);
    if (found) return wait(found);

    // 3. Match de slug normalizado sem acentos ou traços
    found = categorias.find((c) => c && c.slug && removeAccents(c.slug).toLowerCase().replace(/[^a-z0-9]/g, "") === cleanSlug);
    if (found) return wait(found);

    // 4. Match pelo nome da categoria normalizado
    found = categorias.find((c) => c && c.nome && removeAccents(c.nome).toLowerCase().replace(/[^a-z0-9]/g, "") === cleanSlug);
    if (found) return wait(found);

    // 5. Mapeamento de sinônimos / atalhos comuns
    const aliases: Record<string, string[]> = {
      "medicamentos": ["medicamento", "remedio", "remedios", "farmacia", "dor-e-febre", "sistema-nervoso", "gripe-e-resfriado"],
      "higiene-e-cuidados": ["higiene", "cuidados", "higiene-bucal", "sabonetes", "corpo-e-banho", "desodorantes", "sabonetes-intimos"],
      "vitaminas-e-suplementos": ["vitaminas", "suplementos", "vitamina", "suplemento", "minerais", "multivitaminicos"],
      "dermocosm-ticos-e-beleza": ["dermocosmeticos-e-beleza", "dermocosmeticos", "beleza", "cosmeticos", "shampoos", "cabelos", "maquiagem"],
      "mam-e-e-beb": ["mamae-e-bebe", "bebe", "mamae", "fraldas", "infantil"],
      "sa-de-e-aparelhos": ["saude-e-aparelhos", "saude", "aparelhos", "ortopedia"],
      "conveni-ncia": ["conveniencia", "alimentos", "bebidas", "doces"],
      "nossas-marcas": ["marcas", "marcas-proprias", "nossasmarcas"]
    };

    for (const [canonicalSlug, aliasList] of Object.entries(aliases)) {
      const isAliasMatch = aliasList.some(a => {
        const cleanA = removeAccents(a).toLowerCase().replace(/[^a-z0-9]/g, "");
        return cleanSlug.includes(cleanA) || cleanA.includes(cleanSlug);
      });

      if (isAliasMatch) {
        found = categorias.find(c => c && (c.slug === canonicalSlug || removeAccents(c.slug || "").toLowerCase().replace(/[^a-z0-9]/g, "") === removeAccents(canonicalSlug).toLowerCase().replace(/[^a-z0-9]/g, "")));
        if (found) return wait(found);
      }
    }

    // 6. Match parcial em slug ou nome
    found = categorias.find((c) => c && (
      (c.slug && removeAccents(c.slug).toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanSlug)) ||
      (c.nome && removeAccents(c.nome).toLowerCase().replace(/[^a-z0-9]/g, "").includes(cleanSlug)) ||
      (c.slug && cleanSlug.includes(removeAccents(c.slug).toLowerCase().replace(/[^a-z0-9]/g, "")))
    ));
    if (found) return wait(found);

    return wait(null);
  },
  async getCategoryById(id: string): Promise<Categoria | null> {
    await ensureHydrated();
    const categorias = getCategorias();
    return wait(categorias.find((c) => c && c.id === id) ?? null);
  },
  getProductBySlug: async (slugOrId: string, lojaId?: string | null) => {
    if (!slugOrId) return null;
    const cleanKey = String(slugOrId).trim();
    const cacheKey = `${cleanKey}-${lojaId || 'global'}`;
    const cached = productDetailCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < PRODUCT_DETAIL_TTL)) {
      return { ...cached.product };
    }

    // Check in-memory custom products first for 0ms response
    const local = useAdminProducts.getState().customProducts.find(
      p => p.url === cleanKey || p.slug === cleanKey || String(p.id) === cleanKey
    );
    if (local && (!lojaId || local.precosPorLoja?.[lojaId])) {
      const res = enforceHealthServicesCategory(enhanceProduct(local));
      productDetailCache.set(cacheKey, { product: res, timestamp: Date.now() });
      return res;
    }

    await ensureHydrated();

    // 1. Busca direta por slug (mais comum e indexado)
    let query = supabase
      .from('produtos')
      .select('*')
      .eq('slug', cleanKey)
      .limit(1);

    let products = await fetchFromSupabaseWithPrices(query, lojaId);

    // 2. Se não encontrou por slug, tenta por id
    if (products.length === 0) {
      const idQuery = supabase
        .from('produtos')
        .select('*')
        .eq('id', cleanKey)
        .limit(1);
      products = await fetchFromSupabaseWithPrices(idQuery, lojaId);
    }

    // 3. Se não encontrou e for código de barras/EAN (números)
    if (products.length === 0 && /^\d{7,14}$/.test(cleanKey)) {
      const eanQuery = supabase
        .from('produtos')
        .select('*')
        .eq('ean', cleanKey)
        .limit(1);
      products = await fetchFromSupabaseWithPrices(eanQuery, lojaId);
    }

    // 4. Fallback final: busca case-insensitive por slug
    if (products.length === 0) {
      const ilikeQuery = supabase
        .from('produtos')
        .select('*')
        .ilike('slug', cleanKey.toLowerCase())
        .limit(1);
      products = await fetchFromSupabaseWithPrices(ilikeQuery, lojaId);
    }

    if (products.length > 0) {
      const result = { ...products[0] };
      productDetailCache.set(cacheKey, { product: result, timestamp: Date.now() });
      if (result.id) productDetailCache.set(`${result.id}-${lojaId || 'global'}`, { product: result, timestamp: Date.now() });
      if (result.slug) productDetailCache.set(`${result.slug}-${lojaId || 'global'}`, { product: result, timestamp: Date.now() });
      return result;
    }

    if (local) {
      const res = enforceHealthServicesCategory(enhanceProduct(local));
      productDetailCache.set(cacheKey, { product: res, timestamp: Date.now() });
      return res;
    }

    return null;
  },
  getProductById: async (id: string, lojaId?: string | null) => {
    if (!id) return null;
    const cleanId = String(id).trim();
    const cacheKey = `id-${cleanId}-${lojaId || 'global'}`;
    const cached = productDetailCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < PRODUCT_DETAIL_TTL)) {
      return { ...cached.product };
    }

    const local = useAdminProducts.getState().customProducts.find(p => String(p.id) === cleanId);
    if (local && (!lojaId || local.precosPorLoja?.[lojaId])) {
      const res = enforceHealthServicesCategory(enhanceProduct(local));
      productDetailCache.set(cacheKey, { product: res, timestamp: Date.now() });
      return res;
    }

    await ensureHydrated();

    const query = supabase.from('produtos').select('*').eq('id', cleanId).limit(1);
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
    if (products.length > 0) {
      const result = { ...products[0] };
      productDetailCache.set(cacheKey, { product: result, timestamp: Date.now() });
      return result;
    }

    if (local) {
      const res = enforceHealthServicesCategory(enhanceProduct(local));
      productDetailCache.set(cacheKey, { product: res, timestamp: Date.now() });
      return res;
    }

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
  getProductsByIds: async (ids: (string | number)[], lojaId?: string | null): Promise<Produto[]> => {
    if (!ids || ids.length === 0) return [];
    const cleanIds = Array.from(new Set(ids.map(id => String(id).trim()).filter(Boolean)));
    if (cleanIds.length === 0) return [];

    await ensureHydrated();

    let dbProducts: Produto[] = [];
    try {
      const query = supabase.from('produtos').select('*').in('id', cleanIds);
      dbProducts = await fetchFromSupabaseWithPrices(query, lojaId, true);
    } catch (err) {
      console.warn("Erro ao buscar produtos por IDs no Supabase:", err);
    }

    const foundMap = new Map<string, Produto>();
    dbProducts.forEach(p => {
      if (p && p.id) {
        foundMap.set(String(p.id).trim(), p);
      }
    });

    const storeState = useAdminProducts.getState();
    const allCustom = [
      ...(storeState.customProducts || []),
      ...(lojaId && storeState.storeCustomProducts?.[lojaId] ? storeState.storeCustomProducts[lojaId] : [])
    ];

    cleanIds.forEach(id => {
      if (!foundMap.has(id)) {
        const local = allCustom.find(p => String(p.id).trim() === id);
        if (local) {
          foundMap.set(id, enforceHealthServicesCategory(enhanceProduct(local)));
        }
      }
    });

    const results: Produto[] = [];
    cleanIds.forEach(id => {
      const p = foundMap.get(id);
      if (p) results.push(p);
    });

    return results;
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

    const cacheKey = `c:${categoryId}:${lojaId || 'all'}:${page}:${pageSize}`;
    const cachedEntry = categoryCacheMap.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < CATEGORY_CACHE_TTL)) {
      return applyFilters(cachedEntry.data, filters);
    }

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
        const marcasProprias = useMarcasStore.getState().marcas.filter(m => m.ativo !== false && m.marcaPropria === true);
        const marcasList = marcasProprias.length > 0 ? marcasProprias : [
          { nome: "Revitart" },
          { nome: "Santo Hábito" },
          { nome: "Revigore" },
          { nome: "Revimel" },
          { nome: "Crescendo" },
          { nome: "Vita Magna" },
        ];
        const namesToMatch = marcasList.map(m => removeAccents(m.nome.toLowerCase()));
        results = activeProducts.filter(p => {
          const nome = removeAccents(String(p.nome || "").toLowerCase());
          const marca = removeAccents(String(p.marca || "").toLowerCase());
          return namesToMatch.some(b => nome.includes(b) || marca.includes(b));
        });
    }
    
    categoryCacheMap.set(cacheKey, { data: results, timestamp: Date.now() });
    return applyFilters(results, filters);
  },
  productsByVitrine: async (vitrineId: string, categoriaId: string, filters?: FilterOptions, produtoIds?: string[], lojaId?: string | null) => {
    await ensureHydrated();
    
    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;

    const cacheKey = `v:${vitrineId}:${categoriaId}:${(produtoIds || []).join(',')}:${lojaId || 'all'}:${page}:${pageSize}`;
    const cachedEntry = vitrineCacheMap.get(cacheKey);
    if (cachedEntry && (Date.now() - cachedEntry.timestamp < VITRINE_CACHE_TTL)) {
      return applyFilters(cachedEntry.data, filters);
    }

    let query = supabase.from('produtos').select('*');
    let topOrderedIds: string[] = [];

    if (produtoIds && produtoIds.length > 0) {
      query = query.in('id', produtoIds);
    } else if (categoriaId === "destaques") {
      query = query.eq('destaque', true).order('nivel_relevancia', { ascending: false, nullsFirst: false });
    } else if (categoriaId === "ofertas") {
      // Vitrine Ofertas da Semana: reflete apenas produtos manuais destacados pela estrela no admin
      query = query.eq('destaque', true).order('nivel_relevancia', { ascending: false, nullsFirst: false });
    } else if (categoriaId === "novidades") {
      // Vitrine Novidades: única que recebe produtos recém-adicionados automaticamente
      query = query.order('created_at', { ascending: false, nullsFirst: false }).order('id', { ascending: false });
    } else if (categoriaId === "all" || categoriaId === "mais_pedidos" || String(vitrineId) === "3") {
      // Vitrine Mais pedidos / Mais vendidos: automático de acordo com os pedidos reais
      topOrderedIds = await getTopOrderedProductIds(lojaId);
      if (topOrderedIds.length > 0) {
        const pagedIds = topOrderedIds.slice(page * pageSize, (page + 1) * pageSize);
        if (pagedIds.length > 0) {
          query = query.in('id', pagedIds);
        } else {
          return [];
        }
      } else {
        // Fallback se ainda não houver pedidos: catálogo histórico com relevância (nunca novidades sem pedidos)
        query = query.gt('nivel_relevancia', 0).order('nivel_relevancia', { ascending: false });
      }
    } else if (categoriaId === "campanha") {
      query = query.eq('em_campanha', true).order('nivel_relevancia', { ascending: false, nullsFirst: false });
    } else if (categoriaId === "protetores") {
      query = query.ilike('nome', '%protetor%'); // or %solar%
    } else {
      const categorias = getCategorias();
      const validCategoryIds = [categoriaId, ...categorias.filter(c => String(c.parentId) === String(categoriaId)).map(c => c.id)];
      query = query.in('categoria_id', validCategoryIds);
    }

    // Aplica paginação quando não estiver filtrando por pagedIds
    if (!(categoriaId === "all" || categoriaId === "mais_pedidos" || String(vitrineId) === "3") || topOrderedIds.length === 0) {
      query = query.range(page * pageSize, (page + 1) * pageSize - 1);
    }

    const baseProducts = await fetchFromSupabaseWithPrices(query, lojaId);

    // Filtra inativos
    let activeProducts = baseProducts.filter(p => p && p.ativo !== false);

    // Para Ofertas da Semana sem produtoIds explícitos, garante que somente produtos com destaque ativo sejam exibidos
    if (categoriaId === "ofertas" && (!produtoIds || produtoIds.length === 0)) {
      activeProducts = activeProducts.filter(p => p.destaque === true);
    }

    // Se for Mais Pedidos com pedidos reais, ordenar na ordem exata de vendas
    if ((categoriaId === "all" || categoriaId === "mais_pedidos" || String(vitrineId) === "3") && topOrderedIds.length > 0) {
      const idOrderMap = new Map(topOrderedIds.map((id, index) => [id, index]));
      activeProducts.sort((a, b) => {
        const orderA = idOrderMap.has(String(a.id)) ? idOrderMap.get(String(a.id))! : 999999;
        const orderB = idOrderMap.has(String(b.id)) ? idOrderMap.get(String(b.id))! : 999999;
        return orderA - orderB;
      });
    } else {
      // Prioritizes products with stock > 0
      activeProducts.sort((a, b) => {
        const stockA = a.estoque || 0;
        const stockB = b.estoque || 0;
        if (stockA > 0 && stockB <= 0) return -1;
        if (stockB > 0 && stockA <= 0) return 1;
        return 0;
      });
    }

    vitrineCacheMap.set(cacheKey, { data: activeProducts, timestamp: Date.now() });

    return applyFilters(activeProducts, filters);
  },
  productsByBrand: async (brandQuery: string, filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();

    // 1. Garantir que as marcas estejam carregadas
    let marcas = useMarcasStore.getState().marcas;
    if (!marcas || marcas.length === 0) {
      await useMarcasStore.getState().loadMarcas();
      marcas = useMarcasStore.getState().marcas;
    }

    const cleanQuery = (brandQuery || "").trim();
    const cleanQueryLower = cleanQuery.toLowerCase();
    const localSlugify = (text: string) => {
      if (!text) return "";
      return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
    };
    const cleanQuerySlug = localSlugify(cleanQuery);

    const matchedMarca = (marcas || []).find(m => 
      (m.slug && m.slug.toLowerCase() === cleanQueryLower) ||
      (m.seoUrl && m.seoUrl.toLowerCase() === cleanQueryLower) ||
      (m.id && String(m.id).toLowerCase() === cleanQueryLower) ||
      (m.nome && m.nome.toLowerCase() === cleanQueryLower) ||
      (m.slug && localSlugify(m.slug) === cleanQuerySlug) ||
      (m.seoUrl && localSlugify(m.seoUrl) === cleanQuerySlug) ||
      (m.nome && localSlugify(m.nome) === cleanQuerySlug) ||
      (m.nome && removeAccents(m.nome.toLowerCase()) === removeAccents(cleanQueryLower))
    );

    const brandName = matchedMarca ? matchedMarca.nome : (cleanQuery.includes("-") ? cleanQuery.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : cleanQuery);
    const brandSlug = matchedMarca?.slug || matchedMarca?.seoUrl || cleanQuerySlug;
    const isMarcaPropria = !!matchedMarca?.marcaPropria;

    const cleanBrandName = brandName.trim();
    const cleanBrandNameNoAccents = removeAccents(cleanBrandName).trim();
    const cleanSlug = brandSlug.trim();

    // 2. Montar query Supabase com busca flexível (.or)
    let query = supabase.from('produtos').select('*');
    const orClauses: string[] = [];

    if (cleanBrandName) {
      const sanitizedName = cleanBrandName.replace(/[%,()]/g, "").trim();
      if (sanitizedName) orClauses.push(`marca.ilike.%${sanitizedName}%`);
    }
    if (cleanBrandNameNoAccents && cleanBrandNameNoAccents !== cleanBrandName) {
      const sanitizedNoAccents = cleanBrandNameNoAccents.replace(/[%,()]/g, "").trim();
      if (sanitizedNoAccents) orClauses.push(`marca.ilike.%${sanitizedNoAccents}%`);
    }
    if (cleanSlug && cleanSlug.toLowerCase() !== cleanBrandName.toLowerCase()) {
      const sanitizedSlug = cleanSlug.replace(/[%,()]/g, "").trim();
      if (sanitizedSlug) orClauses.push(`marca.ilike.%${sanitizedSlug}%`);
    }

    // internal_tags matching
    if (cleanSlug) {
      orClauses.push(`internal_tags.cs.["marca:${cleanSlug.toLowerCase()}"]`);
    }
    if (cleanBrandName) {
      orClauses.push(`internal_tags.cs.["marca:${cleanBrandName.toLowerCase()}"]`);
    }
    if (matchedMarca?.id) {
      orClauses.push(`internal_tags.cs.["marca:${matchedMarca.id}"]`);
    }

    // Para marcas próprias (ex: Revigore, Revitart, Santo Hábito, Crescendo, etc.) ou marcas com nome longo,
    // também busca produtos cujo nome contenha o nome da marca
    if (isMarcaPropria || cleanBrandName.length >= 4) {
      const sanitizedName = cleanBrandName.replace(/[%,()]/g, "").trim();
      if (sanitizedName) orClauses.push(`nome.ilike.%${sanitizedName}%`);
      if (cleanBrandNameNoAccents && cleanBrandNameNoAccents !== cleanBrandName) {
        const sanitizedNoAccents = cleanBrandNameNoAccents.replace(/[%,()]/g, "").trim();
        if (sanitizedNoAccents) orClauses.push(`nome.ilike.%${sanitizedNoAccents}%`);
      }
    }

    const uniqueClauses = Array.from(new Set(orClauses.filter(Boolean)));
    if (uniqueClauses.length > 0) {
      query = query.or(uniqueClauses.join(','));
    }

    const page = filters?.page || 0;
    const pageSize = filters?.pageSize || 24;

    // Range no Supabase
    query = query.range(page * pageSize, (page + 1) * pageSize - 1);

    const dbProducts = await fetchFromSupabaseWithPrices(query, lojaId);

    // 3. Mesclar produtos do estado local (customProducts / storeCustomProducts da loja)
    const storeState = useAdminProducts.getState();
    const localEffective = storeState.getStoreEffectiveProducts(lojaId) || [];
    const matchingLocal = localEffective.filter(p => {
      if (!p || p.ativo === false) return false;
      const pMarca = (p.marca || "").toLowerCase().trim();
      const pMarcaNoAccents = removeAccents(pMarca);
      const pNome = (p.nome || "").toLowerCase().trim();
      const pNomeNoAccents = removeAccents(pNome);
      
      const bLower = cleanBrandName.toLowerCase();
      const bNoAccents = cleanBrandNameNoAccents.toLowerCase();
      const sLower = cleanSlug.toLowerCase();
      
      if (pMarca.includes(bLower) || pMarcaNoAccents.includes(bNoAccents) || (sLower && pMarca.includes(sLower))) return true;
      if (Array.isArray(p.internalTags) && p.internalTags.some(t => {
        const tl = String(t).toLowerCase();
        return tl === `marca:${sLower}` || tl === `marca:${bLower}` || (matchedMarca?.id && tl === `marca:${matchedMarca.id}`);
      })) return true;
      if ((isMarcaPropria || cleanBrandName.length >= 4) && (pNome.includes(bLower) || pNomeNoAccents.includes(bNoAccents))) return true;
      return false;
    });

    const mergedMap = new Map<string, Produto>();
    dbProducts.forEach(p => {
      if (p && p.id) mergedMap.set(p.id, p);
    });
    if (page === 0) {
      matchingLocal.forEach(p => {
        if (p && p.id) mergedMap.set(p.id, p);
      });
    }

    let allBrandProducts = Array.from(mergedMap.values()).filter(p => p && p.ativo !== false);

    // Prioriza produtos em estoque
    allBrandProducts.sort((a, b) => {
      const stockA = a.estoque || 0;
      const stockB = b.estoque || 0;
      if (stockA > 0 && stockB <= 0) return -1;
      if (stockB > 0 && stockA <= 0) return 1;
      return 0;
    });

    return applyFilters(allBrandProducts, filters);
  },
  // Uses deterministic seed so results are stable across re-renders
  crossSell: async (cartIds: string[], limit = 4, referenceCategoryId?: string, lojaId?: string) => {
    const cacheKey = `${referenceCategoryId || 'all'}-${limit}-${(cartIds || []).sort().join(',')}-${lojaId || ''}`;
    const cached = crossSellCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CROSS_SELL_TTL)) {
      return wait(cached.data);
    }

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

    // Busca um lote maior para conseguir filtrar produtos em estoque
    query = query.limit(Math.max(limit * 4, 30));
    const products = await fetchFromSupabaseWithPrices(query, lojaId);
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

    // Se informada uma loja, prioriza estritamente os produtos com estoque disponível nesta loja
    if (lojaId) {
      others.sort((a, b) => {
        const stockA = getDeterministicStock(a, lojaId);
        const availA = (stockA > 0 || a.tipoProduto === "servico") && a.ativo !== false && (a.precosPorLoja?.[lojaId]?.ativo !== false) ? 1 : 0;
        const stockB = getDeterministicStock(b, lojaId);
        const availB = (stockB > 0 || b.tipoProduto === "servico") && b.ativo !== false && (b.precosPorLoja?.[lojaId]?.ativo !== false) ? 1 : 0;
        return availB - availA;
      });
    }

    const result = others.slice(0, limit);
    crossSellCache.set(cacheKey, { data: result, timestamp: Date.now() });
    return wait(result);
  },
  getOrderBumps: async (): Promise<Produto[]> => {
    await ensureHydrated();
    
    let query = supabase.from('produtos').select('*').contains('internal_tags', JSON.stringify(['orderBump'])).limit(4);
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
    const trimmedQ = (q || "").trim();

    if (!trimmedQ || trimmedQ.length < 2) {
      if (filters && Object.keys(filters).length > 0) {
        let query = supabase.from('produtos').select('*').range(page * pageSize, (page + 1) * pageSize - 1);
        const products = await fetchFromSupabaseWithPrices(query, lojaId);
        return { results: applyFilters(products, filters) };
      }
      return { results: [] };
    }

    // Cache de pesquisa em memória (60 segundos)
    const cacheKey = `sq:${trimmedQ.toLowerCase()}:${lojaId || 'global'}:${page}:${pageSize}:${JSON.stringify(filters || {})}`;
    const cached = searchCacheMap.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < 60000)) {
      return cached.data;
    }

    const profile = analyzeSearchQuery(trimmedQ);
    let candidates: Produto[] = [];

    // Busca rápida em memória se produtos já estiverem carregados no cliente
    const localEffective = getAllProdutos(lojaId);
    let localMatches: Produto[] = [];
    if (localEffective && localEffective.length > 0) {
      localMatches = rankProductsBySearch(localEffective, trimmedQ).ranked;
    }

    if (profile.isCodeLike && profile.digitsOnly.length >= 4) {
      // Busca por código: EAN principal, EANs secundários, ID, código interno, registro ANVISA
      const digits = profile.digitsOnly;
      const codeOrClauses = [
        `ean.eq.${digits}`,
        `ean.ilike.%${digits}%`,
        `id.eq.${profile.cleanQuery}`,
        `codigo_interno.eq.${digits}`,
        `codigo_interno.ilike.%${digits}%`,
      ];
      // EANs secundários (JSONB array): usa operador @> (contains)
      codeOrClauses.push(`eans_secundarios.cs.["${digits}"]`);
      if (digits.length >= 6) {
        codeOrClauses.push(`registro_anvisa.ilike.%${digits}%`);
      }
      const codeQuery = supabase.from('produtos').select('*')
        .or(codeOrClauses.join(','))
        .limit(30);
      candidates = await fetchFromSupabaseWithPrices(codeQuery, lojaId);
    } else {
      // Cláusulas SQL cobrindo todos os campos visíveis na página do produto (incluindo descrição)
      const orClauses: string[] = [];
      const cleanQ = profile.cleanQuery;
      // Termo com acentos preservados (sem caracteres que quebram sintaxe do PostgREST)
      const safeRawQ = trimmedQ.replace(/[,()]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();

      if (cleanQ) {
        orClauses.push(`nome.ilike.%${cleanQ}%`);
        orClauses.push(`marca.ilike.%${cleanQ}%`);
        orClauses.push(`descricao.ilike.%${cleanQ}%`);
        orClauses.push(`resumo_descricao.ilike.%${cleanQ}%`);
        orClauses.push(`slug.ilike.%${cleanQ}%`);
        orClauses.push(`codigo_interno.ilike.%${cleanQ}%`);
        orClauses.push(`registro_anvisa.ilike.%${cleanQ}%`);
        orClauses.push(`classe_terapeutica.ilike.%${cleanQ}%`);
        orClauses.push(`indicacao_terapeutica.ilike.%${cleanQ}%`);
        orClauses.push(`termos_pesquisa.ilike.%${cleanQ}%`);
      }

      if (safeRawQ && safeRawQ !== cleanQ) {
        orClauses.push(`descricao.ilike.%${safeRawQ}%`);
        orClauses.push(`resumo_descricao.ilike.%${safeRawQ}%`);
        orClauses.push(`nome.ilike.%${safeRawQ}%`);
        orClauses.push(`marca.ilike.%${safeRawQ}%`);
      }

      // Tokens principais (máximo 4 tokens para cobrir palavras da descrição)
      for (const token of profile.tokens.slice(0, 4)) {
        if (token.length >= 3) {
          orClauses.push(`nome.ilike.%${token}%`);
          orClauses.push(`marca.ilike.%${token}%`);
          orClauses.push(`descricao.ilike.%${token}%`);
          orClauses.push(`resumo_descricao.ilike.%${token}%`);
          orClauses.push(`indicacao_terapeutica.ilike.%${token}%`);
          orClauses.push(`classe_terapeutica.ilike.%${token}%`);
        }
      }

      // Termo corrigido "você quis dizer" se houver
      if (profile.didYouMean && profile.didYouMean !== cleanQ) {
        orClauses.push(`nome.ilike.%${profile.didYouMean}%`);
        orClauses.push(`marca.ilike.%${profile.didYouMean}%`);
        orClauses.push(`descricao.ilike.%${profile.didYouMean}%`);
        orClauses.push(`resumo_descricao.ilike.%${profile.didYouMean}%`);
      }

      const uniqueClauses = Array.from(new Set(orClauses)).slice(0, 35);
      if (uniqueClauses.length > 0) {
        const query = supabase.from('produtos').select('*')
          .or(uniqueClauses.join(','))
          .limit(80);

        candidates = await fetchFromSupabaseWithPrices(query, lojaId);
      }
    }

    // Mescla candidatos do Supabase com resultados locais em memória
    const candidatesMap = new Map<string, Produto>();
    candidates.forEach(p => candidatesMap.set(p.id, p));
    localMatches.slice(0, 50).forEach(p => {
      if (!candidatesMap.has(p.id)) {
        candidatesMap.set(p.id, p);
      }
    });
    const allCandidates = Array.from(candidatesMap.values());

    // Aplica filtros adicionais (categorias, faixa de preço, retenção de receita)
    const filteredCandidates = applyFilters(allCandidates, filters);

    // Ranqueia por relevância fonética e semântica
    const { ranked, didYouMean } = rankProductsBySearch(filteredCandidates, trimmedQ);

    const paginated = ranked.slice(page * pageSize, (page + 1) * pageSize);
    const resultObj = {
      results: paginated,
      didYouMean: didYouMean && didYouMean !== profile.cleanQuery ? didYouMean : undefined,
    };

    // Salva no cache
    searchCacheMap.set(cacheKey, { data: resultObj, timestamp: Date.now() });

    return resultObj;
  },
  adminSearchProducts: async (params: { search: string, page: number, pageSize: number, listFilter: string, lojaId?: string | null }) => {
    const rawSearch = (params.search || "").trim();
    let query = supabase.from('produtos').select('*', { count: 'exact' });
    
    if (rawSearch) {
      const profile = analyzeSearchQuery(rawSearch);
      if (profile.isNumeric) {
        // Busca por código: EAN principal, EANs secundários, código interno, ID, registro ANVISA
        const digits = profile.cleanQuery;
        const numClauses = [
          `ean.eq.${digits}`,
          `ean.ilike.%${digits}%`,
          `codigo_interno.eq.${digits}`,
          `codigo_interno.ilike.%${digits}%`,
          `id.eq.${digits}`,
          `eans_secundarios.cs.["${digits}"]`,
        ];
        if (digits.length >= 6) {
          numClauses.push(`registro_anvisa.ilike.%${digits}%`);
        }
        query = query.or(numClauses.join(','));
      } else {
        const clauses: string[] = [
          `nome.ilike.%${profile.cleanQuery}%`,
          `marca.ilike.%${profile.cleanQuery}%`,
          `descricao.ilike.%${profile.cleanQuery}%`,
          `resumo_descricao.ilike.%${profile.cleanQuery}%`,
          `classe_terapeutica.ilike.%${profile.cleanQuery}%`,
          `indicacao_terapeutica.ilike.%${profile.cleanQuery}%`,
          `slug.ilike.%${profile.cleanQuery}%`,
          `codigo_interno.ilike.%${profile.cleanQuery}%`,
          `registro_anvisa.ilike.%${profile.cleanQuery}%`,
          `termos_pesquisa.ilike.%${profile.cleanQuery}%`,
        ];

        for (const token of profile.tokens) {
          if (token.length >= 3) {
            clauses.push(`nome.ilike.%${token}%`);
            clauses.push(`marca.ilike.%${token}%`);
            clauses.push(`descricao.ilike.%${token}%`);
            clauses.push(`resumo_descricao.ilike.%${token}%`);
            clauses.push(`indicacao_terapeutica.ilike.%${token}%`);
            clauses.push(`classe_terapeutica.ilike.%${token}%`);
          }
        }

        if (profile.didYouMean) {
          clauses.push(`nome.ilike.%${profile.didYouMean}%`);
          clauses.push(`descricao.ilike.%${profile.didYouMean}%`);
          clauses.push(`resumo_descricao.ilike.%${profile.didYouMean}%`);
        }

        query = query.or(Array.from(new Set(clauses)).join(','));
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

    query = query.range(params.page * params.pageSize, (params.page + 1) * params.pageSize - 1).order('created_at', { ascending: false });

    const { data, error, count } = await query;
    if (error || !data || data.length === 0) return { results: [], count: 0 };
    
    // Convert to Produto and inject prices
    const products = await fetchFromSupabaseWithPrices(
      supabase.from('produtos').select('*').in('id', data.map(d => d.id)).order('created_at', { ascending: false }),
      params.lojaId,
      true // admin should see inactive products
    );

    if (rawSearch) {
      const { ranked } = rankProductsBySearch(products, rawSearch);
      return { results: ranked, count: count || 0 };
    }

    return { results: products, count: count || 0 };
  },
  search: async (q: string, filters?: FilterOptions, lojaId?: string | null) => {
    const { results } = await catalog.searchWithSuggestions(q, filters, lojaId);
    return results;
  },
  featured: async (lojaId?: string | null) => {
    await ensureHydrated();
    let query = supabase.from('produtos').select('*').eq('destaque', true).limit(12);
    let comDestaqueAll = await fetchFromSupabaseWithPrices(query, lojaId);
    
    // Se tiver lojaId, buscar também os destaques específicos da loja
    if (lojaId) {
      const { data: storeDestaques } = await supabase
        .from('produto_precos_loja')
        .select('produto_id')
        .eq('loja_id', lojaId)
        .eq('destaque', true);
        
      if (storeDestaques && storeDestaques.length > 0) {
        const storeFeaturedIds = storeDestaques.map(d => d.produto_id);
        const existingIds = new Set(comDestaqueAll.map(p => p.id));
        const missingIds = storeFeaturedIds.filter(id => !existingIds.has(id));
        
        if (missingIds.length > 0) {
          let storeQuery = supabase.from('produtos').select('*').in('id', missingIds);
          const extraStoreProducts = await fetchFromSupabaseWithPrices(storeQuery, lojaId);
          comDestaqueAll = [...extraStoreProducts, ...comDestaqueAll];
        }
      }
    }

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

