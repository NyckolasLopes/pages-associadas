import { 
  Bold, Italic, Underline, Strikethrough, 
  List, ListOrdered,
  AlignLeft, Link as LinkIcon, Image as ImageIcon, Code,
  HelpCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useAdminCategories } from "@/stores/categories";
import { useAdmin } from "@/stores/admin";
import { Pill, Sparkles, Leaf, Stethoscope, Baby, Flower2, ShoppingBag, HeartPulse, ShieldCheck, Eye, Smile, User, Scale, Activity, BriefcaseMedical, Coffee, Thermometer, Battery, Wind, Droplets, Dumbbell, Tag } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category?: any; // If provided, it's edit mode
}

export function CategoryFormModal({ open, onOpenChange, category }: CategoryFormModalProps) {
  const { categories, addOrUpdateCategory } = useAdminCategories();
  
  const [nome, setNome] = useState("");
  const [slug, setSlug] = useState("");
  const [descricaoHtml, setDescricaoHtml] = useState("");
  const [descricaoBreve, setDescricaoBreve] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] = useState("");
  const [parentId, setParentId] = useState<string | null>(null);
  const [ativa, setAtiva] = useState(true);
  const [destaque, setDestaque] = useState(false);
  const [icone, setIcone] = useState("");
  
  const { featuredCategories, toggleFeaturedCategory } = useAdmin();

  useEffect(() => {
    if (open) {
      if (category) {
        setNome(category.nome || "");
        setSlug(category.slug || "");
        setDescricaoHtml(category.descricaoHtml || "");
        setDescricaoBreve(category.descricaoBreve || "");
        setMetaTitle(category.metaTitle || "");
        setMetaDescription(category.metaDescription || "");
        setParentId(category.parentId || null);
        setAtiva(category.ativa !== false); // default true
        setDestaque(!!category.destaque);
      } else {
        setNome("");
        setSlug("");
        setDescricaoHtml("");
        setDescricaoBreve("");
        setMetaTitle("");
        setMetaDescription("");
        setParentId(null);
        setAtiva(true);
        setDestaque(false);
        setIcone("");
      }
    }
  }, [open, category]);
  
  const AVAILABLE_ICONS = [
    { id: "pill", icon: Pill, label: "Comprimido" },
    { id: "sparkles", icon: Sparkles, label: "Brilho / Beleza" },
    { id: "leaf", icon: Leaf, label: "Folha / Natural" },
    { id: "stethoscope", icon: Stethoscope, label: "Saúde / Médico" },
    { id: "baby", icon: Baby, label: "Bebê / Infantil" },
    { id: "flower2", icon: Flower2, label: "Mulher / Flor" },
    { id: "shopping-bag", icon: ShoppingBag, label: "Bolsa de Compras" },
    { id: "heart-pulse", icon: HeartPulse, label: "Coração" },
    { id: "shield-check", icon: ShieldCheck, label: "Proteção / Escudo" },
    { id: "eye", icon: Eye, label: "Olho" },
    { id: "smile", icon: Smile, label: "Sorriso / Dente" },
    { id: "user", icon: User, label: "Homem / Usuário" },
    { id: "scale", icon: Scale, label: "Balança / Peso" },
    { id: "activity", icon: Activity, label: "Atividade / Movimento" },
    { id: "briefcase-medical", icon: BriefcaseMedical, label: "Maleta Médica" },
    { id: "coffee", icon: Coffee, label: "Alimento / Bebida" },
    { id: "thermometer", icon: Thermometer, label: "Termômetro" },
    { id: "battery", icon: Battery, label: "Bateria / Energia" },
    { id: "wind", icon: Wind, label: "Vento / Ar" },
    { id: "droplets", icon: Droplets, label: "Gotas / Banho" },
    { id: "dumbbell", icon: Dumbbell, label: "Peso / Fitness" },
    { id: "tag", icon: Tag, label: "Etiqueta / Oferta" },
  ];

  const handleSave = () => {
    if (!nome.trim()) {
      toast.error("O nome da categoria é obrigatório");
      return;
    }
    
    const id = category?.id || Math.random().toString(36).substring(2, 9);

    addOrUpdateCategory({
      id,
      nome,
      slug: slug || nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''),
      parentId,
      descricaoHtml,
      descricaoBreve,
      metaTitle,
      metaDescription,
      ativa,
      destaque,
      icone
    });
    
    const isCurrentlyFeatured = featuredCategories.includes(id);
    if (destaque && !isCurrentlyFeatured) {
       toggleFeaturedCategory(id);
    } else if (!destaque && isCurrentlyFeatured) {
       toggleFeaturedCategory(id);
    }
    
    toast.success(category ? "Categoria atualizada com sucesso!" : "Categoria criada com sucesso!");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-[1000px] p-0 gap-0 overflow-hidden bg-slate-50 h-[90vh] flex flex-col">
        <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-white">
          <DialogTitle className="text-[22px] font-bold text-[#1a1a1a]">
            {category ? "Editar categoria" : "Nova categoria"}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 bg-[#fbfbfb]">
                <h3 className="text-lg font-medium text-slate-800">Informações principais</h3>
              </div>
              
              <div className="p-6 space-y-8">
                <div className="flex flex-wrap items-center gap-8 md:gap-12">
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700">Categoria ativa?</span>
                    <div className="flex items-center gap-3">
                      <Switch checked={ativa} onCheckedChange={setAtiva} className="data-[state=checked]:bg-emerald-500" />
                      <span className="text-sm text-slate-500">{ativa ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700">Categoria em destaque?</span>
                    <div className="flex items-center gap-3">
                      <Switch checked={destaque} onCheckedChange={setDestaque} className="data-[state=checked]:bg-[#5ab4d2]" />
                      <span className="text-sm text-slate-500">{destaque ? "Sim" : "Não"}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700">Produtos vinculados</span>
                    <span className="text-sm text-slate-900 font-medium pl-1">0</span>
                  </div>
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-bold text-slate-700">Produtos Removidos vinculados</span>
                    <span className="text-sm text-slate-900 font-medium pl-1">0</span>
                  </div>
                </div>

                <div className="space-y-2 max-w-[400px]">
                  <div className="flex items-center gap-1">
                    <Label className="text-sm font-medium text-slate-700">Categoria pai <span className="text-red-500">*</span></Label>
                    <HelpCircle className="h-3.5 w-3.5 text-slate-400" />
                  </div>
                  <Select value={parentId || "none"} onValueChange={(val) => setParentId(val === "none" ? null : val)}>
                    <SelectTrigger className="w-full h-10 border-slate-200 bg-white">
                      <SelectValue placeholder="[ Raiz ]" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">[ Raiz ]</SelectItem>
                      {categories.filter(c => c.id !== category?.id && !c.parentId).map(c => (
                        <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Nome da categoria <span className="text-red-500">*</span></Label>
                  <Input 
                    className="h-10 border-slate-200" 
                    value={nome} 
                    onChange={e => setNome(e.target.value)} 
                    placeholder="Ex: Bolsas Térmicas de Lazer"
                  />
                </div>
                
                <div className="space-y-2 max-w-[400px]">
                  <Label className="text-sm font-medium text-slate-700">Ícone no Menu Principal</Label>
                  <Select value={icone || "none"} onValueChange={(val) => setIcone(val === "none" ? "" : val)}>
                    <SelectTrigger className="w-full h-10 border-slate-200 bg-white">
                      <SelectValue placeholder="Selecione um ícone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Sem ícone</SelectItem>
                      {AVAILABLE_ICONS.map(ic => (
                        <SelectItem key={ic.id} value={ic.id}>
                          <div className="flex items-center gap-2">
                            <ic.icon className="h-4 w-4" />
                            <span>{ic.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Descrição Breve</Label>
                  <Input 
                    className="h-10 border-slate-200" 
                    placeholder="Uma linha de descrição para exibir na listagem ou topo da página"
                    value={descricaoBreve} 
                    onChange={e => setDescricaoBreve(e.target.value)} 
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-slate-700">Descrição</Label>
                  <div className="border border-slate-200 rounded-md overflow-hidden">
                    <div className="flex items-center gap-1 p-2 border-b border-slate-200 bg-slate-50 flex-wrap">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><Bold className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><Italic className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><Underline className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><Strikethrough className="h-4 w-4" /></Button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><AlignLeft className="h-4 w-4" /></Button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><List className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><ListOrdered className="h-4 w-4" /></Button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><ImageIcon className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><LinkIcon className="h-4 w-4" /></Button>
                      <div className="w-px h-4 bg-slate-300 mx-1" />
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-700"><Code className="h-4 w-4" /></Button>
                    </div>
                    <Textarea 
                      placeholder="Digite aqui..." 
                      value={descricaoHtml}
                      onChange={e => setDescricaoHtml(e.target.value)}
                      className="min-h-[150px] border-0 focus-visible:ring-0 rounded-none resize-y"
                    />
                    <div className="flex justify-between items-center p-2 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
                      <p>A descrição da categoria será mostrada na página da categoria para os motores de busca entenderem do que se trata sua categoria.</p>
                      <span className="shrink-0">Contagem de caracteres: {descricaoHtml?.length || 0}/10000</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-md border border-slate-200 shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="text-lg font-bold text-slate-800">SEO</h3>
              </div>
              <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Tag Title - Título da categoria</Label>
                      <span className="text-[10px] font-bold text-slate-400">{metaTitle?.length || 0} de 70 caracteres</span>
                    </div>
                    <Input 
                      className="h-10 border-slate-200" 
                      placeholder={`${nome || 'Categoria'} | Associadas`}
                      value={metaTitle}
                      onChange={e => setMetaTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-slate-700">Meta Tag Description - Descrição / Resumo</Label>
                      <span className="text-[10px] font-bold text-slate-400">{metaDescription?.length || 0} de 250 caracteres</span>
                    </div>
                    <Textarea 
                      placeholder="Digite aqui um resumo para o Google..." 
                      value={metaDescription}
                      onChange={e => setMetaDescription(e.target.value)}
                      className="min-h-[100px] border-slate-200 placeholder:text-slate-300 resize-y"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">URL da categoria</Label>
                    <Input 
                      placeholder={nome?.toLowerCase().replace(/ /g, '-') || "link-da-pagina"} 
                      value={slug}
                      onChange={e => setSlug(e.target.value)}
                      className="h-10 border-slate-200 placeholder:text-slate-300 text-sm" 
                    />
                  </div>
                </div>

                <div>
                  <div className="border border-slate-200 rounded-md bg-white p-4 min-h-[200px] shadow-sm">
                      <div className="flex items-center gap-1.5 mb-4">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <div className="text-lg text-[#1a0dab] font-medium hover:underline cursor-pointer mb-1 leading-tight">
                        {metaTitle || (nome ? `${nome} | Associadas` : "Título da página")}
                      </div>
                      <div className="text-[13px] text-[#006621] mb-2 font-medium">
                        https://loja.associadas.com.br/<span className="font-bold">{slug || nome?.toLowerCase().replace(/ /g, '-') || "link"}</span>
                      </div>
                      <div className="text-sm text-slate-600 line-clamp-4 leading-snug">
                        {metaDescription || descricaoBreve || "Procurando o produto perfeito? Nossas opções atendem as suas necessidades com qualidade. Confira as nossas ofertas e aproveite!"}
                      </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-4 mt-auto">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="h-10 px-8 font-bold text-slate-600 border-slate-200 hover:bg-slate-50">
            Cancelar
          </Button>
          <Button onClick={handleSave} className="h-10 px-8 bg-primary hover:bg-primary-dark text-white font-bold">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
