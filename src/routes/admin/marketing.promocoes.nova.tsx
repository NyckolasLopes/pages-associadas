// @ts-nocheck
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { StoreSelector } from "@/components/admin/StoreSelector";
import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  ArrowLeft, Save, Flame, Gift, Star, Zap, ShoppingBag, Search, 
  Eye, Tag, Clock, ShoppingBasket, CheckCircle2,
  Percent, ArrowRight, Layers, HelpCircle
} from "lucide-react";
import { useMarketing, Promocao, LevePagueProdutoConfig } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import productsData from "@/data/products.json";
import { lojas } from "@/data/stores";
import { brl } from "@/lib/format";
import { PromoCardBadge, PromoProductPageBanner, PromoLevePagueOfferBox } from "@/components/storefront/PromoCountdown";

export const Route = createFileRoute("/admin/marketing/promocoes/nova")({
  component: NovaPromocaoPage,
});

import { useAdminProducts } from "@/stores/products";
import { useAdminCategories } from "@/stores/categories";
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
  const { currentUser, activeStoreId } = useAdmin();
  const selectedStoreId = activeStoreId || "1";
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

  const { getStoreEffectiveProducts } = useAdminProducts();
  const produtos = useMemo(() => getStoreEffectiveProducts(effectiveStoreId), [getStoreEffectiveProducts, effectiveStoreId]);
  const { getStoreCategories } = useAdminCategories();
  const categorias = useMemo(() => getStoreCategories(effectiveStoreId), [getStoreCategories, effectiveStoreId]);

  // Per-product configuration state for Leve + Pague
  const [produtosConfig, setProdutosConfig] = useState<Record<string, LevePagueProdutoConfig>>({});
  const [batchQtd, setBatchQtd] = useState<number>(2);
  const [batchDescontoPct, setBatchDescontoPct] = useState<number>(20);
  const [selectedPreviewProductId, setSelectedPreviewProductId] = useState<string>("");

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
    produtosConfig: {},
    corSelo: "#ea580c",
    corIcone: "#ffffff",
    corTextoBotao: "#ffffff",
    corBotao: "#ea580c",
    textoBotao: "COMPRAR",
    lojaId: effectiveStoreId || undefined,
  });

  const filteredProdutos = useMemo(() => {
    if (!searchQuery.trim()) return produtos;
    const q = searchQuery.toLowerCase();
    return produtos.filter((p: any) => 
      p.nome.toLowerCase().includes(q) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.id && String(p.id).includes(q))
    );
  }, [produtos, searchQuery]);

  const filteredCategorias = useMemo(() => {
    if (!searchQuery.trim()) return categorias;
    const q = searchQuery.toLowerCase();
    return categorias.filter((c: any) => 
      c.nome.toLowerCase().includes(q) || 
      (c.id && String(c.id).includes(q))
    );
  }, [categorias, searchQuery]);

  useEffect(() => {
    if (existing) {
      const initialConfigs = existing.produtosConfig || {};
      setProdutosConfig(initialConfigs);
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
        produtosConfig: initialConfigs,
        corSelo: existing.corSelo || "#ea580c",
        corIcone: existing.corIcone && existing.corIcone !== existing.corSelo ? existing.corIcone : "#ffffff",
        corTextoBotao: existing.corTextoBotao || "#ffffff",
        corBotao: existing.corBotao || existing.corSelo || "#ea580c",
        textoBotao: existing.textoBotao || "COMPRAR",
        lojaId: existing.lojaId || effectiveStoreId || undefined,
      });
      if (existing.alvosId && existing.alvosId.length > 0) {
        setSelectedPreviewProductId(existing.alvosId[0]);
      }
    }
  }, [existing]);

  // Helper to get or auto-initialize config for a given product
  const getProductConfig = (prodId: string, prodPrecoPor: number): LevePagueProdutoConfig => {
    if (produtosConfig[prodId]) {
      return produtosConfig[prodId];
    }
    const defaultPreco = +(prodPrecoPor * 0.85).toFixed(2);
    return {
      quantidade: formData.levePague_quantidade || 2,
      precoPorItem: defaultPreco,
    };
  };

  const updateSingleProductConfig = (prodId: string, key: keyof LevePagueProdutoConfig, val: number) => {
    setProdutosConfig(prev => ({
      ...prev,
      [prodId]: {
        ...(prev[prodId] || { quantidade: 2, precoPorItem: 0 }),
        [key]: val
      }
    }));
  };

  const applyBatchQuantity = () => {
    if (!batchQtd || batchQtd < 2) {
      toast.error("A quantidade mínima deve ser de pelo menos 2 unidades.");
      return;
    }
    setProdutosConfig(prev => {
      const next = { ...prev };
      formData.alvosId.forEach(id => {
        const prod = produtos.find((p: any) => p.id === id);
        const originalPreco = prod?.precoPor || 10;
        const current = next[id] || { quantidade: batchQtd, precoPorItem: +(originalPreco * 0.85).toFixed(2) };
        next[id] = { ...current, quantidade: batchQtd };
      });
      return next;
    });
    toast.success(`Quantidade (${batchQtd} un) aplicada a todos os produtos selecionados!`);
  };

  const applyBatchDiscount = () => {
    if (!batchDescontoPct || batchDescontoPct <= 0 || batchDescontoPct >= 100) {
      toast.error("Informe uma porcentagem válida de desconto (1% a 99%).");
      return;
    }
    setProdutosConfig(prev => {
      const next = { ...prev };
      formData.alvosId.forEach(id => {
        const prod = produtos.find((p: any) => p.id === id);
        const originalPreco = prod?.precoPor || 10;
        const novoPrecoItem = +(originalPreco * (1 - batchDescontoPct / 100)).toFixed(2);
        const current = next[id] || { quantidade: batchQtd || 2, precoPorItem: novoPrecoItem };
        next[id] = { ...current, precoPorItem: novoPrecoItem };
      });
      return next;
    });
    toast.success(`Desconto de ${batchDescontoPct}% no combo aplicado a todos os produtos!`);
  };

  // Selected sample product for live preview
  const sampleProduct = useMemo(() => {
    if (selectedPreviewProductId) {
      const found = produtos.find((p: any) => p.id === selectedPreviewProductId);
      if (found) return found;
    }
    if (formData.alvosId.length > 0) {
      const found = produtos.find((p: any) => formData.alvosId.includes(p.id));
      if (found) return found;
    }
    return produtos[0] || {
      id: "sample-1",
      nome: "Dipirona Monoidratada 500mg 10 Comprimidos",
      marca: "EMS",
      // @ts-ignore
      marca: "EMS",
      precoDe: 18.90,
      precoPor: 12.90,
      imagens: ["/placeholder.svg"],
    };
  }, [selectedPreviewProductId, formData.alvosId, produtos]);

  // Computed preview prices for the selected sample product
  const previewOriginalPrice = sampleProduct.precoPor || 19.90;
  const sampleConfig = useMemo(() => {
    return getProductConfig(sampleProduct.id, previewOriginalPrice);
  }, [sampleProduct, previewOriginalPrice, produtosConfig]);

  const previewPromoPrice = useMemo(() => {
    if (formData.tipoCampanha === "leve_pague") {
      return sampleConfig.precoPorItem || (previewOriginalPrice * 0.85);
    }
    if (formData.precoPromocional && formData.precoPromocional > 0) {
      return formData.precoPromocional;
    }
    if (formData.descontoPercentual && formData.descontoPercentual > 0) {
      return previewOriginalPrice * (1 - formData.descontoPercentual / 100);
    }
    return previewOriginalPrice * 0.85;
  }, [formData, sampleConfig, previewOriginalPrice]);

  const previewPromoObj: Promocao = useMemo(() => ({
    id: "preview-promo",
    titulo: formData.titulo || "OFERTA EXCLUSIVA",
    tipoAlvo: "produtos",
    alvosId: formData.alvosId,
    dataFim: formData.dataFim,
    horaFim: formData.horaFim,
    icone: formData.icone,
    ativa: formData.ativa,
    tipoCampanha: formData.tipoCampanha,
    descontoPercentual: formData.descontoPercentual,
    precoPromocional: formData.precoPromocional,
    levePague_quantidade: sampleConfig.quantidade || 2,
    levePague_precoPorItem: sampleConfig.precoPorItem || +(previewOriginalPrice * 0.85).toFixed(2),
    produtosConfig: produtosConfig,
    corSelo: formData.corSelo,
    corIcone: formData.corIcone,
    corTextoBotao: formData.corTextoBotao,
    corBotao: formData.corBotao,
    textoBotao: formData.textoBotao,
    lojaId: formData.lojaId,
  }), [formData, sampleConfig, produtosConfig, previewOriginalPrice]);

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

    // Prepare per-product configs ensuring all selected products have valid data
    const finalProdutosConfig: Record<string, LevePagueProdutoConfig> = {};
    if (formData.tipoCampanha === "leve_pague") {
      formData.alvosId.forEach(id => {
        const prod = produtos.find((p: any) => p.id === id);
        const originalPreco = prod?.precoPor || 10;
        const cfg = produtosConfig[id] || {
          quantidade: formData.levePague_quantidade || 2,
          precoPorItem: +(originalPreco * 0.85).toFixed(2)
        };
        finalProdutosConfig[id] = {
          quantidade: Number(cfg.quantidade) || 2,
          precoPorItem: Number(cfg.precoPorItem) || +(originalPreco * 0.85).toFixed(2),
        };
      });
    }

    const firstConfig = formData.alvosId.length > 0 && finalProdutosConfig[formData.alvosId[0]];

    const payload: Omit<Promocao, "id"> = {
      ...formData,
      tipoAlvo: "produtos",
      produtosConfig: formData.tipoCampanha === "leve_pague" ? finalProdutosConfig : undefined,
      levePague_quantidade: firstConfig ? firstConfig.quantidade : formData.levePague_quantidade,
      levePague_precoPorItem: firstConfig ? firstConfig.precoPorItem : formData.levePague_precoPorItem,
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
            </div>
            <p className="text-slate-500 text-sm mt-0.5">
              Configure ofertas com cronômetro regressivo ou modalidade Leve + Pague com preço por produto.
            </p>
          </div>
        </div>
        <StoreSelector className="mb-0" />

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
                <option key={l.id} value={l.id}>{l.nomeFantasia}</option>
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
                  placeholder="Ex: Leve Mais e Pague Menos, Oferta Relâmpago 24h..."
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
                    <option value="leve_pague">🏷 Leve + Pague Menos (Preço e Qtd por Produto)</option>
                    <option value="padrao">⏱ Promoção Padrão com Timer + Selo</option>
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
                <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                    <ShoppingBasket className="h-4 w-4 text-amber-600" />
                    Mecânica Leve Mais e Pague Menos Individualizada
                  </div>
                  <p className="text-xs text-amber-900 leading-relaxed">
                    Você pode selecionar múltiplos produtos e definir para <strong>cada produto</strong> a sua própria quantidade mínima do pacote e o respectivo preço unitário promocional.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Card: Customização Visual & CTA */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 border-b pb-3">
              <Eye className="h-4 w-4 text-orange-600" /> 2. Cores & Botão de Compra
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
                        corIcone: "#ffffff",
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

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
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
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cor do Timer</label>
                  <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                    <input
                      type="color"
                      value={formData.corTimer || "#0f172a"}
                      onChange={(e) => setFormData({ ...formData, corTimer: e.target.value })}
                      className="h-8 w-8 rounded cursor-pointer border-0 p-0"
                    />
                    <span className="text-xs font-mono font-bold text-slate-700 uppercase">{formData.corTimer || "#0f172a"}</span>
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
                    placeholder="Ex: COMPRAR COMBO"
                    className="h-9 font-bold text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Card: Seleção de Alvos */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <ShoppingBasket className="h-4 w-4 text-orange-600" /> 3. Itens Participantes *
                </h2>
                <div className="flex items-center gap-6 mt-3">
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 font-medium">
                    <input 
                      type="radio" 
                      name="tipoAlvo" 
                      value="produtos" 
                      checked={formData.tipoAlvo === "produtos"} 
                      onChange={() => setFormData({ ...formData, tipoAlvo: "produtos", alvosId: [] })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-600 border-slate-300"
                    /> Produtos Específicos
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer text-slate-700 font-medium">
                    <input 
                      type="radio" 
                      name="tipoAlvo" 
                      value="categorias" 
                      checked={formData.tipoAlvo === "categorias"} 
                      onChange={() => setFormData({ ...formData, tipoAlvo: "categorias", alvosId: [] })}
                      className="w-4 h-4 text-orange-600 focus:ring-orange-600 border-slate-300"
                    /> Categorias Inteiras
                  </label>
                </div>
              </div>
              <span className="text-xs font-black bg-orange-100 text-orange-800 px-3 py-1 rounded-full whitespace-nowrap self-start sm:self-auto mt-1">
                {formData.alvosId.length} {formData.tipoAlvo === "produtos" 
                  ? (formData.alvosId.length === 1 ? 'produto selecionado' : 'produtos selecionados')
                  : (formData.alvosId.length === 1 ? 'categoria selecionada' : 'categorias selecionadas')}
              </span>
            </div>

            {/* Product Search & Quick Actions */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <Input 
                  type="search"
                  placeholder={formData.tipoAlvo === "produtos" ? "Pesquisar produto por nome, marca ou código..." : "Pesquisar categoria por nome..."}
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
                  onClick={() => {
                    setFormData({ ...formData, alvosId: [] });
                    setProdutosConfig({});
                  }}
                  className="h-10 text-xs font-bold text-red-600 hover:bg-red-50"
                >
                  Limpar ({formData.alvosId.length})
                </Button>
              )}
            </div>

            {/* Item Checklist Scrollable */}
            <div className="border border-slate-200 rounded-xl max-h-[260px] overflow-y-auto divide-y divide-slate-100 bg-white">
              {formData.tipoAlvo === "produtos" ? (
                filteredProdutos.length > 0 ? (
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
                              if (!selectedPreviewProductId) setSelectedPreviewProductId(p.id);
                              // initialize config for this product if not set
                              if (!produtosConfig[p.id]) {
                                setProdutosConfig(prev => ({
                                  ...prev,
                                  [p.id]: {
                                    quantidade: 2,
                                    precoPorItem: +(p.precoPor * 0.85).toFixed(2)
                                  }
                                }));
                              }
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
                            <span className="font-semibold">{p.marca || "Associadas"}</span>
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
                )
              ) : (
                filteredCategorias.length > 0 ? (
                  filteredCategorias.map((c: any) => {
                    const isChecked = formData.alvosId.includes(c.id);
                    return (
                      <label 
                        key={c.id} 
                        className={`flex items-center gap-3.5 p-3 hover:bg-slate-50 cursor-pointer transition-colors ${isChecked ? 'bg-orange-50/40 hover:bg-orange-50/70' : ''}`}
                      >
                        <input 
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setFormData({ ...formData, alvosId: [...formData.alvosId, c.id] });
                            } else {
                              setFormData({ ...formData, alvosId: formData.alvosId.filter(id => id !== c.id) });
                            }
                          }}
                          className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 accent-orange-600 cursor-pointer"
                        />
                        <div className="flex-1 min-w-0 py-1">
                          <div className="text-sm font-bold text-slate-900 truncate">{c.nome}</div>
                        </div>
                        {isChecked && (
                          <CheckCircle2 className="h-4 w-4 text-orange-600 shrink-0" />
                        )}
                      </label>
                    );
                  })
                ) : (
                  <div className="p-8 text-center text-sm text-slate-500">
                    Nenhuma categoria encontrada para "{searchQuery}".
                  </div>
                )
              )}
            </div>
          </div>

          {/* Section: Configuração Individual por Produto (Quando Leve + Pague) */}
          {formData.tipoCampanha === "leve_pague" && formData.alvosId.length > 0 && (
            <div className="bg-white border-2 border-orange-300/80 rounded-2xl p-6 shadow-sm space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-orange-100 pb-3">
                <div>
                  <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-orange-600" /> 4. Preço e Quantidade por Produto
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Defina a quantidade mínima e o preço unitário do combo para cada produto selecionado.
                  </p>
                </div>
              </div>

              {/* Batch Actions Bar */}
              <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-3.5 space-y-3">
                <div className="text-xs font-bold text-orange-950 uppercase tracking-wide flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-orange-600" /> Ações em Massa (Preencher Todos)
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="2"
                        value={batchQtd}
                        onChange={(e) => setBatchQtd(Number(e.target.value))}
                        className="h-9 text-xs font-bold bg-white"
                        placeholder="Qtd (ex: 3)"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyBatchQuantity}
                      className="h-9 text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white flex-1"
                    >
                      Aplicar Quantidade p/ Todos
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-24">
                      <Input
                        type="number"
                        min="1"
                        max="99"
                        value={batchDescontoPct}
                        onChange={(e) => setBatchDescontoPct(Number(e.target.value))}
                        className="h-9 text-xs font-bold bg-white"
                        placeholder="% OFF"
                      />
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={applyBatchDiscount}
                      className="h-9 text-xs font-bold bg-emerald-700 hover:bg-emerald-800 text-white flex-1"
                    >
                      Aplicar % Desconto p/ Todos
                    </Button>
                  </div>
                </div>
              </div>

              {/* Individual Products Configuration Rows */}
              <div className="space-y-3">
                {formData.alvosId.map(id => {
                  const prod = produtos.find((p: any) => p.id === id);
                  if (!prod) return null;
                  const originalPrice = prod.precoPor || 10;
                  const cfg = getProductConfig(id, originalPrice);
                  const totalCombo = cfg.quantidade * cfg.precoPorItem;
                  const totalOriginal = cfg.quantidade * originalPrice;
                  const economia = Math.max(0, totalOriginal - totalCombo);
                  const descontoPct = originalPrice > 0 ? Math.round((1 - cfg.precoPorItem / originalPrice) * 100) : 0;

                  return (
                    <div 
                      key={id} 
                      className="bg-slate-50 border border-slate-200 rounded-xl p-4 hover:border-orange-300 transition-colors space-y-3"
                    >
                      {/* Product Header */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-white p-1 flex items-center justify-center shrink-0 border border-slate-200">
                            // @ts-ignore
                            <img src={prod.imagens?.[0] || "/placeholder.svg"} alt={prod.nome} className="w-full h-full object-contain mix-blend-multiply" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">{prod.nome}</div>
                            <div className="text-[11px] text-slate-500">
                              Preço Original: <strong className="text-slate-800">{brl(originalPrice)}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Economy Tag */}
                        {economia > 0 && (
                          <div className="text-right shrink-0">
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[11px] px-2 py-0.5 rounded-full">
                              -{descontoPct}% OFF ({brl(economia)} total)
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Inputs Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-200/70">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Quantidade Mínima (Leve X) *
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              min="2"
                              value={cfg.quantidade}
                              onChange={(e) => updateSingleProductConfig(id, "quantidade", Number(e.target.value))}
                              className="h-10 bg-white font-bold text-slate-900 text-sm"
                            />
                            <span className="text-xs font-semibold text-slate-500 shrink-0">unidades</span>
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Preço por Unidade no Combo (R$) *
                          </label>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.01"
                              min="0.01"
                              value={cfg.precoPorItem}
                              onChange={(e) => updateSingleProductConfig(id, "precoPorItem", Number(e.target.value))}
                              className="h-10 bg-white font-black text-orange-600 text-sm"
                            />
                            <span className="text-xs font-semibold text-slate-500 shrink-0">cada</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary calculation pill */}
                      <div className="bg-white border border-slate-200/80 rounded-lg px-3 py-2 text-xs flex items-center justify-between text-slate-600">
                        <span>
                          Total: <strong>{cfg.quantidade} un.</strong> x <strong>{brl(cfg.precoPorItem)}</strong> = <strong className="text-slate-900">{brl(totalCombo)}</strong>
                        </span>
                        <span className="text-emerald-700 font-bold">
                          Economia: {brl(economia)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

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
          <div className="bg-white text-slate-900 rounded-2xl p-5 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-orange-600" />
                <h3 className="font-black text-sm text-slate-900">Promo na minha loja</h3>
              </div>
              
              {/* Preview Mode Switcher */}
              <div className="flex bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                <button
                  type="button"
                  onClick={() => setPreviewTab("card")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition ${previewTab === "card" ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Card Vitrine
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewTab("pdp")}
                  className={`text-xs font-bold px-3 py-1 rounded-md transition ${previewTab === "pdp" ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  Página Produto
                </button>
              </div>
            </div>

            {/* Selector for which selected product to preview */}
            {formData.alvosId.length > 1 && (
              <div className="mb-4 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex items-center gap-2">
                <span className="text-[11px] font-bold text-slate-600 shrink-0">Simular com:</span>
                <select
                  value={sampleProduct.id}
                  onChange={(e) => setSelectedPreviewProductId(e.target.value)}
                  className="w-full bg-white text-xs font-bold text-slate-800 rounded-lg px-2.5 py-1.5 border border-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500 truncate shadow-sm cursor-pointer"
                >
                  {formData.alvosId.map(id => {
                    const p = produtos.find((p: any) => p.id === id);
                    return (
                      <option key={id} value={id}>
                        {p?.nome || id}
                      </option>
                    );
                  })}
                </select>
              </div>
            )}

            <p className="text-xs text-slate-600 mb-4 bg-orange-50/60 p-2.5 rounded-lg border border-orange-100">
              Visualização para o cliente: <strong className="text-slate-900">{sampleProduct.nome}</strong>
            </p>

            {/* Tab: Card da Vitrine */}
            {previewTab === "card" && (
              <div className="bg-white text-slate-900 rounded-xl p-4 shadow-md border-2 border-slate-100 max-w-[300px] mx-auto">
                {/* Promo Badge on Card */}
                <div className="mb-2">
                  <PromoCardBadge promo={previewPromoObj} precoOriginal={previewOriginalPrice} />
                </div>

                {/* Product Image Mock */}
                <div className="aspect-square bg-slate-50 rounded-lg p-4 flex items-center justify-center relative mb-3 border border-slate-100">
                  <img 
                    // @ts-ignore
                    src={sampleProduct.imagens?.[0] || "/placeholder.svg"} 
                    alt={sampleProduct.nome} 
                    className="max-h-full max-w-full object-contain mix-blend-multiply"
                  />
                </div>

                {/* Brand and Title */}
                <div className="text-[10px] uppercase font-bold text-slate-400 truncate">
                  {sampleProduct.marca || sampleProduct.marca || "Marca"}
                </div>
                <div className="text-xs font-bold text-slate-800 line-clamp-2 h-8 leading-tight mb-2">
                  {sampleProduct.nome}
                </div>

                {/* Price Display */}
                {formData.tipoCampanha === "leve_pague" ? (
                  <div className="border-l-2 border-orange-500 pl-2 mb-3 bg-orange-50/50 py-1">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-bold text-orange-600">{sampleConfig.quantidade || 2} por</span>
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

                {/* CTA Button with ShoppingBasket */}
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
                    precoPromocional={previewPromoPrice} 
                  />
                ) : (
                  <PromoLevePagueOfferBox 
                    promo={previewPromoObj} 
                    precoUnitarioOriginal={previewOriginalPrice}
                    onAddToCart={() => toast.info("Simulação: Combo adicionado ao carrinho!")} 
                  />
                )}

                {/* Simulated PDP CTA Area with ShoppingBasket */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="text-xs font-bold text-slate-600">Simulação do Botão de Compra:</div>
                  <button
                    type="button"
                    style={{
                      backgroundColor: formData.corBotao || "#ea580c",
                      color: formData.corTextoBotao || "#ffffff",
                    }}
                    className="w-full h-11 rounded-lg font-bold text-sm flex items-center justify-center gap-2 shadow-sm uppercase"
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