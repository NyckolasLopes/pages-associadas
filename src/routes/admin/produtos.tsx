import { Link, createFileRoute, useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { useAdminProducts, mapRowToProduto } from "@/stores/products";
import { useRegionsStore } from "@/stores/regions";
import { useAdmin } from "@/stores/admin";
import { getDeterministicStock } from "@/lib/stock";
import { catalog, getCategorias } from "@/services/catalog";
import categoriesData from "@/data/categories.json";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useMemo, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FileUp,
  FileDown,
  FileSpreadsheet,
  Download,
  Trash2,
  Search,
  Package,
  ChevronLeft,
  ChevronRight,
  PlusCircle,
  Layers,
  FileText,
  Stethoscope,
  RefreshCw,
  Info,
  ShieldCheck,
  Store,
  Copy
} from "lucide-react";
import { getCityFromCep, searchProductsMatch } from "@/lib/utils";
import type { Produto } from "@/types";
import { toast } from "sonner";
import {
  SpreadsheetImporter,
  generateTemplate,
  exportProductsAsExcel,
} from "@/components/admin/SpreadsheetImporter";
import { DescriptionImporter } from "@/components/admin/DescriptionImporter";
import { BulkEditModal } from "@/components/admin/BulkEditModal";
import { ProductEditorForm } from "@/components/admin/ProductEditorForm";
import { productImage } from "@/lib/format";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SubirDadosLojaModal } from "@/components/admin/SubirDadosLojaModal";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/admin/produtos")({
  component: AdminProdutos,
});

const PAGE_SIZE = 15;

