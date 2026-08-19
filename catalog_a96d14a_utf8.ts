import Fuse from "fuse.js";
import { useAdminCategories } from "@/stores/categories";
import { useMarcasStore } from "@/stores/marcas";

import { useAdmin } from "@/stores/admin";
import type { Produto, Categoria, Loja } from "@/types";
import { removeAccents, isCampanhaAtiva } from "@/lib/utils";
import { checkIsGenerico } from "@/lib/format";
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

    const ov = lojaId ? overrides[p.id] || {} : {};
    const storePrice = lojaId ? p.precosPorLoja?.[lojaId] : null;
    const storeStock = lojaId ? p.estoquesPorLoja?.[lojaId] : null;

    const storeP = { ...p, ...ov };
    if (lojaId) {
       storeP.precoPor = storePrice?.precoPor !== undefined ? storePrice.precoPor : (ov.precoPor !== undefined ? ov.precoPor : p.precoPor);
       storeP.precoDe = storePrice?.precoDe !== undefined ? storePrice.precoDe : (ov.precoDe !== undefined ? ov.precoDe : p.precoDe);
       storeP.estoque = storeStock !== undefined ? storeStock : (ov.estoque !== undefined ? ov.estoque : p.estoque);
       storeP.ativo = storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true));
       storeP.destaque = storePrice?.destaque !== undefined ? storePrice.destaque : (ov.destaque !== undefined ? ov.destaque : (p.destaque ?? false));
    }
    
    storeP._searchString = String(storeP.nome || "").toLowerCase();
    
    if (!storeP.imagemPrincipal && Array.isArray(storeP.imagens) && storeP.imagens.length > 0) {
       storeP.imagemPrincipal = storeP.imagens[0];
    }
    
    return storeP as Produto;
  });

  return finalProducts;
}

