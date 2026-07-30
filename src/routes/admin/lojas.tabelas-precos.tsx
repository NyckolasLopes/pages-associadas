import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { Map, Search, Save, History, Plus, X, Upload } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useRegionsStore } from "@/stores/regions";
import { useAdminProducts } from "@/stores/products";

export const Route = createFileRoute("/admin/lojas/tabelas-precos")({
  component: TabelasPrecos,
});

function TabelasPrecos() {
  const { regions, addRegion, prices, setPrices } = useRegionsStore();

  const [activeRegion, setActiveRegion] = useState(regions[0]?.id || "poa");
  const [searchTerm, setSearchTerm] = useState("");
  
  // State for creating new regions
  const [isCreatingRegion, setIsCreatingRegion] = useState(false);
  const [newRegionName, setNewRegionName] = useState("");
  
  const { customProducts } = useAdminProducts();
  
  const ALL_PRODUCTS = useMemo(() => {
    return customProducts;
  }, [customProducts]);

  // State to hold the drafted prices as RAW STRINGS for free-form editing
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 100;

  const filteredProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(p => 
      (p.nome && p.nome.toLowerCase().includes(searchTerm.toLowerCase())) || 
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (p.ean && p.ean.includes(searchTerm))
    );
  }, [searchTerm, ALL_PRODUCTS]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);
  const currentProducts = filteredProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeRegion]);

  const handlePriceChange = (productId: string, newValue: string) => {
    // Allow free-form typing: just store the raw string
    const key = `${activeRegion}-${productId}`;
    setPriceDrafts(prev => ({ ...prev, [key]: newValue }));
  };

  const handleSave = () => {
    const changesCount = Object.keys(priceDrafts).filter(k => k.startsWith(`${activeRegion}-`)).length;
    if (changesCount === 0) {
      toast.info("Nenhuma alteração para salvar.");
      return;
    }
    
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      // Parse string drafts to numeric prices for the persistent store
      const numericPrices: Record<string, number> = {};
      Object.entries(priceDrafts).forEach(([key, rawVal]) => {
        if (key.startsWith(`${activeRegion}-`)) {
          const numericStr = rawVal.replace(/[^\d.,]/g, "").replace(",", ".");
          const numericValue = parseFloat(numericStr);
          if (!isNaN(numericValue) && numericValue > 0) {
            numericPrices[key] = numericValue;
          }
        }
      });
      setPrices(numericPrices);
      setPriceDrafts(prev => {
        const next = { ...prev };
        Object.keys(next).forEach(k => {
          if (k.startsWith(`${activeRegion}-`)) delete next[k];
        });
        return next;
      });
      toast.success(`${changesCount} preços atualizados na região ${regions.find(r => r.id === activeRegion)?.name} com sucesso!`);
    }, 800);
  };

  const handleCreateRegion = () => {
    if (!newRegionName.trim()) return;
    const newId = newRegionName.toLowerCase().replace(/[^a-z0-9]/g, "_");
    
    if (regions.find(r => r.id === newId)) {
      toast.error("Já existe uma região com este nome.");
      return;
    }
    
    addRegion({ id: newId, name: newRegionName });
    setNewRegionName("");
    setIsCreatingRegion(false);
    setActiveRegion(newId);
    toast.success(`Região ${newRegionName} criada!`);
  };

  const getProductPrice = (productId: string, basePrice: number): string => {
    const key = `${activeRegion}-${productId}`;
    const draft = priceDrafts[key];
    if (draft !== undefined) return draft;
    const saved = prices[key];
    return saved !== undefined ? saved.toFixed(2).replace('.', ',') : basePrice.toFixed(2).replace('.', ',');
  };

  const hasUnsavedChanges = Object.keys(priceDrafts).filter(k => k.startsWith(`${activeRegion}-`)).length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            Tabelas de preços regionais
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Crie regiões personalizadas e gerencie precificações em massa baseadas em localização.
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Button variant="outline" className="gap-2" onClick={() => toast.info("Funcionalidade de importação será implementada em breve.")}>
            <Upload className="h-4 w-4" /> Importar tabela da região
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => setIsCreatingRegion(true)}>
            <Plus className="h-4 w-4" /> Nova Região
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !hasUnsavedChanges}
            className="gap-2 bg-primary hover:bg-primary/90 min-w-[140px]"
          >
            <Save className="h-4 w-4" />
            {isSaving ? "Salvando..." : "Salvar Alterações"}
          </Button>
        </div>
      </div>

      {/* Create Region Inline Form */}
      {isCreatingRegion && (
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-center gap-4 animate-in slide-in-from-top-2">
          <div className="flex-1 max-w-md">
            <label className="text-sm font-semibold text-primary mb-1 block">Nome da nova região (ex: Interior SP)</label>
            <div className="flex gap-2">
              <Input 
                autoFocus
                placeholder="Ex: Zona Norte, Interior..." 
                value={newRegionName}
                onChange={(e) => setNewRegionName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateRegion()}
                className="bg-white"
              />
              <Button onClick={handleCreateRegion}>Criar</Button>
              <Button variant="ghost" size="icon" onClick={() => setIsCreatingRegion(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <Tabs value={activeRegion} onValueChange={setActiveRegion} className="w-full">
          <div className="bg-slate-50 border-b p-2 px-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <TabsList className="bg-slate-200/50 flex-wrap h-auto min-h-10 py-1">
              {regions.map(r => (
                <TabsTrigger key={r.id} value={r.id} className="gap-2 data-[state=active]:bg-white data-[state=active]:text-primary data-[state=active]:shadow-sm my-1">
                  {r.name}
                </TabsTrigger>
              ))}
            </TabsList>

            <div className="relative w-full md:w-[300px] flex-shrink-0">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar produto, SKU ou EAN..." 
                className="pl-9 h-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <div className="p-0">
            <div className="overflow-x-auto max-h-[600px] relative">
              <Table>
                <TableHeader className="bg-slate-50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[60px]"></TableHead>
                    <TableHead className="font-semibold text-slate-700">Produto</TableHead>
                    <TableHead className="font-semibold text-slate-700 whitespace-nowrap">SKU / Código</TableHead>
                    <TableHead className="font-semibold text-slate-700">EAN</TableHead>
                    <TableHead className="font-semibold text-slate-700 text-right whitespace-nowrap">Preço Matriz (POA)</TableHead>
                    <TableHead className="font-semibold text-slate-700 w-[180px] whitespace-nowrap">Preço Regional (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {currentProducts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        Nenhum produto encontrado.
                      </TableCell>
                    </TableRow>
                  ) : (
                    currentProducts.map(product => {
                      const isEdited = priceDrafts[`${activeRegion}-${product.id}`] !== undefined;
                      const baseP = product.precoPor || product.preco || product.basePrice || 0;
                      const displayValue = getProductPrice(product.id, baseP);

                      return (
                        <TableRow 
                          key={product.id}
                          className={`transition-colors ${isEdited ? 'bg-amber-50 hover:bg-amber-100/80' : ''}`}
                        >
                          <TableCell>
                            <div className="h-10 w-10 rounded-md border bg-white overflow-hidden flex items-center justify-center p-1">
                              <img src={product.imagem || product.image || "/placeholder.png"} alt={product.nome} className="h-full w-full object-contain" />
                            </div>
                          </TableCell>
                          <TableCell className="font-medium text-slate-900 min-w-[200px]">
                            {product.nome}
                            {isEdited && <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800">Modificado</span>}
                          </TableCell>
                          <TableCell className="text-slate-500 font-mono text-sm whitespace-nowrap">
                            {product.sku || product.id}
                          </TableCell>
                          <TableCell className="text-slate-500 font-mono text-xs whitespace-nowrap">
                            {product.ean || "Sem EAN"}
                          </TableCell>
                          <TableCell className="text-right text-slate-500 whitespace-nowrap">
                            R$ {baseP.toFixed(2).replace('.', ',')}
                          </TableCell>
                          <TableCell>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-medium">
                                R$
                              </span>
                              <Input 
                                type="text"
                                inputMode="decimal"
                                value={displayValue}
                                onChange={(e) => handlePriceChange(product.id, e.target.value)}
                                onFocus={(e) => e.target.select()}
                                className={`pl-8 text-right font-medium ${isEdited ? 'border-amber-400 focus-visible:ring-amber-400 bg-white' : ''}`}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
            
            {filteredProducts.length > 0 && (
              <div className="flex items-center justify-between p-4 border-t bg-slate-50 text-sm text-muted-foreground">
                <div>
                  Mostrando {currentProducts.length} de {filteredProducts.length} produtos (Página {currentPage} de {totalPages}). As alterações são vinculadas exclusivamente à região {regions.find(r => r.id === activeRegion)?.name}.
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  >
                    Anterior
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={currentPage === totalPages || totalPages === 0}
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  >
                    Próxima
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
}
