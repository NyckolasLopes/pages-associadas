import { createFileRoute } from "@tanstack/react-router";
import { useAdminProducts } from "@/stores/products";
import { useAdmin } from "@/stores/admin";
import { useState, useMemo, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceDiscountInput } from "@/components/ui/PriceDiscountInput";
import { Store, Search, DollarSign, Package, Upload } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import type { Produto } from "@/types";
import { isCampanhaAtiva } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/produtos/precos")({
  component: AdminProdutosPrecos,
});

function AdminProdutosPrecos() {
  const { customProducts, addOrUpdateProduct } = useAdminProducts();
  const { pharmacies, currentUser, grupos } = useAdmin();

  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };

  const userStores = isGlobalAdmin() 
    ? pharmacies 
    : pharmacies.filter(p => currentUser?.lojasVinculadas?.includes(p.id));

  const defaultSelection = isGlobalAdmin() ? "global" : (userStores[0]?.id || "");
  const [selectedPharmacyId, setSelectedPharmacyId] = useState<string>(defaultSelection);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for Encarte Import
  const [pendingImportData, setPendingImportData] = useState<any[] | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importManualDates, setImportManualDates] = useState(false);
  const [importStartDate, setImportStartDate] = useState("");
  const [importEndDate, setImportEndDate] = useState("");
  
  // State for edited prices and campaigns
  const [editingValues, setEditingValues] = useState<Record<string, { precoDe?: string, precoPor?: string, campanhaInicio?: string, campanhaFim?: string }>>({});

  // States for Internal Campaign Modal
  const [isCampanhaModalOpen, setIsCampanhaModalOpen] = useState(false);
  const [campanhaStep, setCampanhaStep] = useState(1);
  const [campanhaSearch, setCampanhaSearch] = useState("");
  const [selectedCampanhaProducts, setSelectedCampanhaProducts] = useState<string[]>([]);
  const [campanhaPrices, setCampanhaPrices] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    let result = customProducts;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.nome?.toLowerCase().includes(q) || p.ean?.includes(q)
      );
    }
    return result.slice(0, 50); // Mocks pagination limit for performance
  }, [customProducts, search]);

  const handleEditChange = (productId: string, field: "precoDe" | "precoPor" | "campanhaInicio" | "campanhaFim", value: string) => {
    setEditingValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [field]: value
      }
    }));
  };

  const handleSavePrice = (produto: Produto) => {
    if (!selectedPharmacyId) {
      toast.error("Selecione uma loja primeiro.");
      return;
    }

    const edits = editingValues[produto.id];
    if (!edits) return;

    const parsedPor = parseFloat(edits.precoPor?.replace(",", ".") || "0");

    if (isNaN(parsedPor) || parsedPor <= 0) {
      toast.error("O Preço Promocional (Por) deve ser um número válido e maior que 0.");
      return;
    }

    const updatedProduct = { ...produto };

    if (selectedPharmacyId === "global") {
      // Salvar Campanha Global
      if (!edits.campanhaInicio || !edits.campanhaFim) {
        toast.error("A data de início e fim da campanha são obrigatórias.");
        return;
      }
      updatedProduct.emCampanha = true;
      updatedProduct.precoCampanha = parsedPor;
      updatedProduct.campanhaInicio = edits.campanhaInicio;
      updatedProduct.campanhaFim = edits.campanhaFim;
    } else {
      // Salvar Preço de Loja Local
      const parsedDe = parseFloat(edits.precoDe?.replace(",", ".") || "0");
      if (isCampanhaAtiva(produto)) {
        toast.error("ERRO 403 (Forbidden): Você não pode alterar o preço de um produto em Campanha Global vigente.");
        return;
      }

      if (!updatedProduct.precosPorLoja) {
        updatedProduct.precosPorLoja = {};
      }

      const currentAtivo = updatedProduct.precosPorLoja[selectedPharmacyId]?.ativo ?? true;

      updatedProduct.precosPorLoja[selectedPharmacyId] = {
        precoDe: parsedDe > 0 ? parsedDe : parsedPor,
        precoPor: parsedPor,
        ativo: currentAtivo
      };
    }

    addOrUpdateProduct(updatedProduct);
    
    // Limpa a edição
    setEditingValues(prev => {
      const next = { ...prev };
      delete next[produto.id];
      return next;
    });

    toast.success(selectedPharmacyId === "global" ? "Campanha global ativada com sucesso!" : `Preço do produto atualizado para a loja.`);
  };

  const handleToggleAtivo = (produto: Produto, checked: boolean) => {
    if (!selectedPharmacyId) {
      toast.error("Selecione uma loja primeiro.");
      return;
    }

    const updatedProduct = { ...produto };
    if (!updatedProduct.precosPorLoja) {
      updatedProduct.precosPorLoja = {};
    }

    const currentPreco = updatedProduct.precosPorLoja[selectedPharmacyId] || {
      precoDe: produto.precoDe,
      precoPor: produto.precoPor
    };

    updatedProduct.precosPorLoja[selectedPharmacyId] = {
      ...currentPreco,
      ativo: checked
    };

    addOrUpdateProduct(updatedProduct);
    toast.success(checked ? "Produto ativado para esta filial." : "Produto indisponível nesta filial.");
  };

  const handleConfirmImport = () => {
    if (!pendingImportData) return;
    
    let inicioCampanha = importStartDate;
    let fimCampanha = importEndDate;

    if (!importManualDates) {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      inicioCampanha = firstDay.toISOString().split('T')[0];
      fimCampanha = lastDay.toISOString().split('T')[0];
    } else {
      if (!inicioCampanha || !fimCampanha) {
        toast.error("Por favor, preencha as datas de início e fim.");
        return;
      }
    }

    let updatedCount = 0;
    
    // A partir da linha 4 da planilha, que no índice (0-based) é 3
    for (let i = 3; i < pendingImportData.length; i++) {
      const row = pendingImportData[i] as any[];
      if (!row || row.length === 0) continue;
      
      const ean = row[1]; // Coluna B
      const precoCampanhaRaw = row[6]; // Coluna G
      
      if (!ean || precoCampanhaRaw === undefined) continue;

      const product = customProducts.find(p => p.ean === String(ean));
      if (!product) continue;
      
      let precoCampanha = 0;
      if (typeof precoCampanhaRaw === 'number') {
        precoCampanha = precoCampanhaRaw;
      } else {
        precoCampanha = parseFloat(String(precoCampanhaRaw).replace(',', '.'));
      }

      if (isNaN(precoCampanha) || precoCampanha <= 0) continue;

      addOrUpdateProduct({
        ...product,
        emCampanha: true,
        precoCampanha,
        campanhaInicio: inicioCampanha,
        campanhaFim: fimCampanha
      });
      updatedCount++;
    }
    
    toast.success(`Planilha de encarte importada! ${updatedCount} produtos atualizados.`);
    setIsImportModalOpen(false);
    setPendingImportData(null);
  };

  const currentMonthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(new Date());

  // Handlers for Internal Campaign
  const handleCampanhaToggleProduct = (productId: string) => {
    setSelectedCampanhaProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSaveCampanha = () => {
    let updatedCount = 0;
    
    selectedCampanhaProducts.forEach(productId => {
      const product = customProducts.find(p => p.id === productId);
      const promoPrice = campanhaPrices[productId];
      
      if (product && promoPrice !== undefined && promoPrice < product.precoPor) {
        const updatedProduct = { ...product };
        if (!updatedProduct.precosPorLoja) {
          updatedProduct.precosPorLoja = {};
        }

        updatedProduct.precosPorLoja[selectedPharmacyId] = {
          ...updatedProduct.precosPorLoja[selectedPharmacyId],
          precoDe: product.precoPor,
          precoPor: promoPrice,
          ativo: true
        };

        addOrUpdateProduct(updatedProduct);
        updatedCount++;
      }
    });

    if (updatedCount > 0) {
      toast.success(`Campanha interna salva! ${updatedCount} produtos atualizados.`);
      setIsCampanhaModalOpen(false);
      setSelectedCampanhaProducts([]);
      setCampanhaPrices({});
    } else {
      toast.error("Nenhum produto foi atualizado. Verifique se os preços são menores que o preço base.");
    }
  };

  return (
    <div className="space-y-6 max-w-6xl pb-12">
      <div className="flex flex-col sm:flex-row gap-4 sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-800">Preços por Loja</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Configure preços diferentes para cada unidade física. Se não configurado, o produto herda o preço global.
          </p>
        </div>
        <div>
          {isGlobalAdmin() && (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()} className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 hover:text-emerald-800">
              <Upload className="mr-2 h-4 w-4" /> Importar Planilha Encarte
            </Button>
          )}
          <input type="file" ref={fileInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
              try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: "binary" });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws, { header: 1 });
                setPendingImportData(data);
                setImportManualDates(false);
                setImportStartDate("");
                setImportEndDate("");
                setIsImportModalOpen(true);
              } catch (err) {
                console.error(err);
                toast.error("Erro ao processar a planilha.");
              }
              if (fileInputRef.current) {
                fileInputRef.current.value = "";
              }
            };
            reader.readAsBinaryString(file);
          }} />
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 space-y-1.5">
              <label className="text-sm font-bold text-slate-700">Selecione a Loja</label>
              <div className="flex items-center gap-2">
                <Select value={selectedPharmacyId} onValueChange={setSelectedPharmacyId} disabled={!isGlobalAdmin() && userStores.length <= 1}>
                  <SelectTrigger className="w-full h-11 bg-slate-50">
                    <Store className="h-4 w-4 text-emerald-600 mr-2" />
                    <SelectValue placeholder="Selecione uma farmácia..." />
                  </SelectTrigger>
                  <SelectContent>
                    {isGlobalAdmin() && (
                      <SelectItem value="global" className="font-bold text-orange-600 bg-orange-50">Gerenciar campanhas de preços em todas as lojas</SelectItem>
                    )}
                    {userStores.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.nome} - {p.cidade}/{p.uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isGlobalAdmin() && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsCampanhaModalOpen(true);
                      setCampanhaStep(1);
                      setCampanhaSearch("");
                      setSelectedCampanhaProducts([]);
                      setCampanhaPrices({});
                    }}
                    className="h-11 border-dashed border-emerald-300 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 whitespace-nowrap"
                  >
                    Criar campanha interna
                  </Button>
                )}
              </div>
            </div>

          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-bold text-slate-700">Buscar Produto</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Busque por nome ou EAN..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 bg-slate-50"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100 uppercase tracking-wider text-xs">
              <tr>
                <th className="px-4 py-3">Produto</th>
                <th className="px-4 py-3">Preço Base (Global)</th>
                
                {selectedPharmacyId === "global" ? (
                  <th className="px-4 py-3 bg-orange-50 text-orange-800 border-l border-orange-100 text-center" colSpan={2}>
                    Configuração de Campanha
                  </th>
                ) : (
                  <>
                    <th className="px-4 py-3 bg-emerald-50 text-emerald-800 border-l border-emerald-100">
                      Preço Específico ({pharmacies.find(p => p.id === selectedPharmacyId)?.nome || "Loja"})
                    </th>
                    <th className="px-4 py-3 bg-emerald-50 text-emerald-800 text-center">Disponível na Loja</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((produto) => {
                const globalDe = produto.precoDe || produto.precoPor;
                const globalPor = produto.precoPor;
                
                const isGlobal = selectedPharmacyId === "global";
                const lojaPreco = isGlobal ? null : produto.precosPorLoja?.[selectedPharmacyId];
                const campanhaAtiva = isCampanhaAtiva(produto);
                
                const edits = editingValues[produto.id];
                
                // Valores de exibição Local vs Global
                const displayDe = isGlobal ? "" : (edits !== undefined ? (edits.precoDe || "") : (lojaPreco?.precoDe?.toString() || globalDe.toString()));
                const displayPor = isGlobal ? (edits !== undefined ? edits.precoPor : produto.precoCampanha?.toString() || "") : (campanhaAtiva ? produto.precoCampanha?.toString() : (edits !== undefined ? edits.precoPor : (lojaPreco?.precoPor?.toString() || "")));
                const displayInicio = (edits?.campanhaInicio ?? produto.campanhaInicio ?? "").substring(0, 10);
                const displayFim = (edits?.campanhaFim ?? produto.campanhaFim ?? "").substring(0, 10);

                const hasCustomPrice = !!lojaPreco;
                const isCampanhaInterna = !isGlobal && hasCustomPrice && (lojaPreco.precoDe > lojaPreco.precoPor);
                const disponivel = lojaPreco?.ativo ?? true;

                return (
                  <tr key={produto.id} className="hover:bg-slate-50 transition-colors group">
                    <td className="px-4 py-4 w-1/2">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-md border bg-white overflow-hidden flex-shrink-0 flex items-center justify-center">
                          {produto.possuiImagem ? (
                            <img src={`https://vtx-ag-p.s3.us-east-1.amazonaws.com/10940/${produto.ean || produto.id}.jpg`} alt="" className="w-full h-full object-contain p-1" />
                          ) : (
                            <Package className="h-4 w-4 text-slate-300" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800 line-clamp-1 flex items-center gap-2" title={produto.nome}>
                            {produto.nome}
                            {campanhaAtiva && (
                              <Badge variant="default" className="bg-orange-500 hover:bg-orange-600 text-[10px] uppercase tracking-wider px-1.5 py-0">Em Campanha</Badge>
                            )}
                            {isCampanhaInterna && !campanhaAtiva && (
                              <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 text-[10px] uppercase tracking-wider px-1.5 py-0 text-white">Em Campanha Interna</Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5">EAN: {produto.ean || 'N/A'}</div>
                          {campanhaAtiva && <div className="text-[10px] font-bold text-orange-600 mt-1 uppercase">Aplicado em todas as lojas</div>}
                        </div>
                      </div>
                    </td>
                    
                    <td className="px-4 py-4 text-slate-600">
                      <div className="flex flex-col">
                        {globalDe > globalPor && (
                          <span className="text-xs line-through text-slate-400">R$ {globalDe.toFixed(2)}</span>
                        )}
                        <span className="font-bold">R$ {globalPor.toFixed(2)}</span>
                      </div>
                    </td>

                    {isGlobal ? (
                      <td className="px-4 py-4 bg-orange-50/30 border-l border-orange-100" colSpan={2}>
                        <div className="flex flex-col xl:flex-row items-start xl:items-end gap-3">
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Preço Promocional (R$)</label>
                            <Input
                              placeholder="Ex: 19.90"
                              className="h-8 text-xs bg-white font-bold"
                              value={displayPor}
                              onChange={(e) => handleEditChange(produto.id, "precoPor", e.target.value)}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Início da Campanha</label>
                            <Input
                              type="date"
                              className="h-8 text-[11px] bg-white"
                              value={displayInicio}
                              onChange={(e) => handleEditChange(produto.id, "campanhaInicio", e.target.value)}
                            />
                          </div>
                          <div className="flex-1 w-full">
                            <label className="text-[10px] font-bold text-orange-700 uppercase mb-1 block">Fim da Campanha</label>
                            <Input
                              type="date"
                              className="h-8 text-[11px] bg-white"
                              value={displayFim}
                              onChange={(e) => handleEditChange(produto.id, "campanhaFim", e.target.value)}
                            />
                          </div>
                          
                          <div className="flex flex-col gap-1 w-full xl:w-auto">
                            {(edits !== undefined && (edits.precoPor || edits.campanhaInicio || edits.campanhaFim)) ? (
                              <Button size="sm" onClick={() => handleSavePrice(produto)} className="h-8 px-3 bg-orange-600 hover:bg-orange-700 text-xs font-bold w-full xl:w-auto">
                                Salvar
                              </Button>
                            ) : null}
                            
                            {produto.emCampanha && edits === undefined && (
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={() => {
                                  const newProduct = {...produto};
                                  newProduct.emCampanha = false;
                                  newProduct.campanhaInicio = "";
                                  newProduct.campanhaFim = "";
                                  newProduct.precoCampanha = undefined;
                                  addOrUpdateProduct(newProduct);
                                  toast.success("Campanha encerrada e removida com sucesso!");
                                }} 
                                className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 w-full xl:w-auto"
                              >
                                Encerrar Campanha
                              </Button>
                            )}
                          </div>
                        </div>
                      </td>
                    ) : (
                      <>
                        <td className="px-4 py-4 bg-emerald-50/30 border-l border-emerald-100">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 min-w-[300px]">
                              <PriceDiscountInput
                                basePrice={globalPor}
                                initialPromoPrice={parseFloat(displayPor || "0") || undefined}
                                onChange={(val) => handleEditChange(produto.id, "precoPor", val.toString())}
                                disabled={campanhaAtiva}
                              />
                            </div>
                            
                            <div className="flex flex-col gap-1 mt-4">
                              {edits !== undefined && !campanhaAtiva ? (
                                <Button size="sm" onClick={() => handleSavePrice(produto)} className="h-8 px-3 bg-emerald-600 hover:bg-emerald-700 text-xs font-bold">
                                  Salvar
                                </Button>
                              ) : hasCustomPrice && !campanhaAtiva ? (
                                <Button size="sm" variant="outline" onClick={() => handleEditChange(produto.id, "precoDe", lojaPreco.precoDe.toString())} className="h-8 px-3 text-xs text-emerald-700 border-emerald-200">
                                  Editar
                                </Button>
                              ) : null}
                              
                              {hasCustomPrice && edits === undefined && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => {
                                    const newProduct = {...produto};
                                    delete newProduct.precosPorLoja![selectedPharmacyId];
                                    addOrUpdateProduct(newProduct);
                                    toast.success("Preço customizado removido. Retornando ao global.");
                                  }} 
                                  className="h-8 px-3 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                                >
                                  Remover
                                </Button>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-center border-l border-slate-100">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <Switch 
                              checked={disponivel}
                              onCheckedChange={(checked) => handleToggleAtivo(produto, checked)}
                              className="data-[state=checked]:bg-emerald-500"
                            />
                            <span className={`text-[10px] font-bold uppercase ${disponivel ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {disponivel ? 'Disponível' : 'Indisponível'}
                            </span>
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
          
          {filtered.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              Nenhum produto encontrado na busca.
            </div>
          )}
        </div>
      </div>
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Importar Encarte</DialogTitle>
            <DialogDescription>
              Esses encartes são correspondentes aos preços de {currentMonthName}?
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4 space-y-4">
            <div className="flex flex-col gap-3">
              <Button 
                variant={!importManualDates ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setImportManualDates(false)}
              >
                Sim, aplicar durante o mês inteiro vigente
              </Button>
              <Button 
                variant={importManualDates ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => setImportManualDates(true)}
              >
                Não, definir datas manualmente
              </Button>
            </div>

            {importManualDates && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Data de Início</label>
                  <Input type="date" value={importStartDate} onChange={e => setImportStartDate(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700">Data de Fim</label>
                  <Input type="date" value={importEndDate} onChange={e => setImportEndDate(e.target.value)} />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsImportModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleConfirmImport}>Confirmar Importação</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Internal Campaign Modal */}
      <Dialog open={isCampanhaModalOpen} onOpenChange={setIsCampanhaModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Criar Campanha Interna</DialogTitle>
            <DialogDescription>
              {campanhaStep === 1 ? "Selecione os produtos que farão parte da sua campanha." : "Defina os preços promocionais para os produtos selecionados."}
            </DialogDescription>
          </DialogHeader>

          {campanhaStep === 1 && (
            <div className="space-y-4 py-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar produtos..."
                  value={campanhaSearch}
                  onChange={(e) => setCampanhaSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="border rounded-md max-h-[400px] overflow-y-auto">
                <div className="divide-y">
                  {customProducts.filter(p => p.nome.toLowerCase().includes(campanhaSearch.toLowerCase())).map(produto => (
                    <div key={produto.id} className="flex items-center space-x-3 p-3 hover:bg-slate-50 transition-colors">
                      <Checkbox 
                        id={`campanha-prod-${produto.id}`}
                        checked={selectedCampanhaProducts.includes(produto.id)}
                        onCheckedChange={() => handleCampanhaToggleProduct(produto.id)}
                      />
                      <label htmlFor={`campanha-prod-${produto.id}`} className="flex-1 cursor-pointer flex justify-between items-center text-sm font-medium leading-none">
                        <span>{produto.nome}</span>
                        <span className="text-slate-500">R$ {produto.precoPor.toFixed(2)}</span>
                      </label>
                    </div>
                  ))}
                  {customProducts.length === 0 && (
                    <div className="p-4 text-center text-slate-500 text-sm">Nenhum produto encontrado.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {campanhaStep === 2 && (
            <div className="space-y-6 py-4 max-h-[500px] overflow-y-auto pr-2">
              {selectedCampanhaProducts.map(productId => {
                const product = customProducts.find(p => p.id === productId);
                if (!product) return null;
                
                const promoPrice = campanhaPrices[productId];
                const isInvalid = promoPrice !== undefined && promoPrice >= product.precoPor;

                return (
                  <div key={productId} className="bg-slate-50 p-4 rounded-lg border border-slate-200 space-y-3">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-sm">{product.nome}</h4>
                      <div className="text-right">
                        <span className="text-xs text-slate-500 block">Preço Base</span>
                        <span className="font-bold text-slate-700">R$ {product.precoPor.toFixed(2)}</span>
                      </div>
                    </div>
                    
                    <PriceDiscountInput
                      basePrice={product.precoPor}
                      initialPromoPrice={promoPrice}
                      onChange={(val) => setCampanhaPrices(prev => ({ ...prev, [productId]: val }))}
                    />

                    {isInvalid && (
                      <p className="text-red-500 text-xs font-semibold">O preço promocional deve ser menor que o preço base.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <DialogFooter className="flex justify-between w-full sm:justify-between items-center">
            {campanhaStep === 1 ? (
              <>
                <span className="text-sm text-slate-500">{selectedCampanhaProducts.length} produtos selecionados</span>
                <div className="space-x-2 flex">
                  <Button variant="outline" onClick={() => setIsCampanhaModalOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={() => setCampanhaStep(2)} 
                    disabled={selectedCampanhaProducts.length === 0}
                  >
                    Continuar
                  </Button>
                </div>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setCampanhaStep(1)}>Voltar</Button>
                <div className="space-x-2 flex">
                  <Button variant="outline" onClick={() => setIsCampanhaModalOpen(false)}>Cancelar</Button>
                  <Button 
                    onClick={handleSaveCampanha} 
                    className="bg-emerald-600 hover:bg-emerald-700"
                    disabled={
                      selectedCampanhaProducts.some(id => {
                        const product = customProducts.find(p => p.id === id);
                        const price = campanhaPrices[id];
                        return !product || price === undefined || price >= product.precoPor;
                      })
                    }
                  >
                    Salvar Campanha
                  </Button>
                </div>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
