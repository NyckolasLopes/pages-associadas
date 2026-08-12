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
  storeVitrines: Record<string, Vitrine[]>;
  getStoreVitrines: (lojaId?: string | null) => Vitrine[];
  _loaded: boolean;
  loadProducts: () => Promise<void>;
  addOrUpdateProduct: (p: Produto, lojaId?: string | null) => void;
  removeProduct: (id: string, lojaId?: string | null) => void;
  getStoreEffectiveProducts: (lojaId?: string | null) => Produto[];
  resetStoreProductsToGeneral: (lojaId: string) => void;
  importProducts: (products: Produto[], lojaId?: string | null) => Promise<void>;
  applyBadgeToProducts: (badgeId: string, productIds: string[]) => void;
  clearProducts: (lojaId?: string | null) => void;
  formatAllTitles: () => void;
  setFornecedores: (fornecedores: Fornecedor[]) => void;
  removeFornecedor: (id: number) => void;
  addVitrine: (v: Omit<Vitrine, "id">, lojaId?: string | null) => void;
  updateVitrine: (v: Vitrine, lojaId?: string | null) => void;
  removeVitrine: (id: number, lojaId?: string | null) => void;
  toggleVitrine: (id: number, lojaId?: string | null) => void;
  updateProductDescriptions: (updates: { ean: string; nome: string; descricao: string }[], lojaId?: string) => Promise<{successCount: number; errorCount: number; errors: {ean: string, error: string}[]}>;
  bulkUpdateProducts: (productIds: string[], updates: Partial<Produto>, lojaId?: string | null) => void;
  updateStoreProductPrice: (lojaId: string, productId: string, precoPor: number, precoDe?: number, estoque?: number, ativo?: boolean) => void;
  updateStoreProductStatus: (lojaId: string, productId: string, ativo: boolean) => Promise<void>;
  bulkUpdateStoreProductStatus: (lojaId: string, productIds: string[], ativo: boolean) => Promise<void>;
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
    buscavel: d.buscavel !== false,
    nivelRelevancia: d.nivel_relevancia || 0,
    termosPesquisa: d.termos_pesquisa || "",
    precoBase: Number(d.preco_base) || 0,
    seoTitulo: d.seo_titulo || "",
    seoDescricao: d.seo_descricao || "",
    tipoProduto: d.tipo_produto || "fisico",
    ncm: d.ncm || "",
    lojaId: d.loja_id,
    precosPorLoja: d.precos_por_loja || {},
    estoquesPorLoja: d.estoques_por_loja || {},
  } as Produto;
}

