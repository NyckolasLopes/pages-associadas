import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { useMarketing } from "@/stores/marketing";
import { useAdminProducts } from "@/stores/products";
import { useAdminCategories } from "@/stores/categories";
import { getAllProdutos } from "@/services/catalog";
import { Produto } from "@/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Megaphone, Search, Plus, Trash, Tag, Percent, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, X } from "lucide-react";
import { brl } from "@/lib/format";
import { catalog } from "@/services/catalog";

const OFERTAS_CAT_ID = "ofertas-loja";

export function LojaPromocoesTab({ lojaId }: { lojaId: string }) {
  const { lojaPromocoes, addLojaPromocao, removeLojaPromocao } = useMarketing();
  const promocoes = lojaPromocoes[lojaId] || [];

  const [search, setSearch] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  
  // Spreadsheet import state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importPreview, setImportPreview] = useState<{ ean: string; preco: number; produto?: Produto; matched: boolean }[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    const res = await catalog.search(search);
    setResults(res.slice(0, 5));
  };

  const handleCreateOfertaMes = (produto: Produto, precoOferta: number) => {
    if (!precoOferta || precoOferta >= produto.precoPor) {
      toast.error("O preço da oferta deve ser menor que o preço original!");
      return;
    }
    
    addLojaPromocao(lojaId, {
      titulo: `Oferta do Mês: ${produto.nome}`,
      tipoAlvo: "produtos",
      alvosId: [produto.id],
      dataFim: "", 
      horaFim: "",
      icone: "percent",
      ativa: true,
      tipoCampanha: "padrao",
      levePague_precoPorItem: precoOferta 
    });
    
    toast.success("Oferta do mês criada com sucesso!");
    setSearch("");
    setResults([]);
  };

  const handleCreateLevePague = (produto: Produto, qtd: number, precoUnidade: number) => {
    if (!qtd || qtd < 2) {
      toast.error("A quantidade deve ser no mínimo 2!");
      return;
    }
    if (!precoUnidade || precoUnidade >= produto.precoPor) {
      toast.error("O preço unitário promocional deve ser menor que o original!");
      return;
    }

    addLojaPromocao(lojaId, {
      titulo: `Leve ${qtd} por ${brl(precoUnidade)} cada`,
      tipoAlvo: "produtos",
      alvosId: [produto.id],
      dataFim: "",
      horaFim: "",
      icone: "tag",
      ativa: true,
      tipoCampanha: "leve_pague",
      levePague_quantidade: qtd,
      levePague_precoPorItem: precoUnidade
    });

    toast.success("Promoção Leve + por - criada com sucesso!");
    setSearch("");
    setResults([]);
  };

  // -------- Spreadsheet Import --------
  const normalizeEan = (val: any): string => {
    if (val === null || val === undefined) return "";
    return String(val).replace(/\D/g, "").replace(/^0+/, "");
  };

  const parsePrice = (val: any): number => {
    if (val === null || val === undefined) return 0;
    if (typeof val === "number") return val;
    const str = String(val)
      .replace(/[R$\s]/g, "")
      .replace(/\./g, "")    // remove thousands dots
      .replace(",", ".");     // comma to decimal point
    const num = parseFloat(str);
    return isNaN(num) ? 0 : num;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: any[] = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        if (rows.length === 0) {
          toast.error("A planilha está vazia!");
          return;
        }

        // Auto-detect EAN and price columns
        const headers = Object.keys(rows[0]);
        const normalizeH = (h: string) => h.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[_\-\.]/g, " ").trim();

        const eanAliases = ["ean", "gtin", "codigo de barras", "código de barras", "barcode", "cod barras", "codbarras", "cod_barras", "ean13"];
        const precoAliases = ["preco", "preço", "preco por", "preço por", "preco venda", "preço de venda", "valor", "price", "preco_por", "preçopor", "preco oferta", "preço oferta", "oferta", "preco promocional", "preço promocional"];

        let eanCol = "";
        let precoCol = "";

        for (const h of headers) {
          const nh = normalizeH(h);
          if (!eanCol && eanAliases.some(a => nh.includes(a))) eanCol = h;
          if (!precoCol && precoAliases.some(a => nh.includes(a))) precoCol = h;
        }

        if (!eanCol) {
          // Fallback: first column might be EAN
          eanCol = headers[0];
        }
        if (!precoCol) {
          // Fallback: second column or first numeric
          precoCol = headers[1] || headers[0];
        }

        // Get all products for matching
        const allProducts = getAllProdutos();
        
        // Build EAN index for fast lookup
        const eanIndex = new Map<string, Produto>();
        for (const p of allProducts) {
          if (p.ean) eanIndex.set(normalizeEan(p.ean), p);
          if ((p as any).ean2) eanIndex.set(normalizeEan((p as any).ean2), p);
          if ((p as any).ean3) eanIndex.set(normalizeEan((p as any).ean3), p);
        }

        const preview: typeof importPreview = [];

        for (const row of rows) {
          const rawEan = row[eanCol];
          const rawPreco = row[precoCol];
          const ean = normalizeEan(rawEan);
          const preco = parsePrice(rawPreco);

          if (!ean || preco <= 0) continue;

          const produto = eanIndex.get(ean);
          preview.push({
            ean,
            preco,
            produto: produto || undefined,
            matched: !!produto,
          });
        }

        setImportPreview(preview);
        setImportModalOpen(true);
        toast.success(`${preview.length} linhas lidas da planilha.`);
      } catch (err) {
        console.error(err);
        toast.error("Erro ao ler a planilha. Verifique o formato do arquivo.");
      }
    };
    reader.readAsArrayBuffer(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const handleConfirmImport = () => {
    setIsImporting(true);
    const matched = importPreview.filter(i => i.matched && i.produto);
    
    if (matched.length === 0) {
      toast.error("Nenhum produto correspondente foi encontrado na planilha.");
      setIsImporting(false);
      return;
    }

    // Ensure "Ofertas" category exists
    const catStore = useAdminCategories.getState();
    const existingOfertasCat = catStore.categories.find(
      c => c.id === OFERTAS_CAT_ID || c.nome.toLowerCase() === "ofertas"
    );
    if (!existingOfertasCat) {
      catStore.addOrUpdateCategory({
        id: OFERTAS_CAT_ID,
        nome: "Ofertas",
        slug: "ofertas",
        parentId: null as any,
        descricaoHtml: "<p>Produtos em oferta e promoção.</p>",
        ativa: true,
        destaque: true,
      });
    }
    const ofertasCatId = existingOfertasCat?.id || OFERTAS_CAT_ID;

    const prodStore = useAdminProducts.getState();
    let created = 0;

    for (const item of matched) {
      const p = item.produto!;

      // 1. Add product to "Ofertas" category via categoriasAdicionais
      const updatedProduct = { ...p };
      const existingAdicionais = updatedProduct.categoriasAdicionais || [];
      if (!existingAdicionais.includes(ofertasCatId)) {
        updatedProduct.categoriasAdicionais = [...existingAdicionais, ofertasCatId];
      }

      // 2. Set precoDe = current precoPor, precoPor = imported price
      updatedProduct.precoDe = p.precoPor;
      updatedProduct.precoPor = item.preco;

      prodStore.addOrUpdateProduct(updatedProduct);

      // 3. Create store promotion (Oferta do Mês)
      addLojaPromocao(lojaId, {
        titulo: `Oferta: ${p.nome}`,
        tipoAlvo: "produtos",
        alvosId: [p.id],
        dataFim: "",
        horaFim: "",
        icone: "percent",
        ativa: true,
        tipoCampanha: "padrao",
        levePague_precoPorItem: item.preco,
      });

      created++;
    }

    toast.success(`${created} promoções importadas com sucesso! Produtos adicionados à categoria "Ofertas".`);
    setImportModalOpen(false);
    setImportPreview([]);
    setIsImporting(false);
  };

  const matchedCount = importPreview.filter(i => i.matched).length;
  const unmatchedCount = importPreview.filter(i => !i.matched).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-lg">
            <Megaphone className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Promoções da Loja</h2>
            <p className="text-sm text-slate-500">Crie ofertas exclusivas para sua região.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Nova Promoção</CardTitle>
            <CardDescription>Busque um produto ou importe uma planilha</CardDescription>
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Import spreadsheet button */}
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={handleFileUpload}
              />
              <Button
                variant="outline"
                className="w-full border-dashed border-2 border-primary/40 text-primary hover:bg-primary/5 font-bold gap-2 h-12"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="w-5 h-5" />
                Importar Planilha de Ofertas
              </Button>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-muted-foreground">ou busque manualmente</span>
              </div>
            </div>

            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="Buscar produto pelo nome..." 
              />
              <Button type="submit" variant="secondary"><Search className="w-4 h-4" /></Button>
            </form>

            <div className="space-y-3 mt-4">
              {results.map(p => (
                <div key={p.id} className="border p-3 rounded-lg flex flex-col gap-3">
                  <div className="flex gap-3 items-center">
                    <img src={p.imagem} alt="" className="w-10 h-10 object-contain" />
                    <div>
                      <div className="font-bold text-sm leading-tight">{p.nome}</div>
                      <div className="text-xs text-muted-foreground">{brl(p.precoPor)}</div>
                    </div>
                  </div>
                  
                  <Tabs defaultValue="oferta" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 h-8">
                      <TabsTrigger value="oferta" className="text-xs">Oferta Mês</TabsTrigger>
                      <TabsTrigger value="leve" className="text-xs">Leve + por -</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="oferta" className="space-y-2 mt-2">
                      <div className="flex items-end gap-2">
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Preço em Oferta (R$)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            id={`preco-${p.id}`} 
                            placeholder={p.precoPor.toString()} 
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const val = parseFloat((document.getElementById(`preco-${p.id}`) as HTMLInputElement).value);
                            handleCreateOfertaMes(p, val);
                          }}
                        >
                          Salvar
                        </Button>
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="leve" className="space-y-2 mt-2">
                      <div className="flex items-end gap-2">
                        <div className="w-20 space-y-1">
                          <Label className="text-xs">Qtd (Ex: 2)</Label>
                          <Input 
                            type="number" 
                            id={`qtd-${p.id}`} 
                            defaultValue="2" 
                            className="h-8 text-sm"
                          />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label className="text-xs">Preço Unitário (R$)</Label>
                          <Input 
                            type="number" 
                            step="0.01"
                            id={`preco-leve-${p.id}`} 
                            placeholder="Ex: 84.99" 
                            className="h-8 text-sm"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          onClick={() => {
                            const qtd = parseInt((document.getElementById(`qtd-${p.id}`) as HTMLInputElement).value);
                            const val = parseFloat((document.getElementById(`preco-leve-${p.id}`) as HTMLInputElement).value);
                            handleCreateLevePague(p, qtd, val);
                          }}
                        >
                          Salvar
                        </Button>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="bg-slate-50/50 border-b">
            <CardTitle className="text-lg">Promoções Ativas</CardTitle>
            <CardDescription>Gerencie as ofertas da sua loja</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {promocoes.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                Nenhuma promoção ativa no momento.
              </div>
            ) : (
              <div className="divide-y">
                {promocoes.map(promo => (
                  <div key={promo.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-orange-100 p-2 rounded text-orange-600">
                        {promo.tipoCampanha === 'leve_pague' ? <Tag className="w-4 h-4" /> : <Percent className="w-4 h-4" />}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-slate-800">{promo.titulo}</div>
                        <div className="text-xs text-slate-500">
                          {promo.tipoCampanha === 'leve_pague' ? 'Leve + por -' : 'Oferta do Mês'}
                        </div>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => removeLojaPromocao(lojaId, promo.id)}
                    >
                      <Trash className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Import Preview Modal */}
      {importModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col mx-4">
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <div className="flex items-center gap-3">
                <div className="bg-primary/10 p-2 rounded-lg">
                  <FileSpreadsheet className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-800">Importar Ofertas</h3>
                  <p className="text-sm text-slate-500">Confira os produtos encontrados na planilha</p>
                </div>
              </div>
              <button
                onClick={() => { setImportModalOpen(false); setImportPreview([]); }}
                className="text-slate-400 hover:text-slate-600 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="px-6 py-3 border-b bg-slate-50/50 flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1.5 text-green-700 font-bold">
                <CheckCircle2 className="w-4 h-4" />
                {matchedCount} encontrados
              </div>
              {unmatchedCount > 0 && (
                <div className="flex items-center gap-1.5 text-amber-600 font-bold">
                  <AlertCircle className="w-4 h-4" />
                  {unmatchedCount} não encontrados
                </div>
              )}
            </div>

            {/* Product list */}
            <div className="flex-1 overflow-y-auto px-6 py-3 space-y-2">
              {importPreview.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-3 p-3 rounded-lg border text-sm transition ${
                    item.matched
                      ? "bg-green-50/50 border-green-200"
                      : "bg-amber-50/50 border-amber-200 opacity-60"
                  }`}
                >
                  {item.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}

                  <div className="flex-1 min-w-0">
                    {item.produto ? (
                      <div className="font-bold text-slate-800 truncate">{item.produto.nome}</div>
                    ) : (
                      <div className="font-medium text-amber-700">EAN não encontrado</div>
                    )}
                    <div className="text-xs text-slate-500">EAN: {item.ean}</div>
                  </div>

                  <div className="text-right shrink-0">
                    {item.produto && (
                      <div className="text-xs text-slate-400 line-through">{brl(item.produto.precoPor)}</div>
                    )}
                    <div className="font-bold text-green-700">{brl(item.preco)}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t bg-slate-50/50 flex items-center justify-between">
              <p className="text-xs text-slate-500">
                {matchedCount} produtos serão adicionados à categoria <strong>"Ofertas"</strong> com o preço promocional.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => { setImportModalOpen(false); setImportPreview([]); }}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleConfirmImport}
                  disabled={matchedCount === 0 || isImporting}
                  className="font-bold gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Importar {matchedCount} ofertas
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
