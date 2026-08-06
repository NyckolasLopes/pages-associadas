import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Produto, Categoria } from "@/types";
import { catalog } from "@/services/catalog";
import { ImagePlus, Package, Trash2, Search, PlusCircle, Link as LinkIcon, Info, Star, CheckCircle2, Loader2, RefreshCw, Video, Youtube, ShoppingBag, Check, ChevronsUpDown } from "lucide-react";
import { getDeterministicStock } from "@/lib/stock";
import { brl, getInstallmentText } from "@/lib/format";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { RichTextEditor } from "@/components/ui/RichTextEditor";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { useAdminFiltros } from "@/stores/filtros";
import { useMarcasStore } from "@/stores/marcas";
import { useVariacoesStore } from "@/stores/variacoes";
import { PriceDiscountInput } from "@/components/ui/PriceDiscountInput";

interface ProductEditorFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product: Produto | null;
  onSave: (product: Produto) => void;
  asPage?: boolean;
  lojaId?: string | null;
}

export function ProductEditorForm({ open, onOpenChange, product, onSave, asPage, lojaId }: ProductEditorFormProps) {
  const [formData, setFormData] = useState<Produto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saveStep, setSaveStep] = useState<"idle" | "saving" | "syncing" | "done">("idle");
  const { pharmacies } = useAdmin();
  const { vitrines, customProducts } = useAdminProducts();
  const { filtros } = useAdminFiltros();
  const { marcas } = useMarcasStore();
  const { variacoes } = useVariacoesStore();
  const [comboOpen, setComboOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const webpDataUrl = canvas.toDataURL("image/webp", 0.8);
          setFormData(prev => prev ? { ...prev, foto: webpDataUrl } : prev);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  useEffect(() => {
    if (product) {
      setFormData({ 
        ...product, 
        categoriasAdicionais: product.categoriasAdicionais || [],
        ativo: product.ativo ?? true,
        visivel: product.visivel ?? true,
        destaque: product.destaque ?? false,
        aVenda: product.aVenda ?? true,
        tipoProduto: product.tipoProduto || "fisico",
        selo: product.selo || "",
        tipoDePreco: product.tipoDePreco || "normal",
        tipoMedicamento: product.tipoMedicamento || "",
        classificacaoRegistro: product.classificacaoRegistro || "",
        classeTerapeutica: product.classeTerapeutica || "",
        indicacaoTerapeutica: product.indicacaoTerapeutica || "",
        disponibilidade: product.disponibilidade || "imediata",
        acaoSemEstoque: product.acaoSemEstoque || "indisponivel",
        comVariacao: product.comVariacao ?? false,
        vitrines: product.vitrines || [],
        filtrosValores: product.filtrosValores || [],
        compreJuntoProdutoId: product.compreJuntoProdutoId || "",
      });
    }
  }, [product]);

  useEffect(() => {
    if (open) {
      catalog.listCategories(true).then(setCategorias);
    }
  }, [open]);

  const handleSaveClick = () => {
    setSaveStep("saving");
    setTimeout(() => {
      setSaveStep("syncing");
      setTimeout(() => {
        setSaveStep("done");
        setTimeout(() => {
          onSave(formData!);
          setSaveStep("idle");
        }, 1500);
      }, 2500);
    }, 1500);
  };

  if (!product || !formData) return null;

  const isMedicamento = categorias.find(c => c.id === formData.categoriaId)?.slug === 'medicamentos' || 
                        categorias.find(c => c.id === formData.categoriaId)?.nome?.toLowerCase() === 'medicamentos';

  const content = (
    <>
        {/* Header Fixo */}
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b sticky top-0 z-20 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {product.id.startsWith("prod-") ? "Novo Produto" : `Editar Produto: ${product.nome}`}
              </h2>
              {lojaId ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  <Info className="w-3 h-3 text-amber-600" />
                  Individual da Loja (Sem alterar a Rede)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  🌐 Catálogo Geral da Rede
                </span>
              )}
            </div>
            <div className="text-sm text-slate-500 mt-1">Código: {product.codigoInterno || product.id} • Cadastrado via {product.origem || "Sistema"}</div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSaveClick} disabled={saveStep !== "idle"} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-8">
              Salvar produto
            </Button>
          </div>
        </div>

        {/* Content com Scroll Linear */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-6xl mx-auto w-full">
          
          {lojaId && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3 text-blue-900 text-sm">
              <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold">Modo de Edição Individual da Loja</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  As modificações ou novos produtos cadastrados aqui são salvos com isolamento total para esta loja e NÃO impactam o cadastro ou preços das demais lojas nem o Catálogo Geral da Rede.
                </p>
              </div>
            </div>
          )}

          {/* Card: Informações Básicas */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Informações básicas</h3>
            
            <div className="flex flex-wrap gap-6 items-center">
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm">
                ATIVO <Switch checked={formData.ativo} onCheckedChange={c => setFormData({...formData, ativo: c})} className="scale-90 data-[state=checked]:bg-emerald-800" />
              </div>
              <div className="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-4 py-2 rounded-full font-bold text-sm">
                BUSCÁVEL (VISÍVEL) <Switch checked={formData.visivel} onCheckedChange={c => setFormData({...formData, visivel: c})} className="scale-90 data-[state=checked]:bg-emerald-800" />
              </div>
              <div className="flex items-center gap-2 bg-amber-100 text-amber-700 px-4 py-2 rounded-full font-bold text-sm">
                <Star className="w-4 h-4" /> DESTAQUE <Switch checked={formData.destaque} onCheckedChange={c => setFormData({...formData, destaque: c})} className="scale-90 data-[state=checked]:bg-amber-500" />
              </div>
              <div className="flex items-center gap-2 bg-pink-100 text-pink-800 px-4 py-2 rounded-full font-bold text-sm">
                <ShoppingBag className="w-4 h-4" /> ORDER BUMP <Switch checked={formData.orderBump} onCheckedChange={c => setFormData({...formData, orderBump: c})} className="scale-90 data-[state=checked]:bg-pink-600" />
              </div>
              <div className="flex items-center gap-2 bg-sky-100 text-sky-800 px-4 py-2 rounded-full font-bold text-sm">
                PRODUTO NOVO <Switch checked={formData.isNovo || false} onCheckedChange={c => setFormData({...formData, isNovo: c})} className="scale-90 data-[state=checked]:bg-sky-600" />
              </div>
              <div className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-bold text-sm">
                REVISADO <Switch checked={formData.isRevisado || false} onCheckedChange={c => setFormData({...formData, isRevisado: c})} className="scale-90 data-[state=checked]:bg-indigo-600" />
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-slate-600 font-bold">Tipo</Label>
              <div className="flex bg-slate-100 p-1 rounded-md w-max">
                <button 
                  className={`px-8 py-2.5 rounded text-sm font-bold transition-colors ${formData.tipoProduto === "fisico" ? "bg-emerald-800 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setFormData({...formData, tipoProduto: "fisico"})}
                >
                  Produto Físico
                </button>
                <button 
                  className={`px-8 py-2.5 rounded text-sm font-bold transition-colors ${formData.tipoProduto === "servico" ? "bg-emerald-800 text-white shadow" : "text-slate-500 hover:text-slate-700"}`}
                  onClick={() => setFormData({...formData, tipoProduto: "servico"})}
                >
                  Serviço de Saúde
                </button>
              </div>
            </div>

            {formData.tipoProduto !== "servico" && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Desconto de laboratório</Label>
                  <Select value={formData.selo} onValueChange={v => setFormData({...formData, selo: v})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione uma ação" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Nenhuma ação</SelectItem>
                      <SelectItem value="dermaclub">Dermaclub</SelectItem>
                      <SelectItem value="scantech">Scantech</SelectItem>
                      <SelectItem value="e-pharma">E-pharma</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex justify-between items-center"><Label className="font-bold">Nome do produto*</Label><span className="text-xs text-slate-400">{(formData.nome || "").length} de 120 caracteres</span></div>
              <Input maxLength={120} value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} className="bg-white text-lg h-12" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Descrição do produto</Label>
              <RichTextEditor 
                value={formData.descricao || ""} 
                onChange={val => setFormData({...formData, descricao: val})}
                placeholder="Digite a descrição ou insira HTML/iframes aqui..."
              />
              <div className="text-right text-xs text-slate-400">Suporta formatação HTML. Até 20000 caracteres</div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">Termos de pesquisa ocultos <Info className="h-4 w-4 text-slate-400" /></Label>
              <p className="text-xs text-slate-500 mb-1">Palavras-chave separadas por vírgula que ajudam os clientes a encontrar este produto na busca, mas não aparecem na página. (Ex: chiclete, bala, goma)</p>
              <Input 
                defaultValue={formData.internalTags?.join(', ') || ""} 
                onBlur={e => setFormData({...formData, internalTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})}
                placeholder="Ex: chiclete, bala, doce..."
                className="bg-white" 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-2">Vídeo do Produto (YouTube) <Youtube className="w-4 h-4 text-red-500" /></Label>
              <p className="text-xs text-slate-500 mb-1">Insira o link de um vídeo padrão do YouTube (não utilize links de Shorts).</p>
              <Input 
                value={formData.youtubeVideoUrl || ""} 
                onChange={e => setFormData({...formData, youtubeVideoUrl: e.target.value})} 
                placeholder="Ex: https://www.youtube.com/watch?v=..."
                className="bg-white" 
              />
            </div>

            <div className="space-y-2 max-w-sm">
              <Label className="font-bold flex items-center gap-2">Marca <Info className="h-4 w-4 text-slate-400" /></Label>
              <Select value={formData.marca || ""} onValueChange={v => setFormData({...formData, marca: v})}>
                <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione uma marca" /></SelectTrigger>
                <SelectContent>
                  {marcas.map(m => (
                    <SelectItem key={m.id} value={m.nome}>{m.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 border-t pt-6">
              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2">
                  Qual o nível de relevância? <span title="Nível de prioridade nas buscas do produto em sua loja."><Info className="h-4 w-4 text-slate-400" /></span>
                </Label>
                <div className="flex bg-slate-100 p-1 rounded-md w-full border border-slate-200">
                  <button 
                    className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${(formData.prioridade === 0 || formData.prioridade === undefined) ? "bg-emerald-800 text-white shadow" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                    onClick={(e) => { e.preventDefault(); setFormData({...formData, prioridade: 0}) }}
                  >
                    Padrão
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${formData.prioridade === 1 ? "bg-emerald-800 text-white shadow" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                    onClick={(e) => { e.preventDefault(); setFormData({...formData, prioridade: 1}) }}
                  >
                    Média
                  </button>
                  <button 
                    className={`flex-1 py-2 rounded text-sm font-bold transition-colors ${formData.prioridade === 2 ? "bg-emerald-800 text-white shadow" : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"}`}
                    onClick={(e) => { e.preventDefault(); setFormData({...formData, prioridade: 2}) }}
                  >
                    Alta
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold flex items-center gap-2">
                  Código NCM <span className="text-muted-foreground font-normal">(opcional)</span> <Info className="h-4 w-4 text-slate-400" />
                </Label>
                <Input 
                  value={formData.ncm || ""} 
                  onChange={e => setFormData({...formData, ncm: e.target.value})} 
                  className="bg-white" 
                />
              </div>
            </div>

            <div className="space-y-2 mt-6">
              <Label className="font-bold flex items-center gap-2">
                Termos de pesquisa <Info className="h-4 w-4 text-slate-400" />
              </Label>
              <Textarea 
                value={(formData.internalTags || []).join(", ")}
                onChange={e => setFormData({...formData, internalTags: e.target.value.split(",").map(t => t.trim())})}
                className="bg-white min-h-[80px]"
              />
              <p className="text-xs text-slate-500">Separe os valores por virgula (,)</p>
            </div>
          </div>

          {/* Card: Mídias Adicionais (Opcional) */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Mídias Adicionais (Opcional)</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Link do Produto <Info className="h-4 w-4 text-slate-400" /></Label>
                  <p className="text-xs text-slate-500 mb-1">URL de referência ou do fornecedor original do produto.</p>
                  <Input 
                    placeholder="https://..." 
                    className="bg-white" 
                    value={formData.linkProduto || ""} 
                    onChange={e => setFormData({...formData, linkProduto: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Vídeo Flutuante (Até 2MB / 30s) <Info className="h-4 w-4 text-slate-400" /></Label>
                  <p className="text-xs text-slate-500 mb-1">Anexe o arquivo de vídeo (.mp4, .webm) que aparecerá no canto inferior esquerdo (estilo GIF/Autoplay).</p>
                  
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 group relative">
                    {formData.videoFlutuante ? (
                      <div className="flex flex-col items-center">
                        <Video className="w-10 h-10 mb-2 text-emerald-600" />
                        <span className="font-bold text-sm text-slate-700">Vídeo anexado</span>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="mt-2 text-red-500 hover:text-red-700 hover:bg-red-50"
                          onClick={(e) => { e.stopPropagation(); setFormData({...formData, videoFlutuante: ""}); }}
                        >
                          Remover
                        </Button>
                      </div>
                    ) : (
                      <>
                        <Video className="w-10 h-10 mb-2 text-slate-400 group-hover:text-emerald-800 transition-colors" />
                        <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-800 mb-1">Arraste o vídeo aqui</div>
                        <div className="text-xs text-center">Ou clique para buscar no computador</div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Stories do Produto <Info className="h-4 w-4 text-slate-400" /></Label>
                  <p className="text-xs text-slate-500 mb-1">Anexe imagens ou vídeos curtos para exibição em formato de stories.</p>
                  
                  <div className="space-y-3">
                    {(formData.storiesProduto || []).length > 0 && (
                      <div className="grid grid-cols-2 gap-3">
                        {(formData.storiesProduto || []).map((story, i) => (
                          <div key={i} className="relative group border rounded-md overflow-hidden aspect-[9/16] bg-slate-100 flex items-center justify-center">
                            <span className="text-xs font-bold text-slate-400">Story {i+1}</span>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <Button 
                                variant="destructive" 
                                size="sm"
                                onClick={() => {
                                  const newStories = [...(formData.storiesProduto || [])];
                                  newStories.splice(i, 1);
                                  setFormData({...formData, storiesProduto: newStories});
                                }}
                              >
                                Remover
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div 
                      className="border-2 border-dashed border-slate-300 rounded-lg p-6 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 group"
                      onClick={() => {
                        // Mock adding a story
                        const newStories = [...(formData.storiesProduto || []), "mock_story_url"];
                        setFormData({...formData, storiesProduto: newStories});
                      }}
                    >
                      <ImagePlus className="w-8 h-8 mb-2 text-slate-400 group-hover:text-emerald-800 transition-colors" />
                      <div className="text-sm font-bold text-slate-700 group-hover:text-emerald-800">Adicionar Story</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* Card: Organização do Produto */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Organização do Produto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Categoria Principal (SEO)</Label>
                  <Select value={formData.categoriaId || ""} onValueChange={v => setFormData({...formData, categoriaId: v, subcategoriaId: ""})}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                    <SelectContent>
                      {categorias.filter(c => !c.parentId).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Categorias Adicionais</Label>
                  <div className="space-y-2 border rounded-lg p-4 bg-slate-50 max-h-[150px] overflow-y-auto">
                    {categorias.filter(c => !c.parentId).map(c => (
                      <div key={c.id} className="flex items-center gap-3 bg-white p-2 border rounded-md">
                        <Checkbox 
                          checked={(formData.categoriasIds || []).includes(c.id.toString())}
                          onCheckedChange={(checked) => {
                            const current = formData.categoriasIds || [];
                            if (checked) {
                              setFormData({ ...formData, categoriasIds: [...current, c.id.toString()] });
                            } else {
                              setFormData({ ...formData, categoriasIds: current.filter(id => id !== c.id.toString()) });
                            }
                          }}
                        />
                        <span className="text-sm font-medium text-slate-700">{c.nome}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Subcategoria Principal (SEO)</Label>
                  <Select value={formData.subcategoriaId || ""} onValueChange={v => setFormData({...formData, subcategoriaId: v})} disabled={!formData.categoriaId}>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Selecione a subcategoria" /></SelectTrigger>
                    <SelectContent>
                      {categorias.filter(c => c.parentId === formData.categoriaId).length > 0 ? (
                        categorias.filter(c => c.parentId === formData.categoriaId).map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>Nenhuma subcategoria disponível</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Subcategorias Adicionais</Label>
                  <div className="space-y-2 border rounded-lg p-4 bg-slate-50 max-h-[150px] overflow-y-auto">
                    {categorias.filter(c => c.parentId).length > 0 ? (
                      categorias.filter(c => c.parentId).map(c => (
                        <div key={c.id} className="flex items-center gap-3 bg-white p-2 border rounded-md">
                          <Checkbox 
                            checked={(formData.subcategoriasIds || []).includes(c.id.toString())}
                            onCheckedChange={(checked) => {
                              const current = formData.subcategoriasIds || [];
                              if (checked) {
                                setFormData({ ...formData, subcategoriasIds: [...current, c.id.toString()] });
                              } else {
                                setFormData({ ...formData, subcategoriasIds: current.filter(id => id !== c.id.toString()) });
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700">{c.nome} <span className="text-xs text-slate-400">({categorias.find(parent => parent.id === c.parentId)?.nome})</span></span>
                        </div>
                      ))
                    ) : (
                       <div className="text-sm text-slate-500">Nenhuma subcategoria disponível</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">Vitrines / Coleções</Label>
                  <div className="space-y-2 border rounded-lg p-4 bg-slate-50 max-h-[250px] overflow-y-auto">
                    {vitrines.length === 0 ? (
                      <div className="text-sm text-slate-500">Nenhuma vitrine cadastrada.</div>
                    ) : (
                      vitrines.map(vitrine => (
                        <div key={vitrine.id} className="flex items-center gap-3 bg-white p-2 border rounded-md">
                          <Checkbox 
                            checked={(formData.vitrines || []).includes(vitrine.id.toString())}
                            onCheckedChange={(checked) => {
                              const current = formData.vitrines || [];
                              if (checked) {
                                setFormData({ ...formData, vitrines: [...current, vitrine.id.toString()] });
                              } else {
                                setFormData({ ...formData, vitrines: current.filter(id => id !== vitrine.id.toString()) });
                              }
                            }}
                          />
                          <span className="text-sm font-medium text-slate-700">{vitrine.nome}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Filtros</Label>
                  <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2">
                    {filtros.length === 0 ? (
                      <div className="text-sm text-slate-500">Nenhum filtro cadastrado.</div>
                    ) : (
                      filtros.filter(f => f.nome.toLowerCase() !== 'marca').map(filtro => {
                        const selected = (formData.filtrosValores || []).find(fv => fv.filtroId === filtro.id)?.opcaoId || "";
                        return (
                          <div key={filtro.id} className="space-y-2">
                            <Label className="font-semibold text-slate-700">{filtro.nome}</Label>
                            <div className="space-y-2 border rounded-lg p-4 bg-slate-50">
                              {filtro.opcoes.map(op => {
                                const isChecked = (formData.filtrosValores || []).some(fv => fv.filtroId === filtro.id && fv.opcaoId === op.id);
                                return (
                                  <div key={op.id} className="flex items-center gap-3 bg-white p-2 border rounded-md">
                                    <Checkbox 
                                      checked={isChecked}
                                      onCheckedChange={(checked) => {
                                        let current = [...(formData.filtrosValores || [])];
                                        if (checked) {
                                          current.push({ filtroId: filtro.id, opcaoId: op.id });
                                        } else {
                                          current = current.filter(fv => !(fv.filtroId === filtro.id && fv.opcaoId === op.id));
                                        }
                                        setFormData({ ...formData, filtrosValores: current });
                                      }}
                                    />
                                    <span className="text-sm font-medium text-slate-700">{op.nome}</span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Variações <Info className="h-4 w-4 text-slate-400" /></Label>
                  <p className="text-xs text-slate-500 mb-1">Selecione produtos com o mesmo nome em dosagens diferentes.</p>
                  <Select>
                    <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Adicionar variação..." /></SelectTrigger>
                    <SelectContent>
                      {variacoes.map(v => (
                        <SelectItem key={v.id} value={v.id}>{v.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Compre Junto Fixo <Info className="h-4 w-4 text-slate-400" /></Label>
                  <p className="text-xs text-slate-500 mb-1">Escolha um produto para ser oferecido em destaque como parceiro deste produto.</p>
                  <Popover open={comboOpen} onOpenChange={setComboOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={comboOpen}
                        className="w-full justify-between bg-white border-slate-200"
                      >
                        {formData.compreJuntoProdutoId
                          ? customProducts.find((p) => p.id === formData.compreJuntoProdutoId)?.nome || "Produto Selecionado"
                          : "Selecione o produto adicional..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[400px] p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Buscar por nome ou EAN..." />
                        <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                        <CommandGroup className="max-h-[300px] overflow-y-auto">
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setFormData({ ...formData, compreJuntoProdutoId: undefined });
                              setComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn("mr-2 h-4 w-4", !formData.compreJuntoProdutoId ? "opacity-100" : "opacity-0")}
                            />
                            Nenhum produto
                          </CommandItem>
                          {customProducts
                            .filter((p) => p.id !== formData.id)
                            .map((p) => (
                              <CommandItem
                                key={p.id}
                                value={p.nome + (p.ean ? ` ${p.ean}` : "")}
                                onSelect={() => {
                                  setFormData({ ...formData, compreJuntoProdutoId: p.id });
                                  setComboOpen(false);
                                }}
                              >
                                <Check
                                  className={cn("mr-2 h-4 w-4", formData.compreJuntoProdutoId === p.id ? "opacity-100" : "opacity-0")}
                                />
                                <div className="flex flex-col">
                                  <span>{p.nome}</span>
                                  {p.ean && <span className="text-xs text-slate-400">EAN: {p.ean}</span>}
                                </div>
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>
          </div>

          {/* Card: Detalhes do Produto */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Detalhes do produto</h3>
            
            <div className="flex items-center gap-3">
              <Label className="font-bold text-slate-700">Disponível para venda?</Label>
              <Switch checked={formData.aVenda} onCheckedChange={c => setFormData({...formData, aVenda: c})} className="data-[state=checked]:bg-emerald-800" />
              <span className="text-sm font-medium text-slate-500">{formData.aVenda ? "SIM" : "NÃO"}</span>
            </div>

            <div className="bg-slate-50 p-6 rounded-lg border">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Preço de venda*</Label>
                  <div className="flex"><div className="bg-slate-100 border border-r-0 px-4 flex items-center rounded-l-md font-bold text-slate-500">R$</div><Input type="number" value={formData.precoDe || 0} onChange={e => setFormData({...formData, precoDe: parseFloat(e.target.value) || 0})} className="rounded-l-none bg-white text-lg font-bold" /></div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-emerald-800">Preço promocional (de / por)</Label>
                  <PriceDiscountInput 
                    basePrice={formData.precoDe} 
                    initialPromoPrice={formData.precoPor} 
                    onChange={val => setFormData({...formData, precoPor: val})} 
                  />
                  {getInstallmentText(formData.precoPor || formData.precoDe) && (
                    <p className="text-xs font-medium text-slate-500 mt-1">
                      {getInstallmentText(formData.precoPor || formData.precoDe)}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Tipo de preço</Label>
                  <div className="h-10 px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-slate-700 font-medium">
                    Preço Base
                  </div>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-md border">
                  <Checkbox id="preco-sob-consulta" checked={formData.precoSobConsulta} onCheckedChange={(c) => setFormData({...formData, precoSobConsulta: c === true})} className="data-[state=checked]:bg-emerald-800 data-[state=checked]:border-emerald-800" />
                  <Label htmlFor="preco-sob-consulta" className="font-medium cursor-pointer">Preço sob consulta (Oculta o preço na loja)</Label>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold flex items-center gap-2">Código Interno (SKU) <Info className="h-4 w-4 text-slate-400" /></Label>
                  {formData.tipoProduto !== "servico" ? (
                    <p className="text-xs text-slate-500 mb-1">O código interno do produto deve ser o mesmo ID da API.</p>
                  ) : (
                    <p className="text-xs text-emerald-600 mb-1 font-medium">Serviços não possuem integração com API. Cadastro manual.</p>
                  )}
                  <div className="flex gap-2">
                    <Input 
                      value={formData.id || ""} 
                      onChange={(e) => formData.tipoProduto === "servico" ? setFormData({...formData, id: e.target.value, sku: e.target.value}) : undefined}
                      readOnly={formData.tipoProduto !== "servico"} 
                      className={`flex-1 ${formData.tipoProduto !== "servico" ? "bg-slate-50 text-slate-500 cursor-not-allowed" : "bg-white text-slate-800"}`} 
                    />
                  </div>
                </div>
                {formData.tipoProduto !== "servico" && (
                  <>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">Código de Barras (EAN-13)* <Info className="h-4 w-4 text-slate-400" /></Label>
                      <Input value={formData.ean || ""} onChange={e => setFormData({...formData, ean: e.target.value})} className="bg-white" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">EAN Secundário <Info className="h-4 w-4 text-slate-400" /></Label>
                      <Input value={formData.ean2 || ""} onChange={e => setFormData({...formData, ean2: e.target.value})} className="bg-white" placeholder="Opcional" />
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold flex items-center gap-2">EAN Terciário <Info className="h-4 w-4 text-slate-400" /></Label>
                      <Input value={formData.ean3 || ""} onChange={e => setFormData({...formData, ean3: e.target.value})} className="bg-white" placeholder="Opcional" />
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Card: Classificação Farmacêutica */}
          {formData.tipoProduto !== "servico" && (
            <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
              <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b flex items-center gap-2">
                <PlusCircle className="h-6 w-6 text-emerald-800" /> Classificação Farmacêutica
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Número de registro da ANVISA</Label>
                    <Input value={formData.registroAnvisa || ""} onChange={e => setFormData({...formData, registroAnvisa: e.target.value})} className="bg-white" />
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Tarja</Label>
                    <Select value={formData.tarja || "Sem Tarja"} onValueChange={v => setFormData({...formData, tarja: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a tarja" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sem Tarja">Sem Tarja</SelectItem>
                        <SelectItem value="Amarela">Amarela</SelectItem>
                        <SelectItem value="Vermelha">Vermelha</SelectItem>
                        <SelectItem value="Vermelha Retém Receita">Vermelha Retém Receita</SelectItem>
                        <SelectItem value="Preta">Preta</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Receita médica</Label>
                    <Select value={formData.retemReceita ? "retem" : formData.retemReceita === false ? "nao_retem" : "nao_aplica"} onValueChange={v => {
                      if (v === "retem") setFormData({...formData, retemReceita: true});
                      else if (v === "nao_retem") setFormData({...formData, retemReceita: false});
                      else setFormData({...formData, retemReceita: false});
                    }}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="retem">Retém receita</SelectItem>
                        <SelectItem value="nao_retem">Não retém receita</SelectItem>
                        <SelectItem value="nao_aplica">Não se aplica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label className="font-bold">Tipo de medicamento</Label>
                    <Select value={formData.tipoMedicamento} onValueChange={v => setFormData({...formData, tipoMedicamento: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="referencia">Referência</SelectItem>
                        <SelectItem value="generico">Genérico</SelectItem>
                        <SelectItem value="similar">Similar</SelectItem>
                        <SelectItem value="biologico">Biológico</SelectItem>
                        <SelectItem value="especifico">Específico</SelectItem>
                        <SelectItem value="fitoterapico">Fitoterápico</SelectItem>
                        <SelectItem value="homeopatico">Homeopático</SelectItem>
                        <SelectItem value="dinamizado">Dinamizado</SelectItem>
                        <SelectItem value="radiofarmaco">Radiofármaco</SelectItem>
                        <SelectItem value="notificado">Notificado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Classificação farmacêutica</Label>
                    <Select value={formData.classificacaoRegistro} onValueChange={v => setFormData({...formData, classificacaoRegistro: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a classificação" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="novo">Novo</SelectItem>
                        <SelectItem value="similar">Similar</SelectItem>
                        <SelectItem value="generico">Genérico</SelectItem>
                        <SelectItem value="especifico">Específico</SelectItem>
                        <SelectItem value="biologico">Biológico</SelectItem>
                        <SelectItem value="fitoterapico">Fitoterápico</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Classe terapêutica</Label>
                    <Select value={formData.classeTerapeutica} onValueChange={v => setFormData({...formData, classeTerapeutica: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Ex: Analgésico, Antibiótico..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="analgesico">Analgésico</SelectItem>
                        <SelectItem value="anti_inflamatorio">Anti-inflamatório</SelectItem>
                        <SelectItem value="antibiotico">Antibiótico</SelectItem>
                        <SelectItem value="antitermico">Antitérmico</SelectItem>
                        <SelectItem value="antialergico">Antialérgico</SelectItem>
                        <SelectItem value="antidepressivo">Antidepressivo</SelectItem>
                        <SelectItem value="anti_hipertensivo">Anti-hipertensivo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Indicação terapêutica</Label>
                    <Select value={formData.indicacaoTerapeutica} onValueChange={v => setFormData({...formData, indicacaoTerapeutica: v})}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Ex: Dor de Cabeça..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="dor_cabeca">Dor de Cabeça</SelectItem>
                        <SelectItem value="febre">Febre</SelectItem>
                        <SelectItem value="inflamacao">Inflamação</SelectItem>
                        <SelectItem value="infeccao">Infecção</SelectItem>
                        <SelectItem value="pressao_alta">Pressão Alta</SelectItem>
                        <SelectItem value="depressao">Depressão</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="col-span-1 md:col-span-2 space-y-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold text-lg">Princípios Ativos</Label>
                    <Button type="button" variant="outline" size="sm" onClick={() => setFormData({...formData, principiosAtivosDetalhes: [...(formData.principiosAtivosDetalhes || []), { nome: '', concentracao: '', unidadeMedida: '' }]})}>
                      Adicionar
                    </Button>
                  </div>
                  {(formData.principiosAtivosDetalhes || []).map((pa, idx) => (
                    <div key={idx} className="flex gap-3 items-end p-3 border rounded-lg bg-slate-50">
                      <div className="flex-1 space-y-1">
                        <Label className="text-xs">Nome</Label>
                        <Input className="bg-white" value={pa.nome} onChange={e => {
                          const newArr = [...(formData.principiosAtivosDetalhes || [])];
                          newArr[idx].nome = e.target.value;
                          setFormData({...formData, principiosAtivosDetalhes: newArr});
                        }} />
                      </div>
                      <div className="w-24 space-y-1">
                        <Label className="text-xs">Conc.</Label>
                        <Input className="bg-white" value={pa.concentracao} onChange={e => {
                          const newArr = [...(formData.principiosAtivosDetalhes || [])];
                          newArr[idx].concentracao = e.target.value;
                          setFormData({...formData, principiosAtivosDetalhes: newArr});
                        }} />
                      </div>
                      <div className="w-32 space-y-1">
                        <Label className="text-xs">Unidade</Label>
                        <Input className="bg-white" value={pa.unidadeMedida} onChange={e => {
                          const newArr = [...(formData.principiosAtivosDetalhes || [])];
                          newArr[idx].unidadeMedida = e.target.value;
                          setFormData({...formData, principiosAtivosDetalhes: newArr});
                        }} />
                      </div>
                      <Button type="button" variant="ghost" size="icon" className="mb-0.5 hover:bg-red-100" onClick={() => {
                        const newArr = [...(formData.principiosAtivosDetalhes || [])];
                        newArr.splice(idx, 1);
                        setFormData({...formData, principiosAtivosDetalhes: newArr});
                      }}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}


          {/* Card: Estoques (Lojas e Prateleira Infinita) */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <div className="pb-4 border-b">
              <h3 className="font-bold text-2xl text-slate-800">Estoques (Lojas e Fornecedores)</h3>
              <p className="text-sm text-slate-500 mt-1">Gerencie a disponibilidade local e configure a prateleira infinita via API do distribuidor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold">Disponibilidade Imediata</Label>
                  <Select value={formData.disponibilidade} onValueChange={v => setFormData({...formData, disponibilidade: v})}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="imediata">Imediata</SelectItem>
                      <SelectItem value="1">1 dia útil</SelectItem>
                      <SelectItem value="2">2 dias úteis</SelectItem>
                      <SelectItem value="3">3 dias úteis</SelectItem>
                      <SelectItem value="4">4 dias úteis</SelectItem>
                      <SelectItem value="5">5 dias úteis</SelectItem>
                      <SelectItem value="6">6 dias úteis</SelectItem>
                      <SelectItem value="7">7 dias úteis</SelectItem>
                      <SelectItem value="8">8 dias úteis</SelectItem>
                      <SelectItem value="9">9 dias úteis</SelectItem>
                      <SelectItem value="10">10 dias úteis</SelectItem>
                      <SelectItem value="15">15 dias úteis</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold">Ação manual quando zerar o estoque</Label>
                  <Select 
                    value={formData.estoqueExterno?.distribuidor ? "automatica_prateleira" : formData.acaoSemEstoque} 
                    onValueChange={v => setFormData({...formData, acaoSemEstoque: v})}
                    disabled={!!formData.estoqueExterno?.distribuidor}
                  >
                    <SelectTrigger className="bg-white disabled:opacity-50 disabled:bg-slate-100"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="automatica_prateleira">Definido via Prateleira Infinita (Automático)</SelectItem>
                      <SelectItem value="indisponivel">Tornar produto indisponível</SelectItem>
                      <SelectItem value="continuar_normal">Continuar vendendo normalmente</SelectItem>
                      <SelectItem value="continuar_1">Continuar vendendo com disponibilidade de 1 dia</SelectItem>
                      <SelectItem value="continuar_2">Continuar vendendo com disponibilidade de 2 dias</SelectItem>
                      <SelectItem value="continuar_3">Continuar vendendo com disponibilidade de 3 dias</SelectItem>
                      <SelectItem value="continuar_4">Continuar vendendo com disponibilidade de 4 dias</SelectItem>
                      <SelectItem value="continuar_5">Continuar vendendo com disponibilidade de 5 dias</SelectItem>
                      <SelectItem value="continuar_6">Continuar vendendo com disponibilidade de 6 dias</SelectItem>
                      <SelectItem value="continuar_7">Continuar vendendo com disponibilidade de 7 dias</SelectItem>
                      <SelectItem value="continuar_10">Continuar vendendo com disponibilidade de 10 dias</SelectItem>
                    </SelectContent>
                  </Select>
                  {!!formData.estoqueExterno?.distribuidor && (
                    <p className="text-xs text-emerald-700 font-medium bg-emerald-50 p-3 rounded border border-emerald-100 mt-2 leading-relaxed">
                      <strong>Automação ativa:</strong> Se o estoque da loja parceira acabar, a disponibilidade muda automaticamente para o prazo do Distribuidor ("{formData.estoqueExterno.prazoEntregaDias || 'X'} dias"). Se o Distribuidor também não tiver estoque nos {formData.ean3 ? '3' : formData.ean2 ? '2' : '1'} EANs cadastrados, torna-se Indisponível.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-6 border-l pl-8">
                <div className="space-y-2">
                  <Label className="font-bold text-lg flex items-center justify-between">
                    Estoque das Lojas
                    <span className="text-sm bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Total: {pharmacies.reduce((acc, loja) => acc + (formData.estoquesPorLoja?.[loja.id] ?? getDeterministicStock(formData.id, loja.id)), 0)} un.
                    </span>
                  </Label>
                  <div className="border rounded-lg overflow-hidden bg-white max-h-[250px] overflow-y-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 text-slate-800 font-bold sticky top-0 z-10">
                        <tr>
                          <th className="text-left px-4 py-2">Loja</th>
                          <th className="text-center px-4 py-2 w-32">Estoque</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pharmacies.map((loja) => {
                          const estoqueLoja = formData.estoquesPorLoja?.[loja.id] ?? getDeterministicStock(formData.id, loja.id);
                          return (
                            <tr key={loja.id} className="border-t hover:bg-slate-50">
                              <td className="px-4 py-2 text-slate-600 font-medium">{(loja as any).nome || (loja as any).name}</td>
                              <td className="px-4 py-2 text-center font-bold text-slate-700">
                                <Input 
                                  type="number" 
                                  className="w-20 mx-auto text-center h-8"
                                  value={estoqueLoja}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    setFormData((prev: any) => ({
                                      ...prev,
                                      estoquesPorLoja: {
                                        ...(prev.estoquesPorLoja || {}),
                                        [loja.id]: isNaN(val) ? 0 : val
                                      }
                                    }));
                                  }}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {formData.tipoProduto !== "servico" && (
                  <div className="space-y-4 pt-4 border-t relative overflow-hidden">
                    {/* Overlay de Bloqueio */}
                    <div className="absolute inset-0 top-4 z-10 flex items-center justify-center bg-white/40 backdrop-blur-[2px] rounded-md">
                      <span className="bg-emerald-800 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 border-2 border-emerald-600/50 transform -rotate-2">
                        <Package className="w-5 h-5" /> Prateleira Infinita em breve!
                      </span>
                    </div>

                    <div className="opacity-40 pointer-events-none select-none blur-[2px]">
                      <Label className="font-bold text-lg flex items-center gap-2">
                        Fornecedor
                      </Label>
                      <p className="text-xs text-slate-500 mb-2">Configure a API do distribuidor para puxar o estoque externo usando os EANs cadastrados.</p>
                      
                      <div className="space-y-3 bg-slate-50 p-4 rounded border">
                        <div className="space-y-2">
                        <Label className="font-semibold text-sm">Nome do Distribuidor</Label>
                        <Input 
                          placeholder="Ex: Panvel, Santa Cruz..." 
                          className="bg-white"
                          value={formData.estoqueExterno?.distribuidor || ""}
                          onChange={e => setFormData({...formData, estoqueExterno: {...(formData.estoqueExterno || {}), distribuidor: e.target.value} as any})}
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label className="font-semibold text-sm">Cidade de Origem</Label>
                          <Input 
                            placeholder="Ex: Porto Alegre" 
                            className="bg-white"
                            value={formData.estoqueExterno?.cidadeDistribuidor || ""}
                            onChange={e => setFormData({...formData, estoqueExterno: {...(formData.estoqueExterno || {}), cidadeDistribuidor: e.target.value} as any})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="font-semibold text-sm">Prazo (Dias Úteis)</Label>
                          <Input 
                            type="number"
                            placeholder="Ex: 3" 
                            className="bg-white"
                            value={formData.estoqueExterno?.prazoEntregaDias || ""}
                            onChange={e => setFormData({...formData, estoqueExterno: {...(formData.estoqueExterno || {}), prazoEntregaDias: Number(e.target.value)} as any})}
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="font-semibold text-sm">URL da API do Fornecedor</Label>
                        <Input 
                          placeholder="https://api.distribuidor.com/v1/estoque" 
                          className="bg-white"
                          value={formData.estoqueExterno?.apiUrl || ""}
                          onChange={e => setFormData({...formData, estoqueExterno: {...(formData.estoqueExterno || {}), apiUrl: e.target.value} as any})}
                        />
                      </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Variações do produto */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-bold text-2xl text-slate-800">Variações do produto</h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-slate-600 text-lg">Seu produto possui variações como de tamanho, cor, material, etc? Se sim, adicione as variações clicando no botão abaixo e fazendo edições necessárias logo após.</p>
              <div className="flex items-center gap-4">
                <Switch checked={formData.comVariacao} onCheckedChange={c => setFormData({...formData, comVariacao: c})} className="data-[state=checked]:bg-emerald-800" />
                <Label className="font-bold text-slate-700">Com variação?</Label>
              </div>
              {formData.comVariacao && (
                <Button variant="outline" className="mt-4 border-emerald-200 text-emerald-800 hover:bg-emerald-50 font-bold">Adicionar variação</Button>
              )}
            </div>
          </div>

          {/* Card: Peso e Dimensões */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-2xl text-slate-800">Peso e Dimensões</h3>
            </div>
            
            <div className="flex gap-12">
              <div className="grid grid-cols-2 gap-x-8 gap-y-6 flex-1">
                <div className="space-y-2">
                  <Label className="font-bold">Peso</Label>
                  <div className="flex"><Input defaultValue="0" className="rounded-r-none border-r-0 bg-white" /><div className="bg-slate-50 border border-l-0 px-4 flex items-center rounded-r-md font-medium text-slate-500">Kg</div></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="font-bold">Largura</Label><span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">= 0,00 m</span></div>
                  <div className="flex"><Input defaultValue="0" className="rounded-r-none border-r-0 bg-white" /><div className="bg-slate-50 border border-l-0 px-4 flex items-center rounded-r-md font-medium text-slate-500">cm</div></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="font-bold">Altura</Label><span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">= 0,00 m</span></div>
                  <div className="flex"><Input defaultValue="0" className="rounded-r-none border-r-0 bg-white" /><div className="bg-slate-50 border border-l-0 px-4 flex items-center rounded-r-md font-medium text-slate-500">cm</div></div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between items-center"><Label className="font-bold">Comprimento</Label><span className="text-xs bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold">= 0,00 m</span></div>
                  <div className="flex"><Input defaultValue="0" className="rounded-r-none border-r-0 bg-white" /><div className="bg-slate-50 border border-l-0 px-4 flex items-center rounded-r-md font-medium text-slate-500">cm</div></div>
                </div>
              </div>
              <div className="w-48 flex items-center justify-center">
                <Package className="w-full h-auto text-slate-200 stroke-1" />
              </div>
            </div>
          </div>

          {/* Card: Imagens */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-bold text-2xl text-slate-800">Imagens</h3>
              <Button variant="link" className="text-emerald-800 flex items-center gap-2 font-semibold" onClick={() => fileInputRef.current?.click()}>Selecionar imagens</Button>
            </div>
            
            <div 
              className="border-2 border-dashed border-slate-300 rounded-lg p-12 flex flex-col items-center justify-center bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer text-slate-500 group relative overflow-hidden min-h-[300px]"
              onClick={() => fileInputRef.current?.click()}
            >
              {formData.foto ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-white/80">
                  <img src={formData.foto} alt="Produto" className="max-w-full max-h-[200px] object-contain mb-4 rounded-md shadow-sm" />
                  <Button variant="outline" className="bg-white text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200" onClick={(e) => { e.stopPropagation(); setFormData({...formData, foto: ""}); }}>
                    Remover Imagem
                  </Button>
                </div>
              ) : (
                <>
                  <ImagePlus className="w-16 h-16 mb-4 text-slate-400 group-hover:text-emerald-800 transition-colors" />
                  <div className="text-lg font-bold text-slate-700 group-hover:text-emerald-800 mb-2">Arraste as imagens aqui ou clique para selecionar</div>
                  <div className="text-sm text-center">Formatos aceitos: JPG, PNG, WEBP (Serão convertidos automaticamente para .webp).<br/>Sugerimos dimensões de 1000 px X 1000 px.</div>
                </>
              )}
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
            </div>
          </div>

          {/* Card: Categorias */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-bold text-2xl text-slate-800">Categorias</h3>
              <Button variant="link" className="text-emerald-800 flex items-center gap-2 font-semibold"><PlusCircle className="w-4 h-4" /> Cadastrar categoria</Button>
            </div>
            
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input className="pl-10 bg-white h-12 text-lg" placeholder="buscar categorias já cadastradas" />
              </div>
              <Button variant="outline" className="h-12 px-8 border-slate-300 font-bold text-slate-600 hover:text-emerald-800">Ver categorias</Button>
            </div>
            
            <div className="bg-slate-50 border rounded-lg p-8 text-center text-slate-500 font-medium">
              Nenhuma categoria adicionada.
            </div>
          </div>

          {/* Card: Google / SEO */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b pb-4">
              <h3 className="font-bold text-2xl flex items-center gap-2 text-slate-800">Google / SEO <Info className="h-5 w-5 text-slate-400" /></h3>
            </div>
            
            <div className="space-y-6 max-w-4xl">
              <div className="space-y-2">
                <div className="flex justify-between items-center"><Label className="font-bold">Título da página</Label><span className="text-xs text-slate-400">0 de 70 caracteres</span></div>
                <Input defaultValue={product.nome} className="bg-white text-lg h-12" />
              </div>
              
              <div className="space-y-2">
                <Label className="font-bold">Link da página</Label>
                <Input 
                  placeholder="link-da-pagina" 
                  value={formData.url || product.nome.toLowerCase().replace(/ /g, '-')} 
                  onChange={e => setFormData({...formData, url: e.target.value})} 
                  className="bg-white text-lg h-12" 
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center"><Label className="font-bold">Descrição da página</Label><span className="text-xs text-slate-400">0 caracteres</span></div>
                <Textarea placeholder="Digite aqui..." className="bg-white min-h-[120px] text-lg" />
                <div className="text-sm text-slate-500">Sugerimos utilizar até 160 caracteres.</div>
              </div>
              
              <div className="space-y-2 pt-4">
                <Label className="flex items-center gap-2 font-bold">URL canônica (opcional) <Info className="h-4 w-4 text-slate-400" /></Label>
                <Input placeholder="link-da-pagina" className="bg-white h-12" />
                <div className="text-sm text-slate-500">Endereço principal para indexação quando há o mesmo produto cadastrado várias vezes.</div>
              </div>

              <div className="mt-8 border-t pt-8">
                <Label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 block">Visualização</Label>
                <div className="border border-dashed border-slate-300 p-6 rounded-lg bg-white">
                  <div className="text-xl text-emerald-800 font-medium mb-1 cursor-pointer hover:underline">{product.nome || "Título da página"}</div>
                  <div className="text-sm text-green-700 font-medium mb-2">https://prototipo-associadas.vercel.app/p/<span className="font-bold text-slate-600">{(formData as any)?.url || 'link-da-pagina'}</span>?shared=true</div>
                  <div className="text-slate-600 text-sm">Descrição da página que aparecerá nos resultados do Google para atrair seus clientes.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom padding for scrolling comfort */}
          <div className="h-12"></div>

        </div>
    </>
  );

  const syncModal = (
    <Dialog open={saveStep !== "idle"} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md flex flex-col items-center justify-center p-8 text-center space-y-6 [&>button]:hidden">
        {saveStep === "saving" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl text-slate-800">Produto salvo com sucesso!</DialogTitle>
          </>
        )}
        {saveStep === "syncing" && (
          <>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
            <DialogTitle className="text-xl text-slate-800">Sincronizando com o E-commerce</DialogTitle>
            <p className="text-slate-500">Aguarde alguns segundos...</p>
          </>
        )}
        {saveStep === "done" && (
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <RefreshCw className="w-8 h-8" />
            </div>
            <DialogTitle className="text-xl text-slate-800">Sincronizado com sucesso!</DialogTitle>
            <p className="text-slate-500">O produto já está espelhado no seu E-commerce.</p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );

  if (asPage) {
    return (
      <div className="flex flex-col w-full h-full bg-slate-100 -m-8" style={{ width: 'calc(100% + 4rem)' }}>
        {content}
        {syncModal}
      </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-[95vw] w-[1200px] h-[95vh] p-0 overflow-hidden flex flex-col bg-slate-50">
          <DialogTitle className="sr-only">Editor de Produto</DialogTitle>
          {content}
        </DialogContent>
      </Dialog>
      {syncModal}
    </>
  );
}