export const useAdminProducts = create<ProductsState>()(
  persist(
    (set, get) => ({
      customProducts: [],
      storeCustomProducts: {},
      storeProductOverrides: {},
      storeRemovedProductIds: {},
      vitrines: [],
      storeVitrines: {},
      getStoreVitrines: (lojaId) => {
        const state = get();
        if (!lojaId) return state.vitrines;
        return state.storeVitrines[lojaId] || [];
      },
      _loaded: false,
      loadProducts: async () => {
        if (get()._loaded) return;
        
        let allData = [];
        let from = 0;
        const step = 999;
        
        while (true) {
          const { data, error } = await supabase
            .from('produtos')
            .select('*')
            .order('nome', { ascending: true })
            .range(from, from + step);
            
          if (error || !data || data.length === 0) break;
          allData = allData.concat(data);
          
          if (data.length < step + 1) break;
          from += step + 1;
        }
        
        const mapped = allData.map(mapRowToProduto);
        set({ customProducts: mapped, _loaded: true });
      },
      addOrUpdateProduct: async (p, lojaId) => {
        const formattedProduct = { ...p, nome: p.nome ? p.nome.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "" };
        const globalPleno = true; // Por padrão Sede
        
        // Optimistic UI Update
        set((s) => {
          const exists = s.customProducts.find(x => x.id === p.id);
          if (exists) {
            return { customProducts: s.customProducts.map(x => x.id === p.id ? { ...x, ...formattedProduct, lojaId } : x) };
          }
          return { customProducts: [{ ...formattedProduct, lojaId }, ...s.customProducts] };
        });

        // Supabase DB Update
        await supabase.from('produtos').upsert({
          id: formattedProduct.id,
          ean: formattedProduct.ean || null,
          nome: formattedProduct.nome,
          descricao: formattedProduct.descricao || null,
          slug: formattedProduct.slug || formattedProduct.url || formattedProduct.id,
          fabricante: formattedProduct.fabricante || null,
          marca: formattedProduct.marca || null,
          preco_de: formattedProduct.precoDe || 0,
          preco_por: formattedProduct.precoPor || 0,
          estoque: formattedProduct.estoque || 0,
          registro_anvisa: formattedProduct.registroAnvisa || null,
          tarja: formattedProduct.tarja || null,
          retem_receita: formattedProduct.retemReceita || false,
          generico: formattedProduct.generico || false,
          possui_imagem: formattedProduct.possuiImagem || false,
          categoria_id: formattedProduct.categoriaId || null,
          subcategoria_id: formattedProduct.subcategoriaId || null,
          categorias_adicionais: formattedProduct.categoriasAdicionais || [],
          internal_tags: formattedProduct.internalTags || [],
          principios_ativos: formattedProduct.principiosAtivos || [],
          imagens: formattedProduct.imagens || [],
          video_url: formattedProduct.videoUrl || null,
          destaque: formattedProduct.destaque || false,
          ativo: formattedProduct.ativo !== false,
          a_venda: formattedProduct.aVenda !== false,
          visivel: formattedProduct.visivel !== false,
          buscavel: formattedProduct.buscavel !== false,
          nivel_relevancia: formattedProduct.nivelRelevancia || 0,
          termos_pesquisa: formattedProduct.termosPesquisa || null,
          preco_base: formattedProduct.precoBase || 0,
          seo_titulo: formattedProduct.seoTitulo || null,
          seo_descricao: formattedProduct.seoDescricao || null,
          tipo_produto: formattedProduct.tipoProduto || "fisico",
          ncm: formattedProduct.ncm || null,
          loja_id: lojaId || null,
          precos_por_loja: formattedProduct.precosPorLoja || {},
          estoques_por_loja: formattedProduct.estoquesPorLoja || {},
          global_pleno: globalPleno
        });
      },
      removeProduct: async (id, lojaId) => {
        // Optimistic
        set((s) => ({ customProducts: s.customProducts.filter(x => x.id !== id) }));
        
        // DB Delete
        await supabase.from('produtos').delete().eq('id', id);
      },
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
      importProducts: async (products, lojaId) => {
        // Optimistic UI Update
        set((s) => {
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
        });

        // Supabase DB Update for global products
        if (!lojaId) {
          const chunkSize = 100;
          for (let i = 0; i < products.length; i += chunkSize) {
            const chunk = products.slice(i, i + chunkSize);
            const upsertData = chunk.map(p => ({
              id: p.id,
              ean: p.ean || null,
              codigo_interno: p.codigoInterno || null,
              nome: p.nome ? p.nome.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "",
              descricao: p.descricao || null,
              slug: p.slug || p.url || p.id,
              fabricante: p.fabricante || null,
              marca: p.marca || null,
              preco_de: p.precoDe || 0,
              preco_por: p.precoPor || 0,
              estoque: p.estoque || 0,
              registro_anvisa: p.registroAnvisa || null,
              tarja: p.tarja || null,
              retem_receita: p.retemReceita || false,
              generico: p.generico || false,
              possui_imagem: p.possuiImagem || false,
              categoria_id: p.categoriaId || null,
              subcategoria_id: p.subcategoriaId || null,
              categorias_adicionais: p.categoriasAdicionais || [],
              internal_tags: p.internalTags || [],
              ativo: p.ativo ?? true,
              a_venda: p.aVenda !== false,
              visivel: p.visivel !== false,
              buscavel: p.buscavel !== false,
              nivel_relevancia: p.nivelRelevancia || 0,
              termos_pesquisa: p.termosPesquisa || null,
              preco_base: p.precoBase || 0,
              seo_titulo: p.seoTitulo || null,
              seo_descricao: p.seoDescricao || null,
              tipo_produto: p.tipoProduto || "fisico",
              ncm: p.ncm || null,
            }));
            
            const { error } = await supabase.from('produtos').upsert(upsertData, { onConflict: 'id' });
            if (error) {
              console.error('Error batch upserting products:', error);
            }
          }
        }
      },
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

        { id: 3, nome: "Mais pedidos", categoriaId: "all", local: "espaco_2", ativa: true, icone: "TrendingUp", modo: "categoria", ordem: 1, linkSeo: "mais-vendidos", tituloSeo: "Mais Pedidos", descricaoSeo: "Os produtos mais pedidos e procurados nas Farmácias Associadas." },
        { id: 4, nome: "Ofertas da Semana", categoriaId: "ofertas", local: "espaco_2", ativa: true, icone: "Percent", modo: "categoria", ordem: 2, linkSeo: "ofertas-da-semana", tituloSeo: "Ofertas da Semana", descricaoSeo: "As melhores promoções da semana." },
        { id: 5, nome: "Novidades", categoriaId: "novidades", local: "espaco_3", ativa: true, icone: "Sparkles", modo: "categoria", ordem: 1, linkSeo: "novidades", tituloSeo: "Novidades", descricaoSeo: "Lançamentos e novos produtos." },
        { id: 6, nome: "Mamãe e Bebê", categoriaId: "144", local: "espaco_3", ativa: true, icone: "Baby", modo: "categoria", ordem: 2, linkSeo: "mamae-e-bebe", tituloSeo: "Mamãe e Bebê", descricaoSeo: "Produtos para o cuidado da mamãe e do bebê." },
        { id: 7, nome: "Protetores Solares e Bronzeadores", categoriaId: "protetores", local: "espaco_3", ativa: true, icone: "Sun", modo: "categoria", ordem: 3, linkSeo: "protetores-solares-e-bronzeadores", tituloSeo: "Protetores Solares", descricaoSeo: "Proteção solar e bronzeadores." },
      ],
      setFornecedores: (fornecedores) => set({ fornecedores }),
      removeFornecedor: (id) => set((s) => ({ fornecedores: s.fornecedores.filter(f => f.id !== id) })),
      addVitrine: (v, lojaId) => set((s) => {
        if (!lojaId) {
          const nextId = s.vitrines.length > 0 ? Math.max(...s.vitrines.map(x => x.id)) + 1 : 1;
          const maxOrdem = s.vitrines.filter(x => x.local === v.local).reduce((max, x) => Math.max(max, x.ordem || 0), 0);
          return { vitrines: [...s.vitrines, { ...v, id: nextId, ordem: v.ordem || maxOrdem + 1 }] };
        } else {
          const storeVits = s.storeVitrines[lojaId] || [];
          const allVits = [...s.vitrines, ...Object.values(s.storeVitrines).flat()];
          const nextId = allVits.length > 0 ? Math.max(...allVits.map(x => x.id)) + 1 : 1;
          const maxOrdem = storeVits.filter(x => x.local === v.local).reduce((max, x) => Math.max(max, x.ordem || 0), 0);
          return { storeVitrines: { ...s.storeVitrines, [lojaId]: [...storeVits, { ...v, id: nextId, ordem: v.ordem || maxOrdem + 1 }] } };
        }
      }),
      updateVitrine: (v, lojaId) => set((s) => {
        if (!lojaId) return { vitrines: s.vitrines.map(x => x.id === v.id ? v : x) };
        const storeVits = s.storeVitrines[lojaId] || [];
        return { storeVitrines: { ...s.storeVitrines, [lojaId]: storeVits.map(x => x.id === v.id ? v : x) } };
      }),
      removeVitrine: (id, lojaId) => set((s) => {
        if (!lojaId) return { vitrines: s.vitrines.filter(v => v.id !== id) };
        const storeVits = s.storeVitrines[lojaId] || [];
        return { storeVitrines: { ...s.storeVitrines, [lojaId]: storeVits.filter(v => v.id !== id) } };
      }),
      toggleVitrine: (id, lojaId) => set((s) => {
        if (!lojaId) return { vitrines: s.vitrines.map(v => v.id === id ? { ...v, ativa: !v.ativa } : v) };
        const storeVits = s.storeVitrines[lojaId] || [];
        return { storeVitrines: { ...s.storeVitrines, [lojaId]: storeVits.map(v => v.id === id ? { ...v, ativa: !v.ativa } : v) } };
      }),
      updateProductDescriptions: async (updates, lojaId) => {
        const state = get();
        const updateMap = new Map(
          updates
            .filter(u => u.ean && u.nome)
            .map(u => [`${u.ean.trim().toLowerCase()}-${u.nome.trim().toLowerCase()}`, u.descricao])
        );
        
        let successCount = 0;
        let errorCount = 0;
        const errors: {ean: string, error: string}[] = [];
        
        // Find matched products against the base customProducts
        const matchedProducts: Produto[] = [];
        const notFound: {ean: string, nome: string}[] = [];

        updates.forEach(u => {
           const p = state.customProducts.find(cp => cp.ean?.trim().toLowerCase() === u.ean.trim().toLowerCase() && cp.nome.trim().toLowerCase() === u.nome.trim().toLowerCase());
           if (p) {
               matchedProducts.push({ ...p, descricao: u.descricao });
           } else {
               notFound.push(u);
           }
        });

        notFound.forEach(u => {
           errorCount++;
           errors.push({ ean: u.ean, error: "Produto não encontrado no catálogo pelo EAN e Nome informados." });
        });

        if (matchedProducts.length > 0) {
          if (!lojaId) {
             // Sede updating global catalog
             set((s) => ({
                customProducts: s.customProducts.map(p => {
                  const match = matchedProducts.find(m => m.id === p.id);
                  return match ? { ...p, descricao: match.descricao } : p;
                })
             }));
             
             // Update Supabase in chunks
             const chunkSize = 100;
             for (let i = 0; i < matchedProducts.length; i += chunkSize) {
               const chunk = matchedProducts.slice(i, i + chunkSize);
               for (const product of chunk) {
                  try {
                     await supabase.from('produtos').update({ descricao: product.descricao }).eq('id', product.id);
                     successCount++;
                  } catch (e: any) {
                     errorCount++;
                     errors.push({ ean: product.ean || "", error: e.message || "Erro no banco" });
                  }
               }
             }
          } else {
             // Loja Local overriding catalog
             const updatesObj: Record<string, any> = {};
             matchedProducts.forEach(m => {
                 updatesObj[m.id] = { descricao: m.descricao };
                 successCount++;
             });
             
             set((s) => {
               const storeCustom = s.storeCustomProducts[lojaId] || [];
               const updatedCustom = storeCustom.map(p => updatesObj[p.id] ? { ...p, ...updatesObj[p.id] } : p);
               const prevOverrides = s.storeProductOverrides[lojaId] || {};
               const newOverrides = { ...prevOverrides };
               
               Object.keys(updatesObj).forEach(id => {
                  if (!storeCustom.some(x => x.id === id)) {
                      newOverrides[id] = { ...(newOverrides[id] || {}), ...updatesObj[id] };
                  }
               });
               return {
                  storeCustomProducts: { ...s.storeCustomProducts, [lojaId]: updatedCustom },
                  storeProductOverrides: { ...s.storeProductOverrides, [lojaId]: newOverrides }
               };
             });
          }
        }

        return { successCount, errorCount, errors };
      },
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
      updateStoreProductPrice: async (lojaId, productId, precoPor, precoDe, estoque, ativo = true) => {
        const state = get();
        const p = state.customProducts.find(x => x.id === productId);
        if (!p) return;

        const prevStore = p.precosPorLoja || {};
        const prevStock = p.estoquesPorLoja || {};
        
        const newPrecosPorLoja = {
          ...prevStore,
          [lojaId]: {
            precoDe: precoDe !== undefined ? precoDe : p.precoDe,
            precoPor: precoPor,
            ativo: ativo
          }
        };
        
        const newEstoquesPorLoja = estoque !== undefined ? {
          ...prevStock,
          [lojaId]: estoque
        } : prevStock;

        // Optimistic UI Update
        set((s) => ({
          customProducts: s.customProducts.map(x => x.id === productId ? {
            ...x,
            precosPorLoja: newPrecosPorLoja,
            estoquesPorLoja: newEstoquesPorLoja
          } : x)
        }));

        // Supabase DB Update
        await supabase.from('produtos').update({
          precos_por_loja: newPrecosPorLoja,
          estoques_por_loja: newEstoquesPorLoja
        }).eq('id', productId);
      },
      updateStoreProductStatus: async (lojaId, productId, ativo) => {
        const state = get();
        const product = state.customProducts.find(p => p.id === productId);
        if (!product) return;

        const prevStore = product.precosPorLoja || {};
        const newPrecosPorLoja = {
          ...prevStore,
          [lojaId]: {
            ...prevStore[lojaId],
            ativo
          }
        };

        // Optimistic UI Update
        set((s) => ({
          customProducts: s.customProducts.map(x => x.id === productId ? {
            ...x,
            precosPorLoja: newPrecosPorLoja
          } : x)
        }));

        // Supabase DB Update
        await supabase.from('produtos').update({
          precos_por_loja: newPrecosPorLoja
        }).eq('id', productId);
      },
      bulkUpdateStoreProductStatus: async (lojaId, productIds, ativo) => {
        const state = get();
        const idsSet = new Set(productIds);
        
        // Prepare updates for DB
        const dbUpdates = state.customProducts
          .filter(p => idsSet.has(p.id))
          .map(product => {
            const prevStore = product.precosPorLoja || {};
            const newPrecosPorLoja = {
              ...prevStore,
              [lojaId]: {
                ...prevStore[lojaId],
                ativo
              }
            };
            return {
              id: product.id,
              precos_por_loja: newPrecosPorLoja
            };
          });

        // Optimistic UI Update
        set((s) => ({
          customProducts: s.customProducts.map(x => {
            if (idsSet.has(x.id)) {
              const prevStore = x.precosPorLoja || {};
              return {
                ...x,
                precosPorLoja: {
                  ...prevStore,
                  [lojaId]: {
                    ...prevStore[lojaId],
                    ativo
                  }
                }
              };
            }
            return x;
          })
        }));

        // Supabase DB Update (Sequential due to JSONB constraints, but safe)
        for (const update of dbUpdates) {
          await supabase.from('produtos').update({
            precos_por_loja: update.precos_por_loja
          }).eq('id', update.id);
        }
      },
      importStoreSpreadsheet: async (lojaId, items) => {
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
          const updatedProducts = state.customProducts.map(p => {
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
          });
          
          set({ customProducts: updatedProducts });

          // Send bulk updates to Supabase
          const productsToUpdate = updatedProducts.filter(p => updatesToApply.has(p.id));
          for (const p of productsToUpdate) {
            await supabase.from('produtos').update({
              precos_por_loja: p.precosPorLoja,
              estoques_por_loja: p.estoquesPorLoja
            }).eq('id', p.id);
          }
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
        storeVitrines: state.storeVitrines,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Load products from Supabase after local rehydration
          state.loadProducts();

          // Add default vitrines if missing (migration for existing localStorage)
          if (!state.vitrines || !state.vitrines.some(v => v.categoriaId === "all")) {
            const defaults = [
              { id: 3, nome: "Mais pedidos", categoriaId: "all", local: "espaco_2" as const, ativa: true, icone: "TrendingUp", modo: "categoria" as const, ordem: 1, linkSeo: "mais-vendidos", tituloSeo: "Mais Pedidos", descricaoSeo: "Os produtos mais pedidos e procurados nas Farmácias Associadas." },
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
