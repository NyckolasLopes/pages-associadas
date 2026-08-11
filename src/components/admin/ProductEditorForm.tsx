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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">ID / Código Interno*</Label>
                <Input value={formData.id || ""} onChange={e => setFormData({...formData, id: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">EAN / Código de Barras*</Label>
                <Input value={formData.ean || ""} onChange={e => setFormData({...formData, ean: e.target.value})} className="bg-white" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Descrição Comercial / Nome do Produto*</Label>
              <Input maxLength={120} value={formData.nome || ""} onChange={e => setFormData({...formData, nome: e.target.value})} className="bg-white text-lg h-12" />
            </div>

            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Descrição Longa</Label>
              <RichTextEditor 
                value={formData.descricao || ""} 
                onChange={val => setFormData({...formData, descricao: val})}
                placeholder="Digite a descrição ou insira HTML aqui..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Categoria (com ID)</Label>
                <Select value={formData.categoriaId || ""} onValueChange={v => setFormData({...formData, categoriaId: v, subcategoriaId: ""})}>
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
                <Select value={formData.subcategoriaId || ""} onValueChange={v => setFormData({...formData, subcategoriaId: v})} disabled={!formData.categoriaId}>
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
                <Input value={formData.marca || formData.fabricante || ""} onChange={e => setFormData({...formData, marca: e.target.value, fabricante: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">DCB / Princípio Ativo</Label>
                <Input 
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
                  <Input value={formData.registroAnvisa || ""} onChange={e => setFormData({...formData, registroAnvisa: e.target.value})} className="bg-white" />
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Retém Receita?</Label>
                  <Select value={formData.retemReceita ? "retem" : formData.retemReceita === false ? "nao_retem" : "nao_aplica"} onValueChange={v => {
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
