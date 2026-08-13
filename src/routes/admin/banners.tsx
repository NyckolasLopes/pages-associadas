import { createFileRoute } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { Search, ChevronDown, Trash2, Edit2, Plus, Image as ImageIcon, LayoutTemplate, Layers, Grid, Zap, PlusCircle, GripVertical, UploadCloud, Truck, Store, Percent, ShieldCheck, Stethoscope, Thermometer, Leaf, Smile, Droplets, Battery, Wind, Heart, Sparkles, Sliders, ShoppingBag, Eye, Save, Palette, Monitor, ShoppingCart, Package, Info } from "lucide-react";
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
import { useAdmin, AdminBanner } from "@/stores/admin";
import { useConfig } from "@/stores/config";
import { useAdminProducts } from "@/stores/products";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StoreStructureViewer } from "@/components/admin/StoreStructureViewer";
import { StoreVitrinesConfig } from "@/components/admin/StoreVitrinesConfig";

const bannersSearchSchema = z.object({
  tab: z.enum(["banners", "estrutura", "vitrines", "logo", "cores"]).optional().catch("banners"),
});

export const Route = createFileRoute("/admin/banners")({
  validateSearch: (search) => bannersSearchSchema.parse(search),
  component: AdminBanners,
});

const BANNER_POSITIONS = ["Full Banner", "Mini Banner", "Banner Tarja", "Banner Categoria", "Banner Extra", "Banner Diferenciais"];

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
    case "Full Banner": return { desktop: "1800x600px", mobile: "800x800px" };
    case "Mini Banner": return { desktop: "600x600px", mobile: "600x600px" };
    case "Banner Tarja": return { desktop: "1920x200px", mobile: "800x300px" };
    case "Banner Categoria": return { desktop: "200x200px", mobile: "200x200px" };
    case "Banner Extra": return { desktop: "1200x300px", mobile: "800x300px" };
    case "Banner Diferenciais": return { desktop: "300x400px", mobile: "300x400px" };
    default: return { desktop: "Auto", mobile: "Auto" };
  }
}

