import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Produto, Vitrine } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toTitleCase } from "@/lib/utils";

export interface Fornecedor {
  id: number;
  distribuidor: string;
  cidade: string;
  prazo: string;
  apiUrl: string;
}

export interface StorePriceItem {
  ean?: string;
  sku?: string;
  id?: string;
  precoDe?: number;
  precoPor: number;
  estoque?: number;
  ativo?: boolean;
}

interface ProductsState {
  customProducts: Produto[];
  storeCustomProducts: Record<string, Produto[]>;
  storeProductOverrides: Record<string, Record<string, Partial<Produto>>>;
  storeRemovedProductIds: Record<string, string[]>;
  fornecedores: Fornecedor[];
  vitrines: Vitrine[];
  _loaded: boolean;
  loadProducts: () => Promise<void>;
  addOrUpdateProduct: (p: Produto, lojaId?: string | null) => void;
  removeProduct: (id: string, lojaId?: string | null) => void;
  getStoreEffectiveProducts: (lojaId?: string | null) => Produto[];
  resetStoreProductsToGeneral: (lojaId: string) => void;
  importProducts: (products: Produto[], lojaId?: string | null) => void;
  applyBadgeToProducts: (badgeId: string, productIds: string[]) => void;
  clearProducts: (lojaId?: string | null) => void;
  formatAllTitles: () => void;
  setFornecedores: (fornecedores: Fornecedor[]) => void;
  removeFornecedor: (id: number) => void;
  addVitrine: (v: Omit<Vitrine, "id">) => void;
  updateVitrine: (v: Vitrine) => void;
  removeVitrine: (id: number) => void;
  toggleVitrine: (id: number) => void;
  updateProductDescriptions: (updates: { ean: string; descricao: string }[]) => void;
  bulkUpdateProducts: (productIds: string[], updates: Partial<Produto>, lojaId?: string | null) => void;
  updateStoreProductPrice: (lojaId: string, productId: string, precoPor: number, precoDe?: number, estoque?: number, ativo?: boolean) => void;
  importStoreSpreadsheet: (lojaId: string, items: StorePriceItem[]) => { updated: number; notFound: number; total: number };
}

// Helper: map Supabase row to Produto type
function mapRowToProduto(d: any): Produto {
  return {
    id: d.id,
    ean: d.ean,
    nome: toTitleCase(d.nome || ""),
    descricao: d.descricao,
    url: d.slug,
    slug: d.slug,
    fabricante: d.fabricante,
    marca: d.marca,
    precoDe: Number(d.preco_de) || 0,
    precoPor: Number(d.preco_por) || 0,
    estoque: d.estoque || 0,
    registroAnvisa: d.registro_anvisa,
    tarja: d.tarja,
    retemReceita: d.retem_receita || false,
    generico: d.generico || false,
    possuiImagem: d.possui_imagem || false,
    categoriaId: d.categoria_id,
    subcategoriaId: d.subcategoria_id,
    categoriasAdicionais: d.categorias_adicionais || [],
    internalTags: d.internal_tags || [],
    principiosAtivos: d.principios_ativos || [],
    imagens: d.imagens || [],
    videoUrl: d.video_url,
    destaque: d.destaque || false,
    ativo: d.ativo !== false,
    aVenda: d.a_venda !== false,
    visivel: d.visivel !== false,
  } as Produto;
}

