import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Save, Flame, Gift, Star, Zap, ShoppingBag, Search, 
  Eye, Sparkles, Tag, Clock, ShoppingBasket, CheckCircle2
} from "lucide-react";
import { useMarketing, Promocao } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import productsData from "@/data/products.json";
import { lojas } from "@/data/stores";
import { brl } from "@/lib/format";
import { PromoCardBadge, PromoProductPageBanner, PromoLevePagueOfferBox } from "@/components/storefront/PromoCountdown";

export const Route = createFileRoute("/admin/marketing/promocoes/nova")({
  component: NovaPromocaoPage,
});

const getSafeProducts = () => Array.isArray(productsData) ? productsData : (productsData as any)?.default || [];

const ICONS = [
  { id: "flame", icon: Flame, label: "Fogo" },
  { id: "gift", icon: Gift, label: "Presente" },
  { id: "star", icon: Star, label: "Estrela" },
  { id: "zap", icon: Zap, label: "Relâmpago" },
  { id: "shopping-bag", icon: ShoppingBag, label: "Sacola" },
];

const PRESET_COLORS = [
  { label: "Laranja", bg: "#ea580c" },
  { label: "Vermelho", bg: "#dc2626" },
  { label: "Verde", bg: "#16a34a" },
  { label: "Azul", bg: "#2563eb" },
  { label: "Roxo", bg: "#7c3aed" },
  { label: "Preto", bg: "#0f172a" },
];

