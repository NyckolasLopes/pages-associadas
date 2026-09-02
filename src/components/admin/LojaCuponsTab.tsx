import { useState, useMemo, useEffect } from "react";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useAdminProducts } from "@/stores/products";
import { useMarketing, type Coupon } from "@/stores/marketing";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Tag, 
  Plus, 
  Trash2, 
  Calendar, 
  DollarSign, 
  Percent, 
  CheckCircle2, 
  XCircle, 
  Search, 
  Layers, 
  Package, 
  Check, 
  Edit, 
  Eye, 
  X, 
  ExternalLink,
  Sparkles,
  Loader2,
  Clock,
  Palette,
  Ticket
} from "lucide-react";
import { sanitizeCouponCode } from "@/lib/security";
import { checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { brl, productImage } from "@/lib/format";
import { catalog } from "@/services/catalog";
import type { Produto, Categoria } from "@/types";

export function LojaCuponsTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy } = useAdmin();
  const { categories } = useAdminCategories();
  const { customProducts } = useAdminProducts();
  const { cupons, addCoupon, removeCoupon, updateCoupon } = useMarketing();
  const pharmacy = pharmacies.find((p) => p.id === lojaId);

  // Cores personalizáveis do destaque do cupom da loja
  const [badgeBg, setBadgeBg] = useState(pharmacy?.themeColors?.['--coupon-badge-bg'] || "#EBF3FE");
  const [badgeText, setBadgeText] = useState(pharmacy?.themeColors?.['--coupon-badge-text'] || "#1a73e8");
  const [badgeBorder, setBadgeBorder] = useState(pharmacy?.themeColors?.['--coupon-badge-border'] || "#d2e3fc");
  const [isSavingColors, setIsSavingColors] = useState(false);

  useEffect(() => {
    if (pharmacy?.themeColors) {
      if (pharmacy.themeColors['--coupon-badge-bg']) setBadgeBg(pharmacy.themeColors['--coupon-badge-bg']);
      if (pharmacy.themeColors['--coupon-badge-text']) setBadgeText(pharmacy.themeColors['--coupon-badge-text']);
      if (pharmacy.themeColors['--coupon-badge-border']) setBadgeBorder(pharmacy.themeColors['--coupon-badge-border']);
    }
  }, [pharmacy]);

  const handleSaveBadgeColors = async () => {
    if (!pharmacy) return;
    setIsSavingColors(true);
    try {
      const updatedThemeColors = {
        ...(pharmacy.themeColors || {}),
        '--coupon-badge-bg': badgeBg,
        '--coupon-badge-text': badgeText,
        '--coupon-badge-border': badgeBorder,
      };
      await updatePharmacy(lojaId, { ...pharmacy, themeColors: updatedThemeColors });
      toast.success("Cores do destaque de cupom salvas com sucesso!");
    } catch (err: any) {
      toast.error("Erro ao salvar cores: " + (err.message || "Tente novamente"));
    } finally {
      setIsSavingColors(false);
    }
  };

  // Carrega todos os produtos do catálogo para seleção completa e cupons do marketing
  const [catalogProducts, setCatalogProducts] = useState<Produto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadMarketing();
    let mounted = true;
    setLoadingProducts(true);
    catalog.listProducts().then((prods) => {
      if (mounted && prods) {
        setCatalogProducts(prods);
      }
    }).catch((err) => {
      console.error("Erro ao carregar produtos:", err);
    }).finally(() => {
      if (mounted) setLoadingProducts(false);
    });
    return () => { mounted = false; };
  }, [loadMarketing]);

  // Mescla produtos do catálogo com produtos personalizados
  const allProducts = useMemo(() => {
    const list = [...catalogProducts];
    if (customProducts && customProducts.length > 0) {
      customProducts.forEach(cp => {
        const idx = list.findIndex(p => p.id === cp.id);
        if (idx >= 0) {
          list[idx] = cp;
        } else {
          list.push(cp);
        }
      });
    }
    return list;
  }, [catalogProducts, customProducts]);

  // Filtra cupons da loja atual ou universais
  const lojaCoupons = cupons.filter((c: any) => c.lojaId === lojaId || c.farmaciaId === lojaId);

  // Formulário de Criação
  const [codigo, setCodigo] = useState("");
  const [tipo, setTipo] = useState<"percent" | "fixed">("percent");
  const [valor, setValor] = useState<string>("");
  const [valorMinimo, setValorMinimo] = useState<string>("");
  const [validade, setValidade] = useState<string>("");
  const [limiteUsos, setLimiteUsos] = useState<string>("");
  const [tipoAlvo, setTipoAlvo] = useState<"todos" | "categorias" | "produtos">("todos");
  const [alvosId, setAlvosId] = useState<string[]>([]);
  const [searchTarget, setSearchTarget] = useState("");

  // Modal de Visualização de Itens do Cupom
  const [viewingCoupon, setViewingCoupon] = useState<any | null>(null);

  // Modal de Edição de Cupom
  const [editingCoupon, setEditingCoupon] = useState<any | null>(null);
  const [editCodigo, setEditCodigo] = useState("");
  const [editTipo, setEditTipo] = useState<"percent" | "fixed">("percent");
  const [editValor, setEditValor] = useState<string>("");
  const [editValorMinimo, setEditValorMinimo] = useState<string>("");
  const [editValidade, setEditValidade] = useState<string>("");
  const [editTipoAlvo, setEditTipoAlvo] = useState<"todos" | "categorias" | "produtos">("todos");
  const [editAlvosId, setEditAlvosId] = useState<string[]>([]);
  const [editSearchTarget, setEditSearchTarget] = useState("");

  // Filtro de Categorias no formulário de criação
  const filteredCategories = useMemo(() => {
    if (!searchTarget) return categories;
    const q = searchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, searchTarget]);

  // Filtro de Produtos no formulário de criação
  const filteredProducts = useMemo(() => {
    if (!searchTarget) return allProducts.slice(0, 50);
    const q = searchTarget.toLowerCase();
    return allProducts.filter((p: any) => 
      (p.nome && p.nome.toLowerCase().includes(q)) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.ean && p.ean.toLowerCase().includes(q)) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q)) ||
      (Array.isArray(p.principiosAtivos) && p.principiosAtivos.some((pa: any) => String(typeof pa === 'string' ? pa : pa.nome).toLowerCase().includes(q)))
    ).slice(0, 50);
  }, [allProducts, searchTarget]);

  // Filtros no modal de edição
  const editFilteredCategories = useMemo(() => {
    if (!editSearchTarget) return categories;
    const q = editSearchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, editSearchTarget]);

  const editFilteredProducts = useMemo(() => {
    if (!editSearchTarget) return allProducts.slice(0, 50);
    const q = editSearchTarget.toLowerCase();
    return allProducts.filter((p: any) => 
      (p.nome && p.nome.toLowerCase().includes(q)) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.ean && p.ean.toLowerCase().includes(q)) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 50);
  }, [allProducts, editSearchTarget]);

  const handleToggleAlvo = (id: string) => {
    setAlvosId(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleToggleEditAlvo = (id: string) => {
    setEditAlvosId(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAllFiltered = () => {
    if (tipoAlvo === "categorias") {
      const idsToAdd = filteredCategories.map(c => c.id);
      setAlvosId(prev => Array.from(new Set([...prev, ...idsToAdd])));
    } else if (tipoAlvo === "produtos") {
      const idsToAdd = filteredProducts.map(p => p.id);
      setAlvosId(prev => Array.from(new Set([...prev, ...idsToAdd])));
    }
  };

  const handleClearAlvos = () => {
    setAlvosId([]);
  };

  const handleAddCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      checkRateLimitOrThrow(`coupon_add_${lojaId}`, RATE_LIMIT_PRESETS.COUPON_APPLY);

      const cleanCode = sanitizeCouponCode(codigo);
      if (!cleanCode || cleanCode.length < 3) {
        toast.error("O código do cupom deve ter pelo menos 3 caracteres alfanuméricos.");
        return;
      }

      const numValor = parseFloat(valor.replace(",", "."));
      if (isNaN(numValor) || numValor <= 0) {
        toast.error("Informe um valor de desconto válido.");
        return;
      }
      if (tipo === "percent" && numValor > 90) {
        toast.error("O desconto percentual máximo permitido é de 90%.");
        return;
      }

      if (tipoAlvo !== "todos" && alvosId.length === 0) {
        toast.error(`Selecione ao menos um(a) ${tipoAlvo === "categorias" ? "categoria" : "produto"} para aplicar o cupom.`);
        return;
      }

      const numMinimo = valorMinimo ? parseFloat(valorMinimo.replace(",", ".")) : 0;
      const numUsos = limiteUsos ? parseInt(limiteUsos, 10) : undefined;

      const newCoupon = {
        codigo: cleanCode,
        descricao: `Cupom ${cleanCode}`,
        ativo: true,
        totalDisponiveis: numUsos || 999,
        valorMinimo: numMinimo || 0,
        dataInicio: "",
        dataTermino: validade || "",
        exigirMinItens: false,
        tipoDesconto: (tipo === "percent" ? "percentual" : "fixo") as "percentual" | "fixo",
        valorDesconto: numValor,
        aplicarFreteGratis: false,
        aplicacaoAutomatica: false,
        permiteAcumular: false,
        usoUnico: false,
        cupomPrimeiraCompra: false,
        lojaId: lojaId,
        tipoAlvo: tipoAlvo,
        alvosId: tipoAlvo === "todos" ? [] : alvosId,
      };

      addCoupon(newCoupon as any);
      toast.success(`Cupom "${cleanCode}" cadastrado com sucesso para sua unidade!`);

      setCodigo("");
      setValor("");
      setValorMinimo("");
      setValidade("");
      setLimiteUsos("");
      setTipoAlvo("todos");
      setAlvosId([]);
      setSearchTarget("");
    } catch (err: any) {
      toast.error(err.message || "Erro ao cadastrar cupom.");
    }
  };

  const openEditModal = (coupon: any) => {
    setEditingCoupon(coupon);
    setEditCodigo(coupon.codigo || coupon.code || "");
    setEditTipo(coupon.tipoDesconto === "percentual" || coupon.tipo === "percent" || coupon.descontoPercentual ? "percent" : "fixed");
    setEditValor(String(coupon.valorDesconto || coupon.valor || coupon.descontoPercentual || coupon.descontoFixo || ""));
    setEditValorMinimo(coupon.valorMinimo ? String(coupon.valorMinimo) : "");
    setEditValidade(coupon.dataTermino || coupon.validade || "");
    const targetType = coupon.tipoAlvo || (coupon.produtosIds?.length ? "produtos" : (coupon.categoriasIds?.length ? "categorias" : (coupon.alvosId?.length ? "produtos" : "todos")));
    const targets = Array.isArray(coupon.alvosId) ? coupon.alvosId : (coupon.produtosIds || coupon.categoriasIds || []);
    setEditTipoAlvo(targetType);
    setEditAlvosId(targets);
    setEditSearchTarget("");
  };

  const handleSaveEditCoupon = async () => {
    if (!editingCoupon) return;
    const cleanCode = sanitizeCouponCode(editCodigo);
    if (!cleanCode || cleanCode.length < 3) {
      toast.error("O código do cupom deve ter pelo menos 3 caracteres.");
      return;
    }

    const numValor = parseFloat(editValor.replace(",", "."));
    if (isNaN(numValor) || numValor <= 0) {
      toast.error("Informe um valor de desconto válido.");
      return;
    }

    if (editTipoAlvo !== "todos" && editAlvosId.length === 0) {
      toast.error(`Selecione ao menos um(a) ${editTipoAlvo === "categorias" ? "categoria" : "produto"}.`);
      return;
    }

    const numMinimo = editValorMinimo ? parseFloat(editValorMinimo.replace(",", ".")) : 0;

    await updateCoupon(editingCoupon.id, {
      codigo: cleanCode,
      tipoDesconto: editTipo === "percent" ? "percentual" : "fixo",
      valorDesconto: numValor,
      valorMinimo: numMinimo,
      dataTermino: editValidade,
      tipoAlvo: editTipoAlvo,
      alvosId: editTipoAlvo === "todos" ? [] : editAlvosId,
    });

    toast.success("Cupom atualizado com sucesso!");
    setEditingCoupon(null);
  };

  const handleToggleCoupon = (coupon: any) => {
    updateCoupon(coupon.id, { ativo: !coupon.ativo });
    toast.success(`Cupom ${!coupon.ativo ? "ativado" : "pausado"}!`);
  };

  const handleDeleteCoupon = (id: string) => {
    removeCoupon(id);
    toast.success("Cupom excluído com sucesso.");
  };

  // Helper para buscar produtos ou categorias alvos do cupom
  const getCouponTargetDetails = (coupon: any) => {
    const targetType = coupon.tipoAlvo || (coupon.produtosIds?.length ? "produtos" : (coupon.categoriasIds?.length ? "categorias" : "todos"));
    const targets: string[] = coupon.alvosId || coupon.produtosIds || coupon.categoriasIds || [];

    if (targetType === "todos") {
      return { type: "todos", label: "Todos os produtos da loja", count: 0, items: [] };
    }

    if (targetType === "categorias") {
      const matched = categories.filter(c => targets.map(String).includes(String(c.id)));
      return { 
        type: "categorias", 
        label: `${matched.length} categoria(s) selecionada(s)`, 
        count: matched.length,
        items: matched 
      };
    }

    const matched = allProducts.filter(p => targets.map(String).includes(String(p.id)) || (p.sku && targets.includes(p.sku)));
    return { 
      type: "produtos", 
      label: `${matched.length > 0 ? matched.length : targets.length} produto(s) selecionado(s)`, 
      count: matched.length > 0 ? matched.length : targets.length,
      items: matched 
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2.5 rounded-xl text-primary">
            <Tag className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cupons de Desconto da Loja</h2>
            <p className="text-sm text-slate-500">
              Crie e gerencie cupons promocionais para toda a loja, categorias específicas ou produtos individuais.
            </p>
          </div>
        </div>
      </div>

      {/* CARD DE PERSONALIZAÇÃO DE CORES DO DESTAQUE DE CUPOM */}
      <Card className="border-slate-200 shadow-sm bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-800 text-sm md:text-base">Personalizar Cores do Destaque do Cupom</h3>
              </div>
              <p className="text-xs text-slate-500">
                Altere a cor do texto, do fundo e da borda do selo que aparece nos cards e na página dos produtos com cupom.
              </p>
            </div>

            {/* Live Preview & Pickers */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Fundo:</label>
                  <input
                    type="color"
                    value={badgeBg}
                    onChange={(e) => setBadgeBg(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Cor de fundo do selo"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Texto:</label>
                  <input
                    type="color"
                    value={badgeText}
                    onChange={(e) => setBadgeText(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Cor do texto do selo"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <label className="text-[11px] font-bold text-slate-600">Borda:</label>
                  <input
                    type="color"
                    value={badgeBorder}
                    onChange={(e) => setBadgeBorder(e.target.value)}
                    className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                    title="Cor da borda do selo"
                  />
                </div>
              </div>

              {/* Preview do Selo */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Prévia:</span>
                <div 
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border shadow-2xs transition-all"
                  style={{
                    backgroundColor: badgeBg,
                    color: badgeText,
                    borderColor: badgeBorder,
                  }}
                >
                  <Ticket className="w-3.5 h-3.5 shrink-0" />
                  <span>R$ 27,54 com Cupom</span>
                </div>
              </div>

              <Button
                size="sm"
                onClick={handleSaveBadgeColors}
                disabled={isSavingColors}
                className="bg-primary text-white font-bold text-xs h-8 px-3 ml-auto"
              >
                {isSavingColors ? "Salvando..." : "Salvar Cores"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Criação de Cupom */}
        <Card className="border-slate-200 shadow-sm lg:col-span-1 h-fit">
          <CardHeader className="bg-slate-50/70 border-b pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" />
              Criar Novo Cupom
            </CardTitle>
            <CardDescription>Defina desconto, regras e os produtos ou categorias alvo</CardDescription>
          </CardHeader>
          <CardContent className="p-4">
            <form onSubmit={handleAddCoupon} className="space-y-4">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Código do Cupom *</Label>
                <Input
                  value={codigo}
                  onChange={(e) => setCodigo(sanitizeCouponCode(e.target.value))}
                  placeholder="Ex: OFERTA10, ESQUENTA"
                  className="uppercase font-mono font-bold tracking-wider text-sm bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Tipo de Desconto</Label>
                  <select
                    value={tipo}
                    onChange={(e: any) => setTipo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-xs font-medium"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Valor *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    placeholder={tipo === "percent" ? "Ex: 10 (%)" : "Ex: 15.00"}
                    className="text-sm bg-white"
                    required
                  />
                </div>
              </div>

              {/* SELETOR DE ALVO: TODOS / CATEGORIAS / PRODUTOS */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Aplicar cupom em:</Label>
                  {tipoAlvo !== "todos" && alvosId.length > 0 && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {alvosId.length} selecionado(s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("todos"); setAlvosId([]); }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${tipoAlvo === "todos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Toda a Loja
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("categorias"); setAlvosId([]); }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${tipoAlvo === "categorias" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Categorias
                  </button>
                  <button
                    type="button"
                    onClick={() => { setTipoAlvo("produtos"); setAlvosId([]); }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${tipoAlvo === "produtos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Produtos
                  </button>
                </div>

                {/* PAINEL DE SELEÇÃO ESPECÍFICA (PRODUTOS OU CATEGORIAS) */}
                {tipoAlvo !== "todos" && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2.5 mt-2">
                    <div className="flex items-center gap-1.5">
                      <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                        <Input
                          value={searchTarget}
                          onChange={(e) => setSearchTarget(e.target.value)}
                          placeholder={`Buscar ${tipoAlvo === "categorias" ? "categoria por nome..." : "produto por nome, marca ou EAN..."}`}
                          className="pl-8 h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 px-0.5">
                      <button
                        type="button"
                        onClick={handleSelectAllFiltered}
                        className="text-primary font-bold hover:underline"
                      >
                        Marcar encontrados
                      </button>
                      {alvosId.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearAlvos}
                          className="text-red-500 font-bold hover:underline"
                        >
                          Limpar seleção
                        </button>
                      )}
                    </div>

                    {/* LISTA ROLÁVEL COM ITENS */}
                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border rounded-lg p-1.5 bg-white">
                      {loadingProducts && tipoAlvo === "produtos" && (
                        <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-1.5">
                          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" /> Carregando produtos...
                        </div>
                      )}

                      {tipoAlvo === "categorias" ? (
                        filteredCategories.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400">Nenhuma categoria encontrada.</div>
                        ) : (
                          filteredCategories.map(cat => {
                            const isChecked = alvosId.includes(cat.id);
                            return (
                              <label
                                key={cat.id}
                                className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                                  isChecked ? "bg-primary/5 border-primary/30 text-primary font-bold" : "hover:bg-slate-50 border-transparent text-slate-700"
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => handleToggleAlvo(cat.id)}
                                />
                                <span className="truncate flex-1">{cat.nome}</span>
                              </label>
                            );
                          })
                        )
                      ) : (
                        filteredProducts.length === 0 ? (
                          <div className="py-3 text-center text-xs text-slate-400">Nenhum produto encontrado.</div>
                        ) : (
                          filteredProducts.map((prod: any) => {
                            const isChecked = alvosId.includes(prod.id);
                            return (
                              <label
                                key={prod.id}
                                className={`flex items-center gap-2.5 p-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                                  isChecked ? "bg-primary/5 border-primary/30 text-primary" : "hover:bg-slate-50 border-transparent text-slate-700"
                                }`}
                              >
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={() => handleToggleAlvo(prod.id)}
                                />
                                <img
                                  src={productImage(prod)}
                                  alt=""
                                  className="h-7 w-7 object-contain rounded bg-white border shrink-0"
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="font-bold truncate text-slate-800">{prod.nome}</div>
                                  <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                    <span>{prod.marca || "Associadas"}</span>
                                    {(prod.ean || prod.codigoBarras || prod.sku) && (
                                      <span>EAN: {prod.ean || prod.codigoBarras || prod.sku}</span>
                                    )}
                                    {prod.precoPor ? <span className="font-bold text-slate-700 ml-auto">{brl(prod.precoPor)}</span> : null}
                                  </div>
                                </div>
                              </label>
                            );
                          })
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Pedido Mínimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={valorMinimo}
                    onChange={(e) => setValorMinimo(e.target.value)}
                    placeholder="Ex: 50.00"
                    className="text-sm bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Limite de Usos</Label>
                  <Input
                    type="number"
                    value={limiteUsos}
                    onChange={(e) => setLimiteUsos(e.target.value)}
                    placeholder="Ex: 100"
                    className="text-sm bg-white"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Data de Validade (Opcional)</Label>
                <Input
                  type="date"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  className="text-sm bg-white"
                />
              </div>

              <Button type="submit" className="w-full font-bold gap-2 mt-4 bg-primary text-white shadow-sm">
                <Plus className="w-4 h-4" />
                Criar Cupom da Loja
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Lista de Cupons Cadastrados */}
        <Card className="border-slate-200 shadow-sm lg:col-span-2">
          <CardHeader className="bg-slate-50/70 border-b pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg font-bold">Cupons Cadastrados na Loja</CardTitle>
                <CardDescription>{lojaCoupons.length} cupom(ns) configurado(s)</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            {lojaCoupons.length === 0 ? (
              <div className="py-14 text-center text-slate-400 space-y-3">
                <div className="bg-primary/5 p-4 rounded-full w-16 h-16 flex items-center justify-center mx-auto text-primary/40">
                  <Tag className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-600">Nenhum cupom cadastrado para esta loja.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Crie cupons no formulário ao lado para oferecer descontos em produtos ou categorias específicas.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {lojaCoupons.map((c: any) => {
                  const targetInfo = getCouponTargetDetails(c);
                  const isPercent = c.tipoDesconto === "percentual" || c.tipo === "percent" || Boolean(c.descontoPercentual);
                  const discountVal = c.valorDesconto || c.valor || c.descontoPercentual || c.descontoFixo || 0;

                  return (
                    <div 
                      key={c.id} 
                      className="border border-slate-200/90 rounded-2xl p-4 bg-white shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-sm tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20">
                            {c.codigo || c.code}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            c.ativo ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-600"
                          }`}>
                            {c.ativo ? "Ativo" : "Pausado"}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="text-lg font-black text-slate-800">
                            {isPercent ? `${discountVal}% OFF` : `R$ ${Number(discountVal).toFixed(2)} OFF`}
                            {c.valorMinimo > 0 && (
                              <span className="text-xs font-normal text-slate-500 ml-1.5">
                                (mín. {brl(c.valorMinimo)})
                              </span>
                            )}
                          </div>

                          {/* Tag Alvo */}
                          <div className="flex items-center justify-between pt-1">
                            <span className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                              {targetInfo.type === "todos" ? (
                                <Layers className="w-3.5 h-3.5 text-primary" />
                              ) : targetInfo.type === "categorias" ? (
                                <Layers className="w-3.5 h-3.5 text-amber-500" />
                              ) : (
                                <Package className="w-3.5 h-3.5 text-emerald-500" />
                              )}
                              <span>{targetInfo.label}</span>
                            </span>

                            {targetInfo.count > 0 && (
                              <button
                                type="button"
                                onClick={() => setViewingCoupon(c)}
                                className="text-xs text-primary hover:underline font-bold inline-flex items-center gap-0.5"
                              >
                                <span>Ver itens</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          {c.validade && (
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 pt-1">
                              <Calendar className="w-3 h-3" /> Válido até {new Date(c.validade + (c.validade.includes('T') ? '' : 'T23:59:59')).toLocaleDateString('pt-BR')}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Botões de Ação */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleCoupon(c)}
                            className="text-xs font-bold h-8 px-2.5"
                          >
                            {c.ativo ? "Pausar" : "Ativar"}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openEditModal(c)}
                            className="text-xs font-bold h-8 px-2.5 text-slate-700"
                          >
                            <Edit className="w-3.5 h-3.5 mr-1" />
                            Editar
                          </Button>
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteCoupon(c.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-bold h-8 px-2"
                        >
                          <Trash2 className="w-3.5 h-3.5 mr-1" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* MODAL: VER ITENS DO CUPOM */}
      <Dialog open={!!viewingCoupon} onOpenChange={(open) => !open && setViewingCoupon(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-primary" />
              Itens Válidos do Cupom {viewingCoupon?.codigo}
            </DialogTitle>
            <DialogDescription>
              {viewingCoupon && getCouponTargetDetails(viewingCoupon).label}
            </DialogDescription>
          </DialogHeader>

          {viewingCoupon && (
            <div className="space-y-4 py-2">
              {(() => {
                const details = getCouponTargetDetails(viewingCoupon);
                if (details.type === "todos") {
                  return (
                    <div className="p-4 rounded-xl bg-slate-50 text-center text-sm text-slate-600">
                      Este cupom é aplicável em <strong>todos os produtos disponíveis</strong> na loja.
                    </div>
                  );
                }
                if (details.type === "categorias") {
                  return (
                    <div className="divide-y border rounded-xl overflow-hidden bg-white max-h-80 overflow-y-auto">
                      {details.items.map((cat: any) => (
                        <div key={cat.id} className="p-3 flex items-center justify-between text-sm">
                          <span className="font-bold text-slate-800">{cat.nome}</span>
                          <span className="text-xs text-slate-400">Categoria</span>
                        </div>
                      ))}
                    </div>
                  );
                }
                return (
                  <div className="divide-y border rounded-xl overflow-hidden bg-white max-h-80 overflow-y-auto">
                    {details.items.map((prod: any) => (
                      <div key={prod.id} className="p-3 flex items-center gap-3 hover:bg-slate-50 transition">
                        <img
                          src={productImage(prod)}
                          alt=""
                          className="h-10 w-10 object-contain rounded bg-white border shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-sm text-slate-800 truncate">{prod.nome}</div>
                          <div className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{prod.marca || "Associadas"}</span>
                            {(prod.ean || prod.codigoBarras || prod.sku) && (
                              <span>EAN: {prod.ean || prod.codigoBarras || prod.sku}</span>
                            )}
                          </div>
                        </div>
                        {prod.precoPor ? (
                          <div className="text-right shrink-0 font-bold text-primary text-sm">
                            {brl(prod.precoPor)}
                          </div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                );
              })()}

              <DialogFooter>
                <Button onClick={() => setViewingCoupon(null)}>Fechar</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: EDITAR CUPOM */}
      <Dialog open={!!editingCoupon} onOpenChange={(open) => !open && setEditingCoupon(null)}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Edit className="w-5 h-5 text-primary" />
              Editar Cupom {editingCoupon?.codigo}
            </DialogTitle>
            <DialogDescription>
              Modifique as regras, alvos de produtos ou categorias deste cupom
            </DialogDescription>
          </DialogHeader>

          {editingCoupon && (
            <div className="space-y-4 py-2">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Código do Cupom</Label>
                <Input
                  value={editCodigo}
                  onChange={(e) => setEditCodigo(sanitizeCouponCode(e.target.value))}
                  className="uppercase font-mono font-bold text-sm bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Tipo de Desconto</Label>
                  <select
                    value={editTipo}
                    onChange={(e: any) => setEditTipo(e.target.value)}
                    className="w-full h-9 rounded-md border border-input bg-white px-3 py-1 text-xs shadow-xs font-medium"
                  >
                    <option value="percent">Porcentagem (%)</option>
                    <option value="fixed">Valor Fixo (R$)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Valor do Desconto</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editValor}
                    onChange={(e) => setEditValor(e.target.value)}
                    className="text-sm bg-white"
                  />
                </div>
              </div>

              {/* SELETOR DE ALVO NA EDIÇÃO */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-bold text-slate-700">Aplicar cupom em:</Label>
                  {editTipoAlvo !== "todos" && (
                    <span className="text-[11px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {editAlvosId.length} selecionado(s)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-xl text-xs">
                  <button
                    type="button"
                    onClick={() => { if (editTipoAlvo !== "todos") { setEditTipoAlvo("todos"); setEditAlvosId([]); } }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${editTipoAlvo === "todos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Toda a Loja
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (editTipoAlvo !== "categorias") { setEditTipoAlvo("categorias"); setEditAlvosId([]); } }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${editTipoAlvo === "categorias" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Categorias
                  </button>
                  <button
                    type="button"
                    onClick={() => { if (editTipoAlvo !== "produtos") { setEditTipoAlvo("produtos"); setEditAlvosId([]); } }}
                    className={`py-1.5 rounded-lg font-bold transition-all ${editTipoAlvo === "produtos" ? "bg-white text-primary shadow-xs" : "text-slate-600 hover:text-slate-900"}`}
                  >
                    Produtos
                  </button>
                </div>

                {editTipoAlvo !== "todos" && (
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2 mt-2">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <Input
                        value={editSearchTarget}
                        onChange={(e) => setEditSearchTarget(e.target.value)}
                        placeholder={`Buscar ${editTipoAlvo === "categorias" ? "categoria por nome..." : "produto por nome, marca ou EAN..."}`}
                        className="pl-8 h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 border rounded-lg p-1.5 bg-white">
                      {editTipoAlvo === "categorias" ? (
                        editFilteredCategories.map(cat => {
                          const isChecked = editAlvosId.includes(cat.id);
                          return (
                            <div
                              key={cat.id}
                              onClick={() => handleToggleEditAlvo(cat.id)}
                              className={`flex items-center gap-2.5 p-2 rounded-lg text-xs cursor-pointer border transition-colors ${
                                isChecked ? "bg-primary/5 border-primary/30 text-primary font-bold" : "hover:bg-slate-50 border-transparent text-slate-700"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                              />
                              <span className="truncate flex-1">{cat.nome}</span>
                            </div>
                          );
                        })
                      ) : (
                        editFilteredProducts.map((prod: any) => {
                          const isChecked = editAlvosId.includes(prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleToggleEditAlvo(prod.id)}
                              className={`flex items-center gap-2.5 p-1.5 rounded-lg text-xs cursor-pointer border transition-colors ${
                                isChecked ? "bg-primary/5 border-primary/30 text-primary font-semibold" : "hover:bg-slate-50 border-transparent text-slate-700"
                              }`}
                            >
                              <Checkbox
                                checked={isChecked}
                              />
                              <img
                                src={productImage(prod)}
                                alt=""
                                className="h-7 w-7 object-contain rounded bg-white border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="font-bold truncate text-slate-800">{prod.nome}</div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  <span>{prod.marca || "Associadas"}</span>
                                  {(prod.ean || prod.codigoBarras || prod.sku) && (
                                    <span>EAN: {prod.ean || prod.codigoBarras || prod.sku}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Pedido Mínimo (R$)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editValorMinimo}
                    onChange={(e) => setEditValorMinimo(e.target.value)}
                    className="text-sm bg-white"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-bold text-slate-700">Validade</Label>
                  <Input
                    type="date"
                    value={editValidade}
                    onChange={(e) => setEditValidade(e.target.value)}
                    className="text-sm bg-white"
                  />
                </div>
              </div>

              <DialogFooter className="gap-2 pt-2">
                <Button variant="outline" onClick={() => setEditingCoupon(null)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveEditCoupon} className="font-bold bg-primary text-white">
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