export const useAdminProducts = create<ProductsState>()(
  persist(
    (set, get) => ({
      customProducts: [],
      storeCustomProducts: {},
      storeProductOverrides: {},
      storeRemovedProductIds: {},
      _loaded: false,
      loadProducts: async () => {
        if (get()._loaded) return;
        const { data, error } = await supabase
          .from('produtos')
          .select('*')
          .order('nome', { ascending: true });
        
        if (!error && data) {
          const mapped = data.map(mapRowToProduto);
          set({ customProducts: mapped, _loaded: true });
        }
      },
      addOrUpdateProduct: (p, lojaId) => set((s) => {
        const formattedProduct = { ...p, nome: toTitleCase(p.nome) };
        
        // If editing/creating in the context of a specific store:
        if (lojaId) {
          const currentStoreProducts = s.storeCustomProducts[lojaId] || [];
          const isStoreExclusive = p.lojaId === lojaId || p.isIndividualLoja || currentStoreProducts.some(x => x.id === p.id) || !s.customProducts.some(x => x.id === p.id);

          if (isStoreExclusive) {
            const storeProd = { ...formattedProduct, lojaId, isIndividualLoja: true, origem: "Loja Individual" };
            const exists = currentStoreProducts.find(x => x.id === p.id);
            const updatedList = exists 
              ? currentStoreProducts.map(x => x.id === p.id ? storeProd : x)
              : [storeProd, ...currentStoreProducts];
            
            return {
              storeCustomProducts: {
                ...s.storeCustomProducts,
                [lojaId]: updatedList
              }
            };
          } else {
            // It is a network product being customized for this store only
            const prevStoreOverrides = s.storeProductOverrides[lojaId] || {};
            return {
              storeProductOverrides: {
                ...s.storeProductOverrides,
                [lojaId]: {
                  ...prevStoreOverrides,
                  [p.id]: formattedProduct
                }
              }
            };
          }
        }

        // Master / General Admin base
        const exists = s.customProducts.find(x => x.id === p.id);
        if (exists) {
          return { customProducts: s.customProducts.map(x => x.id === p.id ? formattedProduct : x) };
        }
        return { customProducts: [formattedProduct, ...s.customProducts] };
      }),
      removeProduct: (id, lojaId) => set((s) => {
        if (lojaId) {
          const currentStoreProducts = s.storeCustomProducts[lojaId] || [];
          const isStoreExclusive = currentStoreProducts.some(x => x.id === id);

          if (isStoreExclusive) {
            return {
              storeCustomProducts: {
                ...s.storeCustomProducts,
                [lojaId]: currentStoreProducts.filter(x => x.id !== id)
              }
            };
          } else {
            // Hide network product from this store only
            const currentRemoved = s.storeRemovedProductIds[lojaId] || [];
            if (!currentRemoved.includes(id)) {
              return {
                storeRemovedProductIds: {
                  ...s.storeRemovedProductIds,
                  [lojaId]: [...currentRemoved, id]
                }
              };
            }
            return {};
          }
        }

        // Master / General Admin
        return {
          customProducts: s.customProducts.filter(x => x.id !== id)
        };
      }),
      getStoreEffectiveProducts: (lojaId) => {
        const state = get();
        if (!lojaId) {
          return state.customProducts || [];
        }

        const removedIds = new Set(state.storeRemovedProductIds?.[lojaId] || []);
        const overrides = state.storeProductOverrides?.[lojaId] || {};
        const storeCreated = state.storeCustomProducts?.[lojaId] || [];

        const baseMerged = (state.customProducts || [])
          .filter(p => !removedIds.has(p.id))
          .map(p => {
            const ov = overrides[p.id] || {};
            const storePrice = p.precosPorLoja?.[lojaId];
            const storeStock = p.estoquesPorLoja?.[lojaId];
            return {
              ...p,
              ...ov,
              precoPor: storePrice?.precoPor !== undefined ? storePrice.precoPor : (ov.precoPor !== undefined ? ov.precoPor : p.precoPor),
              precoDe: storePrice?.precoDe !== undefined ? storePrice.precoDe : (ov.precoDe !== undefined ? ov.precoDe : p.precoDe),
              estoque: storeStock !== undefined ? storeStock : (ov.estoque !== undefined ? ov.estoque : p.estoque),
              ativo: storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true)),
            };
          });

        return [...storeCreated, ...baseMerged];
      },
      resetStoreProductsToGeneral: (lojaId) => set((s) => {
        const newOverrides = { ...s.storeProductOverrides };
        delete newOverrides[lojaId];
        const newRemoved = { ...s.storeRemovedProductIds };
        delete newRemoved[lojaId];
        return {
          storeProductOverrides: newOverrides,
          storeRemovedProductIds: newRemoved
        };
      }),
      importProducts: (products, lojaId) => set((s) => {
        if (lojaId) {
          const currentStoreProducts = s.storeCustomProducts[lojaId] || [];
          const newMap = new Map(currentStoreProducts.map(x => [x.id, x]));
          products.forEach(p => {
            newMap.set(p.id, { ...p, nome: toTitleCase(p.nome), lojaId, isIndividualLoja: true, origem: "Loja Individual", isNovo: true, isRevisado: false });
          });
          return {
            storeCustomProducts: {
              ...s.storeCustomProducts,
              [lojaId]: Array.from(newMap.values())
            }
          };
        }

        // Merge without duplicates based on ID for General Base
        const newMap = new Map(s.customProducts.map(x => [x.id, x]));
        products.forEach(p => {
          if (!newMap.has(p.id)) {
            newMap.set(p.id, { ...p, nome: toTitleCase(p.nome), isNovo: true, isRevisado: false });
          } else {
            newMap.set(p.id, { ...p, nome: toTitleCase(p.nome) });
          }
        });
        return { customProducts: Array.from(newMap.values()) };
      }),
      applyBadgeToProducts: (badgeId, productIds) => set((s) => {
        const idSet = new Set(productIds);
        const updated = s.customProducts.map(p => {
          const hasIt = p.selosIds?.includes(badgeId) || false;
          const shouldHaveIt = idSet.has(p.id);
          
          if (hasIt && !shouldHaveIt) {
            return { ...p, selosIds: p.selosIds?.filter(id => id !== badgeId) };
          } else if (!hasIt && shouldHaveIt) {
            return { ...p, selosIds: [...(p.selosIds || []), badgeId] };
          }
          return p;
        });
        return { customProducts: updated };
      }),
      clearProducts: (lojaId) => set((s) => {
        if (lojaId) {
          const newStoreCustom = { ...s.storeCustomProducts };
          delete newStoreCustom[lojaId];
          const newOverrides = { ...s.storeProductOverrides };
          delete newOverrides[lojaId];
          return {
            storeCustomProducts: newStoreCustom,
            storeProductOverrides: newOverrides,
            storeRemovedProductIds: {
              ...s.storeRemovedProductIds,
              [lojaId]: s.customProducts.map(p => p.id)
            }
          };
        }
        return { customProducts: [] };
      }),
      formatAllTitles: () => set((s) => ({
        customProducts: s.customProducts.map(p => ({ ...p, nome: toTitleCase(p.nome) }))
      })),
      fornecedores: [
        { id: 1, distribuidor: "Distribuidora Santa Cruz", cidade: "Porto Alegre / RS", prazo: "3", apiUrl: "https://api.santacruz.com.br/v1/estoque" }
      ],
      vitrines: [

        { id: 3, nome: "Mais vendidos", categoriaId: "all", local: "espaco_2", ativa: true, icone: "TrendingUp", modo: "categoria", ordem: 1, linkSeo: "mais-vendidos", tituloSeo: "Mais Vendidos", descricaoSeo: "Os produtos mais vendidos e procurados nas Farmácias Associadas." },
        { id: 4, nome: "Ofertas da Semana", categoriaId: "ofertas", local: "espaco_2", ativa: true, icone: "Percent", modo: "categoria", ordem: 2, linkSeo: "ofertas-da-semana", tituloSeo: "Ofertas da Semana", descricaoSeo: "As melhores promoções da semana." },
        { id: 5, nome: "Novidades", categoriaId: "novidades", local: "espaco_3", ativa: true, icone: "Sparkles", modo: "categoria", ordem: 1, linkSeo: "novidades", tituloSeo: "Novidades", descricaoSeo: "Lançamentos e novos produtos." },
        { id: 6, nome: "Mamãe e Bebê", categoriaId: "144", local: "espaco_3", ativa: true, icone: "Baby", modo: "categoria", ordem: 2, linkSeo: "mamae-e-bebe", tituloSeo: "Mamãe e Bebê", descricaoSeo: "Produtos para o cuidado da mamãe e do bebê." },
        { id: 7, nome: "Protetores Solares e Bronzeadores", categoriaId: "protetores", local: "espaco_3", ativa: true, icone: "Sun", modo: "categoria", ordem: 3, linkSeo: "protetores-solares-e-bronzeadores", tituloSeo: "Protetores Solares", descricaoSeo: "Proteção solar e bronzeadores." },
      ],
      setFornecedores: (fornecedores) => set({ fornecedores }),
      removeFornecedor: (id) => set((s) => ({ fornecedores: s.fornecedores.filter(f => f.id !== id) })),
      addVitrine: (v) => set((s) => {
        const nextId = s.vitrines.length > 0 ? Math.max(...s.vitrines.map(x => x.id)) + 1 : 1;
        const maxOrdem = s.vitrines.filter(x => x.local === v.local).reduce((max, x) => Math.max(max, x.ordem || 0), 0);
        return { vitrines: [...s.vitrines, { ...v, id: nextId, ordem: v.ordem || maxOrdem + 1 }] };
      }),
      updateVitrine: (v) => set((s) => ({
        vitrines: s.vitrines.map(x => x.id === v.id ? v : x)
      })),
      removeVitrine: (id) => set((s) => ({ vitrines: s.vitrines.filter(v => v.id !== id) })),
      toggleVitrine: (id) => set((s) => ({
        vitrines: s.vitrines.map(v => v.id === id ? { ...v, ativa: !v.ativa } : v)
      })),
      updateProductDescriptions: (updates) => set((s) => {
        const updateMap = new Map(updates.filter(u => u.ean).map(u => [u.ean, u.descricao]));
        return {
          customProducts: s.customProducts.map(p => {
            if (p.ean && updateMap.has(p.ean)) {
              return { ...p, descricao: updateMap.get(p.ean) as string };
            }
            return p;
          })
        };
      }),
      bulkUpdateProducts: (productIds, updates, lojaId) => set((s) => {
        const idSet = new Set(productIds);
        if (lojaId) {
          const storeCustom = s.storeCustomProducts[lojaId] || [];
          const updatedCustom = storeCustom.map(p => idSet.has(p.id) ? { ...p, ...updates } : p);
          
          const prevOverrides = s.storeProductOverrides[lojaId] || {};
          const newOverrides = { ...prevOverrides };
          productIds.forEach(id => {
            if (!storeCustom.some(x => x.id === id)) {
              newOverrides[id] = { ...(newOverrides[id] || {}), ...updates };
            }
          });

          return {
            storeCustomProducts: {
              ...s.storeCustomProducts,
              [lojaId]: updatedCustom
            },
            storeProductOverrides: {
              ...s.storeProductOverrides,
              [lojaId]: newOverrides
            }
          };
        }

        return {
          customProducts: s.customProducts.map(p => {
            if (idSet.has(p.id)) {
              return { ...p, ...updates };
            }
            return p;
          })
        };
      }),
      updateStoreProductPrice: (lojaId, productId, precoPor, precoDe, estoque, ativo = true) => set((s) => {
        return {
          customProducts: s.customProducts.map(p => {
            if (p.id === productId) {
              const prevStore = p.precosPorLoja || {};
              const prevStock = p.estoquesPorLoja || {};
              return {
                ...p,
                precosPorLoja: {
                  ...prevStore,
                  [lojaId]: {
                    precoDe: precoDe !== undefined ? precoDe : p.precoDe,
                    precoPor: precoPor,
                    ativo: ativo
                  }
                },
                estoquesPorLoja: estoque !== undefined ? {
                  ...prevStock,
                  [lojaId]: estoque
                } : prevStock
              };
            }
            return p;
          })
        };
      }),
      importStoreSpreadsheet: (lojaId, items) => {
        const state = get();
        let updatedCount = 0;
        let notFoundCount = 0;

        // Build fast lookup maps by EAN, SKU, ID, and Name
        const eanMap = new Map<string, Produto>();
        const skuMap = new Map<string, Produto>();
        const idMap = new Map<string, Produto>();
        const nameMap = new Map<string, Produto>();

        state.customProducts.forEach(p => {
          if (p.ean) eanMap.set(p.ean.trim(), p);
          if (p.sku) skuMap.set(p.sku.trim(), p);
          if (p.id) idMap.set(p.id.trim(), p);
          if (p.nome) nameMap.set(p.nome.trim().toLowerCase(), p);
        });

        const updatesToApply = new Map<string, { precoDe?: number; precoPor: number; estoque?: number; ativo?: boolean }>();

        items.forEach(item => {
          let matched: Produto | undefined;
          const cleanEan = item.ean ? String(item.ean).trim() : "";
          const cleanSku = item.sku ? String(item.sku).trim() : "";
          const cleanId = item.id ? String(item.id).trim() : "";
          const cleanNome = (item as any).nome ? String((item as any).nome).trim().toLowerCase() : "";

          if (cleanEan && eanMap.has(cleanEan)) matched = eanMap.get(cleanEan);
          else if (cleanSku && skuMap.has(cleanSku)) matched = skuMap.get(cleanSku);
          else if (cleanId && idMap.has(cleanId)) matched = idMap.get(cleanId);
          else if (cleanNome && nameMap.has(cleanNome)) matched = nameMap.get(cleanNome);

          if (matched) {
            updatesToApply.set(matched.id, {
              precoDe: item.precoDe !== undefined ? item.precoDe : matched.precoDe,
              precoPor: item.precoPor,
              estoque: item.estoque,
              ativo: item.ativo !== undefined ? item.ativo : true
            });
            updatedCount++;
          } else {
            notFoundCount++;
          }
        });

        if (updatesToApply.size > 0) {
          set({
            customProducts: state.customProducts.map(p => {
              const up = updatesToApply.get(p.id);
              if (up) {
                const prevStore = p.precosPorLoja || {};
                const prevStock = p.estoquesPorLoja || {};
                return {
                  ...p,
                  precosPorLoja: {
                    ...prevStore,
                    [lojaId]: {
                      precoDe: up.precoDe !== undefined ? up.precoDe : p.precoDe,
                      precoPor: up.precoPor,
                      ativo: up.ativo !== undefined ? up.ativo : true
                    }
                  },
                  estoquesPorLoja: up.estoque !== undefined ? {
                    ...prevStock,
                    [lojaId]: up.estoque
                  } : prevStock
                };
              }
              return p;
            })
          });
        }

        return { updated: updatedCount, notFound: notFoundCount, total: items.length };
      }
    }),
    {
      name: "fa-admin-products-store-v4",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // Only persist local-only fields (vitrines, fornecedores, overrides).
      // customProducts now comes from Supabase via loadProducts().
      partialize: (state) => ({
        storeCustomProducts: state.storeCustomProducts,
        storeProductOverrides: state.storeProductOverrides,
        storeRemovedProductIds: state.storeRemovedProductIds,
        fornecedores: state.fornecedores,
        vitrines: state.vitrines,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Load products from Supabase after local rehydration
          state.loadProducts();

          // Add default vitrines if missing (migration for existing localStorage)
          if (!state.vitrines || !state.vitrines.some(v => v.categoriaId === "all")) {
            const defaults = [
              { id: 3, nome: "Mais vendidos", categoriaId: "all", local: "espaco_2" as const, ativa: true, icone: "TrendingUp", modo: "categoria" as const, ordem: 1, linkSeo: "mais-vendidos", tituloSeo: "Mais Vendidos", descricaoSeo: "Os produtos mais vendidos e procurados nas Farmácias Associadas." },
              { id: 4, nome: "Ofertas da Semana", categoriaId: "ofertas", local: "espaco_2" as const, ativa: true, icone: "Percent", modo: "categoria" as const, ordem: 2, linkSeo: "ofertas-da-semana", tituloSeo: "Ofertas da Semana", descricaoSeo: "As melhores promoções da semana." },
              { id: 5, nome: "Novidades", categoriaId: "novidades", local: "espaco_3" as const, ativa: true, icone: "Sparkles", modo: "categoria" as const, ordem: 1, linkSeo: "novidades", tituloSeo: "Novidades", descricaoSeo: "Lançamentos e novos produtos." },
              { id: 6, nome: "Mamãe e Bebê", categoriaId: "144", local: "espaco_3" as const, ativa: true, icone: "Baby", modo: "categoria" as const, ordem: 2, linkSeo: "mamae-e-bebe", tituloSeo: "Mamãe e Bebê", descricaoSeo: "Produtos para o cuidado da mamãe e do bebê." },
              { id: 7, nome: "Protetores Solares e Bronzeadores", categoriaId: "protetores", local: "espaco_3" as const, ativa: true, icone: "Sun", modo: "categoria" as const, ordem: 3, linkSeo: "protetores-solares-e-bronzeadores", tituloSeo: "Protetores Solares", descricaoSeo: "Proteção solar e bronzeadores." },
            ];
            useAdminProducts.setState((s) => ({ vitrines: [...(s.vitrines || []), ...defaults] }));
          }
        }
      }
    }
  )
);
