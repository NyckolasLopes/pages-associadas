import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Search, ChevronDown, Trash2, Edit2, Plus, Image as ImageIcon, LayoutTemplate, Layers, Grid, Zap, PlusCircle, GripVertical, UploadCloud, Truck, Store, Percent, ShieldCheck, Stethoscope, Thermometer, Leaf, Smile, Droplets, Battery, Wind, Heart, Sparkles, Sliders, ShoppingBag, Eye, Save, Palette, Monitor, ShoppingCart, Package, Info, ArrowLeft, Copy, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAdmin, AdminBanner, defaultBanners } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { useAdminProducts } from "@/stores/products";
import { useAdminCategories } from "@/stores/categories";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { uploadToStorage, compressImageToBlob } from "@/utils/storageUpload";

import { StoreVitrinesConfig } from "@/components/admin/StoreVitrinesConfig";
import { StoreColorManager } from "@/components/admin/StoreColorManager";

const bannersSearchSchema = z.object({
  tab: z.enum(["banners", "vitrines", "logo", "cores"]).optional().catch("banners"),
});

export const Route = createFileRoute("/admin/banners")({
  validateSearch: (search) => bannersSearchSchema.parse(search),
  component: AdminBanners,
});

const BANNER_POSITIONS = ["Full Banner", "Mini Banner", "Banner Tarja", "Banner Compre por categoria", "Banner por Categoria", "Banner Extra", "Banner Diferenciais"];

function getIcon(url: string) {
  if (!url || !url.startsWith("icon:")) return null;
  const iconName = url.replace("icon:", "");
  if (iconName === "Truck") return Truck;
  if (iconName === "Store") return Store;
  if (iconName === "Percent") return Percent;
  if (iconName === "ShieldCheck") return ShieldCheck;
  if (iconName === "Stethoscope") return Stethoscope;
  if (iconName === "Thermometer") return Thermometer;
  if (iconName === "Leaf") return Leaf;
  if (iconName === "Smile") return Smile;
  if (iconName === "Droplets") return Droplets;
  if (iconName === "Battery") return Battery;
  if (iconName === "Wind") return Wind;
  if (iconName === "Heart") return Heart;
  return Sparkles;
}

function getDimensionsForPosition(pos: string) {
  switch (pos) {
    case "Full Banner": 
      return { 
        desktop: "1920x600px (16:5)", 
        mobile: "800x800px (1:1)",
        descricao: "Carrossel principal no topo da loja. Resolução: 1920x600px Desktop e 800x800px Mobile."
      };
    case "Mini Banner": 
      return { 
        desktop: "900x450px (2:1) ou 600x600px (1:1)", 
        mobile: "600x600px (1:1)",
        descricao: "Banners promocionais em grade (duplo ou trio). Resolução: 900x450px ou 600x600px."
      };
    case "Banner Tarja": 
      return { 
        desktop: "128x128px (Ícones) / 1920x90px (Faixa)", 
        mobile: "128x128px (Ícones) / 800x140px (Faixa)",
        descricao: "Tarja de vantagens (Frete Grátis, Parcelamento). Ícones: 128x128px (PNG transparente)."
      };
    case "Banner Compre por categoria": 
      return { 
        desktop: "200x200px a 300x300px (1:1)", 
        mobile: "200x200px (1:1)",
        descricao: "Ícones circulares para o carrossel de categorias. Resolução: 200x200px (PNG transparente)."
      };
    case "Banner por Categoria": 
      return { 
        desktop: "1920x350px (5.5:1)", 
        mobile: "800x400px (2:1)",
        descricao: "Banner de topo nas páginas de categoria (/c/medicamentos). Resolução: 1920x350px."
      };
    case "Banner Extra": 
      return { 
        desktop: "1440x320px ou 1200x300px (4:1)", 
        mobile: "800x400px (2:1)",
        descricao: "Banner intermediário no meio da página. Resolução: 1440x320px Desktop e 800x400px Mobile."
      };
    case "Banner Diferenciais": 
      return { 
        desktop: "600x400px ou 400x400px (3:2)", 
        mobile: "600x400px ou 400x400px (3:2)",
        descricao: "Cards de diferenciais institucionais e atendimento farmacêutico no rodapé."
      };
    default: 
      return { 
        desktop: "1920x600px", 
        mobile: "800x800px",
        descricao: "Resolução recomendada em alta definição."
      };
  }
}

function BannerTarjaBuilder({ editingBanner, setEditingBanner }: any) {
  const getItems = () => {
    try {
      if (editingBanner.formatoExtra) {
        const parsed = JSON.parse(editingBanner.formatoExtra);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch(e) {}
    return [];
  };
  
  const items = getItems();
  
  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    if (!newItems[index]) newItems[index] = { icon: "", title: "", subtitle: "" };
    newItems[index][field] = value;
    setEditingBanner({ ...editingBanner, formatoExtra: JSON.stringify(newItems) });
  };
  
  const addItem = () => {
    if (items.length >= 4) return;
    const newItems = [...items, { icon: "", title: "", subtitle: "" }];
    setEditingBanner({ ...editingBanner, formatoExtra: JSON.stringify(newItems) });
  };
  
  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setEditingBanner({ ...editingBanner, formatoExtra: JSON.stringify(newItems) });
  };

  const handleIconUpload = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const toastId = toast.loading("Enviando ícone...");
    try {
      const compressedBlob = await compressImageToBlob(file, 256, 256, 0.95);
      const publicUrl = await uploadToStorage(compressedBlob, "banners", "tarja_icon");
      updateItem(index, 'icon', publicUrl);
      toast.success("Ícone enviado com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("Erro ao enviar ícone:", err);
      toast.error(`Erro ao enviar ícone: ${err.message || "Erro desconhecido"}`, { id: toastId });
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-xl p-6 space-y-4 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-200 pb-3">
        <div>
          <h3 className="font-bold text-orange-950 text-lg">Construtor de Banner Tarja (Até 4 Itens)</h3>
          <p className="text-xs text-orange-800">
            Adicione até 4 diferenciais/vantagens exibidos lado a lado na tarja superior.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span className="text-[11px] bg-orange-200/80 text-orange-900 font-bold px-2.5 py-1 rounded-full border border-orange-300">
            Ícone Ideal: 128x128px (1:1 PNG)
          </span>
          <span className="text-[11px] bg-white text-slate-700 font-semibold px-2.5 py-1 rounded-full border border-orange-200">
            Faixa Desktop: 1920x90px
          </span>
        </div>
      </div>
      
      <div className="space-y-4">
        {items.map((item: any, index: number) => (
          <div key={index} className="bg-white p-4 rounded-lg border border-slate-200 relative shadow-sm">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-2 right-2 text-red-500 hover:bg-red-50"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            
            <div className="flex gap-4">
              <div className="w-24 shrink-0">
                <div className="flex items-center justify-between mb-1">
                  <Label className="text-xs font-bold text-slate-800">Ícone</Label>
                  <span className="text-[10px] text-orange-700 font-semibold">128x128</span>
                </div>
                <label className="border-2 border-dashed border-orange-200 rounded-lg w-20 h-20 flex flex-col items-center justify-center cursor-pointer hover:bg-orange-50/50 relative overflow-hidden bg-slate-50 transition group">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => handleIconUpload(e, index)}
                  />
                  {item.icon ? (
                    item.icon.startsWith('icon:') ? (
                       (() => {
                          const Icon = getIcon(item.icon);
                          return Icon ? <Icon className="w-8 h-8 text-[#00B5AD]" /> : <ImageIcon className="w-8 h-8 text-slate-400" />;
                       })()
                    ) : (
                      <img src={item.icon} alt="Icon" className="w-full h-full object-contain p-1" />
                    )
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <UploadCloud className="w-6 h-6 text-orange-500 group-hover:scale-110 transition" />
                      <span className="text-[9px] text-slate-500 mt-1 font-medium leading-tight">PNG/SVG<br/>128x128</span>
                    </div>
                  )}
                </label>
              </div>
              
              <div className="flex-1 space-y-3">
                <div>
                   <Label className="text-xs font-bold text-slate-700">Título</Label>
                   <Input 
                     value={item.title || ""} 
                     onChange={(e) => updateItem(index, 'title', e.target.value)}
                     placeholder="Ex: DESCONTO DE 10%" 
                     className="h-8 text-sm bg-white font-bold"
                   />
                </div>
                <div>
                   <Label className="text-xs font-bold text-slate-700">Subtítulo</Label>
                   <Input 
                     value={item.subtitle || ""} 
                     onChange={(e) => updateItem(index, 'subtitle', e.target.value)}
                     placeholder="Ex: Pagando no pix ou boleto" 
                     className="h-8 text-sm bg-white"
                   />
                </div>
              </div>
            </div>
            
            <div className="mt-3">
               <Label className="text-xs font-bold text-slate-700 block mb-1">Ou use um ícone da biblioteca (Ex: icon:Truck)</Label>
               <Input 
                 value={item.icon && item.icon.startsWith('icon:') ? item.icon : ""} 
                 onChange={(e) => updateItem(index, 'icon', e.target.value)}
                 placeholder="icon:Truck, icon:Store, icon:Percent..." 
                 className="h-8 text-sm bg-white w-full max-w-xs"
               />
            </div>
          </div>
        ))}
      </div>
      
      {items.length < 4 && (
        <Button onClick={addItem} variant="outline" className="w-full border-dashed bg-white">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Item
        </Button>
      )}
    </div>
  );
}

