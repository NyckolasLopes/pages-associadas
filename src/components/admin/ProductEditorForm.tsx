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
import { ImagePlus, Package, Trash2, Search, PlusCircle, Link as LinkIcon, Info, Star, CheckCircle2, Loader2, RefreshCw, Video, Youtube, ShoppingBag, Check, ChevronsUpDown, Upload } from "lucide-react";
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
  headerActions?: React.ReactNode;
}

export function ProductEditorForm({ open, onOpenChange, product, onSave, asPage, lojaId, headerActions }: ProductEditorFormProps) {
  const [formData, setFormData] = useState<Produto | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [saveStep, setSaveStep] = useState<"idle" | "saving" | "syncing" | "done">("idle");
  const { pharmacies, currentUser, grupos } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total === true;
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
        <div className="flex items-center justify-between px-8 py-4 bg-white border-b sticky -top-4 md:-top-8 z-20 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">
                {product.id.startsWith("prod-") ? "Novo Produto" : `Editar Produto: ${product.nome}`}
              </h2>
            </div>
            <div className="text-sm text-slate-500 mt-1">Código: {product.codigoInterno || product.id} • Cadastrado via {product.origem || "Sistema"}</div>
          </div>
          <div className="flex items-center gap-3">
            {headerActions}
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={handleSaveClick} disabled={saveStep !== "idle"} className="bg-emerald-800 hover:bg-emerald-900 text-white font-bold px-8">
              Salvar produto
            </Button>
          </div>
        </div>

        {/* Content com Scroll Linear */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-6xl mx-auto w-full">
          
          {/* Card: Informações Básicas */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Informações básicas</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Switch disabled={!isGlobalAdmin} 
                  id="ativo" 
                  checked={formData.ativo} 
                  onCheckedChange={checked => setFormData({...formData, ativo: checked})}
                />
                <Label htmlFor="ativo" className="font-medium cursor-pointer">Produto Ativo</Label>
              </div>
              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Switch disabled={!isGlobalAdmin} 
                  id="buscavel" 
                  checked={formData.buscavel} 
                  onCheckedChange={checked => setFormData({...formData, buscavel: checked})}
                />
                <Label htmlFor="buscavel" className="font-medium cursor-pointer">Buscável (Visível na busca)</Label>
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Tipo de Produto</Label>
                <Select disabled={!isGlobalAdmin} value={formData.tipoProduto || "fisico"} onValueChange={v => setFormData({...formData, tipoProduto: v})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">Produto Físico</SelectItem>
                    <SelectItem value="servico">Serviço</SelectItem>
                    <SelectItem value="digital">Produto Digital</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">ID / Código Interno*</Label>
                <Input disabled={!isGlobalAdmin} value={formData.id || ""} onChange={e => setFormData({...formData, id: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">EAN / Código de Barras*</Label>
                <Input disabled={!isGlobalAdmin} value={formData.ean || ""} onChange={e => setFormData({...formData, ean: e.target.value})} className="bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Descrição Comercial / Nome do Produto*</Label>
              <Input disabled={!isGlobalAdmin} maxLength={120} value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} className="bg-white text-lg h-12" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Descrição Longa</Label>
              <RichTextEditor disabled={!isGlobalAdmin} 
                value={formData.descricao || ""} 
                onChange={val => setFormData({...formData, descricao: val})}
                placeholder="Digite a descrição ou insira HTML aqui..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Categoria (com ID)</Label>
                <Select disabled={!isGlobalAdmin} value={formData.categoriaId || ""} onValueChange={v => setFormData({...formData, categoriaId: v, subcategoriaId: ""})}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a categoria" /></SelectTrigger>
                  <SelectContent>
                    {categorias.filter((c: any) => !c.parentId).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.nome} (ID: {c.id})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Subcategoria (com ID)</Label>
                <Select disabled={!isGlobalAdmin} value={formData.subcategoriaId || ""} onValueChange={v => setFormData({...formData, subcategoriaId: v})} disabled={!formData.categoriaId}>
                  <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a subcategoria" /></SelectTrigger>
                  <SelectContent>
                    {categorias.filter((c: any) => c.parentId === formData.categoriaId).length > 0 ? (
                      categorias.filter((c: any) => c.parentId === formData.categoriaId).map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>{c.nome} (ID: {c.id})</SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>Nenhuma subcategoria</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Card: Fabricante e Ativos */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Fabricante e Componentes</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Fabricante (Marca)</Label>
                <Input disabled={!isGlobalAdmin} value={formData.marca || formData.fabricante || ""} onChange={e => setFormData({...formData, marca: e.target.value, fabricante: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">DCB / Princípio Ativo</Label>
                <Input disabled={!isGlobalAdmin} 
                  value={(formData.principiosAtivosDetalhes || []).map((p:any) => p.nome).join(", ")} 
                  onChange={e => {
                     setFormData({...formData, principiosAtivosDetalhes: [{ nome: e.target.value, concentracao: "", unidadeMedida: "" }]})
                  }} 
                  className="bg-white" placeholder="Ex: Paracetamol" 
                />
              </div>
            </div>
          </div>

          {/* Card: Classificação Farmacêutica */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b flex items-center gap-2">
              <PlusCircle className="h-6 w-6 text-emerald-800" /> Registro e Restrições
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">MS / Registro ANVISA</Label>
                  <Input disabled={!isGlobalAdmin} value={formData.registroAnvisa || ""} onChange={e => setFormData({...formData, registroAnvisa: e.target.value})} className="bg-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Retém Receita?</Label>
                  <Select disabled={!isGlobalAdmin} value={formData.retemReceita ? "retem" : formData.retemReceita === false ? "nao_retem" : "nao_aplica"} onValueChange={v => {
                    if (v === "retem") setFormData({...formData, retemReceita: true});
                    else if (v === "nao_retem") setFormData({...formData, retemReceita: false});
                    else setFormData({...formData, retemReceita: false});
                  }}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="retem">SIM</SelectItem>
                      <SelectItem value="nao_retem">NÃO</SelectItem>
                      <SelectItem value="nao_aplica">Não se aplica</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Tarja</Label>
                  <Select disabled={!isGlobalAdmin} value={formData.tarja || "Sem Tarja"} onValueChange={v => setFormData({...formData, tarja: v})}>
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
              </div>
            </div>
          </div>
          
          {/* Card: Imagens */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center pb-4 border-b">
              <h3 className="font-bold text-2xl text-slate-800">Imagens do produto</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex flex-wrap gap-4">
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors relative overflow-hidden group">
                  <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" />
                  <Upload className="h-6 w-6 mb-2" />
                  <span className="text-xs font-medium text-center px-2">Upload Imagem</span>
                </div>
              </div>
            </div>
          </div>

          
          {/* Precificação da Loja (Associado/Global) */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">
              {isGlobalAdmin ? "Precificação Padrão da Rede" : "Minha Precificação"}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {!isGlobalAdmin && (
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Preço Base da Rede (R$)</Label>
                  <Input 
                    disabled 
                    value={customProducts.find(p => p.id === formData.id)?.precoPor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"} 
                    className="bg-slate-50 text-slate-500 font-medium" 
                  />
                  <div className="text-xs text-slate-400 font-medium">Preço sugerido pela sede</div>
                </div>
              )}
              
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">{isGlobalAdmin ? "Preço Base da Rede (R$)" : "Meu Preço (R$)"}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                  <Input 
                    disabled={!isGlobalAdmin && isMedicamento}
                    type="number" 
                    step="0.01" 
                    value={formData.precoPor || ""} 
                    onChange={e => setFormData({...formData, precoPor: parseFloat(e.target.value) || 0})} 
                    className="bg-white pl-9 font-bold text-emerald-700" 
                    placeholder="0.00" 
                  />
                </div>
                {!isGlobalAdmin && isMedicamento && (
                  <div className="mt-1 text-xs text-red-500 font-medium">Preço de medicamentos bloqueado para edição.</div>
                )}
                {!isGlobalAdmin && !isMedicamento && (
                  <div className="mt-1 text-xs font-bold">
                    {(() => {
                      const basePrice = customProducts.find(p => p.id === formData.id)?.precoPor || 0;
                      const myPrice = formData.precoPor || 0;
                      if (!basePrice || !myPrice) return null;
                      
                      const diff = myPrice - basePrice;
                      if (diff < 0) return <span className="text-emerald-600">Mais barato {Math.abs(diff).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>;
                      if (diff > 0) return <span className="text-red-600">Mais caro {Math.abs(diff).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</span>;
                      return <span className="text-slate-500">Igual ao preço base da rede</span>;
                    })()}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card: Detalhes e Precificação */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Detalhes e Precificação</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">NCM</Label>
                <Input disabled={!isGlobalAdmin} value={formData.ncm || ""} onChange={e => setFormData({...formData, ncm: e.target.value})} className="bg-white" placeholder="Nomenclatura Comum do Mercosul" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Preço de Comparação (De) - Opcional</Label>
                <Input disabled={!isGlobalAdmin} 
                  type="number" 
                  step="0.01" 
                  value={formData.precoDe || ""} 
                  onChange={e => setFormData({...formData, precoDe: parseFloat(e.target.value) || 0})} 
                  className="bg-white" 
                  placeholder="0.00" 
                />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Nível de Relevância (Prioridade)</Label>
                <Input disabled={!isGlobalAdmin} 
                  type="number" 
                  value={formData.nivelRelevancia || 0} 
                  onChange={e => setFormData({...formData, nivelRelevancia: parseInt(e.target.value) || 0})} 
                  className="bg-white" 
                />
              </div>
            </div>
          </div>

          {/* Card: Google / SEO */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <div className="flex items-center gap-2 pb-4 border-b">
              <Search className="h-6 w-6 text-blue-600" />
              <h3 className="font-bold text-2xl text-slate-800">Google / SEO / AEO / GEO</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label className="font-bold text-xs uppercase text-slate-500">Título da Página (SEO)</Label>
                    <span className="text-xs text-slate-400">{(formData.seoTitulo || "").length}/70</span>
                  </div>
                  <Input disabled={!isGlobalAdmin} 
                    maxLength={70}
                    value={formData.seoTitulo || ""} 
                    onChange={e => setFormData({...formData, seoTitulo: e.target.value})} 
                    className="bg-white" 
                    placeholder="Título otimizado para o Google" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Link da Página (Slug)</Label>
                  <Input disabled={!isGlobalAdmin} 
                    value={formData.url || ""} 
                    onChange={e => setFormData({...formData, url: e.target.value})} 
                    className="bg-white" 
                    placeholder="nome-do-produto" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Palavras-Chave Foco (GEO / AEO)</Label>
                  <Input disabled={!isGlobalAdmin} 
                    value={formData.termosPesquisa || ""} 
                    onChange={e => setFormData({...formData, termosPesquisa: e.target.value})} 
                    className="bg-white" 
                    placeholder="Ex: remedio, dor de cabeca (separados por vírgula)" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Descrição da Página (SEO)</Label>
                  <Textarea disabled={!isGlobalAdmin} 
                    value={formData.seoDescricao || ""} 
                    onChange={e => setFormData({...formData, seoDescricao: e.target.value})} 
                    className="bg-white min-h-[100px]" 
                    placeholder="Resumo do produto que vai aparecer abaixo do título no Google" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Texto Alternativo da Imagem (Alt SEO)</Label>
                  <Input disabled={!isGlobalAdmin} 
                    value={formData.imagemAlt || ""} 
                    onChange={e => setFormData({...formData, imagemAlt: e.target.value})} 
                    className="bg-white" 
                    placeholder="Descrição da imagem para leitores de tela e Google Imagens" 
                  />
                </div>
              </div>

              {/* Preview do Google */}
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Visualização de como vai ficar no Google</Label>
                <div className="bg-white p-4 border border-slate-200 rounded-lg shadow-sm max-w-full font-sans">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 bg-slate-100 rounded-full flex items-center justify-center">
                      <Search className="h-3 w-3 text-slate-500" />
                    </div>
                    <div>
                      <div className="text-[14px] text-[#202124] leading-tight">Sua Loja</div>
                      <div className="text-[12px] text-[#4d5156] leading-tight flex items-center gap-1">
                        <span>https://sualoja.com.br</span>
                        <span>›</span>
                        <span>{formData.url || "nome-do-produto"}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-[20px] text-[#1a0dab] hover:underline cursor-pointer leading-tight mb-1 truncate">
                    {formData.seoTitulo || formData.nome || "Título da Página"}
                  </div>
                  <div className="text-[14px] text-[#4d5156] leading-snug line-clamp-2">
                    {formData.seoDescricao || "Sua descrição SEO aparecerá aqui. Escreva um texto atraente para incentivar as pessoas a clicarem e conhecerem o seu produto."}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </>
  );

  if (asPage) {
    return (
        <div className="flex flex-col bg-slate-100 -mt-4 md:-mt-8 -mx-4 md:-mx-8 min-h-[calc(100vh-4rem)]">
          {content}
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
    </>
  );
}