const getCategorias = () => {
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

import { useAdminProducts } from "@/stores/products";

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


// Await hydration helper — also ensures Supabase products are loaded in background
async function ensureHydrated() {
  if (!useAdminProducts.persist || useAdminProducts.persist.hasHydrated()) {
    // Fire and forget background sync
    if (!useAdminProducts.getState()._loaded) {
      useAdminProducts.getState().loadProducts();
    }
    return;
  }
  return new Promise<void>((resolve) => {
    const unsub = useAdminProducts.persist.onFinishHydration(() => {
      if (!useAdminProducts.getState()._loaded) {
        useAdminProducts.getState().loadProducts();
      }
      resolve();
      unsub();
    });
    // Fallback in case it hangs
    setTimeout(() => {
      if (!useAdminProducts.getState()._loaded) {
        useAdminProducts.getState().loadProducts();
      }
      resolve();
      unsub();
    }, 500);
  });
}

let cachedProdutos: Produto[] | null = null;
let cachedFuse: Fuse<Produto> | null = null;
let lastCustomProductsRef: any = null;

// Helper to get all merged products dynamically
export const getAllProdutos = (lojaId?: string | null): Produto[] => {
  const storeEffective = useAdminProducts.getState().getStoreEffectiveProducts(lojaId) || [];
  
  if (!lojaId && cachedProdutos && lastCustomProductsRef === storeEffective) {
    return cachedProdutos;
  }
  
  if (!lojaId) {
    lastCustomProductsRef = storeEffective;
  }
  
  // Products now come directly from the store (Supabase-backed)
  const map = new Map<string, Produto>();
  
  // Apply store effective products (general from Supabase + store custom + store overrides)
  storeEffective.filter(Boolean).forEach(p => {
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
  listProducts: async (filters?: FilterOptions) => {
    await ensureHydrated();
    return wait(applyFilters(getAllProdutos(), filters));
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
    const allLoaded = useAdminProducts.getState()._loaded;

    if (!allLoaded) {
       // Search by URL first
       let query = supabase.from('produtos').select('*').eq('url', slugOrId).limit(1);
       let products = await fetchFromSupabaseWithPrices(query, lojaId);
       
       if (products.length === 0) {
          // Try by ID
          query = supabase.from('produtos').select('*').eq('id', slugOrId).limit(1);
          products = await fetchFromSupabaseWithPrices(query, lojaId);
       }
       
       if (products.length > 0) return { ...products[0] };
    }

    const produtos = getAllProdutos(lojaId);
    const p = produtos.find(
      (x) =>
        x.id === slugOrId ||
        x.url === slugOrId ||
        String(x.nome || "").toLowerCase().replace(/\s+/g, "-") === slugOrId,
    );
    return p ? { ...p } : null;
  },
  getProductById: async (id: string, lojaId?: string | null) => {
    await ensureHydrated();
    const allLoaded = useAdminProducts.getState()._loaded;

    if (!allLoaded) {
       const query = supabase.from('produtos').select('*').eq('id', id).limit(1);
       const products = await fetchFromSupabaseWithPrices(query, lojaId);
       if (products.length > 0) return { ...products[0] };
    }

    const produtos = getAllProdutos(lojaId);
    const p = produtos.find((x) => x.id === id);
    return p ? { ...p } : null;
  },
  getProduct: async (id: string, lojaId?: string | null) => {
    await ensureHydrated();
    const allLoaded = useAdminProducts.getState()._loaded;

    if (!allLoaded) {
       const query = supabase.from('produtos').select('*').eq('id', id).limit(1);
       const products = await fetchFromSupabaseWithPrices(query, lojaId);
       if (products.length > 0) return { ...products[0] };
    }

    const produtos = getAllProdutos(lojaId);
    const p = produtos.find((x) => x.id === id);
    return p ? { ...p } : null;
  },
  productsByCategory: async (categoryId: string, filters?: FilterOptions, lojaId?: string | null) => {
    await ensureHydrated();
    const categorias = getCategorias();
    const cat = categorias.find(c => c.id === categoryId);
    if (!cat) return wait([]);

    const allLoaded = useAdminProducts.getState()._loaded;
    const isOfertas = String(cat.nome || "").toLowerCase().includes("oferta") || String(cat.nome || "").toLowerCase().includes("promoç");

    if (!allLoaded) {
      let query = supabase.from('produtos').select('*');
      
      if (categoryId === "300") {
         const subCategorias = categorias.filter(c => c.parentId === "300");
         const namesToMatch = subCategorias.map(c => removeAccents(c.nome.toLowerCase()));
         // Hard to query by subcategory names in Supabase without ilike. We'll fetch a lot and filter in JS
         query = query.limit(500);
      } else if (cat.parentId === "300") {
         query = query.ilike('nome', `%${cat.nome}%`).limit(500);
      } else {
         const validCategoryIds = [categoryId, ...categorias.filter(c => c.parentId === categoryId).map(c => c.id)];
         query = query.in('categoriaId', validCategoryIds).limit(1000);
      }

      const products = await fetchFromSupabaseWithPrices(query, lojaId);
      
      let results = products;
      if (categoryId === "300") {
         const subCategorias = categorias.filter(c => c.parentId === "300");
         const namesToMatch = subCategorias.map(c => removeAccents(c.nome.toLowerCase()));
         results = products.filter(p => {
           const nome = removeAccents(String(p.nome).toLowerCase());
           return namesToMatch.some(brand => nome.includes(brand));
         });
      }
      return wait(applyFilters(results, filters));
    }

    const all = getAllProdutos(lojaId);

    let results: Produto[] = [];

    // Custom logic for "Nossas Marcas" (id: "300") and its subcategories
    if (categoryId === "300") {
      const subCategorias = categorias.filter(c => c.parentId === "300");
      const namesToMatch = subCategorias.map(c => removeAccents(c.nome.toLowerCase()));
      results = all.filter(p => {
        const nome = removeAccents(String(p.nome).toLowerCase());
        return namesToMatch.some(brand => nome.includes(brand));
      });
    } else if (cat.parentId === "300") {
      const brandName = removeAccents(cat.nome.toLowerCase());
      results = all.filter(p => removeAccents(String(p.nome).toLowerCase()).includes(brandName));
    } else {
      // Default matching logic
      // Gather categoryId and all its subcategories
      const validCategoryIds = [categoryId, ...categorias.filter(c => c.parentId === categoryId).map(c => c.id)];
      // Gather names in case of legacy data that saved names instead of IDs
      const validCategoryNames = [cat.nome.toLowerCase(), ...categorias.filter(c => c.parentId === categoryId).map(c => c.nome.toLowerCase())];

      results = all.filter(
        (p) => {
          const rawCat = String(p.categoriaId || "").toLowerCase();
          const rawSubcat = String(p.subcategoriaId || "").toLowerCase();
          let matchesCategory = validCategoryIds.includes(p.categoriaId) || 
                 validCategoryNames.includes(rawCat) ||
                 (p.subcategoriaId && validCategoryIds.includes(p.subcategoriaId)) || 
                 (rawSubcat && validCategoryNames.includes(rawSubcat)) ||
                 (Array.isArray(p.categoriasIds) && p.categoriasIds.some(id => validCategoryIds.includes(id))) ||
                 (Array.isArray(p.subcategoriasIds) && p.subcategoriasIds.some(id => validCategoryIds.includes(id))) ||
                 (Array.isArray(p.categoriasAdicionais) && p.categoriasAdicionais.some(id => validCategoryIds.includes(id)));
                 
          if (!matchesCategory && isOfertas) {
            if (p.emCampanha) {
              const now = new Date().toISOString().split('T')[0];
              if (!p.campanhaFim || p.campanhaFim >= now) {
                matchesCategory = true;
              }
            }
          }
          
          return matchesCategory;
        }
      );
    }

    return wait(applyFilters(results, filters));
  },
  productsByVitrine: async (vitrineId: string, categoriaId: string, filters?: FilterOptions, produtoIds?: string[], lojaId?: string | null) => {
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
        (p) => validCategoryIds.includes(p.categoriaId) || 
               (p.subcategoriaId && validCategoryIds.includes(p.subcategoriaId)) || 
               (Array.isArray(p.categoriasIds) && p.categoriasIds.some(id => validCategoryIds.includes(id))) ||
               (Array.isArray(p.subcategoriasIds) && p.subcategoriasIds.some(id => validCategoryIds.includes(id))) ||
               (Array.isArray(p.categoriasAdicionais) && p.categoriasAdicionais.some(id => validCategoryIds.includes(id))) ||
               (Array.isArray(p.vitrines) && p.vitrines.includes(vitrineId))
      );
    }

    return wait(applyFilters(results, filters));
  },
  productsByBrand: async (brandName: string) => {
    await ensureHydrated();
    return wait(
      getAllProdutos().filter(
        (p) => p.marca && String(p.marca).toLowerCase() === brandName.toLowerCase(),
      ),
    );
  },
  // Uses deterministic seed so results are stable across re-renders
  crossSell: async (cartIds: string[], limit = 4, referenceCategoryId?: string) => {
    await ensureHydrated();
    const settings = useAdmin.getState().compreJuntoSettings;
    
    if (settings && !settings.active) {
      return wait([]);
    }

    const produtos = getAllProdutos();
    let others = produtos.filter((p) => p && !cartIds.includes(p.id) && p.categoriaId !== "142");
    
    if (settings) {
      others = others.filter(p => (p.precoPor || p.precoDe || 0) <= settings.maxPrice);
      
      if (settings.categoryId !== "all") {
        others = others.filter(p => p.categoriaId === settings.categoryId || String(p.subcategoriaId).startsWith(settings.categoryId));
      } else if (referenceCategoryId && referenceCategoryId !== "142") {
        others = others.filter(p => p.categoriaId === referenceCategoryId);
      }
    }

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
    const all = getAllProdutos();
    const tagged = all.filter(p => p.orderBump === true);
    if (tagged.length > 0) return wait(tagged.slice(0, 4));

    const settings = useAdmin.getState().orderBumpSettings;
    if (settings && settings.active) {
      const pList = all.filter((p) => {
        const price = p.precoPor || p.precoDe || 0;
        return (p.categoriaId === settings.categoryId || String(p.subcategoriaId).startsWith(settings.categoryId)) &&
               price > 0 && price <= settings.maxPrice;
      });
      return wait(pList);
    }
    
    return wait([]);
  },
  searchWithSuggestions: async (q: string, filters?: FilterOptions, lojaId?: string | null): Promise<{ results: Produto[], didYouMean?: string }> => {
    await ensureHydrated();
    const allLoaded = useAdminProducts.getState()._loaded;

    if (!allLoaded) {
       if (!q || q.length < 2) return wait({ results: [] });
       let query = supabase.from('produtos').select('*').limit(20);
       
       if (/^\d+$/.test(q)) {
          query = query.or(`ean.eq.${q},id.eq.${q}`);
       } else {
          query = query.ilike('nome', `%${q}%`);
       }
       
       const products = await fetchFromSupabaseWithPrices(query, lojaId);
       return wait({ results: applyFilters(products, filters) });
    }

    if (!q || q.length < 2) {
      if (filters && Object.keys(filters).length > 0) {
        return wait({ results: applyFilters(getAllProdutos(lojaId), filters).slice(0, 40) });
      }
      return wait({ results: [] });
    }
    const produtos = getAllProdutos(lojaId);

    let results: Produto[] = [];
    let didYouMean: string | undefined = undefined;

    // Exact number search (EAN or ID)
    if (/^\d+$/.test(q)) {
      const exactMatch = produtos.filter(p => String(p.ean) === q || String(p.id) === q);
      if (exactMatch.length > 0) results = exactMatch;
    }

    if (results.length === 0) {
      const cleanQ = removeAccents(q.toLowerCase()).trim();
      const queryWords = cleanQ.split(/\s+/);
      
      // Exact word matching (high priority)
      const exactMatches = produtos.filter((p: any) => {
        const searchString = p._searchString || "";
        return queryWords.every(word => searchString.includes(word));
      });

      // Fuzzy search for fallbacks and typos
      const fuse = getFuse();
      const hitsWithScore = fuse.search(q, { limit: 20 });
      const hits = hitsWithScore.map((r) => r.item);

      // Check if we should suggest a "did you mean"
      if (exactMatches.length === 0 && hitsWithScore.length > 0) {
        const topHit = hitsWithScore[0];
        // If it's a very good fuzzy match (score is low, but not perfect)
        if (topHit.score && topHit.score < 0.4) {
          const topNameLower = removeAccents(String(topHit.item.nome || "").toLowerCase());
          // Only suggest if they didn't just type a substring of the word
          if (!topNameLower.includes(cleanQ)) {
             didYouMean = topHit.item.nome;
          }
        }
      }

      // Merge and deduplicate (exact matches first)
      const resultMap = new Map<string, Produto>();
      exactMatches.forEach(p => resultMap.set(p.id, p));
      hits.forEach(p => {
        if (!resultMap.has(p.id)) resultMap.set(p.id, p);
      });
      
      results = Array.from(resultMap.values()).slice(0, 20);
    }

    return wait({ results: applyFilters(results, filters), didYouMean });
  },
  search: async (q: string, filters?: FilterOptions) => {
    const { results } = await catalog.searchWithSuggestions(q, filters);
    return results;
  },
  featured: async () => {
    await ensureHydrated();
    const todos = getAllProdutos();
    const comDestaque = todos.filter(p => p.destaque).reverse();
    
    // Fill up to 12 slots with fallback products if needed
    if (comDestaque.length < 12) {
      const fallback = todos.filter((p) => !p.destaque && p.precoDe > p.precoPor);
      const needed = 12 - comDestaque.length;
      return wait([...comDestaque, ...fallback.slice(0, needed)]);
    }
    
    return wait(comDestaque.slice(0, 12));
  },
  getUsedCategoriesIds: async (): Promise<string[]> => {
    await ensureHydrated();
    const todos = getAllProdutos();
    const ids = new Set<string>();
    for (const p of todos) {
      if (p.categoriaId) ids.add(p.categoriaId);
      if (p.subcategoriaId) ids.add(p.subcategoriaId);
      if (Array.isArray(p.categoriasIds)) {
        p.categoriasIds.forEach(id => ids.add(id));
      }
      if (Array.isArray(p.subcategoriasIds)) {
        p.subcategoriasIds.forEach(id => ids.add(id));
      }
      if (Array.isArray(p.categoriasAdicionais)) {
        p.categoriasAdicionais.forEach(id => ids.add(id));
      }
    }
    return Array.from(ids);
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

