import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Produto, Vitrine } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { supabaseStorage } from "@/lib/supabaseStorage";
import { toTitleCase } from "@/lib/utils";
import { checkIsGenerico } from "@/lib/format";

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
  updateStoreProductDestaque: (lojaId: string, productId: string, destaque: boolean) => Promise<void>;
  updateStoreProductStock: (lojaId: string, productId: string, estoque: number) => Promise<void>;
  bulkUpdateStoreProductStatus: (lojaId: string, productIds: string[], ativo: boolean) => Promise<void>;
  importStoreSpreadsheet: (lojaId: string, items: StorePriceItem[]) => Promise<{ updated: number; notFound: number; total: number }>;
}

// Helper: map Supabase row to Produto type
export function mapRowToProduto(d: any): Produto {
  const isGen = checkIsGenerico(d);
  const rawInternalTags = Array.isArray(d.internal_tags) ? d.internal_tags : [];
  const rawSelosIds = rawInternalTags
    .filter((t: string) => t.startsWith("selo:"))
    .map((t: string) => t.replace("selo:", ""));

  const tagFiltrosValores = rawInternalTags
    .filter((t: string) => t.startsWith("filtro:"))
    .map((t: string) => {
      const parts = t.replace("filtro:", "").split(":");
      return { filtroId: parts[0] || "", opcaoId: parts[1] || "" };
    });

  const tagCompreJunto = rawInternalTags
    .find((t: string) => t.startsWith("comprejunto:"))
    ?.replace("comprejunto:", "") || "";

  if (isGen && !rawSelosIds.includes("gen")) {
    rawSelosIds.push("gen");
  }

  const meta = d.metadata || {};

  return {
    id: d.id,
    ean: d.ean || "",
    nome: toTitleCase(d.nome || ""),
    descricao: d.descricao || "",
    url: d.slug || "",
    slug: d.slug || "",
    marca: d.marca || meta.marca || "",
    precoDe: Number(d.preco_de) || 0,
    precoPor: Number(d.preco_por) || 0,
    estoque: d.estoque || 0,
    registroAnvisa: d.registro_anvisa || meta.registro_anvisa || "",
    tarja: d.tarja || meta.tarja || "Sem Tarja",
    retemReceita: d.retem_receita ?? meta.retem_receita ?? false,
    generico: isGen || d.generico || meta.generico || false,
    possuiImagem: d.possui_imagem || false,
    categoriaId: d.categoria_id ? String(d.categoria_id) : "",
    subcategoriaId: d.subcategoria_id ? String(d.subcategoria_id) : "",
    categoriasAdicionais: Array.isArray(d.categorias_adicionais) ? d.categorias_adicionais : (Array.isArray(meta.categorias_adicionais) ? meta.categorias_adicionais : []),
    categoriasIds: Array.isArray(d.categorias_ids) ? d.categorias_ids : (Array.isArray(meta.categorias_ids) ? meta.categorias_ids : (Array.isArray(d.categorias_adicionais) ? d.categorias_adicionais : [])),
    subcategoriasIds: Array.isArray(d.subcategorias_adicionais) ? d.subcategorias_adicionais : (Array.isArray(d.subcategorias_ids) ? d.subcategorias_ids : (Array.isArray(meta.subcategorias_ids) ? meta.subcategorias_ids : [])),
    internalTags: rawInternalTags.filter((t: string) => !t.startsWith("selo:") && !t.startsWith("filtro:") && !t.startsWith("comprejunto:")),
    selosIds: rawSelosIds,
    principiosAtivos: Array.isArray(d.principios_ativos) ? d.principios_ativos : (Array.isArray(meta.principios_ativos) ? meta.principios_ativos : []),
    imagens: d.imagens || meta.imagens || [],
    foto: d.foto || (Array.isArray(d.imagens) && d.imagens[0] ? (d.imagens[0].caminhoImagem || d.imagens[0]) : "") || "",
    videoUrl: d.video_url || meta.video_url || "",
    destaque: d.destaque || false,
    ativo: d.ativo !== false,
    aVenda: d.a_venda !== false,
    visivel: d.visivel !== false,
    buscavel: d.buscavel !== false,
    lancamento: d.lancamento || false,
    nivelRelevancia: d.nivel_relevancia ?? meta.nivel_relevancia ?? d.prioridade ?? 0,
    prioridade: d.prioridade ?? meta.prioridade ?? d.nivel_relevancia ?? 0,
    termosPesquisa: d.termos_pesquisa || meta.termos_pesquisa || "",
    precoBase: Number(d.preco_base) || 0,
    seoTitulo: d.seo_titulo || d.titulo_seo || meta.seo_titulo || meta.titulo_seo || "",
    tituloSeo: d.titulo_seo || d.seo_titulo || meta.titulo_seo || meta.seo_titulo || "",
    seoDescricao: d.seo_descricao || d.meta_description || meta.seo_descricao || meta.meta_description || "",
    metaDescription: d.meta_description || d.seo_descricao || meta.meta_description || meta.seo_descricao || "",
    imagemAlt: d.imagem_alt || meta.imagem_alt || "",
    campanhaInicio: d.campanha_inicio || undefined,
    campanhaFim: d.campanha_fim || undefined,
    emCampanha: d.em_campanha || false,
    precoCampanha: d.preco_campanha ? Number(d.preco_campanha) : undefined,
    tipoProduto: d.tipo_produto || meta.tipo_produto || "fisico",
    ncm: d.ncm || meta.ncm || "",
    lojaId: d.loja_id,
    precosPorLoja: d.precos_por_loja || {},
    estoquesPorLoja: d.estoques_por_loja || {},
    
    produtoNatureza: meta.natureza_produto || d.produto_natureza || (d.tipo_produto === "servico" ? "servico" : "fisico"),
    sku: (d.sku && d.sku !== d.ean ? d.sku : "") || d.codigo_interno || (meta.sku && meta.sku !== d.ean ? meta.sku : "") || "",
    codigoInterno: d.codigo_interno || meta.codigo_interno || "",
    ean2: d.ean2 || meta.ean2 || "",
    ean3: d.ean3 || meta.ean3 || "",
    youtubeVideoUrl: meta.youtube_video_url || d.youtube_video_url || "",
    tipoReceita: d.tipo_receita || meta.tipo_receita || "",
    alertaTexto: d.alerta_texto || meta.alerta_texto || "",
    alertaRegulatorio: d.alerta_regulatorio ?? meta.alerta_regulatorio ?? false,
    caracteristicas: Array.isArray(d.caracteristicas) ? d.caracteristicas : (Array.isArray(meta.caracteristicas) ? meta.caracteristicas : []),
    eansSecundarios: Array.isArray(d.eans_secundarios) ? d.eans_secundarios : (Array.isArray(meta.eans_secundarios) ? meta.eans_secundarios : []),
    resumoDescricao: meta.resumo_descricao || d.resumo_descricao || "",
    classeTerapeutica: d.classe_terapeutica || meta.classe_terapeutica || "",
    indicacaoTerapeutica: d.indicacao_terapeutica || meta.indicacao_terapeutica || "",
    tipoDePreco: meta.tipo_de_preco || d.tipo_de_preco || "",
    classificacaoRegistro: d.classificacao_registro || meta.classificacao_registro || "",
    tipoMedicamento: d.tipo_medicamento || meta.tipo_medicamento || "",
    quantidadeEmbalagem: meta.qtd_embalagem || 0,
    unidadeEmbalagem: meta.unidade_embalagem || "",
    quantidadeConteudo: meta.qtd_conteudo || 0,
    unidadeConteudo: meta.unidade_conteudo || "",
    sabor: meta.sabor || "",
    fps: meta.fps || 0,
    faixaEtaria: meta.faixa_etaria || "",
    filtrosValores: (Array.isArray(d.filtros_valores) && d.filtros_valores.length > 0) ? d.filtros_valores : (tagFiltrosValores.length > 0 ? tagFiltrosValores : (Array.isArray(meta.filtros_valores) ? meta.filtros_valores : [])),
    compreJuntoProdutoId: tagCompreJunto || meta.compre_junto_produto_id || d.compre_junto_produto_id || "",
  } as Produto;
}