function NovaPromocaoPage() {
  const navigate = useNavigate();
  const search: any = useSearch({ from: "/admin/marketing/promocoes/nova" });
  const { addPromocao, updatePromocao, promocoes } = useMarketing();
  const { currentUser, selectedStoreId } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : selectedStoreId;
  
  const editingId = search?.id;
  const existing = promocoes.find((p) => p.id === editingId);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewTab, setPreviewTab] = useState<"card" | "pdp">("card");

  // Default end date tomorrow
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDateFim = tomorrow.toISOString().split("T")[0];

  const [formData, setFormData] = useState<Omit<Promocao, "id">>({
    titulo: "",
    tipoAlvo: "produtos",
    alvosId: [],
    dataFim: defaultDateFim,
    horaFim: "23:59",
    icone: "flame",
    ativa: true,
    tipoCampanha: "padrao",
    descontoPercentual: undefined,
    precoPromocional: undefined,
    levePague_quantidade: 2,
    levePague_precoPorItem: 0,
    corSelo: "#ea580c",
    corIcone: "#ea580c",
    corTextoBotao: "#ffffff",
    corBotao: "#ea580c",
    textoBotao: "COMPRAR",
    lojaId: effectiveStoreId || undefined,
  });

  const produtos = useMemo(() => getSafeProducts(), []);
  const filteredProdutos = useMemo(() => {
    if (!searchQuery.trim()) return produtos;
    const q = searchQuery.toLowerCase();
    return produtos.filter((p: any) => 
      p.nome.toLowerCase().includes(q) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.id && String(p.id).includes(q))
    );
  }, [produtos, searchQuery]);

  useEffect(() => {
    if (existing) {
      setFormData({
        titulo: existing.titulo,
        tipoAlvo: "produtos",
        alvosId: existing.alvosId || [],
        dataFim: existing.dataFim || defaultDateFim,
        horaFim: existing.horaFim || "23:59",
        icone: existing.icone || "flame",
        ativa: existing.ativa ?? true,
        tipoCampanha: existing.tipoCampanha || "padrao",
        descontoPercentual: existing.descontoPercentual,
        precoPromocional: existing.precoPromocional,
        levePague_quantidade: existing.levePague_quantidade || 2,
        levePague_precoPorItem: existing.levePague_precoPorItem || 0,
        corSelo: existing.corSelo || "#ea580c",
        corIcone: existing.corIcone || existing.corSelo || "#ea580c",
        corTextoBotao: existing.corTextoBotao || "#ffffff",
        corBotao: existing.corBotao || existing.corSelo || "#ea580c",
        textoBotao: existing.textoBotao || "COMPRAR",
        lojaId: existing.lojaId || effectiveStoreId || undefined,
      });
    }
  }, [existing]);

  // Selected sample product for live preview
  const sampleProduct = useMemo(() => {
    if (formData.alvosId.length > 0) {
      const found = produtos.find(p => formData.alvosId.includes(p.id));
      if (found) return found;
    }
    return produtos[0] || {
      id: "sample-1",
      nome: "Dipirona Monoidratada 500mg 10 Comprimidos",
      fabricante: "EMS",
      marca: "EMS",
      precoDe: 18.90,
      precoPor: 12.90,
      imagens: ["/placeholder.svg"],
    };
  }, [formData.alvosId, produtos]);

  // Computed preview prices
  const previewOriginalPrice = sampleProduct.precoPor || 19.90;
  const previewPromoPrice = useMemo(() => {
    if (formData.tipoCampanha === "leve_pague") {
      return formData.levePague_precoPorItem || (previewOriginalPrice * 0.8);
    }
    if (formData.precoPromocional && formData.precoPromocional > 0) {
      return formData.precoPromocional;
    }
    if (formData.descontoPercentual && formData.descontoPercentual > 0) {
      return previewOriginalPrice * (1 - formData.descontoPercentual / 100);
    }
    return previewOriginalPrice * 0.85;
  }, [formData, previewOriginalPrice]);

  const previewPromoObj: Promocao = useMemo(() => ({
    id: "preview-promo",
    titulo: formData.titulo || "SUPER OFERTA EXCLUSIVA",
    tipoAlvo: "produtos",
    alvosId: formData.alvosId,
    dataFim: formData.dataFim,
    horaFim: formData.horaFim,
    icone: formData.icone,
    ativa: formData.ativa,
    tipoCampanha: formData.tipoCampanha,
    descontoPercentual: formData.descontoPercentual,
    precoPromocional: formData.precoPromocional,
    levePague_quantidade: formData.levePague_quantidade,
    levePague_precoPorItem: formData.levePague_precoPorItem,
    corSelo: formData.corSelo,
    corIcone: formData.corIcone,
    corTextoBotao: formData.corTextoBotao,
    corBotao: formData.corBotao,
    textoBotao: formData.textoBotao,
    lojaId: formData.lojaId,
  }), [formData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titulo.trim()) {
      toast.error("Por favor, preencha o nome da promoção.");
      return;
    }

    if (formData.alvosId.length === 0) {
      toast.error("Selecione pelo menos um produto individual para esta promoção.");
      return;
    }
    
    if (formData.tipoCampanha !== "leve_pague" && (!formData.dataFim || !formData.horaFim)) {
      toast.error("Preencha a data e hora de encerramento da promoção.");
      return;
    }

    const payload: Omit<Promocao, "id"> = {
      ...formData,
      tipoAlvo: "produtos",
      lojaId: isGlobalAdmin ? formData.lojaId : effectiveStoreId,
    };

    if (existing) {
      updatePromocao(existing.id, payload);
      toast.success("Promoção atualizada com sucesso!");
    } else {
      addPromocao(payload);
      toast.success("Promoção cadastrada com sucesso!");
    }
    navigate({ to: "/admin/marketing/promocoes" });
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate({ to: "/admin/marketing/promocoes" })}
            className="rounded-full hover:bg-slate-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-700" />
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-900">
                {existing ? "Editar Promoção" : "Criar Nova Promoção"}
              </h1>
              <span className="bg-orange-100 text-orange-700 text-xs font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Alta Conversão
              </span>
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Configure ofertas com cronômetro regressivo ou modalidade Leve + Pague por produto.
            </p>
          </div>
        </div>

        {/* Global Admin Store Selector */}
        {isGlobalAdmin && (
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
            <span className="text-xs font-semibold text-slate-600">Aplicar na Loja:</span>
            <select
              value={formData.lojaId || ""}
              onChange={(e) => setFormData({ ...formData, lojaId: e.target.value || undefined })}
              className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
            >
              <option value="">Todas as Lojas (Global)</option>
              {lojas.map((l) => (
                <option key={l.id} value={l.id}>{l.nome}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Form Controls (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card: Dados Básicos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Tag className="h-4 w-4 text-orange-600" /> 1. Informações da Campanha
              </h2>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">Status:</span>
                <span className={`text-xs font-black uppercase px-2 py-0.5 rounded-full ${formData.ativa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'}`}>
                  {formData.ativa ? 'Ativa' : 'Inativa'}
                </span>
                <Switch 
                  checked={formData.ativa} 
                  onCheckedChange={(c) => setFormData({ ...formData, ativa: c })} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Título da Promoção / Chamada *
                </label>
                <Input 
                  value={formData.titulo} 
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })} 
                  placeholder="Ex: Oferta Relâmpago 24h, Semana da Saúde, Leve 3 Pague 2..."
                  className="h-11 border-slate-300 font-medium text-slate-900 focus-visible:ring-orange-500"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Tipo de Mecânica *
                  </label>
                  <select
                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-orange-500"
                    value={formData.tipoCampanha || "padrao"}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      tipoCampanha: e.target.value as any,
                      tipoAlvo: "produtos"
                    })}
                  >
                    <option value="padrao">⏱ Promoção com Timer + Selo</option>
                    <option value="leve_pague">🏷 Leve + Pague Menos (Combo Unitário)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Ícone Temático
                  </label>
                  <div className="flex gap-2">
                    {ICONS.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        title={item.label}
                        onClick={() => setFormData({ ...formData, icone: item.id })}
                        style={formData.icone === item.id ? { 
                          borderColor: formData.corSelo || '#ea580c', 
                          backgroundColor: (formData.corSelo || '#ea580c') + '15', 
                          color: formData.corIcone || formData.corSelo || '#ea580c'
                        } : {}}
                        className={`h-11 flex-1 rounded-lg flex items-center justify-center border-2 transition-all ${
                          formData.icone === item.id 
                            ? 'shadow-sm ring-1 ring-orange-400'
                            : 'border-slate-200 text-slate-400 hover:border-slate-300'
                        }`}
                      >
                        <item.icon className="w-5 h-5" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dynamic inputs according to campaign type */}
              {formData.tipoCampanha === "padrao" ? (
                <div className="bg-orange-50/50 border border-orange-200/80 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-orange-950 font-bold text-xs uppercase tracking-wider">
                    <Clock className="h-4 w-4 text-orange-600" />
                    Cronômetro Regressivo & Desconto
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Data de Encerramento *
                      </label>
                      <Input 
                        type="date" 
                        value={formData.dataFim} 
                        onChange={(e) => setFormData({ ...formData, dataFim: e.target.value })} 
                        className="h-10 border-slate-300 bg-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Hora de Encerramento *
                      </label>
                      <Input 
                        type="time" 
                        value={formData.horaFim} 
                        onChange={(e) => setFormData({ ...formData, horaFim: e.target.value })} 
                        className="h-10 border-slate-300 bg-white"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-orange-200/60">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Desconto em % (Opcional)
                      </label>
                      <Input 
                        type="number" 
                        min="1"
                        max="99"
                        placeholder="Ex: 25 (para 25% OFF)"
                        value={formData.descontoPercentual || ""} 
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          descontoPercentual: e.target.value ? Number(e.target.value) : undefined,
                          precoPromocional: undefined
                        })} 
                        className="h-10 border-slate-300 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Ou Preço Fixo Promocional (R$)
                      </label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 9.90"
                        value={formData.precoPromocional || ""} 
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          precoPromocional: e.target.value ? Number(e.target.value) : undefined,
                          descontoPercentual: undefined
                        })} 
                        className="h-10 border-slate-300 bg-white"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-4">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                    <ShoppingBag className="h-4 w-4 text-amber-600" />
                    Condição Leve + Pague Menos
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Quantidade Mínima (Ex: Leve 2, 3...) *
                      </label>
                      <Input 
                        type="number" 
                        min="2"
                        value={formData.levePague_quantidade || 2} 
                        onChange={(e) => setFormData({ ...formData, levePague_quantidade: Number(e.target.value) })} 
                        className="h-10 border-slate-300 bg-white font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        Preço por Unidade no Combo (R$) *
                      </label>
                      <Input 
                        type="number" 
                        step="0.01"
                        min="0.01"
                        placeholder="Ex: 8.50"
                        value={formData.levePague_precoPorItem || ""} 
                        onChange={(e) => setFormData({ ...formData, levePague_precoPorItem: Number(e.target.value) })} 
                        className="h-10 border-slate-300 bg-white font-bold"
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Card: Customização Visual & CTA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Sparkles className="h-4 w-4 text-orange-600" /> 2. Cores & Botão de Compra
            </h2>

            <div className="space-y-4">
              {/* Color Presets */}
              <div>
                <label className="text-xs font-bold text-slate-600 block mb-1.5">Temas Pré-definidos</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((c) => (
                    <button
                      key={c.bg}
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        corSelo: c.bg,
                        corIcone: c.bg,
                        corBotao: c.bg,
                      })}
                      className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-400 transition"
                    >
                      <span className="w-3.5 h-3.5 rounded-full shadow-inner" style={{ backgroundColor: c.bg }}></span>
                      <span>{c.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cor do Selo/Banner</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <input
                      type="color"
                      value={formData.corSelo || "#ea580c"}
                      onChange={(e) => setFormData({ ...formData, corSelo: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">{formData.corSelo || "#ea580c"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cor do Botão CTA</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <input
                      type="color"
                      value={formData.corBotao || "#ea580c"}
                      onChange={(e) => setFormData({ ...formData, corBotao: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">{formData.corBotao || "#ea580c"}</span>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Texto do Botão CTA</label>
                  <Input
                    value={formData.textoBotao || "COMPRAR"}
                    onChange={(e) => setFormData({ ...formData, textoBotao: e.target.value })}
                    placeholder="Ex: APROVEITAR OFERTA"
                    className="h-9 font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Seleção Estrita de Produtos Individuais */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4 text-orange-600" /> 3. Produtos Participantes *
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Selecione os produtos específicos que receberão esta promoção.</p>
              </div>
              <span className="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full">
                {formData.alvosId.length} {formData.alvosId.length === 1 ? 'produto selecionado' : 'produtos selecionados'}
              </span>
            </div>

            {/* Product Search & Quick Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="search"
                  placeholder="Pesquisar produto por nome, marca ou código..."
                  className="pl-9 h-10 border-slate-300 bg-slate-50/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              {formData.alvosId.length > 0 && (
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setFormData({ ...formData, alvosId: [] })}
                  className="h-10 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Limpar ({formData.alvosId.length})
                </Button>
              )}
            </div>

            {/* Product Checklist Scrollable */}
            <div className="border border-slate-200 rounded-xl max-h-[320px] overflow-y-auto divide-y divide-slate-100 bg-white">
              {filteredProdutos.length > 0 ? (
                filteredProdutos.map((p: any) => {
                  const isChecked = formData.alvosId.includes(p.id);
                  return (
                    <label 
                      key={p.id} 
                      className={`flex items-center gap-3.5 p-3 hover:bg-slate-50 cursor-pointer transition-colors ${isChecked ? 'bg-orange-50/40 hover:bg-orange-50/70' : ''}`}
                    >
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setFormData({ ...formData, alvosId: [...formData.alvosId, p.id] });
                          } else {
                            setFormData({ ...formData, alvosId: formData.alvosId.filter(id => id !== p.id) });
                          }
                        }}
                        className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                      />
                      <div className="w-10 h-10 rounded-lg bg-slate-100 p-1 flex items-center justify-center shrink-0 border border-slate-200">
                        <img src={p.imagens?.[0] || "/placeholder.svg"} alt={p.nome} className="w-full h-full object-contain mix-blend-multiply" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">{p.nome}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-semibold">{p.marca || p.fabricante || "Associadas"}</span>
                          <span>•</span>
                          <span className="font-bold text-emerald-700">{brl(p.precoPor || 0)}</span>
                        </div>
                      </div>
                      {isChecked && (
                        <CheckCircle2 className="h-4 w-4 text-orange-600 shrink-0" />
                      )}
                    </label>
                  );
                })
              ) : (
                <div className="p-8 text-center text-sm text-slate-500">
                  Nenhum produto encontrado para "{searchQuery}".
                </div>
              )}
            </div>
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate({ to: "/admin/marketing/promocoes" })}
              className="h-12 px-6 font-bold text-slate-700"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="h-12 px-8 bg-orange-600 hover:bg-orange-700 text-white font-bold text-base shadow-md gap-2"
            >
              <Save className="h-5 w-5" />
              Salvar Promoção
            </Button>
          </div>
        </div>

        {/* Right Live Preview Column (5 Cols) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6 space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-xl border border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-400" />
                <h3 className="font-bold text-sm text-slate-100">Prévia em Tempo Real</h3>
              </div>
              
              {/* Preview Mode Switcher */}
              <div className="flex bg-slate-800 rounded-lg p-0.5 border border-slate-700">
                <button
                  type="button"
                  onClick={() => setPreviewTab("card")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition ${previewTab === "card" ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Card da Vitrine
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("pdp")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition ${previewTab === "pdp" ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                >
                  Página do Produto
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Veja exatamente como sua promoção aparecerá para os clientes na loja virtual:
            </p>

            {/* Tab: Card da Vitrine */}
            {previewTab === "card" && (
              <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg border border-slate-200 max-w-[300px] mx-auto">
                {/* Promo Badge on Card */}
                <div className="mb-2">
                  <PromoCardBadge promo={previewPromoObj} precoOriginal={previewOriginalPrice} />
                </div>

                {/* Product Image Mock */}
                <div className="aspect-square bg-slate-50 rounded-lg p-4 flex items-center justify-center relative mb-3 border border-slate-100">
                  <img 
                    src={sampleProduct.imagens?.[0] || "/placeholder.svg"} 
                    alt={sampleProduct.nome} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Brand and Title */}
                <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
                  {sampleProduct.marca || sampleProduct.fabricante || "Marca"}
                </div>
                <div className="text-xs font-bold text-slate-800 line-clamp-2 h-8 leading-tight mb-2">
                  {sampleProduct.nome}
                </div>

                {/* Price Display */}
                {formData.tipoCampanha === "leve_pague" ? (
                  <div className="border-l-2 border-orange-500 pl-2 mb-3 bg-orange-50/50 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-orange-600">{formData.levePague_quantidade || 2} por</span>
                      <span className="text-base font-black text-slate-900">{brl(previewPromoPrice)}</span>
                      <span className="text-[10px] font-medium text-orange-600">cada</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-semibold">
                      1 un. por {brl(previewOriginalPrice)}
                    </div>
                  </div>
                ) : (
                  <div className="mb-3">
                    <div className="text-[11px] text-slate-400 line-through">
                      {brl(previewOriginalPrice)}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900">{brl(previewPromoPrice)}</span>
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                        OFERTA
                      </span>
                    </div>
                  </div>
                )}

                {/* CTA Button */}
                <button
                  type="button"
                  style={{
                    backgroundColor: formData.corBotao || "#ea580c",
                    color: formData.corTextoBotao || "#ffffff",
                  }}
                  className="w-full py-2.5 rounded-lg font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition hover:brightness-110"
                >
                  <ShoppingBasket className="h-3.5 w-3.5" />
                  <span>{formData.textoBotao || "COMPRAR"}</span>
                </button>
              </div>
            )}

            {/* Tab: Página do Produto */}
            {previewTab === "pdp" && (
              <div className="bg-white text-slate-900 rounded-xl p-4 shadow-lg border border-slate-200 space-y-4">
                <div className="text-xs font-bold text-slate-500 uppercase tracking-wider border-b pb-1">
                  Topo da Página do Produto:
                </div>

                {formData.tipoCampanha === "padrao" ? (
                  <PromoProductPageBanner 
                    promo={previewPromoObj} 
                    precoOriginal={previewOriginalPrice} 
                    precoAtual={previewPromoPrice} 
                  />
                ) : (
                  <PromoLevePagueOfferBox 
                    promo={previewPromoObj} 
                    precoOriginal={previewOriginalPrice}
                    onAddToCart={() => toast.info("Simulação: Produto adicionado!")} 
                  />
                )}

                {/* Simulated PDP CTA Area */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-600">Simulação do Botão de Compra:</div>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData.corBotao || "#ea580c",
                      color: formData.corTextoBotao || "#ffffff",
                    }}
                    className="w-full h-11 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm"
                  >
                    <ShoppingBasket className="h-4 w-4" />
                    <span>{formData.textoBotao || "COMPRAR"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