function AdminBanners() {
  const addBanner = useAdmin(s => s.addBanner);
  const updateBanner = useAdmin(s => s.updateBanner);

  const activeStoreId = useAdmin(s => s.activeStoreId);
  const setActiveStoreId = useAdmin(s => s.setActiveStoreId);
  const currentUser = useAdmin(s => s.currentUser);
  const grupos = useAdmin(s => s.grupos);
  const allBanners = useAdmin(s => s.banners);
  
  const isGlobalAdmin = () => {
    if (currentUser?.proprietario) return true;
    const userGroup = grupos?.find(g => g.id === currentUser?.grupoId);
    return userGroup?.permissao_total || false;
  };
  const banners = activeStoreId ? allBanners.filter(b => b.lojaId === activeStoreId) : allBanners.filter(b => !b.lojaId);
  const setBanners = useAdmin(s => s.setBanners);
  const removeBanner = useAdmin(s => s.removeBanner);
  const fetchBanners = useAdmin(s => s.fetchBanners);
  const vitrines = useAdminProducts(s => s.vitrines);
  const pharmacies = useAdmin(s => s.pharmacies);
  const { categories, loadCategories } = useAdminCategories();

  useEffect(() => {
    fetchBanners(activeStoreId || undefined);
    loadCategories();
  }, [activeStoreId, fetchBanners, loadCategories]);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const desktopInputRef2 = useRef<HTMLInputElement>(null);
  const mobileInputRef2 = useRef<HTMLInputElement>(null);

  const desktopInputRef3 = useRef<HTMLInputElement>(null);
  const mobileInputRef3 = useRef<HTMLInputElement>(null);

  const processFile = async (file: File | undefined, isMobile: boolean, imageIndex: number = 1) => {
    if (!file) return;
    
    const fieldName = imageIndex === 1 
      ? (isMobile ? 'mobileImageUrl' : 'imageUrl')
      : imageIndex === 2
      ? (isMobile ? 'mobileImageUrl2' : 'imageUrl2')
      : (isMobile ? 'mobileImageUrl3' : 'imageUrl3');

    const toastId = toast.loading("Enviando e otimizando imagem do banner...");

    try {
      const maxWidth = isMobile ? 900 : 1920;
      const maxHeight = isMobile ? 1200 : 1080;
      const compressedBlob = await compressImageToBlob(file, maxWidth, maxHeight, 0.85);
      const publicUrl = await uploadToStorage(compressedBlob, "banners", isMobile ? "banner_mobile" : "banner_desktop");

      setEditingBanner(prev => prev ? { 
        ...prev, 
        [fieldName]: publicUrl 
      } : null);

      toast.success("Imagem enviada com sucesso!", { id: toastId });
    } catch (err: any) {
      console.error("Erro ao enviar imagem:", err);
      toast.error(`Falha no upload da imagem: ${err.message || "Erro desconhecido"}`, { id: toastId });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean, imageIndex: number = 1) => {
    processFile(e.target.files?.[0], isMobile, imageIndex);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, isMobile: boolean, imageIndex: number = 1) => {
    e.preventDefault();
    e.stopPropagation();
    processFile(e.dataTransfer.files?.[0], isMobile, imageIndex);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<AdminBanner> | null>(null);
  const [bannerToDelete, setBannerToDelete] = useState<string | null>(null);
  const [selectedBanners, setSelectedBanners] = useState<string[]>([]);

  const handleDeleteSelected = (groupIds: string[]) => {
    if (confirm(`Tem certeza que deseja excluir os ${groupIds.length} banner(s) selecionado(s)?`)) {
      groupIds.forEach(id => removeBanner(id));
      setSelectedBanners(prev => prev.filter(id => !groupIds.includes(id)));
      toast.success(`${groupIds.length} banner(s) removido(s) com sucesso`);
    }
  };

  type TabType = "banners" | "vitrines" | "logo" | "cores";

  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const validTabs: TabType[] = ["banners", "vitrines", "logo", "cores"];
  const currentTab: TabType = (searchParams?.tab && validTabs.includes(searchParams.tab as any))
    ? (searchParams.tab as TabType)
    : "banners";

  const [activeTab, setActiveTab] = useState<TabType>(currentTab);

  useEffect(() => {
    if (searchParams?.tab && validTabs.includes(searchParams.tab as any)) {
      setActiveTab(searchParams.tab as TabType);
    }
  }, [searchParams?.tab]);

  const [managingGlobal, setManagingGlobal] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [confirmCopyOpen, setConfirmCopyOpen] = useState(false);
  
  const handleCopyGlobalBanners = async () => {
    if (!activeStoreId) return;
    setConfirmCopyOpen(true);
  };

  const executeCopyGlobalBanners = async () => {
    setIsCopying(true);
    try {
      const globalBanners = allBanners.filter(b => !b.lojaId);
      for (const banner of globalBanners) {
        await addBanner({
          ...banner,
          id: "",
          lojaId: activeStoreId || undefined
        });
      }
      toast.success("Banners da rede copiados com sucesso!");
    } catch (e) {
      toast.error("Erro ao copiar banners da rede.");
    } finally {
      setIsCopying(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate({ search: (prev: any) => ({ ...prev, tab }) });
  };

  const matchBannerPos = (b: AdminBanner, pos: string) => {
    const bPos = (b.posicao || "").toLowerCase().trim();
    const pPos = pos.toLowerCase().trim();
    return bPos === pPos || 
           bPos === pPos.replace(/\s+/g, "") || 
           (pPos === "mini banner" && bPos.includes("mini banner")) ||
           (pPos === "banner compre por categoria" && (bPos === "banner categoria" || bPos.includes("categoria"))) ||
           (pPos === "banner tarja" && (bPos.includes("tarja") || bPos === "banner tarja"));
  };

  const groupedBanners = BANNER_POSITIONS.map(pos => {
    if (activeStoreId) {
      const storeItems = allBanners.filter(b => b.lojaId === activeStoreId && matchBannerPos(b, pos));
      if (storeItems.length > 0) {
        return {
          position: pos,
          isInherited: false,
          items: storeItems.filter(b => b.nome.toLowerCase().includes(search.toLowerCase()))
        };
      }
      // Se a loja não tem banners próprios nesta posição, exibe os banners da rede herdados que estão ativos na loja
      const globalItems = allBanners.filter(b => !b.lojaId && matchBannerPos(b, pos));
      const fallbackItems = globalItems.length > 0 ? globalItems : defaultBanners.filter(b => matchBannerPos(b, pos));
      return {
        position: pos,
        isInherited: fallbackItems.length > 0,
        items: fallbackItems.filter(b => b.nome.toLowerCase().includes(search.toLowerCase()))
      };
    }

    const globalItems = allBanners.filter(b => !b.lojaId && matchBannerPos(b, pos));
    const fallbackItems = globalItems.length > 0 ? globalItems : defaultBanners.filter(b => matchBannerPos(b, pos));
    return {
      position: pos,
      isInherited: false,
      items: fallbackItems.filter(b => b.nome.toLowerCase().includes(search.toLowerCase()))
    };
  });

  // --- Drag-and-drop ordering state (per position group) ---
  const [localOrder, setLocalOrder] = useState<Record<string, string[]>>({}); // position -> [id,...]
  const [dirtyGroups, setDirtyGroups] = useState<Set<string>>(new Set());
  const [isSavingOrder, setIsSavingOrder] = useState(false);
  const dragItem = useRef<{ position: string; index: number } | null>(null);
  const dragOverItem = useRef<{ position: string; index: number } | null>(null);

  // Sync localOrder when banners change (on mount / after fetch)
  useEffect(() => {
    const next: Record<string, string[]> = {};
    groupedBanners.forEach(group => {
      const sorted = [...group.items].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
      next[group.position] = sorted.map(b => b.id);
    });
    setLocalOrder(next);
    setDirtyGroups(new Set());
  }, [allBanners, activeStoreId]);

  const getOrderedItems = (position: string, items: AdminBanner[]) => {
    const order = localOrder[position];
    if (!order || order.length === 0) return [...items].sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0));
    const indexed = new Map(items.map(i => [i.id, i]));
    const result: AdminBanner[] = [];
    order.forEach(id => { const b = indexed.get(id); if (b) result.push(b); });
    items.forEach(i => { if (!order.includes(i.id)) result.push(i); });
    return result;
  };

  const handleDragStart = (position: string, index: number) => {
    dragItem.current = { position, index };
  };

  const handleDragEnter = (position: string, index: number) => {
    dragOverItem.current = { position, index };
  };

  const handleDragEnd = (position: string) => {
    if (!dragItem.current || !dragOverItem.current) return;
    if (dragItem.current.position !== position || dragOverItem.current.position !== position) return;
    if (dragItem.current.index === dragOverItem.current.index) return;

    const sourceIndex = dragItem.current.index;
    const destIndex = dragOverItem.current.index;

    setLocalOrder(prev => {
      const newOrder = [...(prev[position] || [])];
      const [moved] = newOrder.splice(sourceIndex, 1);
      newOrder.splice(destIndex, 0, moved);
      return { ...prev, [position]: newOrder };
    });
    setDirtyGroups(prev => new Set([...prev, position]));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      for (const position of Array.from(dirtyGroups)) {
        const ids = localOrder[position] || [];
        await Promise.all(
          ids.map((id, idx) => updateBanner(id, { ordem: idx }))
        );
      }
      setDirtyGroups(new Set());
      toast.success('Ordem dos banners salva com sucesso!');
    } catch {
      toast.error('Erro ao salvar a ordem dos banners.');
    } finally {
      setIsSavingOrder(false);
    }
  };

  const openNewModal = (posicao?: string) => {
    setEditingBanner({
      active: true,
      nome: "",
      posicao: posicao || "Full Banner",
      paginaPublicacao: "Página inicial",
      link: "",
      titulo: "",
      startDate: "",
      endDate: "",
      imageUrl: "",
      mobileImageUrl: "",
    });
    setModalOpen(true);
  };

  const openEditModal = (banner: AdminBanner) => {
    setEditingBanner({ ...banner });
    setModalOpen(true);
  };

  const saveBanner = async () => {
    if (!editingBanner?.nome || !editingBanner?.posicao) {
      toast.error("Nome e posição são obrigatórios");
      return;
    }
    if (!editingBanner?.imageUrl) {
      toast.error("Você precisa enviar a imagem ou informar o ícone do banner.");
      return;
    }

    if (editingBanner.startDate) {
      const start = new Date(editingBanner.startDate);
      // Remove 5 minutes from now to allow slight delays when selecting current time
      if (start.getTime() < Date.now() - 5 * 60000) {
        // Se for um novo banner, não permite data passada
        if (!editingBanner.id) {
          toast.error("A data de início não pode estar no passado.");
          return;
        }
      }
    }

    if (editingBanner.endDate) {
      const end = new Date(editingBanner.endDate);
      if (end.getTime() < Date.now() - 5 * 60000) {
        if (!editingBanner.id) {
          toast.error("A data de fim não pode estar no passado.");
          return;
        }
      }
      if (editingBanner.startDate && end.getTime() <= new Date(editingBanner.startDate).getTime()) {
        toast.error("A data de término deve ser posterior à data de início.");
        return;
      }
    }

    try {
      const isCustomizingInherited = activeStoreId && editingBanner.id && (!editingBanner.lojaId || editingBanner.lojaId !== activeStoreId);
      if (editingBanner.id && !isCustomizingInherited) {
        await updateBanner(editingBanner.id, editingBanner);
        toast.success("Banner atualizado com sucesso!");
      } else {
        await addBanner({
          ...editingBanner,
          id: `banner_${Date.now()}`,
          lojaId: managingGlobal ? undefined : (activeStoreId || (!currentUser?.proprietario ? currentUser?.lojasVinculadas?.[0] : undefined) || undefined),
        } as AdminBanner);
        toast.success(isCustomizingInherited ? "Banner personalizado para esta loja com sucesso!" : "Banner criado com sucesso!");
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error("Erro ao salvar o banner: " + (e.message || "Erro desconhecido"));
    }
  };

  const dimensions = editingBanner?.posicao ? getDimensionsForPosition(editingBanner.posicao) : null;

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">
            {activeTab === "vitrines" ? "Minhas Vitrines" : activeTab === "logo" ? "Logotipo da Loja" : activeTab === "cores" ? "Minhas Cores" : "Banners"}
          </h2>
          <span className="text-sm font-medium text-slate-500">
            {activeTab === "vitrines" 
              ? "Gerencie e organize as vitrines e carrosséis de produtos" 
              : activeTab === "logo"
              ? "Gerencie a logomarca da sua loja"
              : activeTab === "cores"
              ? "Personalize as cores da sua loja"
              : "Gerencie os banners promocionais e visuais da sua loja"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeStoreId && isGlobalAdmin() && activeTab === "banners" && (
            <Button variant="outline" onClick={() => setActiveStoreId("")} className="font-bold text-slate-600 bg-white shadow-sm border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          {managingGlobal && isGlobalAdmin() && activeTab === "banners" && (
            <Button variant="outline" onClick={() => setManagingGlobal(false)} className="font-bold text-slate-600 bg-white shadow-sm border-slate-200">
              <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
            </Button>
          )}
          {activeStoreId && isGlobalAdmin() && activeTab === "banners" && pharmacies.find(p => p.id === activeStoreId)?.categoriaAssociado !== 'Parceiro' && (
            <Button 
              variant="outline" 
              onClick={handleCopyGlobalBanners} 
              disabled={isCopying}
              className="font-bold text-emerald-600 hover:text-emerald-700 border-emerald-200 hover:bg-emerald-50 shadow-sm"
              title="Copia os banners cadastrados na rede global para esta loja."
            >
              <Copy className="w-4 h-4 mr-2" /> Puxar Banners da Rede
            </Button>
          )}
          <StoreSelector className="mb-0" />
          {activeTab === "banners" && (activeStoreId || managingGlobal || !isGlobalAdmin()) && (
            <Button onClick={() => openNewModal()} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-6 rounded-lg shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo banner
            </Button>
          )}

        </div>
      </div>

      {/* Tab 1: Banners Content */}
      {activeTab === "banners" && (
        !activeStoreId && isGlobalAdmin() && !managingGlobal ? (
          <div className="space-y-6">
            <div className="p-6 bg-emerald-50 rounded-xl border border-emerald-100 flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-bold text-emerald-800">Banners da Rede (Globais)</h3>
                <p className="text-sm text-emerald-600">Gerencie os banners padrão que as lojas poderão puxar para suas próprias vitrines.</p>
              </div>
              <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={() => setManagingGlobal(true)}>
                <Layers className="w-4 h-4 mr-2" /> Gerenciar Banners da Rede
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pharmacies.map(loja => {
              const bannerCount = allBanners.filter(b => b.lojaId === loja.id).length;
              return (
                <div key={loja.id} className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col justify-between hover:border-emerald-400 hover:shadow-md transition-all cursor-pointer group" onClick={() => setActiveStoreId(loja.id)}>
                  <div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 group-hover:bg-emerald-500 group-hover:text-white transition-colors">
                        <Store className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-800 text-lg group-hover:text-emerald-600 transition-colors">{loja.nome || (loja as any).nomeFantasia || loja.razaoSocial}</h3>
                        <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
                          Filial #{loja.id}
                          <span className={`px-1.5 py-0.5 rounded font-bold text-[10px] uppercase tracking-wider ${
                            loja.categoriaAssociado === 'Parceiro'
                              ? 'bg-orange-500 text-white'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {loja.categoriaAssociado === 'Parceiro' ? 'Parceiro' : 'Pleno'}
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 flex items-center justify-between mb-4">
                      <span className="text-sm font-medium text-slate-600">Banners cadastrados</span>
                      <span className="text-sm font-black text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">{bannerCount}</span>
                    </div>
                  </div>
                  <Button variant="outline" className="w-full border-slate-200 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200" onClick={(e) => { e.stopPropagation(); setActiveStoreId(loja.id); }}>
                    <Layers className="w-4 h-4 mr-2" /> Gerenciar Banners
                  </Button>
                </div>
              );
            })}
            {pharmacies.length === 0 && (
              <div className="col-span-full py-12 text-center text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">
                <Store className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p>Nenhuma loja cadastrada na rede.</p>
              </div>
            )}
            </div>
          </div>
        ) : (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input 
                placeholder="Buscar banner por nome..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 h-10 bg-white border-slate-200"
              />
            </div>
            {dirtyGroups.size > 0 && (
              <Button
                onClick={saveOrder}
                disabled={isSavingOrder}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10 px-6 rounded-lg shadow-sm animate-in fade-in slide-in-from-right-4 gap-2"
              >
                <Save className="w-4 h-4" />
                {isSavingOrder ? "Salvando..." : "Salvar Alteração"}
              </Button>
            )}
          </div>
        
        <div className="p-6 space-y-10">
          {groupedBanners.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white border border-slate-200 rounded-md overflow-hidden mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border-b border-slate-200 gap-2">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-bold text-[#3a4454] text-[17px]">{group.position}</h3>
                  {group.isInherited && (
                    <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                      🌐 Padrão da Rede (Ativo na Loja)
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {group.items.some(b => selectedBanners.includes(b.id)) && (
                    <button 
                      onClick={() => handleDeleteSelected(group.items.map(b => b.id).filter(id => selectedBanners.includes(id)))} 
                      className="flex items-center gap-1.5 text-red-500 hover:text-red-700 text-[13px] font-medium"
                    >
                      <Trash2 className="w-4 h-4" /> Excluir selecionados
                    </button>
                  )}
                  <button onClick={() => openNewModal(group.position)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[13px] font-medium">
                    <PlusCircle className="w-4 h-4" /> Adicionar {group.position.toLowerCase()}
                  </button>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[#556376] font-medium text-[13px]">
                      <th className="p-3 w-14 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 w-3.5 h-3.5 cursor-pointer"
                          checked={group.items.length > 0 && group.items.every(b => selectedBanners.includes(b.id))}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedBanners(prev => [...new Set([...prev, ...group.items.map(b => b.id)])]);
                            } else {
                              setSelectedBanners(prev => prev.filter(id => !group.items.find(b => b.id === id)));
                            }
                          }}
                        />
                      </th>
                      <th className="p-3">Nome do banner</th>
                      <th className="p-3 text-center">Data início agendamento</th>
                      <th className="p-3 text-center">Data fim agendamento</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {group.items.length === 0 && (
                       <tr>
                         <td colSpan={6} className="p-10 text-center text-[#3a4454] font-medium text-[13px]">Ainda não existe nenhum {group.position.toLowerCase()} cadastrado.</td>
                       </tr>
                    )}
                    {getOrderedItems(group.position, group.items).map((banner, rowIdx) => (
                      <tr
                        key={banner.id}
                        className="hover:bg-slate-50 group transition-colors"
                        draggable
                        onDragStart={() => handleDragStart(group.position, rowIdx)}
                        onDragEnter={() => handleDragEnter(group.position, rowIdx)}
                        onDragEnd={() => handleDragEnd(group.position)}
                        onDragOver={e => e.preventDefault()}
                        style={{ cursor: 'grab' }}
                      >
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <GripVertical className="w-4 h-4 text-slate-400 cursor-grab hover:text-slate-700" />
                            <input 
                              type="checkbox" 
                              className="rounded border-slate-300 w-3.5 h-3.5 cursor-pointer"
                              checked={selectedBanners.includes(banner.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedBanners(prev => [...prev, banner.id]);
                                } else {
                                  setSelectedBanners(prev => prev.filter(id => id !== banner.id));
                                }
                              }}
                            />
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-4 cursor-pointer" onClick={() => openEditModal(banner)}>
                            <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0">
                               {banner.imageUrl && banner.imageUrl.startsWith('icon:') ? (() => {
                                 const Icon = getIcon(banner.imageUrl);
                                 return (
                                   <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[#00B5AD]">
                                     {Icon ? <Icon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                   </div>
                                 );
                               })() : banner.imageUrl && !banner.imageUrl.includes('placehold') ? (
                                 <img src={banner.imageUrl} alt={banner.nome} className="w-full h-full object-contain" />
                               ) : (
                                 <div className="w-full h-full bg-[#f68f1e] flex flex-col items-center justify-center text-[6px] font-black text-white leading-tight">
                                    <ImageIcon className="w-4 h-4 mb-0.5" />
                                 </div>
                               )}
                            </div>
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="text-[15px] font-medium text-[#3a4454] hover:text-[#00B5AD]">{banner.nome}</span>
                                {group.isInherited && (
                                  <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                                    Herdado da Rede
                                  </span>
                                )}
                              </div>
                              <span className="text-[12px] text-slate-500">Posição: {banner.posicao || group.position}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-3 text-center text-slate-500 text-[13px]">
                           {banner.startDate ? new Date(banner.startDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-3 text-center text-slate-500 text-[13px]">
                           {banner.endDate ? new Date(banner.endDate).toLocaleDateString('pt-BR') : '-'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${banner.active ? 'bg-[#00B5AD]' : 'bg-slate-300'}`}></span>
                            <span className="text-[13px] text-slate-600">{banner.active ? 'Ativo' : 'Inativo'}</span>
                          </div>
                        </td>
                        <td className="p-3">
                           <div className="flex gap-2">
                             <Button onClick={() => openEditModal(banner)} size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-[#00B5AD] hover:bg-slate-100 hover:text-slate-800 transition-colors" title={group.isInherited ? "Personalizar para esta loja" : "Editar banner"}>
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <Button onClick={() => setBannerToDelete(banner.id)} size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors" title="Excluir banner">
                               <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>

          {/* Banners das Lojas */}
          {!activeStoreId && (allBanners.filter(b => b.lojaId).length > 0) && (
            <div className="mt-12 space-y-6">
              <div className="border-b border-slate-200 pb-4">
                <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2.5">
                  <Store className="w-[22px] h-[22px] text-orange-500 shrink-0" /> 
                  <span className="leading-none pt-0.5">Banners das Lojas (Personalizados)</span>
                </h2>
                <p className="text-sm text-slate-500 mt-2">Veja quais banners cada loja está usando na sua própria página. Você pode editá-los diretamente se desejar.</p>
              </div>

              {pharmacies.filter(p => allBanners.some(b => b.lojaId === p.id)).map(store => {
                const sBanners = allBanners.filter(b => b.lojaId === store.id);
                return (
                  <div key={store.id} className="bg-white border border-slate-200 rounded-md overflow-hidden mb-6">
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                          <Store className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-[#3a4454] text-[16px]">{store.nome}</h3>
                          <p className="text-xs text-slate-500">{sBanners.length} banner(s) personalizado(s)</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full text-left whitespace-nowrap">
                        <tbody className="divide-y divide-slate-100">
                          {sBanners.map((banner) => (
                            <tr key={banner.id} className="hover:bg-slate-50 group transition-colors">
                              <td className="p-3 w-16">
                                <div className="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-white flex items-center justify-center shrink-0 cursor-pointer" onClick={() => openEditModal(banner)}>
                                   {banner.imageUrl && banner.imageUrl.startsWith('icon:') ? (() => {
                                     const Icon = getIcon(banner.imageUrl);
                                     return (
                                       <div className="w-full h-full bg-slate-100 flex items-center justify-center text-[#00B5AD]">
                                         {Icon ? <Icon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                       </div>
                                     );
                                   })() : banner.imageUrl && !banner.imageUrl.includes('placehold') ? (
                                     <img src={banner.imageUrl} alt={banner.nome} className="w-full h-full object-contain" />
                                   ) : (
                                     <div className="w-full h-full bg-[#f68f1e] flex flex-col items-center justify-center text-[6px] font-black text-white leading-tight">
                                        <ImageIcon className="w-4 h-4 mb-0.5" />
                                     </div>
                                   )}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex flex-col">
                                  <span className="text-[14px] font-medium text-[#3a4454]">{banner.nome}</span>
                                  <span className="text-[12px] text-slate-500">Posição: {banner.posicao}</span>
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="flex items-center gap-1.5">
                                  <span className={`w-2 h-2 rounded-full ${banner.active ? 'bg-[#00B5AD]' : 'bg-slate-300'}`}></span>
                                  <span className="text-[12px] text-slate-600">{banner.active ? 'Ativo' : 'Inativo'}</span>
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                 <Button onClick={() => openEditModal(banner)} size="sm" variant="outline" className="h-8 text-xs text-slate-600 hover:text-[#00B5AD]">
                                   <Edit2 className="w-3.5 h-3.5 mr-1" /> Editar
                                 </Button>
                                 <Button onClick={() => setBannerToDelete(banner.id)} size="sm" variant="ghost" className="h-8 w-8 p-0 ml-2 text-slate-400 hover:text-red-500 hover:bg-red-50">
                                   <Trash2 className="w-4 h-4" />
                                 </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )
      )}



      {/* Tab 3: Minhas Vitrines (Configuração & Produtos) */}
      {activeTab === "vitrines" && (
        <StoreVitrinesConfig />
      )}

      {/* Tab 4: Logo */}
      {activeTab === "logo" && (
        <StoreLogoConfig />
      )}

      {/* Tab 5: Cores */}
      {activeTab === "cores" && (
        <StoreColorsConfig />
      )}

      <ConfirmDialog
        isOpen={!!bannerToDelete}
        onClose={() => setBannerToDelete(null)}
        onConfirm={() => {
          if (bannerToDelete) {
            removeBanner(bannerToDelete);
            toast.success("Banner excluído.");
            setBannerToDelete(null);
          }
        }}
        title="Excluir banner"
        description="Deseja realmente excluir este banner?"
        confirmText="Excluir"
      />

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-[700px] p-0 overflow-hidden flex flex-col max-h-[90vh] bg-slate-50">
          <DialogHeader className="px-8 py-5 border-b bg-white flex flex-row items-center justify-between sticky top-0 z-10 shadow-sm">
            <DialogTitle className="text-xl font-bold text-slate-800">
              {editingBanner?.id ? 'Editar Banner' : 'Novo Banner'}
            </DialogTitle>
            <div className="flex items-center gap-3">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={saveBanner} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold">
                Salvar alterações
              </Button>
            </div>
          </DialogHeader>

          {editingBanner && (
            <div className="flex-1 overflow-y-auto p-8 space-y-8">
              {/* STATUS */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-3">
                <Label className="text-slate-700 font-bold">Banner ativo?</Label>
                <div className="flex items-center gap-3">
                  <Switch 
                    checked={editingBanner.active} 
                    onCheckedChange={v => setEditingBanner({...editingBanner, active: v})} 
                    className="data-[state=checked]:bg-[#00B5AD]"
                  />
                  <span className="text-sm font-medium text-slate-600">{editingBanner.active ? 'Sim' : 'Não'}</span>
                </div>
              </div>

              {/* INFORMAÇÕES */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Nome do banner <span className="text-red-500">*</span></Label>
                  <Input 
                    value={editingBanner.nome || ""} 
                    onChange={e => setEditingBanner({...editingBanner, nome: e.target.value})}
                    placeholder="Ex: FULL 1"
                    className="h-11 border-slate-200"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Posição do banner <span className="text-red-500">*</span></Label>
                    <Select 
                      value={editingBanner.posicao} 
                      onValueChange={v => {
                        const updates: any = { posicao: v };
                        if (v === "Banner por Categoria") {
                          updates.paginaPublicacao = "Página de Categoria";
                        }
                        setEditingBanner({...editingBanner, ...updates});
                      }}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-white">
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                      <SelectContent>
                        {BANNER_POSITIONS.map(p => (
                          <SelectItem key={p} value={p}>{p}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Página de publicação <span className="text-red-500">*</span></Label>
                    <Select 
                      disabled={editingBanner.posicao === "Banner por Categoria"}
                      value={editingBanner.paginaPublicacao || "Página inicial"} 
                      onValueChange={v => setEditingBanner({...editingBanner, paginaPublicacao: v})}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-white">
                        <SelectValue placeholder="Selecione a página" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Página inicial">Página inicial</SelectItem>
                        <SelectItem value="Todas as páginas">Todas as páginas</SelectItem>
                        <SelectItem value="Página de Categoria">Página de Categoria</SelectItem>
                        <SelectItem value="Checkout">Checkout</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {editingBanner.posicao === "Banner por Categoria" && (
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Categoria Vinculada <span className="text-red-500">*</span></Label>
                    <Select 
                      value={editingBanner.topicoVinculado || ""} 
                      onValueChange={v => setEditingBanner({...editingBanner, topicoVinculado: v})}
                    >
                      <SelectTrigger className="h-11 border-slate-200 bg-white">
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map(c => (
                          <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Link do banner</Label>
                  <Input 
                    value={editingBanner.link || ""} 
                    onChange={e => setEditingBanner({...editingBanner, link: e.target.value})}
                    placeholder="https://suafarmacia.com.br/ofertas"
                    className="h-11 border-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Título do banner</Label>
                  <Input 
                    value={editingBanner.titulo || ""} 
                    onChange={e => setEditingBanner({...editingBanner, titulo: e.target.value})}
                    placeholder="Ex: Promoção de Verão"
                    className="h-11 border-slate-200"
                  />
                </div>
                
                {editingBanner.posicao === "Banner Extra" && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 mt-4 border-t border-slate-100">
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Abaixo de qual vitrine?</Label>
                      <Select 
                        value={editingBanner.vitrineVinculada || "none"} 
                        onValueChange={v => setEditingBanner({...editingBanner, vitrineVinculada: v === "none" ? undefined : v, bannerVinculado: undefined, topicoVinculado: undefined})}
                      >
                        <SelectTrigger className="h-11 border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione a vitrine (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhuma (Exibição padrão)</SelectItem>
                          {vitrines.filter(v => v.ativa).map(v => (
                            <SelectItem key={v.id} value={v.nome}>{v.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Ou abaixo de outro banner?</Label>
                      <Select 
                        value={editingBanner.bannerVinculado || "none"} 
                        onValueChange={v => setEditingBanner({...editingBanner, bannerVinculado: v === "none" ? undefined : v, vitrineVinculada: undefined, topicoVinculado: undefined})}
                      >
                        <SelectTrigger className="h-11 border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione o banner (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (Exibição padrão)</SelectItem>
                          {banners.filter(b => b.id !== editingBanner?.id).map(b => (
                            <SelectItem key={b.id} value={b.id}>{b.nome} ({b.posicao})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Ou abaixo de algum tópico?</Label>
                      <Select 
                        value={editingBanner.topicoVinculado || "none"} 
                        onValueChange={v => setEditingBanner({...editingBanner, topicoVinculado: v === "none" ? undefined : v, vitrineVinculada: undefined, bannerVinculado: undefined})}
                      >
                        <SelectTrigger className="h-11 border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione o tópico (opcional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Nenhum (Exibição padrão)</SelectItem>
                          <SelectItem value="servicos">Serviços (Apenas lojas com serviços)</SelectItem>
                          <SelectItem value="diferenciais">Diferenciais Institucionais</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="font-bold text-slate-700">Formato</Label>
                      <Select 
                        value={editingBanner.formatoExtra || "1_banner"} 
                        onValueChange={v => setEditingBanner({...editingBanner, formatoExtra: v as "1_banner" | "2_banners"})}
                      >
                        <SelectTrigger className="h-11 border-slate-200 bg-white">
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1_banner">1 Banner (Largura Total)</SelectItem>
                          <SelectItem value="2_banners">2 Banners (Lado a Lado - 50/50)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </div>

              {/* AGENDAMENTO */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-6">
                <h3 className="font-bold text-slate-800 text-lg">Agendamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-1">Data de início <span className="text-slate-400 text-xs ml-1">(Opcional)</span></Label>
                    <Input 
                      type="datetime-local"
                      value={editingBanner.startDate || ""} 
                      onChange={e => setEditingBanner({...editingBanner, startDate: e.target.value})}
                      className="h-11 border-slate-200 text-slate-600 bg-white"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex items-center gap-1">Data de fim <span className="text-slate-400 text-xs ml-1">(Opcional)</span></Label>
                    <Input 
                      type="datetime-local"
                      value={editingBanner.endDate || ""} 
                      onChange={e => setEditingBanner({...editingBanner, endDate: e.target.value})}
                      className="h-11 border-slate-200 text-slate-600 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* IMAGENS */}
              <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm space-y-8">
                {editingBanner.posicao === "Banner Tarja" ? (
                  <BannerTarjaBuilder editingBanner={editingBanner} setEditingBanner={setEditingBanner} />
                ) : editingBanner.posicao === "Banner Compre por categoria" ? (
                  <div className="bg-orange-50 border border-orange-200 rounded p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-bold text-orange-800 text-lg">Configuração de Cartão ({editingBanner.posicao})</h3>
                        <p className="text-sm text-orange-700">
                          Os Banners Compre por categoria são os ícones redondos que aparecem na seção "Compre por categoria".
                        </p>
                      </div>
                      {dimensions && <span className="text-xs bg-orange-100 px-2 py-1 rounded text-orange-800 font-bold font-mono border border-orange-200 shadow-sm">{dimensions.desktop}</span>}
                    </div>
                    <div className="space-y-3">
                      <Label className="font-bold text-slate-700">Ícone, URL ou Upload de Imagem</Label>
                      
                      {/* Preview da imagem atual */}
                      {editingBanner.imageUrl && (
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
                          {editingBanner.imageUrl.startsWith("icon:") ? (() => {
                            const Icon = getIcon(editingBanner.imageUrl);
                            return (
                              <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-[#00B5AD] rounded border">
                                {Icon ? <Icon className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                              </div>
                            );
                          })() : (
                            <img src={editingBanner.imageUrl} alt="Preview" className="w-14 h-14 object-contain rounded border" />
                          )}
                          <div className="flex-1 text-sm text-slate-600 truncate">
                            {editingBanner.imageUrl.startsWith("icon:") ? `Ícone selecionado: ${editingBanner.imageUrl}` : "Imagem carregada"}
                          </div>
                          <Button variant="outline" size="sm" className="text-red-500 border-red-200 hover:bg-red-50" onClick={() => setEditingBanner({...editingBanner, imageUrl: ""})}>
                            Remover
                          </Button>
                        </div>
                      )}

                      {/* Upload de arquivo */}
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-lg p-4 bg-white flex items-center justify-center gap-3 cursor-pointer hover:bg-slate-50 transition-colors"
                        onClick={() => desktopInputRef.current?.click()}
                      >
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          ref={desktopInputRef}
                          onChange={(e) => handleFileChange(e, false)}
                        />
                        <UploadCloud className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-500 font-medium">Clique para enviar uma imagem</span>
                      </div>
                      
                      {/* Input de texto para ícone ou URL */}
                      <Input 
                        value={editingBanner.imageUrl || ""} 
                        onChange={e => setEditingBanner({...editingBanner, imageUrl: e.target.value})}
                        placeholder="Ou use: icon:Thermometer ou URL da imagem (200x200)"
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">O texto abaixo do ícone será o "Nome do banner". Você pode fazer upload de uma imagem, colar uma URL ou usar ícones (ex: icon:Truck).</p>
                    </div>
                  </div>
                ) : (
                  <>
                    {dimensions && (
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Info className="w-4 h-4 text-blue-600 shrink-0" />
                            <span className="font-bold text-sm text-blue-900">Dimensões Recomendadas ({editingBanner.posicao})</span>
                          </div>
                          <p className="text-xs text-blue-700 pl-6">{dimensions.descricao}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                          <div className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-mono font-bold text-blue-900 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-sans block leading-none">Desktop:</span>
                            {dimensions.desktop}
                          </div>
                          <div className="bg-white px-2.5 py-1 rounded-lg border border-blue-200 text-xs font-mono font-bold text-blue-900 shadow-xs">
                            <span className="text-[10px] text-slate-400 font-sans block leading-none">Mobile:</span>
                            {dimensions.mobile}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Imagem do banner (Desktop)</h3>
                          <p className="text-xs text-slate-500">Essa é a imagem principal exibida em computadores e notebooks.</p>
                        </div>
                        {dimensions && <span className="text-xs bg-blue-100 text-blue-900 px-2.5 py-1 rounded-md font-bold font-mono border border-blue-200 shadow-sm">{dimensions.desktop}</span>}
                      </div>
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                        onClick={() => desktopInputRef.current?.click()}
                        onDrop={(e) => handleDrop(e, false, 1)}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                      >
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           ref={desktopInputRef}
                           onChange={(e) => handleFileChange(e, false)}
                         />
                         {editingBanner.imageUrl ? (
                            <div className="relative w-full max-w-md">
                              <img src={editingBanner.imageUrl} alt="Banner" className="w-full h-auto max-h-[200px] object-contain rounded" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                 <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); desktopInputRef.current?.click(); }}>Alterar imagem</Button>
                              </div>
                            </div>
                         ) : (
                           <>
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                               <UploadCloud className="w-8 h-8" />
                             </div>
                             <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem do banner aqui</h4>
                             <p className="text-xs text-slate-500 max-w-sm mx-auto">
                               Resolução ideal: <strong className="text-blue-700">{dimensions?.desktop || "1920x600px"}</strong>. Formato JPG, PNG ou WebP até 2MB.
                             </p>
                             <Input 
                                type="text" 
                                placeholder="Ou cole a URL da imagem aqui..." 
                                className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                value={editingBanner.imageUrl || ""}
                                onChange={e => setEditingBanner({...editingBanner, imageUrl: e.target.value})}
                                onClick={e => e.stopPropagation()}
                              />
                           </>
                         )}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Imagem do banner para celular (Mobile)</h3>
                          <p className="text-xs text-slate-500">Exibida em smartphones para garantir legibilidade e carregamento ultra-rápido.</p>
                        </div>
                        {dimensions && <span className="text-xs bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-md font-bold font-mono border border-emerald-200 shadow-sm">{dimensions.mobile}</span>}
                      </div>
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                        onClick={() => mobileInputRef.current?.click()}
                        onDrop={(e) => handleDrop(e, true, 1)}
                        onDragOver={handleDragOver}
                        onDragEnter={handleDragOver}
                      >
                         <input 
                           type="file" 
                           accept="image/*" 
                           className="hidden" 
                           ref={mobileInputRef}
                           onChange={(e) => handleFileChange(e, true)}
                         />
                         {editingBanner.mobileImageUrl ? (
                            <div className="relative w-full max-w-[200px]">
                              <img src={editingBanner.mobileImageUrl} alt="Banner Mobile" className="w-full h-auto max-h-[300px] object-contain rounded" />
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                 <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); mobileInputRef.current?.click(); }}>Alterar imagem</Button>
                              </div>
                            </div>
                         ) : (
                           <>
                             <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                               <ImageIcon className="w-8 h-8" />
                             </div>
                             <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem do banner para celular aqui</h4>
                             <p className="text-xs text-slate-500 max-w-sm mx-auto">
                               Recomendado para melhor experiência mobile. Formato JPG ou PNG.
                             </p>
                             <Input 
                                type="text" 
                                placeholder="Ou cole a URL da imagem mobile aqui..." 
                                className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                value={editingBanner.mobileImageUrl || ""}
                                onChange={e => setEditingBanner({...editingBanner, mobileImageUrl: e.target.value})}
                                onClick={e => e.stopPropagation()}
                              />
                           </>
                         )}
                      </div>
                    </div>
                    {editingBanner.formatoExtra === "2_banners" && (
                      <div className="pt-8 border-t border-slate-100 mt-8 space-y-6">
                        <h3 className="font-bold text-slate-800 text-lg">Banner Direito (50%)</h3>
                        <p className="text-sm text-slate-500">Configure a imagem e o link do segundo banner que aparecerá ao lado direito.</p>
                        
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Link do banner direito</Label>
                          <Input 
                            value={editingBanner.link2 || ""} 
                            onChange={e => setEditingBanner({...editingBanner, link2: e.target.value})}
                            placeholder="https://suafarmacia.com.br/ofertas"
                            className="h-11 border-slate-200"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Desktop</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => desktopInputRef2.current?.click()}
                            onDrop={(e) => handleDrop(e, false, 2)}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={desktopInputRef2}
                              onChange={(e) => handleFileChange(e, false, 2)}
                            />
                            {editingBanner.imageUrl2 ? (
                              <div className="relative w-full max-w-md">
                                <img src={editingBanner.imageUrl2} alt="Banner" className="w-full h-auto max-h-[200px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); desktopInputRef2.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <UploadCloud className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem do banner aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.imageUrl2 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, imageUrl2: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Mobile (Opcional)</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => mobileInputRef2.current?.click()}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={mobileInputRef2}
                              onChange={(e) => handleFileChange(e, true, 2)}
                            />
                            {editingBanner.mobileImageUrl2 ? (
                              <div className="relative w-full max-w-[200px]">
                                <img src={editingBanner.mobileImageUrl2} alt="Banner Mobile" className="w-full h-auto max-h-[300px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); mobileInputRef2.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <ImageIcon className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem mobile aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem mobile aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.mobileImageUrl2 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, mobileImageUrl2: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    {editingBanner.posicao === "Banner Diferenciais" && (
                      <div className="pt-8 border-t border-slate-100 mt-8 space-y-8">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Banner Central (Card 2)</h3>
                          <p className="text-sm text-slate-500">Configure a imagem e o link do segundo card.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Link do banner central</Label>
                          <Input 
                            value={editingBanner.link2 || ""} 
                            onChange={e => setEditingBanner({...editingBanner, link2: e.target.value})}
                            placeholder="https://suafarmacia.com.br/ofertas"
                            className="h-11 border-slate-200"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Desktop</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => desktopInputRef2.current?.click()}
                            onDrop={(e) => handleDrop(e, false, 2)}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={desktopInputRef2}
                              onChange={(e) => handleFileChange(e, false, 2)}
                            />
                            {editingBanner.imageUrl2 ? (
                              <div className="relative w-full max-w-md">
                                <img src={editingBanner.imageUrl2} alt="Banner 2" className="w-full h-auto max-h-[200px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); desktopInputRef2.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <UploadCloud className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem do banner aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.imageUrl2 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, imageUrl2: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Mobile (Opcional)</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => mobileInputRef2.current?.click()}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={mobileInputRef2}
                              onChange={(e) => handleFileChange(e, true, 2)}
                            />
                            {editingBanner.mobileImageUrl2 ? (
                              <div className="relative w-full max-w-[200px]">
                                <img src={editingBanner.mobileImageUrl2} alt="Banner Mobile 2" className="w-full h-auto max-h-[300px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); mobileInputRef2.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <ImageIcon className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem mobile aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem mobile aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.mobileImageUrl2 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, mobileImageUrl2: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100">
                          <h3 className="font-bold text-slate-800 text-lg">Banner Direito (Card 3)</h3>
                          <p className="text-sm text-slate-500">Configure a imagem e o link do terceiro card.</p>
                        </div>
                        
                        <div className="space-y-2">
                          <Label className="font-bold text-slate-700">Link do banner direito</Label>
                          <Input 
                            value={editingBanner.link3 || ""} 
                            onChange={e => setEditingBanner({...editingBanner, link3: e.target.value})}
                            placeholder="https://suafarmacia.com.br/ofertas"
                            className="h-11 border-slate-200"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Desktop</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => desktopInputRef3.current?.click()}
                            onDrop={(e) => handleDrop(e, false, 3)}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={desktopInputRef3}
                              onChange={(e) => handleFileChange(e, false, 3)}
                            />
                            {editingBanner.imageUrl3 ? (
                              <div className="relative w-full max-w-md">
                                <img src={editingBanner.imageUrl3} alt="Banner 3" className="w-full h-auto max-h-[200px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); desktopInputRef3.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <UploadCloud className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem do banner aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.imageUrl3 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, imageUrl3: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-bold text-slate-700">Imagem Mobile (Opcional)</h4>
                          </div>
                          <div 
                            className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                            onClick={() => mobileInputRef3.current?.click()}
                            onDrop={(e) => handleDrop(e, true, 3)}
                            onDragOver={handleDragOver}
                            onDragEnter={handleDragOver}
                          >
                            <input 
                              type="file" 
                              accept="image/*" 
                              className="hidden" 
                              ref={mobileInputRef3}
                              onChange={(e) => handleFileChange(e, true, 3)}
                            />
                            {editingBanner.mobileImageUrl3 ? (
                              <div className="relative w-full max-w-[200px]">
                                <img src={editingBanner.mobileImageUrl3} alt="Banner Mobile 3" className="w-full h-auto max-h-[300px] object-contain rounded" />
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded">
                                  <Button variant="outline" className="bg-white text-slate-800 border-none shadow-sm font-bold" onClick={(e) => { e.stopPropagation(); mobileInputRef3.current?.click(); }}>Alterar imagem</Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-slate-100 text-slate-400 group-hover:text-[#00B5AD] transition-colors">
                                  <ImageIcon className="w-8 h-8" />
                                </div>
                                <h4 className="font-bold text-slate-700 mb-1">Arraste e solte a imagem mobile aqui</h4>
                                <Input 
                                  type="text" 
                                  placeholder="Ou cole a URL da imagem mobile aqui..." 
                                  className="mt-6 max-w-md h-10 border-slate-200 text-center bg-white"
                                  value={editingBanner.mobileImageUrl3 || ""}
                                  onChange={e => setEditingBanner({...editingBanner, mobileImageUrl3: e.target.value})}
                                  onClick={e => e.stopPropagation()}
                                />
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 mt-4">
            {editingBanner?.id ? (
              <Button
                variant="outline"
                className="text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600"
                onClick={() => {
                  if (confirm("Deseja realmente excluir este banner?")) {
                    removeBanner(editingBanner.id!);
                    setModalOpen(false);
                    toast.success("Banner excluído.");
                  }
                }}
              >
                <Trash2 className="w-4 h-4 mr-2" /> Excluir
              </Button>
            ) : <div />}
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={saveBanner} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold">Salvar banner</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog 
        isOpen={confirmCopyOpen}
        onClose={() => setConfirmCopyOpen(false)}
        onConfirm={executeCopyGlobalBanners}
        title="pages-associadas.vercel.app diz"
        description="Isso copiará todos os banners da rede global para a sua loja. Tem certeza?"
        confirmText="OK"
        cancelText="Cancelar"
      />
    </div>
  );
}

function StoreLogoConfig() {
  const { activeStoreId, pharmacies } = useAdmin();
  const { logo, fetchConfigs, saveConfig } = useConfig();
  const [logoUrl, setLogoUrl] = useState(logo || "");

  const activeStore = pharmacies.find(p => p.id === activeStoreId);
  const isPleno = activeStore?.categoriaAssociado === 'Pleno';

  useEffect(() => {
    fetchConfigs(activeStoreId || undefined);
  }, [activeStoreId, fetchConfigs]);

  useEffect(() => {
    setLogoUrl(logo || "");
  }, [logo]);

  const handleSave = async () => {
    await saveConfig("logo", logoUrl, activeStoreId || undefined);
    toast.success("Logotipo salvo com sucesso!");
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const toastId = toast.loading("Enviando logo...");
      try {
        const compressedBlob = await compressImageToBlob(file, 600, 300, 0.9);
        const publicUrl = await uploadToStorage(compressedBlob, "logos", "logo");
        setLogoUrl(publicUrl);
        toast.success("Logo enviada com sucesso!", { id: toastId });
      } catch (err: any) {
        console.error("Erro ao enviar logo:", err);
        toast.error(`Falha no upload do logo: ${err.message || "Erro desconhecido"}`, { id: toastId });
      }
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 max-w-2xl mt-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Logotipo da Loja</h3>
          <p className="text-sm text-slate-500 mt-1">
            Personalize a logomarca que será exibida no cabeçalho da loja.
          </p>
        </div>
        {!isPleno && (
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Save className="w-4 h-4 mr-2" /> Salvar Logo
          </Button>
        )}
      </div>


      
      <div className="space-y-4">
        <div className="flex items-start gap-6">
          <div className="w-48 h-32 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50 overflow-hidden relative group">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="max-w-full max-h-full object-contain p-2" />
            ) : (
              <div className="flex flex-col items-center text-slate-400">
                <ImageIcon className="w-8 h-8 mb-2" />
                <span className="text-xs font-bold">Sem logotipo</span>
              </div>
            )}
            
            <div className={`absolute inset-0 bg-black/50 opacity-0 ${isPleno ? '' : 'group-hover:opacity-100'} transition-opacity flex flex-col items-center justify-center gap-2`}>
              <UploadCloud className="w-6 h-6 text-white" />
              <span className="text-white text-xs font-bold">Alterar imagem</span>
              {!isPleno && <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            {!isPleno && (
              <>
                <div>
                  <Label className="font-bold text-slate-700">Fazer Upload do Computador</Label>
                  <div className="relative mt-1">
                    <Input type="file" accept="image/*" onChange={handleImageUpload} className="cursor-pointer file:bg-emerald-50 file:text-emerald-700 file:border-0 file:rounded file:px-2 file:py-1 file:font-bold file:mr-2" />
                  </div>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-slate-200" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-white px-2 text-slate-400 font-bold">OU</span>
                  </div>
                </div>

                <div>
                  <Label className="font-bold text-slate-700">URL da Imagem</Label>
                  <Input value={logoUrl} onChange={e => setLogoUrl(e.target.value)} placeholder="https://..." className="mt-1" />
                </div>
              </>
            )}

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-500 shrink-0" />
              <div className="text-xs text-amber-800 leading-relaxed">
                <span className="font-bold block mb-1">Medidas Recomendadas:</span>
                Tamanho ideal: <strong className="font-black text-amber-900">250x60 pixels</strong> (formato horizontal).<br/>
                Recomendamos imagens com fundo transparente (<strong className="font-black text-amber-900">PNG</strong>) para melhor adaptação no cabeçalho.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StoreColorsConfig() {
  return (
    <div className="mt-6">
      <StoreColorManager
        showStoreSelector={true}
        title="Personalizar Cores da Loja"
        description="Escolha as cores que representarão a sua marca no site e no aplicativo."
      />
    </div>
  );
}

