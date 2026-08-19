import { createFileRoute } from "@tanstack/react-router";
import { Package, Store, Save, Search, Truck, CheckCircle2, Plus, Edit, Trash2, Settings, AlertTriangle } from "lucide-react";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "@/stores/admin";
import { getDeterministicStock } from "@/lib/stock";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useState, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Spinner } from "@/components/ui/spinner";
import { catalog } from "@/services/catalog";
import type { Produto } from "@/types";

export const Route = createFileRoute("/admin/produtos/estoque")({
  component: AdminProdutosEstoque,
});

function AdminProdutosEstoque() {
  const { fornecedores, setFornecedores, removeFornecedor } = useAdminProducts();
  const [serverProducts, setServerProducts] = useState<Produto[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const { pharmacies } = useAdmin();
  const activePharmacies = pharmacies.filter(p => p.ativo !== false);

  // ─── Stock data from Supabase ───
  const [stockData, setStockData] = useState<Record<string, Record<string, number>>>({});
  // stockData shape: { [produtoId]: { [lojaId]: estoque } }
  const [pendingChanges, setPendingChanges] = useState<Record<string, Record<string, number>>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(200);

  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // Load all stock data from produto_precos_loja AND server products
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load global stocks
      const { data, error } = await supabase
        .from("produto_precos_loja")
        .select("produto_id, loja_id, estoque");

      if (!error && data) {
        const map: Record<string, Record<string, number>> = {};
        data.forEach((row: any) => {
          if (!map[row.produto_id]) map[row.produto_id] = {};
          map[row.produto_id][row.loja_id] = row.estoque ?? 0;
        });
        setStockData(map);
      }
      
      // Load products
      try {
        const { results, count } = await catalog.adminSearchProducts({
          search,
          page: currentPage,
          pageSize,
          listFilter: "all"
        });
        setServerProducts(results);
        setTotalProducts(count);
      } catch (e) {
        console.error(e);
      }

      setIsLoading(false);
    }
    
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [search, currentPage, pageSize]);

  // ─── Computed values ───


  const getStock = useCallback((produtoId: string, lojaId: string) => {
    // Pending changes take priority
    if (pendingChanges[produtoId]?.[lojaId] !== undefined) {
      return pendingChanges[produtoId][lojaId];
    }
    // Then Supabase data
    if (stockData[produtoId]?.[lojaId] !== undefined) {
      return stockData[produtoId][lojaId];
    }
    // Fallback to product's estoquesPorLoja or global estoque
    const product = serverProducts.find(p => p.id === produtoId);
    if (product) {
      return getDeterministicStock(product, lojaId);
    }
    return 0;
  }, [pendingChanges, stockData, serverProducts]);

  const getTotalStock = useCallback((produtoId: string) => {
    return activePharmacies.reduce((acc, loja) => acc + getStock(produtoId, loja.id), 0);
  }, [activePharmacies, getStock]);

  const globalTotalStock = useMemo(() => {
    return serverProducts.reduce((acc, p) => acc + getTotalStock(p.id), 0);
  }, [serverProducts, getTotalStock]);

  const paginatedProducts = serverProducts;

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // ─── Handlers ───
  const handleStockChange = (produtoId: string, lojaId: string, value: string) => {
    const numVal = value === "" ? 0 : parseInt(value, 10);
    if (isNaN(numVal) || numVal < 0) return;

    setPendingChanges(prev => ({
      ...prev,
      [produtoId]: {
        ...(prev[produtoId] || {}),
        [lojaId]: numVal,
      }
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const upserts: Array<{ produto_id: string; loja_id: string; estoque: number }> = [];
      
      for (const [produtoId, lojas] of Object.entries(pendingChanges)) {
        for (const [lojaId, estoque] of Object.entries(lojas)) {
          upserts.push({ produto_id: produtoId, loja_id: lojaId, estoque });
        }
      }

      if (upserts.length === 0) {
        toast.info("Nenhuma alteração para salvar.");
        setIsSaving(false);
        return;
      }

      // Upsert in batches of 50
      for (let i = 0; i < upserts.length; i += 50) {
        const batch = upserts.slice(i, i + 50);
        const { error } = await supabase
          .from("produto_precos_loja")
          .upsert(batch, { onConflict: "produto_id,loja_id" });

        if (error) {
          console.error("Erro ao salvar estoque:", error);
          toast.error(`Erro ao salvar: ${error.message}`);
          setIsSaving(false);
          return;
        }
      }

      // Merge pending changes into stockData
      setStockData(prev => {
        const updated = { ...prev };
        for (const [produtoId, lojas] of Object.entries(pendingChanges)) {
          updated[produtoId] = { ...(updated[produtoId] || {}), ...lojas };
        }
        return updated;
      });

      // Also update local serverProducts state
      setServerProducts(prev => prev.map(p => {
        if (pendingChanges[p.id]) {
          return {
            ...p,
            estoquesPorLoja: {
              ...(p.estoquesPorLoja || {}),
              ...pendingChanges[p.id]
            }
          };
        }
        return p;
      }));

      setPendingChanges({});
      toast.success(`${upserts.length} estoque(s) atualizado(s) com sucesso!`);
    } catch (err) {
      console.error(err);
      toast.error("Erro inesperado ao salvar estoques.");
    }
    setIsSaving(false);
  };

  const handleExportJson = () => {
    const exportData = serverProducts.map(p => {
      const pData: any = {
        "ID/CÓDIGO INTERNO": p.id,
        "EAN/CÓDIGO DE BARRAS": p.ean || "",
        "NOME DO PRODUTO": p.nome,
        "PRECO_DE": p.precoDe || 0,
        "PRECO_POR": p.precoPor || 0,
        "ESTOQUE_GLOBAL": p.estoque || 0
      };

      activePharmacies.forEach(loja => {
        pData[`ESTOQUE_LOJA_${loja.id}`] = getStock(p.id, loja.id);
      });

      return pData;
    });

    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
    const dlAnchorElem = document.createElement("a");
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", "modelo_api_estoque_precos.txt");
    dlAnchorElem.click();
  };

  // ─── Fornecedor Modal ───
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formDataFornecedor, setFormDataFornecedor] = useState({ distribuidor: "", cidade: "", prazo: "", apiUrl: "" });
  const [isSavingFornecedor, setIsSavingFornecedor] = useState(false);

  const openNewFornecedor = () => {
    setEditingId(null);
    setFormDataFornecedor({ distribuidor: "", cidade: "", prazo: "", apiUrl: "" });
    setIsModalOpen(true);
  };

  const openEditFornecedor = (f: any) => {
    setEditingId(f.id);
    setFormDataFornecedor(f);
    setIsModalOpen(true);
  };

  const handleSaveFornecedor = () => {
    setIsSavingFornecedor(true);
    setTimeout(() => {
      if (editingId) {
        setFornecedores(fornecedores.map(f => f.id === editingId ? { ...formDataFornecedor, id: editingId } as any : f));
      } else {
        const newId = Math.max(0, ...fornecedores.map(f => f.id)) + 1;
        setFornecedores([...fornecedores, { ...formDataFornecedor, id: newId } as any]);
      }
      setIsSavingFornecedor(false);
      setIsModalOpen(false);
      toast.success("Fornecedor externo salvo com sucesso!");
    }, 800);
  };

  // ─── Per-store stock totals ───
  const storeStockTotals = useMemo(() => {
    return activePharmacies.map(pharmacy => ({
      id: pharmacy.id,
      nome: pharmacy.nome || pharmacy.razaoSocial || "Loja",
      bairro: pharmacy.bairro || "N/A",
      cidade: pharmacy.cidade && pharmacy.uf ? `${pharmacy.cidade}/${pharmacy.uf}` : "N/A",
      total: serverProducts.reduce((acc, p) => acc + getStock(p.id, pharmacy.id), 0),
    }));
  }, [activePharmacies, serverProducts, getStock]);

  return (
    <div className="space-y-8 max-w-full mx-auto pb-12">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Estoques</h1>
        <p className="text-slate-500 mt-2 text-lg">
          Gerencie o estoque de todos os produtos em todas as lojas.
        </p>
      </div>

      {/* Cards de resumo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-emerald-100 p-4 rounded-full text-emerald-800">
            <Package className="h-8 w-8" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Estoque Total (todas as lojas)</div>
            <div className="text-4xl font-bold text-slate-800">{globalTotalStock.toLocaleString("pt-BR")}</div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-6">
          <div className="bg-indigo-100 p-4 rounded-full text-indigo-700">
            <Store className="h-8 w-8" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Lojas Ativas</div>
            <div className="text-4xl font-bold text-slate-800">{activePharmacies.length}</div>
          </div>
        </div>


      </div>

      {/* Resumo por loja */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h2 className="font-bold text-xl text-slate-800">Estoque por Loja</h2>
          <p className="text-sm text-slate-500">Volume total de unidades em cada loja.</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b text-sm">
              <tr>
                <th className="p-4">Unidade / Loja</th>
                <th className="p-4">Bairro</th>
                <th className="p-4">Cidade/UF</th>
                <th className="p-4 text-right">Estoque Total (Unid.)</th>
              </tr>
            </thead>
            <tbody>
              {storeStockTotals.map((loja) => (
                <tr key={loja.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors text-sm">
                  <td className="p-4 font-medium text-slate-800 flex items-center gap-3">
                    <Store className="h-4 w-4 text-slate-400" />
                    {loja.nome}
                  </td>
                  <td className="p-4 text-slate-500">{loja.bairro}</td>
                  <td className="p-4 text-slate-500">{loja.cidade}</td>
                  <td className="p-4 text-right">
                    <span className="inline-block bg-emerald-50 text-emerald-800 font-bold px-3 py-1 rounded-full">
                      {loja.total.toLocaleString('pt-BR')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Inventário Editável — Produto x Loja */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-xl text-slate-800">Inventário por Produto × Loja</h2>
            <p className="text-sm text-slate-500">
              Visualize e edite o estoque de cada produto em cada loja. Clique no campo para editar.
            </p>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Buscar produto (nome, EAN)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-white"
              />
            </div>
            {hasPendingChanges && (
              <Button
                onClick={handleSaveAll}
                disabled={isSaving}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold whitespace-nowrap"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : `Salvar (${Object.values(pendingChanges).reduce((a, b) => a + Object.keys(b).length, 0)})`}
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleExportJson}
              className="font-bold text-xs whitespace-nowrap"
            >
              Exportar JSON
            </Button>
          </div>
        </div>

        {hasPendingChanges && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 flex items-center gap-2 text-sm text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <span className="font-medium">
              Você tem {Object.values(pendingChanges).reduce((a, b) => a + Object.keys(b).length, 0)} alteração(ões) não salva(s).
            </span>
          </div>
        )}

        <div className="overflow-x-auto max-h-[600px]">
          {isLoading ? (
            <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500 font-medium">
              <Spinner size={32} />
              <span>Carregando estoques...</span>
            </div>
          ) : (
            <table className="w-full text-left">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b text-xs sticky top-0 z-10">
                <tr>
                  <th className="p-3 min-w-[250px] sticky left-0 bg-slate-50 z-20">Produto</th>
                  <th className="p-3 min-w-[100px]">EAN</th>
                  <th className="p-3 min-w-[70px] text-right bg-slate-100 font-black">TOTAL</th>
                  {activePharmacies.map(loja => (
                    <th key={loja.id} className="p-3 min-w-[140px] text-center">
                      <div className="text-xs font-bold text-slate-700 whitespace-normal leading-tight" title={loja.nome || loja.razaoSocial}>
                        {loja.nome || loja.razaoSocial || "Loja"}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedProducts.map((p) => {
                  const total = getTotalStock(p.id);
                  return (
                    <tr key={p.id} className="border-b last:border-0 hover:bg-slate-50/50 transition-colors text-sm">
                      <td className="p-3 sticky left-0 bg-white z-10 border-r border-slate-100">
                        <div className="flex items-center gap-2">
                          {p.imagem ? (
                            <img src={p.imagem} alt="" className="w-8 h-8 object-contain bg-white rounded border shrink-0" />
                          ) : (
                            <div className="w-8 h-8 bg-slate-100 rounded border flex items-center justify-center text-slate-400 shrink-0">
                              <Package className="w-4 h-4" />
                            </div>
                          )}
                          <span className="line-clamp-1 max-w-[200px] text-slate-800 font-medium">{p.nome}</span>
                        </div>
                      </td>
                      <td className="p-3 text-slate-500 font-mono text-xs">{p.ean || p.codigoInterno || "-"}</td>
                      <td className="p-3 text-right bg-slate-50/50 border-x border-slate-100">
                        <span className={`inline-block font-bold px-2 py-0.5 rounded-full text-xs ${
                          total > 5 ? 'bg-emerald-50 text-emerald-800' : 
                          total > 0 ? 'bg-orange-50 text-orange-800' : 
                          'bg-red-50 text-red-800'
                        }`}>
                          {total}
                        </span>
                      </td>
                      {activePharmacies.map(loja => {
                        const stock = getStock(p.id, loja.id);
                        const isPending = pendingChanges[p.id]?.[loja.id] !== undefined;
                        return (
                          <td key={loja.id} className="p-1 text-center">
                            <input
                              type="number"
                              min="0"
                              value={stock}
                              onChange={(e) => handleStockChange(p.id, loja.id, e.target.value)}
                              className={`w-full text-center text-sm py-1.5 px-1 rounded border transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                                isPending 
                                  ? 'border-amber-400 bg-amber-50 font-bold text-amber-900' 
                                  : stock > 0 
                                    ? 'border-slate-200 bg-white text-slate-700'
                                    : 'border-slate-200 bg-red-50/50 text-red-400'
                              }`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        <div className="p-4 border-t flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-500">Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-slate-200 rounded px-2 py-1 bg-slate-50 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            >
              {[100, 200, 400, 500, 1000].map(size => (
                <option key={size} value={size}>{size}</option>
              ))}
            </select>
            <span className="text-sm text-slate-500">
              de {totalProducts} produtos
            </span>
          </div>
          
          {totalProducts > pageSize && (
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <div className="px-3 text-sm text-slate-600 font-medium">
                Página {currentPage} de {Math.ceil(totalProducts / pageSize)}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(totalProducts / pageSize), p + 1))}
                disabled={currentPage >= Math.ceil(totalProducts / pageSize)}
              >
                Próxima
              </Button>
            </div>
          )}
        </div>

        {hasPendingChanges && (
          <div className="p-4 border-t bg-slate-50 flex justify-end">
            <Button
              onClick={handleSaveAll}
              disabled={isSaving}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Salvando..." : "Salvar Todas as Alterações"}
            </Button>
          </div>
        )}
      </div>


    </div>
  );
}
