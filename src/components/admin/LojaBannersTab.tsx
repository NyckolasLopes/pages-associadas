import { useState } from "react";
import { useAdmin, type AdminBanner } from "@/stores/admin";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Link as LinkIcon, 
  Eye, 
  EyeOff, 
  LayoutTemplate, 
  ShoppingBag,
  Sparkles,
  Store
} from "lucide-react";
import { sanitizeText } from "@/lib/security";
import { checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { StoreStructureViewer } from "./StoreStructureViewer";
import { StoreVitrinesConfig } from "./StoreVitrinesConfig";

export function LojaBannersTab({ lojaId }: { lojaId: string }) {
  const { banners, addBanner, removeBanner, updateBanner, pharmacies } = useAdmin();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  const [activeSubTab, setActiveSubTab] = useState<"banners" | "estrutura" | "vitrines">("banners");

  // Filtra banners exclusivos desta loja ou globais com filtro de loja
  const lojaBanners = banners.filter((b) => b.lojaId === lojaId || b.farmaciaId === lojaId);

  const [title, setTitle] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [posicao, setPosicao] = useState<"principal" | "secundario" | "rodape">("principal");

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      checkRateLimitOrThrow(`banner_add_${lojaId}`, RATE_LIMIT_PRESETS.SPREADSHEET_IMPORT);

      const cleanTitle = sanitizeText(title, 80);
      const cleanImage = imageUrl.trim();
      const cleanLink = sanitizeText(linkUrl, 200).trim();

      if (!cleanTitle) {
        toast.error("Informe um título para o banner.");
        return;
      }
      if (!cleanImage) {
        toast.error("Informe a URL da imagem do banner.");
        return;
      }

      const newBanner: AdminBanner = {
        id: `banner-${Date.now()}`,
        titulo: cleanTitle,
        imagemUrl: cleanImage,
        linkUrl: cleanLink || "/",
        ativo: true,
        posicao: posicao,
        lojaId: lojaId,
        farmaciaId: lojaId,
        ordem: lojaBanners.length + 1,
        localizacao: {
          uf: pharmacy?.uf || "RS",
          cidade: pharmacy?.cidade || "Porto Alegre",
        },
      };

      addBanner(newBanner);
      toast.success("Banner adicionado com sucesso!");

      setTitle("");
      setImageUrl("");
      setLinkUrl("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao adicionar banner.");
    }
  };

  const handleToggleBanner = (banner: AdminBanner) => {
    updateBanner({ ...banner, ativo: !banner.ativo });
    toast.success(`Banner ${!banner.ativo ? "ativado" : "desativado"} com sucesso!`);
  };

  const handleDeleteBanner = (id: string) => {
    removeBanner(id);
    toast.success("Banner removido.");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-[#00B5AD]/10 p-2.5 rounded-xl text-[#00B5AD]">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Personalizar Minha Loja</h2>
            <p className="text-sm text-slate-500">
              Personalize banners regionais, confira a estrutura visual e configure as vitrines para {pharmacy?.nome || "sua unidade"}.
            </p>
          </div>
        </div>
      </div>

      {/* Sub-abas de Navegação */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("banners")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeSubTab === "banners"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ImageIcon className="w-4 h-4" />
          Banners
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            activeSubTab === "banners" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
          }`}>
            {lojaBanners.length}
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("estrutura")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeSubTab === "estrutura"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <LayoutTemplate className="w-4 h-4" />
          Estrutura da Minha Loja
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            activeSubTab === "estrutura" ? "bg-white/20 text-white" : "bg-amber-100 text-amber-800"
          }`}>
            Panorama Geral
          </span>
        </button>

        <button
          onClick={() => setActiveSubTab("vitrines")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-sm transition-all ${
            activeSubTab === "vitrines"
              ? "bg-[#00B5AD] text-white shadow-sm"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Minhas Vitrines
          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
            activeSubTab === "vitrines" ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
          }`}>
            Produtos
          </span>
        </button>
      </div>

      {/* Sub-aba 1: Banners */}
      {activeSubTab === "banners" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Form para Adicionar Banner */}
          <Card className="border-slate-200 shadow-sm lg:col-span-1">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-bold">Novo Banner da Loja</CardTitle>
              <CardDescription>Cadastre imagens promocionais regionais</CardDescription>
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <form onSubmit={handleAddBanner} className="space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs font-bold">Título do Banner</Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Ofertas Especiais da Farmácia"
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">URL da Imagem</Label>
                  <Input
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    placeholder="https://exemplo.com/banner.jpg"
                    className="text-sm"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Link de Redirecionamento (Opcional)</Label>
                  <Input
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Ex: /categoria/medicamentos"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs font-bold">Posição</Label>
                  <select
                    value={posicao}
                    onChange={(e: any) => setPosicao(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  >
                    <option value="principal">Carrossel Principal (Topo)</option>
                    <option value="secundario">Banner Secundário (Meio)</option>
                    <option value="rodape">Banner de Rodapé</option>
                  </select>
                </div>

                {imageUrl && (
                  <div className="mt-3 border rounded-xl p-2 bg-slate-50">
                    <p className="text-[11px] font-bold text-slate-500 mb-1">Pré-visualização:</p>
                    <img
                      src={imageUrl}
                      alt="Preview"
                      className="w-full h-24 object-cover rounded-lg"
                      onError={(e) => ((e.target as HTMLElement).style.display = "none")}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full bg-[#00B5AD] hover:bg-[#009c95] text-white font-bold gap-2 mt-2">
                  <Plus className="w-4 h-4" />
                  Cadastrar Banner
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Lista de Banners Ativos */}
          <Card className="border-slate-200 shadow-sm lg:col-span-2">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-lg font-bold">Banners Cadastrados</CardTitle>
              <CardDescription>
                {lojaBanners.length} banner(s) exclusivo(s) para {pharmacy?.nome || "sua unidade"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4">
              {lojaBanners.length === 0 ? (
                <div className="py-12 text-center text-slate-400 space-y-2">
                  <ImageIcon className="w-10 h-10 mx-auto opacity-30" />
                  <p className="text-sm font-bold">Nenhum banner cadastrado para esta loja.</p>
                  <p className="text-xs text-slate-400">Preencha o formulário ao lado para adicionar o primeiro banner.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {lojaBanners.map((b) => (
                    <div key={b.id} className="border rounded-2xl overflow-hidden bg-white shadow-sm flex flex-col justify-between">
                      <div>
                        <div className="relative h-32 bg-slate-100">
                          <img src={b.imagemUrl} alt={b.titulo} className="w-full h-full object-cover" />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-sm ${
                            b.ativo ? "bg-emerald-600 text-white" : "bg-slate-500 text-white"
                          }`}>
                            {b.ativo ? "Ativo" : "Pausado"}
                          </span>
                        </div>
                        <div className="p-3">
                          <h4 className="font-bold text-sm text-slate-900 truncate">{b.titulo}</h4>
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 truncate">
                            <LinkIcon className="w-3 h-3 shrink-0" />
                            {b.linkUrl || "Sem link"}
                          </p>
                        </div>
                      </div>

                      <div className="p-3 border-t bg-slate-50 flex items-center justify-between">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleToggleBanner(b)}
                          className="text-xs font-bold gap-1 h-8"
                        >
                          {b.ativo ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          {b.ativo ? "Desativar" : "Ativar"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteBanner(b.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Sub-aba 2: Estrutura da Minha Loja (Panorama Geral) */}
      {activeSubTab === "estrutura" && (
        <StoreStructureViewer onNavigateTab={setActiveSubTab} />
      )}

      {/* Sub-aba 3: Minhas Vitrines (Configuração & Produtos) */}
      {activeSubTab === "vitrines" && (
        <StoreVitrinesConfig />
      )}
    </div>
  );
}