function AdminProdutos() {
  const { 
    customProducts, 
    storeCustomProducts,
    storeProductOverrides,
    storeRemovedProductIds,
    removeProduct, 
    importProducts, 
    addOrUpdateProduct, 
    clearProducts, 
    updateProductDescriptions, 
    bulkUpdateProducts,
    getStoreEffectiveProducts,
    resetStoreProductsToGeneral,
    updateStoreProductStatus,
    updateStoreProductDestaque,
    bulkUpdateStoreProductStatus
  } = useAdminProducts();
  const { regions, prices } = useRegionsStore();
  const { pharmacies, activeStoreId, currentUser, grupos } = useAdmin();
  const location = useLocation();
  const isRoot = location.pathname === "/admin/produtos" || location.pathname === "/admin/produtos/";

  const isGlobalAdmin = currentUser?.proprietario || grupos?.find((g: any) => g.id === currentUser?.grupoId)?.permissao_total === true;

  // Resolved store context
  const currentLojaId = activeStoreId || (currentUser?.lojasVinculadas && currentUser.lojasVinculadas[0]) || null;
  const currentLoja = pharmacies.find(p => p.id === currentLojaId || undefined);

  // Products effective for current scope (Store or Global Network Master)
  const currentProductsList = useMemo(() => {
    return getStoreEffectiveProducts(currentLojaId || undefined);
  }, [customProducts, storeCustomProducts, storeProductOverrides, storeRemovedProductIds, currentLojaId, getStoreEffectiveProducts]);

  const [importerOpen, setImporterOpen] = useState(false);
  const [descImporterOpen, setDescImporterOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Produto | null>(null);
  const [serverProducts, setServerProducts] = useState<Produto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [lojaApiDataMap, setLojaApiDataMap] = useState<Record<string, { estoque: number, precoPor: number, precoDe: number }>>({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState("15");
  const [listFilter, setListFilter] = useState("all");
  const [syncModalOpen, setSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [apiProdutosUrl, setApiProdutosUrl] = useState("");
  const [apiPrecosUrl, setApiPrecosUrl] = useState("");
  const [apiEstoqueUrl, setApiEstoqueUrl] = useState("");
  const [jsonFile, setJsonFile] = useState<File | null>(null);
  const [deleteAllModalOpen, setDeleteAllModalOpen] = useState(false);
  const [subirDadosOpen, setSubirDadosOpen] = useState(false);
  const [isSyncingApi, setIsSyncingApi] = useState(false);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const estoque = params.get("estoque");
    if (estoque === "zerado") setListFilter("out-of-stock");
    if (estoque === "baixo") setListFilter("low-stock");
  }, [location.search]);

  useEffect(() => {
    async function loadLojaApiData() {
      if (currentLojaId || undefined) {
        const { supabase } = await import("@/integrations/supabase/client");
        const { data } = await supabase
          .from("produto_precos_loja")
          .select("produto_id, estoque, preco_por, preco_de")
          // @ts-ignore
          .eq("loja_id", currentLojaId || undefined);
        
        if (data) {
          const map: Record<string, any> = {};
          data.forEach(d => {
            map[d.produto_id] = { estoque: d.estoque, precoPor: d.preco_por, precoDe: d.preco_de };
          });
          setLojaApiDataMap(map);
        }
      } else {
        setLojaApiDataMap({});
      }
    }
    loadLojaApiData();
  }, [currentLojaId]);

  const handleEditProduct = (product: Produto) => {
    setEditingProduct(product);
    setEditorOpen(true);
  };

  const [stockModalOpen, setStockModalOpen] = useState(false);
  const [editingStockProduct, setEditingStockProduct] = useState<Produto | null>(null);
  const [newStockValue, setNewStockValue] = useState<string>("0");

  const handleOpenStockModal = (p: Produto) => {
    setEditingStockProduct(p);
    const currentStock = lojaApiDataMap[p.id]?.estoque ?? getDeterministicStock(p, currentLojaId || '');
    setNewStockValue(String(currentStock));
    setStockModalOpen(true);
  };

  const handleSaveStock = async () => {
    if (!editingStockProduct || !currentLojaId || undefined) return;
    const store = pharmacies.find(s => s.id === currentLojaId || undefined);
    
    const stockVal = parseInt(newStockValue, 10);
    if (isNaN(stockVal)) return;

    await useAdminProducts.getState().updateStoreProductStock(currentLojaId, editingStockProduct.id, stockVal);
    
    setLojaApiDataMap(prev => ({
      ...prev,
      [editingStockProduct.id]: {
        ...(prev[editingStockProduct.id] || { precoPor: editingStockProduct.precoPor, precoDe: editingStockProduct.precoDe }),
        estoque: stockVal
      }
    }));

    toast.success(`Estoque atualizado para a loja ${store?.nome || store?.razaoSocial}`);
    setStockModalOpen(false);
    setEditingStockProduct(null);
  };

  const handleSaveProduct = async (updatedProduct: Produto) => {
    const finalProduct: Produto = {
      ...updatedProduct,
      lojaId: currentLojaId || undefined,
      isIndividualLoja: !!currentLojaId,
    };
    await addOrUpdateProduct(finalProduct, currentLojaId || undefined);
    setEditorOpen(false);
    toast.success(
      currentLojaId
        ? `Produto atualizado exclusivamente para a loja ${currentLoja?.nome || ""}!`
        : `Produto atualizado no Catálogo Geral da Rede!`
    );
    // Reload server products after update
    const numericPageSize = parseInt(pageSize, 10);
    catalog.adminSearchProducts({ search, page, pageSize: numericPageSize, listFilter, lojaId: currentLojaId || undefined })
      .then(({ results, count }) => {
        setServerProducts(results);
        setTotalProducts(count);
      });
  };

  const handleExportJson = async () => {
    setIsLoading(true);
    try {
      // Exporta apenas a estrutura (exemplo) do JSON
      const sampleStructure = [{
        "produto": {
          "cabecalho": {
            "titulo": "",
            "codigo_sistema": null
          },
          "informacoes_basicas": {
            "produto_ativo": false,
            "buscavel_visivel_na_busca": false,
            "selo_de_lancamento": false,
            "natureza_do_produto": "",
            "sku_codigo_interno": "",
            "ean_codigo_barras": "",
            "eans_secundarios": "",
            "descricao_comercial_nome": "",
            "descricao_longa": "",
            "categoria": {
              "id": null,
              "nome": ""
            },
            "subcategoria": {
              "id": null,
              "nome": ""
            },
            "categorias_adicionais": [],
            "subcategorias_adicionais": []
          },
          "marca_e_dcb": {
            "marca": "",
            "principios_ativos": [],
            "classe_terapeutica": ""
          },
          "alertas_e_caracteristicas": {
            "alerta_regulatorio_texto": "",
            "caracteristicas_adicionais": [],
            "requer_exibicao_alerta_regulatorio": false
          },
          "registro_anvisa_retencao_tarja_tipo_receita": {
            "ms_registro_anvisa": "",
            "retem_receita": "",
            "tarja": "",
            "tipo_de_receita": ""
          },
          "imagens_do_produto": [],
          "precificacao": {
            "preco_de": null,
            "preco_por": null
          },
          "tributario_e_relevancia": {
            "ncm": "",
            "nivel_de_relevancia_prioridade": null
          },
          "google_seo_aeo_geo": {
            "titulo_da_pagina_seo": "",
            "link_da_pagina_slug": "",
            "palavras_chave_foco": "",
            "descricao_da_pagina_meta_description": "",
            "texto_alternativo_da_imagem_alt_seo": "",
            "tags_de_busca_internas": ""
          }
        }
      }];

      const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(sampleStructure, null, 2));
      const dlAnchorElem = document.createElement("a");
      dlAnchorElem.setAttribute("href", dataStr);
      dlAnchorElem.setAttribute("download", "estrutura_produto_exemplo.json");
      dlAnchorElem.click();
      toast.success("Estrutura exportada com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar JSON");
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportGoogleShopping = async () => {
    setIsLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data, error } = await supabase.from('produtos').select('*').eq('ativo', true);
      
      if (error || !data) throw new Error("Falha ao exportar");

      // Filtrar produtos ativos, com preço e sem tarja de retenção
      const feedProducts = data.filter(p => 
        p.preco_por > 0 &&
        p.tarja !== "Vermelha" && 
        p.tarja !== "Preta" &&
        p.tarja !== "Vermelha com Retenção de Receita"
      );

      let xml = `<?xml version="1.0"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>E-commerce Associadas</title>
    <link>https://associadas.com.br</link>
    <description>Catálogo de Produtos - Feed Oficial</description>
`;

      feedProducts.forEach(p => {
        const isMedicamento = p.categoria_id === "142" || (p.nome && p.nome.toLowerCase().includes("medicamento"));
        const googleCategory = isMedicamento ? "Health & Beauty > Health Care > Medications" : "Health & Beauty > Personal Care";
        
        const price = p.preco_de && p.preco_de > p.preco_por ? p.preco_de : p.preco_por;
        const salePrice = p.preco_de && p.preco_de > p.preco_por ? p.preco_por : null;
        
        const imgLink = p.possui_imagem && p.ean ? `https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/${p.ean}.jpg` : `https://associadas.com.br/placeholder.jpg`;

        xml += `
    <item>
      <g:id>${p.id}</g:id>
      <g:title><![CDATA[${p.nome}]]></g:title>
      <g:description><![CDATA[${p.descricao || p.nome}]]></g:description>
      <g:link>https://associadas.com.br/p/${p.id}</g:link>
      <g:image_link>${imgLink}</g:image_link>
      <g:condition>new</g:condition>
      <g:availability>in stock</g:availability>
      <g:price>${price.toFixed(2)} BRL</g:price>
      ${salePrice ? `<g:sale_price>${salePrice.toFixed(2)} BRL</g:sale_price>` : ''}
      <g:brand><![CDATA[${p.marca || 'Associadas'}]]></g:brand>
      <g:gtin>${p.ean || ''}</g:gtin>
      <g:google_product_category><![CDATA[${googleCategory}]]></g:google_product_category>
    </item>`;
      });

      xml += `
  </channel>
</rss>`;

      const blob = new Blob([xml], { type: "application/xml" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = "google_shopping_feed.xml";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      toast.error("Erro ao exportar XML");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSpreadsheetImport = async (products: Produto[]) => {
    // Forçar salvamento no catálogo geral (para refletir em todas as lojas) se for admin global
    const targetLojaId = isGlobalAdmin ? null : currentLojaId;
    
    try {
      await importProducts(products, targetLojaId);
      toast.success(
        targetLojaId
          ? `Planilha importada com sucesso exclusivamente para a loja ${currentLoja?.nome || ""}!`
          : `Planilha importada no Catálogo Geral da Rede e refletirá em todas as lojas!`
      );
    } catch (err) {
      console.error(err);
      throw err; // Repassa o erro para o SpreadsheetImporter exibir o erro
    }
  };

  const simulateApiSync = () => {
    setSyncModalOpen(true);
  };

  const handleDeleteAll = () => {
    setDeleteAllModalOpen(true);
  };

  const confirmDeleteAll = () => {
    clearProducts(currentLojaId || undefined);
    setDeleteAllModalOpen(false);
    toast.success(
      currentLojaId
        ? `Catálogo exclusivo da loja ${currentLoja?.nome || ""} foi limpo.`
        : `Todos os produtos da rede foram excluídos.`
    );
  };

  const handleConfirmSync = async () => {
    setIsSyncing(true);
    setSyncProgress(10);
    
    // Fallback Mock se falhar na API
    const fallbackProdutos = {
      "produtos": [
        {
          "ean": "0000000000001",
          "eans_secundarios": ["0000000000002", "0000000000003"],
          "codigoInterno": "111",
          "nome": "Paracetamol Ems 750mg 20cpr Generico",
          "descricao": "PARACETAMOL EMS 750MG 20CPR GENERICO",
          "caracteristicas": [{ "titulo": "Modo de Usar", "descricao": "Tomar 1 comprimido, por via oral, a cada 8 horas" }],
          "tipo": 7,
          "generico": true,
          "tarja": "N",
          "retem_receita": false,
          "ativo": true,
          "prioridade": 1
        }
      ]
    };
    
    const fallbackPrecos = {
      "precos": [
        { "codigoInterno": "111", "precoDe": 15.00, "precoPor": 9.90, "percentualDesconto": 34 }
      ]
    };
    
    const fallbackEstoque = {
      "estoques": [
        { "codigoInterno": "111", "lojaCnpj": "00.000.000/0001-91", "quantidade": 50 }
      ]
    };

    try {
      setSyncProgress(30);
      let prodData = fallbackProdutos.produtos;
      
      if (apiProdutosUrl) {
        try {
          const res = await fetch(apiProdutosUrl);
          if (res.ok) {
            const data = await res.json();
            prodData = data.produtos || data;
          }
        } catch(e) {
          toast.error("Falha ao ler API de Produtos. Usando Mock para validação.");
        }
      }
      
      setSyncProgress(60);
      let precosData = fallbackPrecos.precos;
      if (apiPrecosUrl) {
        try {
          const res = await fetch(apiPrecosUrl);
          if (res.ok) {
            const data = await res.json();
            precosData = data.precos || data;
          }
        } catch(e) {
          toast.error("Falha ao ler API de Preços. Usando Mock para validação.");
        }
      }
      
      setSyncProgress(80);
      let estoquesData = fallbackEstoque.estoques;
      if (apiEstoqueUrl) {
        try {
          const res = await fetch(apiEstoqueUrl);
          if (res.ok) {
            const data = await res.json();
            estoquesData = data.estoques || data;
          }
        } catch(e) {
          toast.error("Falha ao ler API de Estoque. Usando Mock para validação.");
        }
      }

      setSyncProgress(90);
      
      // Processar os dados e unificar (Merge)
      const mappedProducts: Produto[] = prodData.map((p: any) => {
        // Encontrar o preco e estoque pro produto
        const precoInfo: any = precosData.find((pr: any) => pr.codigoInterno === p.codigoInterno) || {};
        const estoquesProduto = estoquesData.filter((est: any) => est.codigoInterno === p.codigoInterno) || [];
        const estoqueTotal = estoquesProduto.reduce((acc: number, cur: any) => acc + (cur.quantidade || 0), 0);
        
        const estoquesMapeados: Record<string, number> = {};
        estoquesProduto.forEach((est: any) => {
          const pharm = pharmacies.find(ph => ph.cnpj === est.lojaCnpj);
          if (pharm) {
            estoquesMapeados[pharm.id] = est.quantidade;
          } else if (est.lojaCnpj) {
            estoquesMapeados[est.lojaCnpj] = est.quantidade;
          }
        });

        return {
          id: p.codigoInterno || `api-${Date.now()}-${Math.random()}`,
          ean: p.ean || "",
          eansSecundarios: p.eans_secundarios || [],
          codigoInterno: p.codigoInterno,
          sku: p.sku || p.codigoInterno || "",
          foto: "",
          registroAnvisa: "",
          subcategoriaId: "",
          nome: p.nome || "Produto da API",
          descricao: p.descricao || "",
          url: `prod-api-${p.codigoInterno}`,
          caracteristicas: p.caracteristicas || [],
          tipo: p.tipo,
          generico: !!p.generico,
          tarja: p.tarja === "N" ? "Sem Tarja" : p.tarja,
          retemReceita: !!p.retem_receita,
          ativo: p.ativo !== false,
          prioridade: p.prioridade,
          precoDe: precoInfo.precoDe || 0,
          precoPor: precoInfo.precoPor || 0,
          percentualDesconto: precoInfo.percentualDesconto,
          estoque: estoqueTotal,
          estoquesPorLoja: estoquesMapeados,
          estoquePorLoja: estoquesProduto,
          marca: "Sincronizado via API",
          possuiImagem: false,
          categoriaId: "142",
          internalTags: [],
          origem: "API",
          dataImportacao: new Date().toISOString(),
          lojaId: currentLojaId || undefined,
          isIndividualLoja: !!currentLojaId,
        };
      });

      if (jsonFile) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (Array.isArray(data)) importProducts(data, currentLojaId || undefined);
          } catch {}
        };
        reader.readAsText(jsonFile);
      } else {
        importProducts(mappedProducts, currentLojaId || undefined);
      }
      
      setSyncProgress(100);
      toast.success("Sincronização concluída com sucesso!");

    } catch (e) {
      toast.error("Erro fatal durante sincronização das APIs.");
    } finally {
      setTimeout(() => {
        setIsSyncing(false);
        setSyncModalOpen(false);
        setSyncProgress(0);
        setJsonFile(null);
        setApiProdutosUrl("");
        setApiPrecosUrl("");
        setApiEstoqueUrl("");
      }, 800);
    }
  };

  useEffect(() => {
    async function loadServerProducts() {
      setIsLoading(true);
      try {
        const numericPageSize = parseInt(pageSize, 10);
        const { results, count } = await catalog.adminSearchProducts({
          search,
          page,
          pageSize: numericPageSize,
          listFilter,
          lojaId: currentLojaId || undefined
        });
        
        let finalResults = results;
        
        // Handle out-of-stock and low-stock locally since they depend on dynamic stock calc
        if (listFilter === "out-of-stock") {
          finalResults = finalResults.filter(p => {
            const s = currentLojaId ? (lojaApiDataMap[p.id]?.estoque ?? getDeterministicStock(p, currentLojaId)) : pharmacies.reduce((acc, loja) => acc + getDeterministicStock(p, loja.id), 0);
            return s <= 0;
          });
        } else if (listFilter === "low-stock") {
          finalResults = finalResults.filter(p => {
            const s = currentLojaId ? (lojaApiDataMap[p.id]?.estoque ?? getDeterministicStock(p, currentLojaId)) : pharmacies.reduce((acc, loja) => acc + getDeterministicStock(p, loja.id), 0);
            return s > 0 && s <= 5;
          });
        }
        
        // Filter out services if the current store doesn't offer them
        if (currentLojaId) {
          const pharm = pharmacies.find(ph => ph.id === currentLojaId);
          if (pharm && pharm.offersServices === false) {
            finalResults = finalResults.filter(p => {
              const isService = p.tipoProduto === "servico" || p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"));
              return !isService;
            });
          }
        }
        
        setServerProducts(finalResults);
        setTotalProducts(count);
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    
    // We delay the search slightly to debounce typing
    const timeout = setTimeout(loadServerProducts, 300);
    return () => clearTimeout(timeout);
  }, [search, page, pageSize, listFilter, currentLojaId, lojaApiDataMap]);

  // Pagination bounds
  const numericPageSize = parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(totalProducts / numericPageSize));
  const currentPage = Math.min(page, totalPages - 1);
  const paginatedProducts = serverProducts;

  if (!isRoot) {
    return (
      <div className="animate-in fade-in">
        <Outlet />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Produtos</h2>
          <p className="text-muted-foreground">
            {currentLojaId 
              ? `Gerencie o catálogo exclusivo da loja ${currentLoja?.nome || ""}.`
              : "Gerencie o catálogo geral de produtos da rede importando planilhas ou JSON."}
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          {/* Top row: Exports and Sync */}
          <div className="flex flex-wrap gap-2 justify-end items-center">
            <StoreSelector className="mb-1" />
            {isGlobalAdmin && (
              <>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportJson}
                  disabled={isLoading}
                  className="font-bold text-xs"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  Exportar JSON
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportProductsAsExcel(serverProducts)}
                  className="font-bold text-xs"
                >
                  <FileDown className="h-3.5 w-3.5 mr-1.5" />
                  Exportar Planilha
                </Button>
                
                
              </>
            )}
          </div>

          {/* Bottom row: Import Actions */}
          <div className="flex flex-wrap gap-2 justify-end mt-2">
            
            {isGlobalAdmin && (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setDeleteAllModalOpen(true)}
                  className="font-bold text-xs bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                  Excluir Todos
                </Button>
                <Button
                  size="sm"
                  onClick={() => setDescImporterOpen(true)}
                  className="font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                >
                  <FileText className="h-3.5 w-3.5 mr-1.5" />
                  Importar Descrições
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      size="sm"
                      className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white w-full sm:w-auto"
                    >
                      <PlusCircle className="h-3.5 w-3.5 mr-1.5" />
                      Novo Cadastro
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <Link to="/admin/produtos/novo" search={{ tipo: 'fisico' } as any}>
                      <DropdownMenuItem className="cursor-pointer font-medium">
                        <Package className="h-4 w-4 mr-2 text-emerald-600" />
                        Produto Físico
                      </DropdownMenuItem>
                    </Link>
                    <Link to="/admin/produtos/novo" search={{ tipo: 'servico' } as any}>
                      <DropdownMenuItem className="cursor-pointer font-medium">
                        <Stethoscope className="h-4 w-4 mr-2 text-indigo-600" />
                        Serviço de Saúde
                      </DropdownMenuItem>
                    </Link>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  size="sm"
                  onClick={() => setImporterOpen(true)}
                  className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                  Importar Planilha
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={generateTemplate}
                  className="font-bold text-xs"
                >
                  <Download className="h-3.5 w-3.5 mr-1.5" />
                  Baixar Modelo Planilha
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        {/* Table header with search */}
        <div className="p-4 border-b flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <h3 className="font-bold">
              {currentLojaId ? `Produtos de ${currentLoja?.nome || "sua loja"}` : "Seus produtos da rede"}
            </h3>
            <Badge variant="secondary" className="text-xs">{totalProducts}</Badge>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {totalProducts > 0 && (
              <div className="w-full sm:w-48">
                <Select value={listFilter} onValueChange={(v) => { setListFilter(v); setPage(0); }}>
                  <SelectTrigger className="h-8 text-xs bg-white">
                    <SelectValue placeholder="Filtrar por lista" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as listas (Sem filtro)</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                    <SelectItem value="featured">Em Destaque</SelectItem>
                    <SelectItem value="cat1">Apenas Medicamentos</SelectItem>
                    <SelectItem value="not-cat1">Não Medicamentos (Perfumaria, etc)</SelectItem>
                    <SelectItem value="generic">Genéricos</SelectItem>
                    <SelectItem value="prescription">Retém Receita</SelectItem>
                    <SelectItem value="out-of-stock">Sem Estoque</SelectItem>
                    <SelectItem value="low-stock">Estoque Baixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            {totalProducts > 0 && (
              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nome, EAN, marca..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="pl-9 h-8 text-xs bg-white"
                />
              </div>
            )}
          </div>
        </div>

        {/* Table content */}
        {isLoading ? (
          <div className="text-center py-12 bg-white rounded-lg border border-slate-200">
            <div className="animate-spin w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-500 font-medium">Carregando produtos...</p>
          </div>
        ) : totalProducts === 0 ? (
          <div className="p-12 text-center">
            <div className="h-16 w-16 mx-auto rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <FileSpreadsheet className="h-8 w-8 text-slate-400" />
            </div>
            <p className="font-bold text-slate-600 mb-1">Nenhum produto cadastrado</p>
            <p className="text-sm text-muted-foreground mb-4">
              {currentLojaId 
                ? "Esta loja ainda não possui produtos ativos. Importe uma planilha ou clique em 'Restaurar Catálogo da Rede'."
                : "Importe uma planilha Excel ou JSON para começar a gerenciar seu catálogo."}
            </p>
            <div className="flex justify-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={generateTemplate}
                className="font-bold text-xs"
              >
                <Download className="h-3.5 w-3.5 mr-1.5" />
                Baixar Modelo
              </Button>
              <Button
                size="sm"
                onClick={() => setImporterOpen(true)}
                className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700"
              >
                <FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />
                Importar Planilha
              </Button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-slate-50/50">
                    <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Produto</th>
                    <th className="text-left px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider hidden md:table-cell">Origem</th>
                    <th className="text-right px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Preço</th>
                    <th className="text-right px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Estoque</th>
                    <th className="text-center px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Status</th>
                    <th className="text-center px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider">Destaque</th>
                    <th className="text-right px-4 py-2.5 font-bold text-xs text-slate-500 uppercase tracking-wider w-12"></th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedProducts.map((p, idx) => {
                    const isStoreExclusive = currentLojaId && (p.lojaId === currentLojaId || (storeCustomProducts[currentLojaId] || []).some(x => x.id === p.id));
                    const isStoreOverride = currentLojaId && Boolean(storeProductOverrides[currentLojaId]?.[p.id]);

                    return (
                      <tr
                        key={p.id}
                        className="border-b last:border-0 hover:bg-slate-50/70 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-lg bg-white border border-slate-200 flex items-center justify-center shrink-0 overflow-hidden">
                              <img src={productImage(p)} alt={p.nome} className="w-full h-full object-contain p-1" loading="lazy" />
                            </div>
                            <div className="min-w-0 flex flex-col gap-0.5">
                              <div className="flex items-center gap-2 flex-wrap">
                                <div className="font-bold text-sm text-slate-800 truncate max-w-[250px]">{p.nome}</div>
                                {isStoreExclusive && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-purple-100 text-purple-800 border-purple-300">
                                    Exclusivo da Loja
                                  </Badge>
                                )}
                                {isStoreOverride && (
                                  <Badge className="text-[10px] px-1.5 py-0 h-4 bg-blue-100 text-blue-800 border-blue-300">
                                    Preço/Dados Alterados
                                  </Badge>
                                )}
                                {p.isNovo && <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-sky-500 text-white border-none">Novo</Badge>}
                                {p.isRevisado && <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4 bg-emerald-500 text-white border-none">Revisado</Badge>}
                              </div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded font-mono text-slate-500">EAN: {p.ean}</code>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[100px]">{p.marca || "Sem marca"}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[150px] bg-slate-100 px-1.5 py-0.5 rounded">
                                  {(() => {
                                    const cats = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.default || [];
                                    const cat = cats.find((c: any) => c.id === p.categoriaId);
                                    const sub = p.subcategoriaId ? cats.find((c: any) => c.id === p.subcategoriaId) : null;
                                    if (!cat) return "Sem categoria";
                                    return sub ? `${cat.nome} > ${sub.nome}` : cat.nome;
                                  })()}
                                </span>
                                {p.categoriaId === "142" ? (
                                  <>
                                    {Boolean(p.tarja && p.tarja !== "Sem Tarja") && (
                                      <Badge 
                                        variant={String(p.tarja).toLowerCase().includes("preta") ? "default" : "destructive"} 
                                        className={`text-[8px] px-1.5 py-0 h-4 ${String(p.tarja).toLowerCase().includes("preta") ? "bg-black text-white hover:bg-slate-900" : ""}`}
                                      >
                                        {p.tarja}
                                      </Badge>
                                    )}
                                    {Boolean(p.retemReceita) && (
                                      <Badge variant="outline" className="text-[8px] px-1.5 py-0 h-4 bg-red-50 text-red-700 border-red-200">
                                        Retém Receita
                                      </Badge>
                                    )}
                                  </>
                                ) : (
                                  <Badge variant="secondary" className="text-[8px] px-1.5 py-0 h-4 text-slate-500 bg-slate-100 hover:bg-slate-100">
                                    Não Medicamento
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <div className="flex flex-col gap-0.5">
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded w-max ${p.origem === 'API' ? 'bg-slate-800 text-white' : p.origem === 'JSON' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                              {p.origem || 'Planilha'}
                            </span>
                            <span className="text-[10px] font-medium text-slate-400">
                              {p.dataImportacao ? new Date(p.dataImportacao).toLocaleDateString("pt-BR") : new Date().toLocaleDateString("pt-BR")}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right">
                          {(() => {
                            const effectiveDe = (currentLojaId && lojaApiDataMap[p.id]?.precoDe) ? lojaApiDataMap[p.id].precoDe : p.precoDe;
                            const effectivePor = (currentLojaId && lojaApiDataMap[p.id]?.precoPor) ? lojaApiDataMap[p.id].precoPor : p.precoPor;
                            return (
                              <>
                                {effectiveDe > effectivePor && (
                                  <div className="text-xs text-muted-foreground line-through">
                                    {effectiveDe.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                  </div>
                                )}
                                <div className="font-bold text-sm text-emerald-700">
                                  {effectivePor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                                </div>
                              </>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!currentLojaId ? (
                            <span className={`text-sm font-bold ${pharmacies.reduce((acc, loja) => acc + getDeterministicStock(p, loja.id), 0) > 0 ? "text-slate-700" : "text-red-500"}`}>
                              {pharmacies.reduce((acc, loja) => acc + getDeterministicStock(p, loja.id), 0)}
                            </span>
                          ) : (
                            <div className="flex items-center justify-end gap-2 group">
                              <span className={`text-sm font-bold ${(lojaApiDataMap[p.id]?.estoque ?? getDeterministicStock(p, currentLojaId || '')) > 0 ? "text-slate-700" : "text-red-500"}`}>
                                {lojaApiDataMap[p.id]?.estoque ?? getDeterministicStock(p, currentLojaId || '')}
                              </span>
                              {isGlobalAdmin && (
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => handleOpenStockModal(p)}
                                  title="Editar Estoque"
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                </Button>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Switch
                            checked={p.ativo !== false}
                            onCheckedChange={async (checked) => {
                              // Optimistic UI Update
                              setServerProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, ativo: checked } : prod));
                              
                              if (isGlobalAdmin && !currentLojaId) {
                                await addOrUpdateProduct({ ...p, ativo: checked }, currentLojaId || undefined);
                              } else {
                                await updateStoreProductStatus(currentLojaId!, p.id, checked);
                              }
                            }}
                            className="data-[state=checked]:bg-emerald-500 scale-75"
                          />
                        </td>
                        <td className="px-4 py-3 text-center">
                          {isGlobalAdmin && !currentLojaId ? (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                setServerProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, destaque: !p.destaque } : prod));
                                await addOrUpdateProduct({ ...p, destaque: !p.destaque }, currentLojaId || undefined);
                              }}
                              className={`h-7 w-7 scale-90 ${p.destaque ? 'text-amber-400 hover:text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                              title="Destacar produto na rede"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={p.destaque ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={async () => {
                                setServerProducts(prev => prev.map(prod => prod.id === p.id ? { ...prod, destaque: !p.destaque } : prod));
                                await updateStoreProductDestaque(currentLojaId!, p.id, !p.destaque);
                              }}
                              className={`h-7 w-7 scale-90 ${p.destaque ? 'text-amber-400 hover:text-amber-500 bg-amber-50' : 'text-slate-300 hover:text-amber-400'}`}
                              title="Destacar produto na sua loja"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={p.destaque ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                            </Button>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1">
                            {isGlobalAdmin && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50"
                                  onClick={() => handleEditProduct(p)}
                                >
                                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  title="Duplicar Produto"
                                  className="h-7 w-7 text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50"
                                  onClick={() => {}}
                                >
                                  <Copy className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-50"
                                  onClick={() => {
                                    setServerProducts(prev => prev.filter(prod => prod.id !== p.id));
                                    removeProduct(p.id, currentLojaId || undefined);
                                    toast.success(currentLojaId ? "Produto removido da sua loja!" : "Produto removido da rede!");
                                  }}
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t bg-slate-50/50 gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    {totalProducts > 0 ? currentPage * numericPageSize + 1 : 0}–{Math.min((currentPage + 1) * numericPageSize, totalProducts)} de {totalProducts} produtos
                  </span>
                  <div className="flex items-center gap-2">
                    <span>Exibir:</span>
                    <Select value={pageSize} onValueChange={(v) => { setPageSize(v); setPage(0); }}>
                      <SelectTrigger className="h-7 w-20 text-xs bg-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="100">100</SelectItem>
                        <SelectItem value="500">500</SelectItem>
                        <SelectItem value="1000">1000</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage === 0 || isLoading}
                    onClick={() => setPage((p) => p - 1)}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-xs font-medium px-2">
                    {currentPage + 1} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-7 w-7"
                    disabled={currentPage >= totalPages - 1 || isLoading}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <Dialog open={stockModalOpen} onOpenChange={setStockModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Estoque</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-slate-500 mb-4">
              Tem certeza que deseja alterar o estoque da loja <span className="font-bold">{currentLoja?.nome || currentLoja?.razaoSocial}</span> para o produto <span className="font-bold">{editingStockProduct?.nome}</span>?
            </p>
            <div className="space-y-2">
              <Label>Quantidade em Estoque</Label>
              <Input 
                type="number" 
                value={newStockValue} 
                onChange={e => setNewStockValue(e.target.value)} 
                min="0"
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSaveStock();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStockModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveStock}>Confirmar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <SubirDadosLojaModal open={subirDadosOpen} onOpenChange={setSubirDadosOpen} />
      
      {/* Spreadsheet Importer Dialog */}
      <SpreadsheetImporter
        open={importerOpen}
        onOpenChange={setImporterOpen}
        onImport={handleSpreadsheetImport}
      />

      <DescriptionImporter
        open={descImporterOpen}
        onOpenChange={setDescImporterOpen}
        onImport={(updates) => updateProductDescriptions(updates, currentLojaId || undefined)}
      />

      {/* Bulk Edit Dialog */}
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        filteredProducts={serverProducts}
        onBulkUpdate={(productIds, updates) => bulkUpdateProducts(productIds, updates, currentLojaId || undefined)}
      />

      {/* Product Editor Dialog */}
      <ProductEditorForm 
        open={editorOpen}
        onOpenChange={setEditorOpen}
        product={editingProduct}
        onSave={handleSaveProduct}
        lojaId={currentLojaId}
      />
      
      {/* Nested Routes (like /admin/produtos/novo) */}
      <Outlet />
      {/* Sync API Modal */}
      <Dialog open={syncModalOpen} onOpenChange={(open) => !isSyncing && setSyncModalOpen(open)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Sincronização via API</DialogTitle>
          </DialogHeader>
          
          <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
            {isSyncing ? (
              <>
                <Spinner className="h-12 w-12 text-slate-800 animate-spin" />
                <div className="space-y-2 w-full">
                  <p className="font-bold text-slate-700">
                    Sincronizando seus {customProducts.length} produtos, aguarde um momento...
                  </p>
                  <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                    <div 
                      className="bg-slate-800 h-full transition-all duration-300 ease-in-out" 
                      style={{ width: `${syncProgress}%` }}
                    />
                  </div>
                  <p className="text-sm font-bold text-slate-500">{syncProgress}% concluído</p>
                </div>
              </>
            ) : (
              <div className="space-y-4 w-full text-left">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 text-sm text-blue-800">
                  <p className="font-bold mb-1">Sincronização Automática Ativa</p>
                  <p>A integração da API está configurada para atualizar preços e estoques <strong>de hora em hora</strong> automaticamente.</p>
                </div>
                
                <p className="text-slate-600 font-medium">
                  Se você precisa das atualizações agora, pode forçar uma sincronização manual.
                </p>
                <div className="space-y-3 pt-2 border-t">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL da API de Produtos</label>
                    <Input 
                      placeholder="https://api.sistema.com/v1/produtos" 
                      value={apiProdutosUrl}
                      onChange={(e) => setApiProdutosUrl(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL da API de Preços</label>
                    <Input 
                      placeholder="https://api.sistema.com/v1/precos" 
                      value={apiPrecosUrl}
                      onChange={(e) => setApiPrecosUrl(e.target.value)}
                      className="h-9"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">URL da API de Estoque</label>
                    <Input 
                      placeholder="https://api.sistema.com/v1/estoques" 
                      value={apiEstoqueUrl}
                      onChange={(e) => setApiEstoqueUrl(e.target.value)}
                      className="h-9"
                    />
                  </div>
                </div>
                <div className="space-y-2 pt-2 border-t">
                  <label className="text-sm font-bold text-slate-700">Ou faça upload de um JSON para teste manual</label>
                  <Input 
                    type="file" 
                    accept=".json" 
                    onChange={(e) => setJsonFile(e.target.files?.[0] || null)}
                  />
                </div>
              </div>
            )}
          </div>

          {!isSyncing && (
            <DialogFooter className="sm:justify-between">
              <Button variant="outline" onClick={() => setSyncModalOpen(false)}>
                Fechar
              </Button>
              <Button onClick={handleConfirmSync} className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                Forçar Sincronização
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete All Modal */}
      <Dialog open={deleteAllModalOpen} onOpenChange={setDeleteAllModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Excluir Todos os Produtos
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-slate-600 font-medium text-lg">
              Tem certeza que deseja excluir <strong>todos os produtos</strong>?
            </p>
            <p className="text-sm text-slate-500 mt-2">
              Esta ação apagará todo o estoque e não poderá ser desfeita.
            </p>
          </div>
          <DialogFooter className="sm:justify-between">
            <Button variant="outline" onClick={() => setDeleteAllModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={confirmDeleteAll} className="font-bold">
              Sim, Excluir Todos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}
