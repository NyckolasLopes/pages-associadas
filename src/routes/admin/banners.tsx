import { createFileRoute } from "@tanstack/react-router";
import { Search, ChevronDown, Trash2, Edit2, Plus, Image as ImageIcon, LayoutTemplate, Layers, Grid, Zap, PlusCircle, GripVertical, UploadCloud, Truck, Store, Percent, ShieldCheck, Stethoscope, Thermometer, Leaf, Smile, Droplets, Battery, Wind, Heart, Sparkles, Sliders, ShoppingBag, Eye } from "lucide-react";
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
import { useAdminProducts } from "@/stores/products";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { StoreStructureViewer } from "@/components/admin/StoreStructureViewer";
import { StoreVitrinesConfig } from "@/components/admin/StoreVitrinesConfig";

const bannersSearchSchema = z.object({
  tab: z.enum(["banners", "estrutura", "vitrines"]).optional().catch("banners"),
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

  const banners = useAdmin(s => s.banners);
  const setBanners = useAdmin(s => s.setBanners);
  const removeBanner = useAdmin(s => s.removeBanner);
  const vitrines = useAdminProducts(s => s.vitrines);

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

  const searchParams = Route.useSearch();
  const navigate = Route.useNavigate();
  const currentTab = (searchParams?.tab && ["banners", "estrutura", "vitrines"].includes(searchParams.tab))
    ? (searchParams.tab as "banners" | "estrutura" | "vitrines")
    : "banners";

  const [activeTab, setActiveTab] = useState<"banners" | "estrutura" | "vitrines">(currentTab);

  useEffect(() => {
    if (searchParams?.tab && ["banners", "estrutura", "vitrines"].includes(searchParams.tab)) {
      setActiveTab(searchParams.tab as "banners" | "estrutura" | "vitrines");
    }
  }, [searchParams?.tab]);

  const handleTabChange = (tab: "banners" | "estrutura" | "vitrines") => {
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

  const saveBanner = () => {
    if (!editingBanner?.nome || !editingBanner?.posicao || !editingBanner?.paginaPublicacao) {
      toast.error("Preencha os campos obrigatórios (Nome, Posição e Página)");
      return;
    }

    if (editingBanner.id) {
      updateBanner(editingBanner.id, editingBanner);
      toast.success("Banner atualizado com sucesso!");
    } else {
      addBanner({
        ...editingBanner,
        id: `banner_${Date.now()}`,
      } as AdminBanner);
      toast.success("Banner criado com sucesso!");
    }
    setModalOpen(false);
  };

  const dimensions = editingBanner?.posicao ? getDimensionsForPosition(editingBanner.posicao) : null;

  return (
    <div className="max-w-6xl space-y-6 pb-20">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col">
          <h2 className="text-[22px] font-bold text-[#1a1a1a]">Personalizar Minha Loja</h2>
          <span className="text-sm font-medium text-slate-500">
            Gerencie o visual da sua loja, banners promocionais e vitrines de produtos
          </span>
        </div>
        {activeTab === "banners" && (
          <Button onClick={() => openNewModal()} className="bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold h-10 px-6 rounded-lg shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Novo banner
          </Button>
        )}
      </div>

      {/* Modern Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange("banners")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "banners"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeTab === "banners" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {totalBannersCount}
          </span>
        </button>

        <button
          onClick={() => handleTabChange("estrutura")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "estrutura"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Estrutura da Minha Loja
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            activeTab === "estrutura" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}>
            Panorama Geral
          </span>
        </button>

        <button
          onClick={() => handleTabChange("vitrines")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeTab === "vitrines"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Minhas Vitrines
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            activeTab === "vitrines" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
          }`}>
            Produtos
          </span>
        </button>
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