export const useAdminProducts = create<ProductsState>()(
  persist(
    (set, get) => ({
      customProducts: [],
      storeCustomProducts: {},
      storeProductOverrides: {},
      storeRemovedProductIds: {},
      storeVitrines: {},
      getStoreVitrines: (lojaId) => {
        const state = get();
        if (!lojaId) return state.vitrines;
        const storeVits = state.storeVitrines[lojaId];
        return (storeVits && storeVits.length > 0) ? storeVits : state.vitrines;
      },
      _loaded: false,
      loadProducts: async () => {
        if (get()._loaded) return;
        set({ _loaded: true });

        // O Admin usará paginação local, então não há necessidade de preencher customProducts com todos os produtos.
      },
      addOrUpdateProduct: async (p, lojaId) => {
        const isGen = checkIsGenerico(p) || !!p.generico;
        const selosIds = Array.isArray(p.selosIds) ? [...p.selosIds] : [];
        if (isGen) {
          if (!selosIds.includes("gen")) selosIds.push("gen");
        } else {
          const filtered = selosIds.filter(id => id !== "gen");
          selosIds.length = 0;
          selosIds.push(...filtered);
        }

        const relev = Math.max(1, Math.min(10, Math.round(Number(p.nivelRelevancia ?? p.prioridade) || 1)));

        const formattedProduct: Produto = { 
          ...p, 
          generico: isGen,
          selosIds,
          nivelRelevancia: relev,
          prioridade: relev,
          nome: p.nome ? p.nome.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "" 
        };
        
        // Optimistic UI Update
        set((s) => {
          const exists = s.customProducts.find(x => x.id === p.id);
          if (exists) {
            return { customProducts: s.customProducts.map(x => x.id === p.id ? { ...x, ...formattedProduct, lojaId: lojaId ?? undefined } : x) };
          }
          return { customProducts: [{ ...formattedProduct, lojaId: lojaId ?? undefined } as any, ...s.customProducts] };
        });

        const allTags = new Set([
          ...(formattedProduct.internalTags || []).filter((t: string) => !t.startsWith("filtro:") && !t.startsWith("comprejunto:")),
          ...(formattedProduct.selosIds || []).map(id => `selo:${id}`),
          ...(formattedProduct.filtrosValores || []).map(fv => `filtro:${fv.filtroId}:${fv.opcaoId}`),
          ...(formattedProduct.compreJuntoProdutoId ? [`comprejunto:${formattedProduct.compreJuntoProdutoId}`] : [])
        ]);
        if (isGen) {
          allTags.add("selo:gen");
        } else {
          allTags.delete("selo:gen");
        }

        const metadataPayload = {
          marca: formattedProduct.marca || null,
          registro_anvisa: formattedProduct.registroAnvisa || null,
          tarja: formattedProduct.tarja || null,
          retem_receita: formattedProduct.retemReceita || false,
          tipo_receita: formattedProduct.tipoReceita || null,
          tipo_medicamento: formattedProduct.tipoMedicamento || null,
          classificacao_registro: formattedProduct.classificacaoRegistro || null,
          classe_terapeutica: formattedProduct.classeTerapeutica || null,
          indicacao_terapeutica: formattedProduct.indicacaoTerapeutica || null,
          principios_ativos: formattedProduct.principiosAtivos || [],
          alerta_texto: formattedProduct.alertaTexto || null,
          alerta_regulatorio: formattedProduct.alertaRegulatorio || false,
          caracteristicas: formattedProduct.caracteristicas || [],
          ncm: formattedProduct.ncm || null,
          nivel_relevancia: relev,
          prioridade: relev,
          termos_pesquisa: formattedProduct.termosPesquisa || null,
          seo_titulo: formattedProduct.seoTitulo || formattedProduct.tituloSeo || null,
          titulo_seo: formattedProduct.seoTitulo || formattedProduct.tituloSeo || null,
          meta_description: formattedProduct.metaDescription || formattedProduct.seoDescricao || null,
          seo_descricao: formattedProduct.metaDescription || formattedProduct.seoDescricao || null,
          imagem_alt: formattedProduct.imagemAlt || null,
          eans_secundarios: formattedProduct.eansSecundarios || [],
          codigo_interno: formattedProduct.codigoInterno || (formattedProduct.sku && formattedProduct.sku !== formattedProduct.ean ? formattedProduct.sku : null) || null,
          natureza_produto: formattedProduct.produtoNatureza || (formattedProduct.tipoProduto === "servico" ? "servico" : "fisico"),
          tipo_produto: formattedProduct.tipoProduto || "fisico",
          youtube_video_url: formattedProduct.youtubeVideoUrl || null,
          filtros_valores: formattedProduct.filtrosValores || [],
          categorias_ids: formattedProduct.categoriasIds || [],
          subcategorias_ids: formattedProduct.subcategoriasIds || [],
          categorias_adicionais: formattedProduct.categoriasAdicionais || [],
          compre_junto_produto_id: formattedProduct.compreJuntoProdutoId || null,
        };

        // Supabase DB Update
        const { error } = await (supabase.from('produtos') as any).upsert({
          id: formattedProduct.id,
          ean: formattedProduct.ean || null,
          nome: formattedProduct.nome,
          descricao: formattedProduct.descricao || null,
          slug: formattedProduct.slug || formattedProduct.url || `${formattedProduct.nome?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${formattedProduct.id}`,
          marca: formattedProduct.marca || null,
          preco_de: formattedProduct.precoDe || 0,
          preco_por: formattedProduct.precoPor || 0,
          estoque: formattedProduct.estoque || 0,
          registro_anvisa: formattedProduct.registroAnvisa || null,
          tarja: formattedProduct.tarja || null,
          retem_receita: formattedProduct.retemReceita || false,
          generico: isGen,
          possui_imagem: formattedProduct.possuiImagem || false,
          categoria_id: formattedProduct.categoriaId || null,
          subcategoria_id: formattedProduct.subcategoriaId || null,
          categorias_adicionais: formattedProduct.categoriasAdicionais || formattedProduct.categoriasIds || [],
          subcategorias_adicionais: formattedProduct.subcategoriasIds || [],
          internal_tags: Array.from(allTags),
          principios_ativos: formattedProduct.principiosAtivos || [],
          imagens: formattedProduct.imagens || [],
          video_url: formattedProduct.videoUrl || null,
          destaque: formattedProduct.destaque || false,
          ativo: formattedProduct.ativo !== false,
          lancamento: formattedProduct.lancamento || false,
          produto_natureza: formattedProduct.produtoNatureza || null,
          tipo_produto: formattedProduct.tipoProduto || null,
          codigo_interno: formattedProduct.codigoInterno || (formattedProduct.sku && formattedProduct.sku !== formattedProduct.ean ? formattedProduct.sku : null) || null,
          caracteristicas: formattedProduct.caracteristicas || [],
          ncm: formattedProduct.ncm || null,
          classe_terapeutica: formattedProduct.classeTerapeutica || null,
          indicacao_terapeutica: formattedProduct.indicacaoTerapeutica || null,
          tipo_medicamento: formattedProduct.tipoMedicamento || (isGen ? "generico" : null),
          faixa_etaria: formattedProduct.faixaEtaria || null,
          titulo_seo: formattedProduct.seoTitulo || formattedProduct.tituloSeo || null,
          meta_description: formattedProduct.metaDescription || formattedProduct.seoDescricao || null,
          alerta_regulatorio: formattedProduct.alertaRegulatorio === true,
          alerta_texto: formattedProduct.alertaTexto || null,
          tipo_receita: formattedProduct.tipoReceita || null,
          resumo_descricao: formattedProduct.resumoDescricao || null,
          termos_pesquisa: formattedProduct.termosPesquisa || null,
          buscavel: formattedProduct.buscavel !== false,
          nivel_relevancia: Number(formattedProduct.nivelRelevancia ?? formattedProduct.prioridade) || 1,
          prioridade: Number(formattedProduct.nivelRelevancia ?? formattedProduct.prioridade) || 1,
          imagem_alt: formattedProduct.imagemAlt || null,
        });
        
        if (error) {
          console.error("Erro ao salvar o produto no Supabase:", error);
          throw error;
        }

        if (lojaId) {
          const localOverrides = (formattedProduct.precosPorLoja?.[lojaId] || {}) as any;
          const pPor = Number(localOverrides.precoPor) > 0 ? Number(localOverrides.precoPor) : (Number(formattedProduct.precoPor) || Number(formattedProduct.preco) || 0);
          const pDe = Number(localOverrides.precoDe) > 0 ? Number(localOverrides.precoDe) : (Number(formattedProduct.precoDe) || pPor);
          const pEst = localOverrides.estoque ?? formattedProduct.estoque ?? 0;
          const pAtivo = localOverrides.ativo ?? formattedProduct.ativo ?? true;

          const { data: existing, error: findError } = await supabase.from('produto_precos_loja')
            .select('id')
            .eq('produto_id', formattedProduct.id)
            .eq('loja_id', lojaId)
            .maybeSingle();
            
          let storeError;
          if (existing) {
            const res = await supabase.from('produto_precos_loja').update({
              ...(pDe > 0 ? { preco_de: pDe } : {}),
              ...(pPor > 0 ? { preco_por: pPor } : {}),
              estoque: pEst,
              ativo: pAtivo
            }).eq('id', existing.id);
            storeError = res.error;
          } else {
            const res = await supabase.from('produto_precos_loja').insert({
              produto_id: formattedProduct.id,
              loja_id: lojaId,
              preco_de: pDe,
              preco_por: pPor,
              estoque: pEst,
              ativo: pAtivo
            });
            storeError = res.error;
          }

          if (storeError) {
            console.error("Erro ao salvar o preço da loja no Supabase:", storeError);
            throw storeError;
          }
        }
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
          return (state.customProducts || []).filter(p => !p.lojaId);
        }

        const removedIds = new Set(state.storeRemovedProductIds?.[lojaId] || []);
        const overrides = state.storeProductOverrides?.[lojaId] || {};
        const storeCreated = state.storeCustomProducts?.[lojaId] || [];

        const baseMerged = (state.customProducts || [])
          .filter(p => !p.lojaId || p.lojaId === lojaId)
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
              estoque: (storeStock !== undefined && storeStock > 0) ? storeStock : (ov.estoque !== undefined && ov.estoque > 0 ? ov.estoque : (p.estoque || 0)),
              ativo: storePrice?.ativo !== undefined ? storePrice.ativo : (ov.ativo !== undefined ? ov.ativo : (p.ativo ?? true)),
              destaque: storePrice?.destaque !== undefined ? storePrice.destaque : (ov.destaque !== undefined ? ov.destaque : (p.destaque ?? false)),
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
        const state = get();
        // Match existing products by EAN or slug if ID is a generic 'gen-' ID
        const matchedProducts = products.map(p => {
          if (p.id.startsWith("gen-")) {
            const existing = state.customProducts.find(
              ep => (p.ean && ep.ean === p.ean) || (ep.slug || ep.url) === p.url
            );
            if (existing) {
              return { ...p, id: existing.id };
            }
          }
          return p;
        });

        // Deduplicate matchedProducts internally so we don't have duplicate IDs in the same chunk
        const uniqueMatchedProducts = Array.from(
          new Map(matchedProducts.map(p => [p.id, p])).values()
        );

        // Optimistic UI Update
        set((s) => {
          if (lojaId) {
            const currentStoreProducts = s.storeCustomProducts[lojaId] || [];
            const newMap = new Map(currentStoreProducts.map(x => [x.id, x]));
            uniqueMatchedProducts.forEach(p => {
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
          uniqueMatchedProducts.forEach(p => {
            if (!newMap.has(p.id)) {
              newMap.set(p.id, { ...p, nome: toTitleCase(p.nome), isNovo: true, isRevisado: false });
            } else {
              newMap.set(p.id, { ...p, nome: toTitleCase(p.nome) });
            }
          });
          return { customProducts: Array.from(newMap.values()) };
        });

        // Supabase DB Update
        const chunkSize = 100;
        for (let i = 0; i < uniqueMatchedProducts.length; i += chunkSize) {
          const chunk = uniqueMatchedProducts.slice(i, i + chunkSize);
          const upsertData = chunk.map(p => {
            const isPGen = checkIsGenerico(p) || !!p.generico;
            const pTags = new Set([
              ...(p.internalTags || []),
              ...(p.selosIds || []).map(id => `selo:${id}`)
            ]);
            if (isPGen) {
              pTags.add("selo:gen");
            }

            return {
              id: p.id,
              ean: p.ean || null,
              nome: p.nome ? p.nome.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()) : "",
              descricao: p.descricao || null,
              slug: p.slug || p.url || `${(p.nome || 'produto').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}-${p.id}`,
              marca: p.marca || null,
              preco_de: p.precoDe || 0,
              preco_por: p.precoPor || 0,
              estoque: p.estoque || 0,
              registro_anvisa: p.registroAnvisa || null,
              tarja: p.tarja || null,
              retem_receita: p.retemReceita || false,
              generico: isPGen,
              possui_imagem: p.possuiImagem || false,
              categoria_id: p.categoriaId || null,
              subcategoria_id: p.subcategoriaId || null,
              categorias_adicionais: p.categoriasAdicionais || [],
              internal_tags: Array.from(pTags),
              ativo: p.ativo ?? true,
            };
          });
          
          const { error } = await supabase.from('produtos').upsert(upsertData, { onConflict: 'id', ignoreDuplicates: false });
          if (error) {
            console.error('Error batch upserting products:', error);
            throw new Error(`Erro ao salvar no banco de dados: ${error.message}`);
          }
        }
      },
      applyBadgeToProducts: async (badgeId, productIds) => {
        const strProductIds = productIds.map(id => String(id));
        const idSet = new Set(strProductIds);
        
        set((s) => {
          const updated = s.customProducts.map(p => {
            const hasIt = p.selosIds?.includes(badgeId) || false;
            const shouldHaveIt = idSet.has(String(p.id));
            
            if (hasIt && !shouldHaveIt) {
              const updatedSelos = p.selosIds?.filter(id => id !== badgeId) || [];
              const newP = { ...p, selosIds: updatedSelos };
              if (badgeId === 'gen') newP.generico = false;
              return newP;
            } else if (!hasIt && shouldHaveIt) {
              const newP = { ...p, selosIds: [...(p.selosIds || []), badgeId] };
              if (badgeId === 'servico') newP.tipoProduto = 'servico';
              if (badgeId === 'gen') newP.generico = true;
              return newP;
            }
            return p;
          });
          return { customProducts: updated };
        });

        try {
          let query = supabase.from('produtos').select('id, internal_tags');
          if (badgeId === 'gen') {
            query = query.or(`internal_tags.cs.["selo:${badgeId}"],generico.eq.true`);
          } else {
            query = query.contains('internal_tags', JSON.stringify([`selo:${badgeId}`]));
          }

          const { data: currentWithBadge, error: queryError } = await query;
            
          if (queryError) {
            console.error("Error querying products with badge:", queryError);
          }
            
          const currentIds = currentWithBadge?.map(p => String(p.id)) || [];
          const toRemove = currentWithBadge?.filter(p => !idSet.has(String(p.id))) || [];
          const toAddIds = strProductIds.filter(id => !currentIds.includes(id));
          
          console.log(`[Badges] Updating ${badgeId}: removing from ${toRemove.length}, adding to ${toAddIds.length}`);
          
          for (const p of toRemove) {
            const rawTags = p.internal_tags;
            const parsedTags = typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags;
            const tags = (Array.isArray(parsedTags) ? parsedTags : []).filter((t: string) => t !== `selo:${badgeId}`);
            const updates: any = { internal_tags: tags };
            if (badgeId === 'gen') updates.generico = false;
            const { error } = await supabase.from('produtos').update(updates).eq('id', p.id);
            if (error) console.error("Error removing badge from product", p.id, error);
          }
          
          if (toAddIds.length > 0) {
            const { data: currentToAdd, error: fetchError } = await supabase
              .from('produtos')
              .select('id, internal_tags')
              .in('id', toAddIds);
              
            if (fetchError) {
              console.error("Error fetching products to add badge:", fetchError);
            }
              
            if (currentToAdd) {
              for (const p of currentToAdd) {
                const rawTags = p.internal_tags;
                const parsedTags = typeof rawTags === 'string' ? JSON.parse(rawTags) : rawTags;
                const tags = Array.isArray(parsedTags) ? parsedTags : [];
                if (!tags.includes(`selo:${badgeId}`)) {
                  const newTags = [...tags, `selo:${badgeId}`];
                  const updates: any = { internal_tags: newTags };
                  if (badgeId === 'servico') updates.tipo_produto = 'servico';
                  if (badgeId === 'gen') updates.generico = true;
                  
                  const { error } = await supabase.from('produtos').update(updates).eq('id', p.id);
                  if (error) console.error("Error adding badge to product", p.id, error);
                }
              }
            }
          }
        } catch (e) {
          console.error("Erro ao salvar selos no supabase", e);
        }
      },
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
        { id: 1, nome: "Ofertas do Mês", categoriaId: "campanha", local: "espaco_1", ativa: true, icone: "Flame", modo: "categoria", ordem: 1, linkSeo: "ofertas-do-mes", tituloSeo: "Ofertas do Mês", descricaoSeo: "Preços exclusivos da campanha." },
        { id: 2, nome: "Destaques da Loja", categoriaId: "destaques", local: "espaco_1", ativa: true, icone: "Sparkles", modo: "categoria", ordem: 2, linkSeo: "destaques", tituloSeo: "Destaques da Loja", descricaoSeo: "Produtos em destaque na loja." },
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
          const newVitrine = { ...v, id: nextId, ordem: v.ordem || maxOrdem + 1 };
          
          const newStoreVitrines = { ...s.storeVitrines };
          Object.keys(newStoreVitrines).forEach(key => {
            if (newStoreVitrines[key] && newStoreVitrines[key].length > 0) {
              const storeMaxOrdem = newStoreVitrines[key].filter(x => x.local === v.local).reduce((max, x) => Math.max(max, x.ordem || 0), 0);
              newStoreVitrines[key] = [...newStoreVitrines[key], { ...newVitrine, ordem: v.ordem || storeMaxOrdem + 1 }];
            }
          });
          
          return { vitrines: [...s.vitrines, newVitrine], storeVitrines: newStoreVitrines };
        } else {
          const storeVits = (s.storeVitrines[lojaId] && s.storeVitrines[lojaId].length > 0) ? s.storeVitrines[lojaId] : s.vitrines;
          const allVits = [...s.vitrines, ...Object.values(s.storeVitrines).flat()];
          const nextId = allVits.length > 0 ? Math.max(...allVits.map(x => x.id)) + 1 : 1;
          const maxOrdem = storeVits.filter(x => x.local === v.local).reduce((max, x) => Math.max(max, x.ordem || 0), 0);
          return { storeVitrines: { ...s.storeVitrines, [lojaId]: [...storeVits, { ...v, id: nextId, ordem: v.ordem || maxOrdem + 1 }] } };
        }
      }),
      updateVitrine: (v, lojaId) => set((s) => {
        if (!lojaId) {
          const newStoreVitrines = { ...s.storeVitrines };
          Object.keys(newStoreVitrines).forEach(key => {
            if (newStoreVitrines[key] && newStoreVitrines[key].some(x => x.id === v.id)) {
              newStoreVitrines[key] = newStoreVitrines[key].map(x => x.id === v.id ? v : x);
            }
          });
          return { vitrines: s.vitrines.map(x => x.id === v.id ? v : x), storeVitrines: newStoreVitrines };
        }
        const storeVits = (s.storeVitrines[lojaId] && s.storeVitrines[lojaId].length > 0) ? s.storeVitrines[lojaId] : s.vitrines;
        return { storeVitrines: { ...s.storeVitrines, [lojaId]: storeVits.map(x => x.id === v.id ? v : x) } };
      }),
      removeVitrine: (id, lojaId) => set((s) => {
        if (!lojaId) {
          const newStoreVitrines = { ...s.storeVitrines };
          Object.keys(newStoreVitrines).forEach(key => {
            if (newStoreVitrines[key]) {
              newStoreVitrines[key] = newStoreVitrines[key].filter(v => v.id !== id);
            }
          });
          return { vitrines: s.vitrines.filter(v => v.id !== id), storeVitrines: newStoreVitrines };
        }
        const storeVits = (s.storeVitrines[lojaId] && s.storeVitrines[lojaId].length > 0) ? s.storeVitrines[lojaId] : s.vitrines;
        return { storeVitrines: { ...s.storeVitrines, [lojaId]: storeVits.filter(v => v.id !== id) } };
      }),
      toggleVitrine: (id, lojaId) => set((s) => {
        if (!lojaId) {
          const newStoreVitrines = { ...s.storeVitrines };
          Object.keys(newStoreVitrines).forEach(key => {
            if (newStoreVitrines[key] && newStoreVitrines[key].some(v => v.id === id)) {
              newStoreVitrines[key] = newStoreVitrines[key].map(v => v.id === id ? { ...v, ativa: !v.ativa } : v);
            }
          });
          return { vitrines: s.vitrines.map(v => v.id === id ? { ...v, ativa: !v.ativa } : v), storeVitrines: newStoreVitrines };
        }
        const storeVits = (s.storeVitrines[lojaId] && s.storeVitrines[lojaId].length > 0) ? s.storeVitrines[lojaId] : s.vitrines;
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
        try {
          const { data: existing } = await supabase.from('produto_precos_loja')
            .select('id')
            .eq('loja_id', lojaId)
            .eq('produto_id', productId)
            .maybeSingle();

          let error;
          if (existing) {
            const res = await supabase.from('produto_precos_loja').update({
              preco_de: precoDe !== undefined ? precoDe : p.precoDe,
              preco_por: precoPor,
              ativo: ativo
            }).eq('id', existing.id);
            error = res.error;
          } else {
            const res = await supabase.from('produto_precos_loja').insert({
              loja_id: lojaId,
              produto_id: productId,
              preco_de: precoDe !== undefined ? precoDe : p.precoDe,
              preco_por: precoPor,
              ativo: ativo
            });
            error = res.error;
          }

          if (error) {
            console.error("Supabase Error updating store price:", error);
            toast.error("Erro ao salvar o preço no banco de dados.");
          }
        } catch(e) {
          console.error("Exception in update store price", e);
        }
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
        try {
          const { data: existing } = await supabase.from('produto_precos_loja')
            .select('id')
            .eq('loja_id', lojaId)
            .eq('produto_id', productId)
            .maybeSingle();

          let error;
          if (existing) {
            const res = await supabase.from('produto_precos_loja').update({
              ativo: ativo
            }).eq('id', existing.id);
            error = res.error;
          } else {
            const pPor = Number(product.precoPor) || Number(product.preco) || 0;
            const pDe = Number(product.precoDe) || pPor;
            const res = await supabase.from('produto_precos_loja').insert({
              loja_id: lojaId,
              produto_id: productId,
              preco_por: pPor > 0 ? pPor : 0,
              preco_de: pDe > 0 ? pDe : pPor,
              ativo: ativo
            });
            error = res.error;
          }

          if (error) {
            console.error("Supabase Error updating store status:", error);
          }
        } catch(e) {
          console.error("Exception in update store status", e);
        }
      },
      updateStoreProductDestaque: async (lojaId, productId, destaque) => {
        const state = get();
        const product = state.customProducts.find(p => p.id === productId);
        if (!product) return;

        const prevStore = product.precosPorLoja || {};
        const newPrecosPorLoja = {
          ...prevStore,
          [lojaId]: {
            ...prevStore[lojaId],
            destaque
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
        try {
          const { data: existing } = await supabase.from('produto_precos_loja')
            .select('id')
            .eq('loja_id', lojaId)
            .eq('produto_id', productId)
            .maybeSingle();

          let error;
          if (existing) {
            const res = await (supabase.from('produto_precos_loja') as any).update({
              destaque: destaque
            }).eq('id', existing.id);
            error = res.error;
          } else {
            const pPor = Number(product.precoPor) || Number(product.preco) || 0;
            const pDe = Number(product.precoDe) || pPor;
            const res = await (supabase.from('produto_precos_loja') as any).insert({
              loja_id: lojaId,
              produto_id: productId,
              preco_por: pPor > 0 ? pPor : 0,
              preco_de: pDe > 0 ? pDe : pPor,
              destaque: destaque
            });
            error = res.error;
          }

          if (error) {
            console.error("Supabase Error updating store destaque:", error);
          }
        } catch(e) {
          console.error("Exception in update store destaque", e);
        }
      },
      updateStoreProductStock: async (lojaId, productId, estoque) => {
        const state = get();
        const product = state.customProducts.find(p => p.id === productId);

        const prevStore = product?.estoquesPorLoja || {};
        const newEstoquesPorLoja = {
          ...prevStore,
          [lojaId]: estoque
        };

        // Optimistic UI Update
        if (product) {
          set((s) => ({
            customProducts: s.customProducts.map(x => x.id === productId ? {
              ...x,
              estoquesPorLoja: newEstoquesPorLoja
            } : x)
          }));
        }

        // Supabase DB Update
        try {
          const { data: existing } = await supabase.from('produto_precos_loja')
            .select('id, preco_por, preco_de')
            .eq('loja_id', lojaId)
            .eq('produto_id', productId)
            .maybeSingle();

          let error;
          if (existing) {
            const res = await supabase.from('produto_precos_loja').update({
              estoque: estoque
            }).eq('id', existing.id);
            error = res.error;
          } else {
            let pPor = Number(product?.precoPor) || Number(product?.preco) || 0;
            let pDe = Number(product?.precoDe) || pPor;

            if (pPor === 0) {
              const { data: prodData } = await supabase.from('produtos').select('preco_por, preco_de').eq('id', productId).maybeSingle();
              if (prodData) {
                pPor = Number(prodData.preco_por) || 0;
                pDe = Number(prodData.preco_de) || pPor;
              }
            }

            const res = await supabase.from('produto_precos_loja').insert({
              loja_id: lojaId,
              produto_id: productId,
              estoque: estoque,
              ...(pPor > 0 ? { preco_por: pPor, preco_de: pDe > 0 ? pDe : pPor } : {})
            });
            error = res.error;
          }

          if (error) {
            console.error("Supabase Error updating store stock:", error);
          }
        } catch(e) {
          console.error("Exception in update store stock", e);
        }
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
              // precos_por_loja: newPrecosPorLoja
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

        // Supabase DB Update
        const upsertData = productIds.map(id => ({
          loja_id: lojaId,
          produto_id: id,
          ativo: ativo
        }));

        try {
          const chunkSize = 100;
          for (let i = 0; i < upsertData.length; i += chunkSize) {
            const chunk = upsertData.slice(i, i + chunkSize);
            await supabase.from('produto_precos_loja').upsert(chunk, { onConflict: "loja_id, produto_id" });
          }
        } catch(e) {
          console.error("Failed to bulk update store status", e);
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
            const isMedicamento = matched.categoriaId === "142" || matched.categoriasAdicionais?.includes("142");
            const pmcMax = Math.max(matched.precoDe || 0, matched.precoPor || 0);
            let finalPrecoPor = item.precoPor;
            if (isMedicamento && pmcMax > 0 && finalPrecoPor > pmcMax) {
              finalPrecoPor = pmcMax; // Limita ao teto PMC estipulado pela rede
            }

            updatesToApply.set(matched.id, {
              precoDe: item.precoDe !== undefined ? item.precoDe : matched.precoDe,
              precoPor: finalPrecoPor,
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
              // precos_por_loja: p.precosPorLoja,
              // estoques_por_loja: p.estoquesPorLoja
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
        storeProductOverrides: state.storeProductOverrides,
        storeRemovedProductIds: state.storeRemovedProductIds,
        fornecedores: state.fornecedores,
        vitrines: state.vitrines,
        storeVitrines: state.storeVitrines,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Add default vitrines if missing (migration for existing localStorage)
          let currentVitrines = state.vitrines || [];
          let hasChanged = false;
          
          if (!currentVitrines.some(v => v.categoriaId === "campanha")) {
            currentVitrines = [
              { id: 1, nome: "Ofertas do Mês", categoriaId: "campanha", local: "espaco_1" as const, ativa: true, icone: "Flame", modo: "categoria" as const, ordem: 1, linkSeo: "ofertas-do-mes", tituloSeo: "Ofertas do Mês", descricaoSeo: "Preços exclusivos da campanha." },
              { id: 2, nome: "Destaques da Loja", categoriaId: "destaques", local: "espaco_1" as const, ativa: true, icone: "Sparkles", modo: "categoria" as const, ordem: 2, linkSeo: "destaques", tituloSeo: "Destaques da Loja", descricaoSeo: "Produtos em destaque na loja." },
              ...currentVitrines
            ];
            hasChanged = true;
          }
          
          if (!currentVitrines.some(v => v.categoriaId === "all")) {
            const defaults = [
              { id: 3, nome: "Mais pedidos", categoriaId: "all", local: "espaco_2" as const, ativa: true, icone: "TrendingUp", modo: "categoria" as const, ordem: 1, linkSeo: "mais-vendidos", tituloSeo: "Mais Pedidos", descricaoSeo: "Os produtos mais pedidos e procurados nas Farmácias Associadas." },
              { id: 4, nome: "Ofertas da Semana", categoriaId: "ofertas", local: "espaco_2" as const, ativa: true, icone: "Percent", modo: "categoria" as const, ordem: 2, linkSeo: "ofertas-da-semana", tituloSeo: "Ofertas da Semana", descricaoSeo: "As melhores promoções da semana." },
              { id: 5, nome: "Novidades", categoriaId: "novidades", local: "espaco_3" as const, ativa: true, icone: "Sparkles", modo: "categoria" as const, ordem: 1, linkSeo: "novidades", tituloSeo: "Novidades", descricaoSeo: "Lançamentos e novos produtos." },
              { id: 6, nome: "Mamãe e Bebê", categoriaId: "144", local: "espaco_3" as const, ativa: true, icone: "Baby", modo: "categoria" as const, ordem: 2, linkSeo: "mamae-e-bebe", tituloSeo: "Mamãe e Bebê", descricaoSeo: "Produtos para o cuidado da mamãe e do bebê." },
              { id: 7, nome: "Protetores Solares e Bronzeadores", categoriaId: "protetores", local: "espaco_3" as const, ativa: true, icone: "Sun", modo: "categoria" as const, ordem: 3, linkSeo: "protetores-solares-e-bronzeadores", tituloSeo: "Protetores Solares", descricaoSeo: "Proteção solar e bronzeadores." },
            ];
            currentVitrines = [...currentVitrines, ...defaults];
            hasChanged = true;
          }
          if (hasChanged) {
            // Deduplicate to clean up existing messed up state
            const deduplicated = currentVitrines.filter((v, index, self) => index === self.findIndex((t) => t.id === v.id));
            useAdminProducts.setState({ vitrines: deduplicated });
          } else {
            // Even if no defaults were added, let's run a deduplication pass just in case
            const deduplicated = currentVitrines.filter((v, index, self) => index === self.findIndex((t) => t.id === v.id));
            if (deduplicated.length !== currentVitrines.length) {
              useAdminProducts.setState({ vitrines: deduplicated });
            }
          }

          // Deduplicate storeVitrines as well to clean up corrupted states
          const currentStoreVitrines = state.storeVitrines || {};
          let storeVitrinesChanged = false;
          const newStoreVitrines = { ...currentStoreVitrines };

          for (const lojaId in newStoreVitrines) {
            const vits = newStoreVitrines[lojaId];
            if (vits && vits.length > 0) {
              const deduplicatedVits = vits.filter((v, index, self) => index === self.findIndex((t) => t.id === v.id));
              if (deduplicatedVits.length !== vits.length) {
                newStoreVitrines[lojaId] = deduplicatedVits;
                storeVitrinesChanged = true;
              }
            }
          }

          if (storeVitrinesChanged) {
            useAdminProducts.setState({ storeVitrines: newStoreVitrines });
          }
        }
      }
    }
  )
);