function AdminBanners() {
  const addBanner = useAdmin(s => s.addBanner);
  const updateBanner = useAdmin(s => s.updateBanner);

  const activeStoreId = useAdmin(s => s.activeStoreId);
  const currentUser = useAdmin(s => s.currentUser);
  const allBanners = useAdmin(s => s.banners);
  const banners = activeStoreId ? allBanners.filter(b => b.lojaId === activeStoreId) : allBanners.filter(b => !b.lojaId);
  const setBanners = useAdmin(s => s.setBanners);
  const removeBanner = useAdmin(s => s.removeBanner);
  const fetchBanners = useAdmin(s => s.fetchBanners);
  const vitrines = useAdminProducts(s => s.vitrines);

  useEffect(() => {
    fetchBanners(activeStoreId || undefined);
  }, [activeStoreId, fetchBanners]);

  const desktopInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);

  const desktopInputRef2 = useRef<HTMLInputElement>(null);
  const mobileInputRef2 = useRef<HTMLInputElement>(null);

  const desktopInputRef3 = useRef<HTMLInputElement>(null);
  const mobileInputRef3 = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isMobile: boolean, imageIndex: number = 1) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let width = img.width;
        let height = img.height;
        
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round((height * MAX_WIDTH) / width);
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round((width * MAX_HEIGHT) / height);
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);
        
        const compressedBase64 = canvas.toDataURL("image/webp", 0.6);
        
        const fieldName = imageIndex === 1 
          ? (isMobile ? 'mobileImageUrl' : 'imageUrl')
          : imageIndex === 2
          ? (isMobile ? 'mobileImageUrl2' : 'imageUrl2')
          : (isMobile ? 'mobileImageUrl3' : 'imageUrl3');

        setEditingBanner(prev => prev ? { 
          ...prev, 
          [fieldName]: compressedBase64 
        } : null);
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
  };
  
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<AdminBanner> | null>(null);

  type TabType = "banners" | "estrutura" | "vitrines" | "logo" | "cores";

  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const validTabs: TabType[] = ["banners", "estrutura", "vitrines", "logo", "cores"];
  const currentTab: TabType = (searchParams?.tab && validTabs.includes(searchParams.tab as any))
    ? (searchParams.tab as TabType)
    : "banners";

  const [activeTab, setActiveTab] = useState<TabType>(currentTab);

  useEffect(() => {
    if (searchParams?.tab && validTabs.includes(searchParams.tab as any)) {
      setActiveTab(searchParams.tab as TabType);
    }
  }, [searchParams?.tab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    navigate({ search: (prev: any) => ({ ...prev, tab }) });
  };

  const totalBannersCount = banners.length;

  const groupedBanners = BANNER_POSITIONS.map(pos => {
    return {
      position: pos,
      items: banners.filter(b => {
        const bPos = (b.posicao || "").toLowerCase().trim();
        const pPos = pos.toLowerCase();
        return bPos === pPos || 
               bPos === pPos.replace(" ", "") || 
               (pPos === "mini banner" && bPos.includes("mini banner"));
      }).filter(b => b.nome.toLowerCase().includes(search.toLowerCase()))
    };
  });

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
      if (editingBanner.id) {
        await updateBanner(editingBanner.id, editingBanner);
        toast.success("Banner atualizado com sucesso!");
      } else {
        await addBanner({
          ...editingBanner,
          id: `banner_${Date.now()}`,
          lojaId: activeStoreId || (!currentUser?.proprietario ? currentUser?.lojasVinculadas?.[0] : undefined) || undefined,
        } as AdminBanner);
        toast.success("Banner criado com sucesso!");
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
            {activeTab === "estrutura" ? "Estrutura da Loja" : activeTab === "vitrines" ? "Minhas Vitrines" : activeTab === "logo" ? "Logotipo da Loja" : activeTab === "cores" ? "Minhas Cores" : "Banners"}
          </h2>
          <span className="text-sm font-medium text-slate-500">
            {activeTab === "estrutura" 
              ? "Panorama geral de todas as seções e blocos da sua loja" 
              : activeTab === "vitrines" 
              ? "Gerencie e organize as vitrines e carrosséis de produtos" 
              : activeTab === "logo"
              ? "Gerencie a logomarca da sua loja"
              : activeTab === "cores"
              ? "Personalize as cores da sua loja"
              : "Gerencie os banners promocionais e visuais da sua loja"}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StoreSelector className="mb-0" />
          {activeTab === "banners" && (
            <Button onClick={() => openNewModal()} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-6 rounded-lg shadow-sm">
              <Plus className="w-4 h-4 mr-2" /> Novo banner
            </Button>
          )}
        </div>
      </div>

      {/* Tab 1: Banners Content */}
      {activeTab === "banners" && (
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
          </div>
        
        <div className="p-6 space-y-10">
          {groupedBanners.map((group, groupIdx) => (
            <div key={groupIdx} className="bg-white border border-slate-200 rounded-md overflow-hidden mb-6">
              <div className="flex items-center justify-between p-4 border-b border-slate-200">
                <h3 className="font-bold text-[#3a4454] text-[17px]">{group.position}</h3>
                <button onClick={() => openNewModal(group.position)} className="flex items-center gap-1.5 text-slate-500 hover:text-slate-800 text-[13px] font-medium">
                  <PlusCircle className="w-4 h-4" /> Adicionar {group.position.toLowerCase()}
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left whitespace-nowrap">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[#556376] font-medium text-[13px]">
                      <th className="p-3 w-14 text-center">
                        <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
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
                    {group.items.map((banner) => (
                      <tr key={banner.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-3">
                            <GripVertical className="w-4 h-4 text-slate-300 cursor-grab hover:text-slate-500" />
                            <input type="checkbox" className="rounded border-slate-300 w-3.5 h-3.5" />
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
                              <span className="text-[15px] font-medium text-[#3a4454] hover:text-[#00B5AD]">{banner.nome}</span>
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
                             <Button onClick={() => openEditModal(banner)} size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-[#00B5AD] hover:bg-slate-100 transition-colors">
                               <Edit2 className="w-4 h-4" />
                             </Button>
                             <Button onClick={() => {
                               if (confirm("Deseja realmente excluir este banner?")) {
                                 removeBanner(banner.id);
                                 toast.success("Banner excluído.");
                               }
                             }} size="icon" variant="ghost" className="h-8 w-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
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
      </div>
      )}

      {/* Tab 2: Estrutura da Minha Loja (Panorama Geral) */}
      {activeTab === "estrutura" && (
        <StoreStructureViewer 
          onNavigateTab={setActiveTab} 
          onOpenNewBannerModal={openNewModal} 
        />
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
                      onValueChange={v => setEditingBanner({...editingBanner, posicao: v})}
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
                        onValueChange={v => setEditingBanner({...editingBanner, vitrineVinculada: v === "none" ? undefined : v, bannerVinculado: undefined})}
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
                        onValueChange={v => setEditingBanner({...editingBanner, bannerVinculado: v === "none" ? undefined : v, vitrineVinculada: undefined})}
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
                {editingBanner.posicao === "Banner Tarja" || editingBanner.posicao === "Banner Categoria" ? (
                  <div className="bg-orange-50 border border-orange-200 rounded p-6 space-y-4">
                    <div>
                      <h3 className="font-bold text-orange-800 text-lg">Configuração de Cartão ({editingBanner.posicao})</h3>
                      <p className="text-sm text-orange-700">
                        {editingBanner.posicao === "Banner Tarja" 
                          ? 'Os Banners Tarja são os cartões de vantagens que aparecem na loja (ex: "Compre pelo site...").' 
                          : 'Os Banners Categoria são os ícones redondos que aparecem na seção "Compre por categoria".'}
                      </p>
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
                        placeholder={editingBanner.posicao === "Banner Tarja" ? "Ou use: icon:Truck, icon:Store..." : "Ou use: icon:Thermometer ou URL da imagem (200x200)"}
                        className="bg-white"
                      />
                      <p className="text-xs text-slate-500">O texto abaixo do ícone será o "Nome do banner". Você pode fazer upload de uma imagem, colar uma URL ou usar ícones (ex: icon:Truck).</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between border-b pb-2">
                        <div>
                          <h3 className="font-bold text-slate-800 text-lg">Imagem do banner</h3>
                          <p className="text-xs text-slate-500">Essa é a imagem principal que será exibida para quem acessar pelo computador.</p>
                        </div>
                        {dimensions && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold font-mono border border-slate-200 shadow-sm">{dimensions.desktop}</span>}
                      </div>
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                        onClick={() => desktopInputRef.current?.click()}
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
                               Tamanho máximo 2MB. Para maior qualidade envie a imagem no formato JPG ou PNG.
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
                          <h3 className="font-bold text-slate-800 text-lg">Imagem do banner para celular</h3>
                          <p className="text-xs text-slate-500">Opcional. Caso adicionado, será exibida esta imagem em dispositivos móveis.</p>
                        </div>
                        {dimensions && <span className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-600 font-bold font-mono border border-slate-200 shadow-sm">{dimensions.mobile}</span>}
                      </div>
                      <div 
                        className="border-2 border-dashed border-slate-200 rounded-xl p-8 bg-slate-50 flex flex-col items-center justify-center text-center hover:bg-slate-100 transition-colors cursor-pointer group"
                        onClick={() => mobileInputRef.current?.click()}
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
    </div>
  );
}

function StoreLogoConfig() {
  const { activeStoreId } = useAdmin();
  const { logo, fetchConfigs, saveConfig } = useConfig();
  const [logoUrl, setLogoUrl] = useState(logo || "");

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const webpDataUrl = canvas.toDataURL("image/webp", 0.9);
            setLogoUrl(webpDataUrl);
          } else {
            setLogoUrl(reader.result as string);
          }
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
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
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Save className="w-4 h-4 mr-2" /> Salvar Logo
        </Button>
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
            
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
              <UploadCloud className="w-6 h-6 text-white" />
              <span className="text-white text-xs font-bold">Alterar imagem</span>
              <input type="file" accept="image/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleImageUpload} />
            </div>
          </div>

          <div className="flex-1 space-y-4">
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
  const { activeStoreId, pharmacies } = useAdmin();
  const currentPharmacy = pharmacies.find(p => p.id === activeStoreId);
  const { cores, fetchConfigs, saveConfig } = useConfig();
  
  const defaultColors = {
    primary: "#00B5AD",
    secondary: "#10b981",
    accent: "#f43f5e",
    headerBg: "#00B5AD",
    headerIcons: "#ffffff",
    searchBg: "#ffffff",
    institutionalBg: "#f97316"
  };

  const [colors, setColors] = useState<Record<string, string>>({
    ...defaultColors,
    ...cores
  });

  useEffect(() => {
    fetchConfigs(activeStoreId || undefined);
  }, [activeStoreId, fetchConfigs]);

  useEffect(() => {
    setColors({
      ...defaultColors,
      ...cores
    });
  }, [cores]);

  const handleSave = async () => {
    await saveConfig("cores", colors, activeStoreId || undefined);
    toast.success("Cores salvas com sucesso!");
  };

  const updateColor = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Personalizar Cores da Loja</h3>
          <p className="text-sm text-slate-500 mt-1">
            Escolha as cores principais que representarão a sua marca no site.
          </p>
        </div>
          <div className="flex items-center gap-3">
            {currentPharmacy && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white"
                onClick={() => {
                  const safeSlugify = (text: string) => {
                    if (!text) return "";
                    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
                  };
                  window.open(`/${safeSlugify(currentPharmacy.nome || currentPharmacy.id)}`, '_blank');
                }}
              >
                <Eye className="w-4 h-4" /> Ver na minha loja
              </Button>
            )}
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" /> Salvar Cores
            </Button>
          </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Left Column: Controles */}
        <div className="p-8 space-y-8 bg-white max-h-[800px] overflow-y-auto">
          <div>
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-400" /> Paleta Principal
            </h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.primary }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor Primária</Label>
                  <p className="text-xs text-slate-500 mb-2">A cor principal da marca (botões principais, links ativos).</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.primary || "#00B5AD"} onChange={e => updateColor("primary", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.primary || "#00B5AD"} onChange={e => updateColor("primary", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.secondary }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor Secundária</Label>
                  <p className="text-xs text-slate-500 mb-2">Usada em botões secundários, ícones de menu e rodapé.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.secondary || "#10b981"} onChange={e => updateColor("secondary", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.secondary || "#10b981"} onChange={e => updateColor("secondary", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.accent }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor de Destaque (Accent)</Label>
                  <p className="text-xs text-slate-500 mb-2">Usada para chamar atenção: descontos, preços, alertas.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.accent || "#f43f5e"} onChange={e => updateColor("accent", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.accent || "#f43f5e"} onChange={e => updateColor("accent", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-100">
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <LayoutTemplate className="w-5 h-5 text-slate-400" /> Estrutura
            </h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.headerBg || colors.primary }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Fundo do Cabeçalho</Label>
                  <p className="text-xs text-slate-500 mb-2">Cor do topo do site.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.headerBg || colors.primary} onChange={e => updateColor("headerBg", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.headerBg || colors.primary} onChange={e => updateColor("headerBg", e.target.value)} />
                  </div>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.headerIcons || "#ffffff" }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Ícones do Cabeçalho</Label>
                  <p className="text-xs text-slate-500 mb-2">Cor dos ícones de carrinho, usuário etc.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.headerIcons || "#ffffff"} onChange={e => updateColor("headerIcons", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.headerIcons || "#ffffff"} onChange={e => updateColor("headerIcons", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.searchBg || "#ffffff" }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Barra de Pesquisa</Label>
                  <p className="text-xs text-slate-500 mb-2">Cor de fundo do campo de busca.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.searchBg || "#ffffff"} onChange={e => updateColor("searchBg", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.searchBg || "#ffffff"} onChange={e => updateColor("searchBg", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.institutionalBg || "#f97316" }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Sessões Institucionais (Ex: Imagens)</Label>
                  <p className="text-xs text-slate-500 mb-2">Cor de fundo das seções institucionais (como Serviços de Saúde e Diferenciais da Farmácia).</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-10 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.institutionalBg || "#f97316"} onChange={e => updateColor("institutionalBg", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-28 h-10 text-sm" value={colors.institutionalBg || "#f97316"} onChange={e => updateColor("institutionalBg", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="p-8 bg-slate-50/50 flex flex-col items-center justify-start overflow-hidden">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 self-start">
            <Monitor className="w-5 h-5 text-slate-400" /> Demonstração na loja
          </h4>
          
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 overflow-hidden w-full max-w-[420px] scale-95 md:scale-100 origin-top">
            {/* Fake Header */}
            <div className="px-5 py-4 flex flex-col gap-4" style={{ backgroundColor: colors.headerBg || colors.primary }}>
              <div className="flex items-center justify-between">
                <div className="font-black text-xl tracking-tight flex items-center gap-2" style={{ color: colors.headerIcons || "#ffffff" }}>
                  {currentPharmacy?.logoUrl ? (
                    <img src={currentPharmacy.logoUrl} alt="Logo" className="h-6 w-auto brightness-0 invert" style={{ filter: colors.headerIcons === '#ffffff' ? 'brightness(0) invert(1)' : 'none' }} />
                  ) : (
                    <><Store className="w-6 h-6" /> LOJA</>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Search className="w-5 h-5" style={{ color: colors.headerIcons || "#ffffff" }} />
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" style={{ color: colors.headerIcons || "#ffffff" }} />
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] w-4 h-4 flex items-center justify-center rounded-full text-white font-bold" style={{ backgroundColor: colors.accent || "#f43f5e" }}>2</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-10 rounded-lg flex items-center px-4" style={{ backgroundColor: colors.searchBg || "#ffffff" }}>
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <div className="h-2 w-32 bg-slate-200 rounded"></div>
              </div>
            </div>

            {/* Fake Banner */}
            <div className="h-32 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: (colors.secondary || "#10b981") + "15" }}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-transparent"></div>
              <div className="z-10 text-center space-y-1">
                <div className="inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white mb-1" style={{ backgroundColor: colors.secondary || "#10b981" }}>OFERTAS ESPECIAIS</div>
                <div className="text-xl font-black text-slate-800">CUIDADO DIÁRIO</div>
                <div className="text-xs font-medium text-slate-500">Até 50% de desconto</div>
              </div>
            </div>

            {/* Fake Content */}
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="font-black text-base text-slate-800">Mais Pedidos</div>
                <div className="text-xs font-bold hover:opacity-80 cursor-pointer" style={{ color: colors.primary || "#00B5AD" }}>VER TODOS</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[1,2].map(i => (
                  <div key={i} className="border border-slate-100/80 shadow-sm rounded-xl p-3 hover:shadow-md transition-shadow bg-white">
                    <div className="w-full h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center relative">
                      <div className="absolute top-1 left-1 bg-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 text-amber-500">
                        <Monitor className="w-2 h-2 fill-amber-500" /> 4.9
                      </div>
                      <img src="https://placehold.co/100x100/e2e8f0/94a3b8?text=Produto" className="w-16 h-16 object-contain rounded-md mix-blend-multiply" alt="produto" />
                    </div>
                    <div className="h-2 w-20 bg-slate-200 rounded mb-1.5"></div>
                    <div className="h-2 w-12 bg-slate-100 rounded mb-3"></div>
                    <div className="text-[10px] text-slate-400 line-through mb-0.5">R$ 29,90</div>
                    <div className="font-black text-base leading-none mb-3" style={{ color: colors.accent || "#f43f5e" }}>R$ 19,90</div>
                    <div className="w-full h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm cursor-pointer" style={{ backgroundColor: colors.primary || "#00B5AD" }}>
                      COMPRAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fake Institutional (Improved based on screenshot) */}
            <div className="px-6 py-8 flex flex-col items-center justify-center text-center mt-2" style={{ backgroundColor: colors.institutionalBg || "#f97316" }}>
              <div className="font-black text-white text-xl mb-1">Farmácias Associadas</div>
              <div className="font-medium text-white/90 text-[11px] mb-6 max-w-[250px] leading-relaxed">
                Farmácias Associadas, muito mais que farmácia, aqui você tem amigos.
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center mb-2 shadow-sm transform hover:scale-105 transition-transform w-12 h-12">
                    <Heart className="w-6 h-6" style={{ color: colors.institutionalBg || "#f97316" }} />
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight">Atendimento Humanizado</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center mb-2 shadow-sm transform hover:scale-105 transition-transform w-12 h-12">
                    <Truck className="w-6 h-6" style={{ color: colors.institutionalBg || "#f97316" }} />
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight">Entrega Rápida</div>
                </div>
              </div>
            </div>

          </div>
        </div>      </div>
    </div>
  );
}
