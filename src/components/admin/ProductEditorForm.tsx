// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumericInput } from "@/components/ui/numeric-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Produto, Categoria } from "@/types";
import { catalog } from "@/services/catalog";
import { ImagePlus, Package, Trash2, Search, PlusCircle, Link as LinkIcon, Info, Star, CheckCircle2, RefreshCw, Video, Youtube, ShoppingBag, Check, ChevronsUpDown, Upload, X, Loader2 } from "lucide-react";
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
import { useSelos } from "@/stores/selos";
import { useMarcasStore } from "@/stores/marcas";
import { useVariacoesStore } from "@/stores/variacoes";
import { PriceDiscountInput } from "@/components/ui/PriceDiscountInput";
import { Spinner } from "@/components/ui/spinner";
import { productImage } from "@/lib/format";

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
  const allSelos = useSelos(s => s.selos);
  const isGlobalAdmin = currentUser?.proprietario || grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total === true;
  const currentLoja = lojaId ? pharmacies.find(l => l.id === lojaId) : null;
  const canOfferServices = (isGlobalAdmin && !lojaId) ? true : currentLoja?.offersServices !== false;
  const { vitrines, customProducts } = useAdminProducts();
  const { filtros } = useAdminFiltros();
  const { marcas } = useMarcasStore();
  const { variacoes } = useVariacoesStore();
  const [comboOpen, setComboOpen] = useState(false);
  const [draggedImgIdx, setDraggedImgIdx] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const currentImagens = (formData?.imagens || []) as any[];
    if (currentImagens.length >= 5) {
      toast?.error("Limite máximo de 5 imagens atingido.");
      return;
    }

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
          setFormData(prev => {
            if (!prev) return prev;
            const newImagens = [...(prev.imagens || []), { caminhoImagem: webpDataUrl }];
            return { ...prev, imagens: newImagens, foto: newImagens[0]?.caminhoImagem || prev.foto };
          });
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (index: number) => {
    setFormData(prev => {
      if (!prev) return prev;
      const newImagens = [...(prev.imagens || [])];
      newImagens.splice(index, 1);
      const nextFirst = newImagens[0];
      return { ...prev, imagens: newImagens, foto: nextFirst ? (nextFirst.caminhoImagem || nextFirst) : "" };
    });
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedImgIdx(index);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedImgIdx === null || draggedImgIdx === dropIndex) return;

    setFormData(prev => {
      if (!prev) return prev;
      const newImagens = [...(prev.imagens || [])];
      const draggedItem = newImagens[draggedImgIdx];
      newImagens.splice(draggedImgIdx, 1);
      newImagens.splice(dropIndex, 0, draggedItem);
      const nextFirst = newImagens[0];
      return { ...prev, imagens: newImagens, foto: nextFirst ? (nextFirst.caminhoImagem || nextFirst) : "" };
    });
    setDraggedImgIdx(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  useEffect(() => {
    if (product) {
      let initialImagens = Array.isArray(product.imagens) ? [...product.imagens] : [];
      if (initialImagens.length === 0 && product.foto) {
        initialImagens = [{ caminhoImagem: product.foto }];
      }

      let initialTipoProduto = product.tipoProduto || "";
      if ((product.selosIds || []).includes("servico") || product.selo === "servico") {
        initialTipoProduto = "servico";
      }

      setFormData({ 
        ...product, 
        imagens: initialImagens,
        categoriasAdicionais: product.categoriasAdicionais || [],
        ativo: product.ativo ?? true,
        visivel: product.visivel ?? true,
        destaque: product.destaque ?? false,
        aVenda: product.aVenda ?? true,
        tipoProduto: initialTipoProduto,
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

  useEffect(() => {
    if (categorias.length > 0 && product && formData) {
      const catIds: string[] = [];
      const subIds: string[] = [];
      (product.categoriasAdicionais || []).forEach(id => {
         const cat = categorias.find(c => String(c.id) === String(id));
         if (cat) {
            if (cat.parentId) subIds.push(id);
            else catIds.push(id);
         }
      });
      
      const currentCatIds = formData.categoriasIds || [];
      const currentSubIds = formData.subcategoriasIds || [];
      if (JSON.stringify(currentCatIds) !== JSON.stringify(catIds) || JSON.stringify(currentSubIds) !== JSON.stringify(subIds)) {
        setFormData(prev => ({ ...prev!, categoriasIds: catIds, subcategoriasIds: subIds }));
      }
    }
  }, [categorias, product]);

  const handleSaveClick = async () => {
    if (!formData?.nome?.trim()) {
      toast.error("O campo Nome do Produto é obrigatório.");
      return;
    }
    // Para serviços, EAN não é obrigatório — gera um código automático se vazio
    if (formData?.tipoProduto === "servico") {
      if (!formData?.ean?.trim()) {
        setFormData(prev => prev ? { ...prev, ean: `SRV-${Date.now()}` } : prev);
        // Atualiza o formData local para o restante do save
        formData.ean = `SRV-${Date.now()}`;
      }
    } else if (!formData?.ean?.trim()) {
      toast.error("O campo EAN / Código de Barras é obrigatório.");
      return;
    }

    let finalFormData = { ...formData };
    
    // Combina as categorias e subcategorias de volta no campo categoriasAdicionais antes de salvar
    finalFormData.categoriasAdicionais = [
      ...(finalFormData.categoriasIds || []),
      ...(finalFormData.subcategoriasIds || [])
    ];
    
    // Se preencher apenas o "DE", considera-o como o "POR" (preço de venda real)
    if (finalFormData.precoDe > 0 && (!finalFormData.precoPor || finalFormData.precoPor === 0)) {
      finalFormData.precoPor = finalFormData.precoDe;
      finalFormData.precoDe = 0;
    }
    
    // Limpeza de arrays vazios devido ao trailing comma antes de salvar
    if (finalFormData.eansSecundarios) {
      finalFormData.eansSecundarios = finalFormData.eansSecundarios.filter(Boolean);
    }
    if (finalFormData.internalTags) {
      finalFormData.internalTags = finalFormData.internalTags.filter(Boolean);
    }

    const lancamentoSelo = allSelos.find(s => s.nome.toLowerCase() === "lançamento" || s.nome.toLowerCase() === "lancamento");
    
    if (lancamentoSelo) {
      let updatedSelosIds = [...(finalFormData.selosIds || [])];
      if (finalFormData.lancamento) {
        if (!updatedSelosIds.includes(lancamentoSelo.id)) {
          updatedSelosIds.push(lancamentoSelo.id);
        }
      } else {
        updatedSelosIds = updatedSelosIds.filter(id => id !== lancamentoSelo.id);
      }
      finalFormData.selosIds = updatedSelosIds;
    }

    const servicoSelo = allSelos.find(s => s.id === "servico");
    if (servicoSelo) {
      let updatedSelosIds = [...(finalFormData.selosIds || [])];
      if (finalFormData.tipoProduto === "servico") {
        if (!updatedSelosIds.includes(servicoSelo.id)) {
          updatedSelosIds.push(servicoSelo.id);
        }
      } else {
        updatedSelosIds = updatedSelosIds.filter(id => id !== servicoSelo.id);
      }
      finalFormData.selosIds = updatedSelosIds;
    }

    setSaveStep("saving");
    
    try {
      await onSave(finalFormData);
      setSaveStep("done");
      setTimeout(() => {
        setSaveStep("idle");
      }, 1500);
    } catch (error: any) {
      setSaveStep("idle");
      toast.error("Erro ao salvar produto. Verifique os dados e tente novamente.");
      console.error("Erro no onSave:", error);
    }
  };

  if (!product || !formData) return null;

  const isMedicamento = categorias.find(c => String(c.id) === String(formData.categoriaId))?.slug === 'medicamentos' || 
                        categorias.find(c => String(c.id) === String(formData.categoriaId))?.nome?.toLowerCase() === 'medicamentos';

  const isServico = formData.tipoProduto === "servico";

  // ---- Formulário simplificado para SERVIÇOS ----
  const serviceContent = (
    <>
      {/* Header Fixo */}
      <div className="flex items-center justify-between px-8 py-4 bg-white border-b sticky -top-4 md:-top-8 z-20 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-bold px-2 py-1 rounded-full">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="M9 12l2 2 4-4"/></svg>
              Serviço
            </span>
            <h2 className="text-xl font-bold text-slate-800">{formData.nome || "Novo Serviço"}</h2>
          </div>
          <div className="text-sm text-slate-500 mt-1">Cadastro simplificado de serviço farmacêutico</div>
        </div>
        <div className="flex items-center gap-3">
          {headerActions}
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSaveClick} disabled={saveStep !== "idle"} className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-8">
            Salvar Serviço
          </Button>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 max-w-3xl mx-auto w-full">

        {/* Status */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 pb-3 border-b">Status do Serviço</h3>
          <div className="flex items-center gap-6">
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100 flex-1">
              <Switch disabled={!isGlobalAdmin}
                id="ativo-srv"
                checked={formData.ativo}
                onCheckedChange={checked => setFormData({...formData, ativo: checked})}
              />
              <Label htmlFor="ativo-srv" className="font-medium cursor-pointer">Serviço Ativo</Label>
            </div>
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100 flex-1">
              <Switch disabled={!isGlobalAdmin}
                id="visivel-srv"
                checked={formData.visivel ?? true}
                onCheckedChange={checked => setFormData({...formData, visivel: checked})}
              />
              <Label htmlFor="visivel-srv" className="font-medium cursor-pointer">Visível na Loja</Label>
            </div>
          </div>
        </div>

        {/* Informações do Serviço */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-800 pb-3 border-b">Informações do Serviço</h3>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Nome do Serviço *</Label>
            <Input
              disabled={!isGlobalAdmin}
              maxLength={120}
              value={formData.nome || ""}
              onChange={e => setFormData({...formData, nome: e.target.value})}
              className="bg-white text-lg h-12"
              placeholder="Ex: Aferição de Pressão Arterial, Aplicação de Injeção..."
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Descrição do Serviço</Label>
            <Textarea
              disabled={!isGlobalAdmin}
              value={formData.descricao || ""}
              onChange={e => setFormData({...formData, descricao: e.target.value})}
              className="bg-white min-h-[120px]"
              placeholder="Descreva o serviço: o que é feito, benefícios, duração estimada, como funciona..."
            />
          </div>

          <div className="space-y-2">
            <Label className="font-bold text-xs uppercase text-slate-500">Como se Preparar / Entre em Contato</Label>
            <Textarea
              disabled={!isGlobalAdmin}
              value={(formData as any).instrucaoPreparacao || ""}
              onChange={e => setFormData({...formData, instrucaoPreparacao: e.target.value} as any)}
              className="bg-white min-h-[100px]"
              placeholder="Entre em contato com a farmácia para saber como se preparar para esse serviço. Ex: Jejum de 8 horas necessário, trazer documento com foto..."
            />
            <p className="text-xs text-slate-400">Este texto será exibido na página do serviço para orientar o cliente.</p>
          </div>

          <div className="space-y-3">
            <Label className="font-bold text-xs uppercase text-slate-500">Exige Prescrição Médica?</Label>
            <div className="flex gap-4">
              {[
                { value: "nao", label: "Não exige prescrição" },
                { value: "sim", label: "Sim, exige prescrição" },
                { value: "recomendado", label: "Recomendado ter prescrição" },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFormData({...formData, prescricaoServico: opt.value} as any)}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                    ((formData as any).prescricaoServico || "nao") === opt.value
                      ? "border-purple-600 bg-purple-50 text-purple-700"
                      : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Imagem */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-lg text-slate-800 pb-3 border-b">Imagem do Serviço</h3>
          <div className="flex flex-wrap gap-4">
            {((formData.imagens || []) as any[]).filter((i: any) => i !== '/placeholder.svg').map((img: any, idx: number) => (
              <div key={idx} className="w-32 h-32 border border-slate-200 rounded-lg relative overflow-hidden group">
                <img src={img.caminhoImagem || img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                <button
                  onClick={() => handleRemoveImage(idx)}
                  className="absolute top-1 right-1 bg-white hover:bg-red-50 text-red-500 rounded-md p-1.5 shadow-sm transition-colors z-10"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {isGlobalAdmin && ((formData.imagens || []) as any[]).length < 3 && (
              <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-purple-600 hover:border-purple-600 hover:bg-purple-50 cursor-pointer transition-colors relative">
                <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                <svg className="h-6 w-6 mb-2" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                <span className="text-xs font-medium text-center px-2">Upload Foto</span>
              </div>
            )}
          </div>
        </div>

        {/* Preço */}
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
          <h3 className="font-bold text-lg text-slate-800 pb-3 border-b">Precificação</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Preço (De) — R$</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <NumericInput
                  disabled={!isGlobalAdmin}
                  value={formData.precoDe}
                  onChange={val => setFormData({...formData, precoDe: val || 0})}
                  className="bg-white pl-9 font-bold text-slate-700"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">Preço (Por) — R$</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                <NumericInput
                  disabled={!isGlobalAdmin}
                  value={formData.precoPor}
                  onChange={val => setFormData({...formData, precoPor: val || 0})}
                  className="bg-white pl-9 font-bold text-purple-700"
                  placeholder="0.00"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {saveStep !== "idle" && (
        <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-slate-200 animate-in fade-in zoom-in duration-200">
            {saveStep === "done" ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-purple-500 mb-4 animate-in zoom-in" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Salvo com sucesso!</h3>
                <p className="text-slate-500 font-medium">O serviço foi cadastrado.</p>
              </>
            ) : (
              <>
                <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Aguarde um momento</h3>
                <p className="text-slate-500 font-medium">Salvando serviço na rede...</p>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );

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
              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
                <Switch disabled={!isGlobalAdmin} 
                  id="lancamento" 
                  checked={formData.lancamento || false} 
                  onCheckedChange={checked => setFormData({...formData, lancamento: checked})}
                />
                <Label htmlFor="lancamento" className="font-medium cursor-pointer">Selo de Lançamento</Label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Natureza do Produto</Label>
                <Select disabled={!isGlobalAdmin} value={formData.tipoProduto || ""} onValueChange={val => setFormData({...formData, tipoProduto: val})}>
                  <SelectTrigger className="bg-white">
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fisico">Produto Físico</SelectItem>
                    {canOfferServices && (
                      <SelectItem value="servico">Serviço</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">ID / SKU / Código Interno</Label>
                <Input disabled={!isGlobalAdmin} value={formData.codigoInterno || formData.sku || ""} onChange={e => setFormData({...formData, codigoInterno: e.target.value, sku: e.target.value})} className="bg-white" />
              </div>
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">EAN / Código de Barras*</Label>
                <Input disabled={!isGlobalAdmin} value={formData.ean || ""} onChange={e => setFormData({...formData, ean: e.target.value})} className="bg-white" />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label className="font-bold text-xs uppercase text-slate-500">EANs Secundários (separados por vírgula)</Label>
              <Input disabled={!isGlobalAdmin} value={(formData.eansSecundarios || []).join(", ")} onChange={e => setFormData({...formData, eansSecundarios: e.target.value.split(',').map((s: string) => s.trim())})} className="bg-white" placeholder="Ex: 7891234567890, 7890987654321" />
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

            {/* Categorias e Subcategorias Adicionais Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
              {/* Categorias Adicionais */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Label className="font-bold text-xs uppercase text-slate-500">Categoria Adicional</Label>
                  <span className="text-xs text-slate-400">Adicione categorias extras. (Opcional)</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.categoriasIds || []).map(catId => {
                    const cat = categorias.find((c: any) => String(c.id) === String(catId));
                    if (!cat) return null;
                    return (
                      <Badge key={`cat-${catId}`} variant="secondary" className="flex items-center gap-1 py-1">
                        {cat.nome}
                        {!isGlobalAdmin ? null : (
                          <button 
                            onClick={() => setFormData({...formData, categoriasIds: (formData.categoriasIds || []).filter(id => id !== catId)})}
                            className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                  {((formData.categoriasIds || []).length === 0) && (
                    <span className="text-sm text-slate-400 italic">Nenhuma categoria selecionada.</span>
                  )}
                </div>

                  <div className="flex items-center gap-2 w-full">
                    <Select 
                      onValueChange={v => {
                        if (v === "none" || !v) return;
                        if (!(formData.categoriasIds || []).includes(v)) {
                          setFormData({...formData, categoriasIds: [...(formData.categoriasIds || []), v]});
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecionar categoria..." /></SelectTrigger>
                      <SelectContent>
                        {categorias.filter((c: any) => !c.parentId && String(c.id) !== String(formData.categoriaId) && !(formData.categoriasIds || []).includes(String(c.id))).map((c: any) => (
                          <SelectItem key={`add-${c.id}`} value={String(c.id)}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
              </div>

              {/* Subcategorias Adicionais */}
              <div className="space-y-4">
                <div className="flex flex-col gap-1">
                  <Label className="font-bold text-xs uppercase text-slate-500">Subcategoria Adicional</Label>
                  <span className="text-xs text-slate-400">Adicione subcategorias extras. (Opcional)</span>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  {(formData.subcategoriasIds || []).map(subId => {
                    const sub = categorias.find((c: any) => String(c.id) === String(subId));
                    if (!sub) return null;
                    const parent = categorias.find((c: any) => String(c.id) === String(sub.parentId));
                    return (
                      <Badge key={`sub-${subId}`} variant="secondary" className="flex items-center gap-1 py-1">
                        {parent ? `${parent.nome} > ` : ""}{sub.nome}
                        {!isGlobalAdmin ? null : (
                          <button 
                            onClick={() => setFormData({...formData, subcategoriasIds: (formData.subcategoriasIds || []).filter(id => id !== subId)})}
                            className="ml-1 hover:bg-slate-200 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </Badge>
                    );
                  })}
                  {((formData.subcategoriasIds || []).length === 0) && (
                    <span className="text-sm text-slate-400 italic">Nenhuma subcategoria selecionada.</span>
                  )}
                </div>

                  <div className="flex items-center gap-2 w-full">
                    <Select 
                      onValueChange={v => {
                        if (v === "none" || !v) return;
                        if (!(formData.subcategoriasIds || []).includes(v)) {
                          setFormData({...formData, subcategoriasIds: [...(formData.subcategoriasIds || []), v]});
                        }
                      }}
                    >
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecionar subcategoria..." /></SelectTrigger>
                      <SelectContent>
                        {categorias.filter((c: any) => c.parentId && String(c.id) !== String(formData.subcategoriaId) && !(formData.subcategoriasIds || []).includes(String(c.id))).map((c: any) => {
                          const parent = categorias.find((p: any) => String(p.id) === String(c.parentId));
                          return (
                            <SelectItem key={`add-sub-${c.id}`} value={String(c.id)}>
                              {parent ? `${parent.nome} > ` : ""}{c.nome}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
              </div>
            </div>
          </div>

          {/* Card: Marca e Ativos */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Marca e Dcb</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Marca</Label>
                  <Input disabled={!isGlobalAdmin} value={formData.marca || ""} onChange={e => setFormData({...formData, marca: e.target.value})} className="bg-white" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Classe Terapêutica</Label>
                  <Input value={formData.classeTerapeutica || ""} onChange={e => setFormData({...formData, classeTerapeutica: e.target.value})} className="bg-white" placeholder="Ex: Analgésico, Antitérmico" />
                </div>
              </div>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Princípios Ativos</Label>
                  <div className="space-y-2">
                    {(formData.principiosAtivos && Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : []).map((p: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <Input 
                          placeholder="Nome" 
                          value={p.nome || (typeof p === "string" ? p : "")} 
                          onChange={e => {
                            const newArr = [...(Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : [])];
                            if (typeof newArr[idx] === "string") newArr[idx] = { nome: e.target.value };
                            else newArr[idx] = { ...newArr[idx], nome: e.target.value };
                            setFormData({...formData, principiosAtivos: newArr});
                          }} 
                        />
                        <Input 
                          placeholder="Concentração" 
                          className="w-32"
                          value={p.concentracao || ""} 
                          onChange={e => {
                            const newArr = [...(Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : [])];
                            if (typeof newArr[idx] === "string") newArr[idx] = { nome: newArr[idx], concentracao: e.target.value };
                            else newArr[idx] = { ...newArr[idx], concentracao: e.target.value };
                            setFormData({...formData, principiosAtivos: newArr});
                          }} 
                        />
                        <Input 
                          placeholder="Unid." 
                          className="w-20"
                          value={p.unidadeMedida || ""} 
                          onChange={e => {
                            const newArr = [...(Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : [])];
                            if (typeof newArr[idx] === "string") newArr[idx] = { nome: newArr[idx], unidadeMedida: e.target.value };
                            else newArr[idx] = { ...newArr[idx], unidadeMedida: e.target.value };
                            setFormData({...formData, principiosAtivos: newArr});
                          }} 
                        />

                        <Button variant="ghost" size="icon" onClick={() => {
                          const newArr = [...(Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : [])];
                          newArr.splice(idx, 1);
                          setFormData({...formData, principiosAtivos: newArr});
                        }}>
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={() => {
                      const newArr = [...(Array.isArray(formData.principiosAtivos) ? formData.principiosAtivos : [])];
                      newArr.push({ nome: "", concentracao: "", unidadeMedida: "" });
                      setFormData({...formData, principiosAtivos: newArr});
                    }}>
                      <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Princípio Ativo
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Novos Campos (Características, Pesos e Embalagem) */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">
              Alertas e Características
            </h3>
            
            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Alerta Regulatório (Texto)</Label>
                <Textarea value={formData.alertaTexto || (isMedicamento ? '"AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."' : "")} onChange={e => setFormData({...formData, alertaTexto: e.target.value})} className="bg-white" placeholder="Ex: Ao persistirem os sintomas, o médico deverá ser consultado." />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="font-bold text-xs uppercase text-slate-500">Características Adicionais</Label>
                  <Button variant="outline" size="sm" onClick={() => {
                    const newArr = [...(Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [])];
                    newArr.push({ titulo: "", descricao: "" });
                    setFormData({...formData, caracteristicas: newArr});
                  }}>
                    <PlusCircle className="w-4 h-4 mr-2" /> Adicionar Característica
                  </Button>
                </div>
                
                <div className="space-y-3 mt-4">
                  {Array.isArray(formData.caracteristicas) && formData.caracteristicas.map((c, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input 
                        placeholder="Título (ex: Cor)" 
                        className="w-1/3 bg-white"
                        value={c.titulo || ""} 
                        onChange={e => {
                          const newArr = [...(Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [])];
                          newArr[idx] = { ...newArr[idx], titulo: e.target.value };
                          setFormData({...formData, caracteristicas: newArr});
                        }} 
                      />
                      <Input 
                        placeholder="Descrição (ex: Branco)" 
                        className="flex-1 bg-white"
                        value={c.descricao || ""} 
                        onChange={e => {
                          const newArr = [...(Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [])];
                          newArr[idx] = { ...newArr[idx], descricao: e.target.value };
                          setFormData({...formData, caracteristicas: newArr});
                        }} 
                      />
                      <Button variant="ghost" size="icon" onClick={() => {
                        const newArr = [...(Array.isArray(formData.caracteristicas) ? formData.caracteristicas : [])];
                        newArr.splice(idx, 1);
                        setFormData({...formData, caracteristicas: newArr});
                      }}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  ))}
                  {(!formData.caracteristicas || formData.caracteristicas.length === 0) && (
                    <p className="text-sm text-slate-400 italic">Nenhuma característica adicionada.</p>
                  )}
                </div>
              </div>
            </div>


            
            <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-lg border border-slate-100">
              <Switch 
                id="alertaRegulatorio" 
                checked={formData.alertaRegulatorio} 
                onCheckedChange={checked => setFormData({...formData, alertaRegulatorio: checked})}
              />
              <Label htmlFor="alertaRegulatorio" className="font-medium cursor-pointer">Requer Exibição do Alerta Regulatório</Label>
            </div>
          </div>

          {/* Card: Classificação Farmacêutica */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">
              Registro Anvisa, Retenção, Tarja e Tipo de Receita
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
                  
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Tipo de Receita</Label>
                  <Input disabled={!isGlobalAdmin} value={formData.tipoReceita || ""} onChange={e => setFormData({...formData, tipoReceita: e.target.value})} className="bg-white" placeholder="Ex: Branca, Azul, Amarela" />
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
                {((formData.imagens || []) as any[]).filter(i => i !== '/placeholder.svg').map((img: any, idx: number) => (
                  <div 
                    key={idx} 
                    className="w-32 h-32 border border-slate-200 rounded-lg relative overflow-hidden group cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, idx)}
                  >
                    <img src={img.caminhoImagem || img} alt={`Imagem ${idx + 1}`} className="w-full h-full object-cover" />
                    <button 
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-white hover:bg-red-50 text-red-500 rounded-md p-1.5 shadow-sm transition-colors z-10"
                      title="Remover imagem"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {idx === 0 && (
                      <div className="absolute bottom-0 left-0 right-0 bg-emerald-600/90 text-white text-[10px] text-center py-1 font-bold z-10 pointer-events-none">
                        Capa
                      </div>
                    )}
                  </div>
                ))}
                
                {((formData.imagens || []) as any[]).filter(i => i !== '/placeholder.svg').length === 0 && (
                  <div className="w-32 h-32 border border-slate-200 rounded-lg relative overflow-hidden group opacity-80" title="Imagem gerada automaticamente. Faça upload de uma imagem para substituir.">
                    <img src={productImage(formData)} alt="Imagem Padrão" className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity text-center px-2">
                      Imagem Automática (Mockup)
                    </div>
                  </div>
                )}
                
                {isGlobalAdmin && ((formData.imagens || []) as any[]).length < 5 && (
                  <div className="w-32 h-32 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-600 hover:bg-emerald-50 cursor-pointer transition-colors relative overflow-hidden group">
                    <input type="file" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" accept="image/*" onChange={handleImageUpload} />
                    <Upload className="h-6 w-6 mb-2" />
                    <span className="text-xs font-medium text-center px-2">Upload Imagem</span>
                    <span className="text-[10px] text-slate-400 mt-1">{5 - ((formData.imagens || []) as any[]).length} restantes</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          
          {/* Precificação da Loja (Associado/Global) */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">
              {isGlobalAdmin ? "Precificação" : "Minha Precificação"}
            </h3>
            
            {!isGlobalAdmin && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Preço (de) sugerido</Label>
                  <Input 
                    disabled 
                    value={customProducts.find(p => p.id === formData.id)?.precoDe?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"} 
                    className="bg-slate-50 text-slate-500 font-medium" 
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-slate-500">Preço (por) sugerido</Label>
                  <Input 
                    disabled 
                    value={customProducts.find(p => p.id === formData.id)?.precoPor?.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) || "R$ 0,00"} 
                    className="bg-slate-50 text-slate-500 font-medium" 
                  />
                  <div className="text-xs text-slate-400 font-medium">Preço sugerido pela sede</div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">{isGlobalAdmin ? "Preço (de) (R$)" : "Meu Preço (de) (R$)"}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                  <NumericInput 
                    disabled={!isGlobalAdmin && isMedicamento}
                    value={formData.precoDe} 
                    onChange={val => setFormData({...formData, precoDe: val || 0})} 
                    className="bg-white pl-9 font-bold text-slate-700" 
                    placeholder="0.00" 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">{isGlobalAdmin ? "Preço (por) (R$)" : "Meu Preço (por) (R$)"}</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 font-medium">R$</span>
                  <NumericInput 
                    disabled={!isGlobalAdmin && isMedicamento}
                    value={formData.precoPor} 
                    onChange={val => setFormData({...formData, precoPor: val || 0})} 
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
            <h3 className="font-bold text-2xl text-slate-800 pb-4 border-b">Tributário e Relevância</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">NCM</Label>
                <Input disabled={!isGlobalAdmin} value={formData.ncm || ""} onChange={e => setFormData({...formData, ncm: e.target.value})} className="bg-white" placeholder="Nomenclatura Comum do Mercosul" />
              </div>

              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-slate-500">Nível de Relevância (Prioridade)</Label>
                <NumericInput disabled={!isGlobalAdmin} 
                  allowDecimals={false}
                  value={formData.nivelRelevancia} 
                  onChange={val => setFormData({...formData, nivelRelevancia: val || 0})} 
                  className="bg-white" 
                />
              </div>
            </div>
          </div>

          {/* Card: Google / SEO */}
          <div className="bg-white p-8 rounded-lg border border-slate-200 shadow-sm space-y-8">
            <div className="pb-4 border-b">
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
                  <Label className="font-bold text-xs uppercase text-slate-500">Descrição da Página (SEO / Meta Description)</Label>
                  <Textarea disabled={!isGlobalAdmin} 
                    value={formData.metaDescription || formData.seoDescricao || ""} 
                    onChange={e => setFormData({...formData, metaDescription: e.target.value})} 
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
                <div className="space-y-2 border-t pt-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-xs uppercase text-slate-500">Tags de Busca Internas</Label>
                    <Textarea disabled={!isGlobalAdmin} 
                      value={(formData.internalTags || []).join(", ")} 
                      onChange={e => setFormData({...formData, internalTags: e.target.value.split(',').map(s => s.trim())})} 
                      className="bg-white min-h-[80px]" 
                      placeholder="Ex: gripe, resfriado, febre, dor no corpo (separados por vírgula)" 
                    />
                    <span className="text-xs text-slate-400">Palavras-chave internas que facilitam a busca dentro do site. Não aparecem no Google.</span>
                  </div>
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
                    {formData.metaDescription || formData.seoDescricao || "Sua descrição SEO aparecerá aqui. Escreva um texto atraente para incentivar as pessoas a clicarem e conhecerem o seu produto."}
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {saveStep !== "idle" && (
          <div className="absolute inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center">
            <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center max-w-sm w-full text-center border border-slate-200 animate-in fade-in zoom-in duration-200">
              {saveStep === "done" ? (
                <>
                  <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4 animate-in zoom-in" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Salvo com sucesso!</h3>
                  <p className="text-slate-500 font-medium">As alterações foram registradas.</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mb-4" />
                  <h3 className="text-xl font-bold text-slate-800 mb-2">Aguarde um momento</h3>
                  <p className="text-slate-500 font-medium">Estamos salvando seu produto na rede...</p>
                </>
              )}
            </div>
          </div>
        )}
      </>
  );

  if (asPage) {
    return (
        <div className="flex flex-col bg-slate-100 -mt-4 md:-mt-8 -mx-4 md:-mx-8 min-h-[calc(100vh-4rem)] relative">
          {isServico ? serviceContent : content}
        </div>
    );
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className={`max-w-[95vw] ${isServico ? 'w-[900px]' : 'w-[1200px]'} h-[95vh] p-0 overflow-hidden flex flex-col bg-slate-50 relative`}>
          <DialogTitle className="sr-only">{isServico ? "Editor de Serviço" : "Editor de Produto"}</DialogTitle>
          {isServico ? serviceContent : content}
        </DialogContent>
      </Dialog>
    </>
  );
}

