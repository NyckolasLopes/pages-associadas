import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { useMarketing, Coupon } from "@/stores/marketing";
import { useAdmin } from "@/stores/admin";
import { useAdminCategories } from "@/stores/categories";
import { useAdminProducts } from "@/stores/products";
import { catalog } from "@/services/catalog";
import { brl, productImage } from "@/lib/format";
import type { Produto, Categoria } from "@/types";
import { 
  Search, 
  Filter, 
  ChevronDown, 
  MoreHorizontal, 
  Trash2, 
  Plus, 
  Store, 
  Edit2, 
  RotateCcw, 
  CheckCircle2, 
  XCircle,
  Package,
  Layers,
  Eye,
  Tag,
  Check,
  X,
  ExternalLink,
  Sparkles,
  Loader2,
  Palette,
  Ticket
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanitizeCouponCode } from "@/lib/security";

export const Route = createFileRoute("/admin/marketing/cupons/")({
  component: CuponsIndexPage,
});

function CuponsIndexPage() {
  const { cupons, addCoupon, updateCoupon, removeCoupon, loadMarketing } = useMarketing();
  const { 
    currentUser, 
    activeStoreId, 
    grupos, 
    pharmacies, 
    loadPharmacies, 
    networkDefaultTheme, 
    loadNetworkTheme, 
    saveNetworkTheme, 
    updatePharmacy 
  } = useAdmin();
  const { categories } = useAdminCategories();
  const { customProducts } = useAdminProducts();

  // Carrega todos os produtos do catálogo para seleção completa
  const [catalogProducts, setCatalogProducts] = useState<Produto[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    loadMarketing();
    loadPharmacies();
    loadNetworkTheme();
    let mounted = true;
    setLoadingProducts(true);
    catalog.listAllProducts(effectiveStoreId || undefined).then((prods) => {
      if (mounted && prods) {
        setCatalogProducts(prods);
      }
    }).catch((err) => {
      console.error("Erro ao carregar produtos:", err);
    }).finally(() => {
      if (mounted) setLoadingProducts(false);
    });
    return () => { mounted = false; };
  }, [loadMarketing, loadPharmacies, loadNetworkTheme, effectiveStoreId]);

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

  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const effectiveStoreId = !isGlobalAdmin && currentUser?.lojasVinculadas?.length ? currentUser.lojasVinculadas[0] : activeStoreId;
  const effectiveStore = pharmacies.find(p => p.id === effectiveStoreId);

  // Helper para obter as cores do selo "Com Cupom" de uma loja ou rede
  const getStoreBadgeColors = (storeId?: string) => {
    const store = pharmacies.find(p => p.id === storeId) || effectiveStore;
    const bg = store?.themeColors?.['--coupon-badge-bg'] || store?.themeColors?.couponBadgeBg || networkDefaultTheme?.['--coupon-badge-bg'] || "#ff0000";
    const text = store?.themeColors?.['--coupon-badge-text'] || store?.themeColors?.couponBadgeText || networkDefaultTheme?.['--coupon-badge-text'] || "#ffffff";
    const border = store?.themeColors?.['--coupon-badge-border'] || store?.themeColors?.couponBadgeBorder || networkDefaultTheme?.['--coupon-badge-border'] || "#ff0000";
    return { bg, text, border };
  };

  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingCoupon, setViewingCoupon] = useState<Coupon | null>(null);

  // Estados do formulário de criação
  const initialColors = getStoreBadgeColors(effectiveStoreId);
  const [novoCupom, setNovoCupom] = useState({
    codigo: "",
    descricao: "",
    valorDesconto: 0,
    tipoDesconto: "percentual" as "percentual" | "fixo",
    valorMinimo: 0,
    totalDisponiveis: 100,
    dataTermino: "",
    lojaId: "",
    tipoAlvo: "todos" as "todos" | "categorias" | "produtos",
    alvosId: [] as string[],
    badgeBg: initialColors.bg,
    badgeText: initialColors.text,
    badgeBorder: initialColors.border,
  });
  const [searchTarget, setSearchTarget] = useState("");

  // Atualiza cores padrão ao mudar a loja efetiva
  useEffect(() => {
    if (!novoCupom.lojaId) {
      const colors = getStoreBadgeColors(effectiveStoreId);
      setNovoCupom(prev => ({
        ...prev,
        badgeBg: prev.badgeBg === "#ff0000" ? colors.bg : prev.badgeBg,
        badgeText: prev.badgeText === "#ffffff" ? colors.text : prev.badgeText,
        badgeBorder: prev.badgeBorder === "#ff0000" ? colors.border : prev.badgeBorder,
      }));
    }
  }, [effectiveStore, networkDefaultTheme, effectiveStoreId]);

  // Estados do modal de edição
  const [editingCupom, setEditingCupom] = useState<Coupon | null>(null);
  const [editSearchTarget, setEditSearchTarget] = useState("");

  // Filtros de busca de categorias e produtos para criação
  const filteredCategories = useMemo(() => {
    if (!searchTarget) return categories;
    const q = searchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, searchTarget]);

  const filteredProducts = useMemo(() => {
    if (!searchTarget) return allProducts.slice(0, 500);
    const q = searchTarget.toLowerCase();
    return allProducts.filter((p: any) => 
      (p.nome && p.nome.toLowerCase().includes(q)) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.ean && p.ean.toLowerCase().includes(q)) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 500);
  }, [allProducts, searchTarget]);

  // Filtros de busca de categorias e produtos para edição
  const editFilteredCategories = useMemo(() => {
    if (!editSearchTarget) return categories;
    const q = editSearchTarget.toLowerCase();
    return categories.filter(c => c.nome.toLowerCase().includes(q));
  }, [categories, editSearchTarget]);

  const editFilteredProducts = useMemo(() => {
    if (!editSearchTarget) return allProducts.slice(0, 500);
    const q = editSearchTarget.toLowerCase();
    return allProducts.filter((p: any) => 
      (p.nome && p.nome.toLowerCase().includes(q)) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.ean && p.ean.toLowerCase().includes(q)) ||
      (p.codigoBarras && p.codigoBarras.toLowerCase().includes(q)) ||
      (p.sku && p.sku.toLowerCase().includes(q))
    ).slice(0, 500);
  }, [allProducts, editSearchTarget]);

  const handleToggleAlvo = (id: string) => {
    setNovoCupom(prev => ({
      ...prev,
      alvosId: prev.alvosId.includes(id) 
        ? prev.alvosId.filter(item => item !== id)
        : [...prev.alvosId, id]
    }));
  };

  const handleToggleEditAlvo = (id: string) => {
    if (!editingCupom) return;
    const currentAlvos = editingCupom.alvosId || (editingCupom as any).produtosIds || (editingCupom as any).categoriasIds || [];
    const updatedAlvos = currentAlvos.includes(id)
      ? currentAlvos.filter((item: string) => item !== id)
      : [...currentAlvos, id];
    
    setEditingCupom({
      ...editingCupom,
      alvosId: updatedAlvos
    });
  };

  const handleSelectAllFiltered = () => {
    if (novoCupom.tipoAlvo === "categorias") {
      const idsToAdd = filteredCategories.map(c => c.id);
      setNovoCupom(prev => ({
        ...prev,
        alvosId: Array.from(new Set([...prev.alvosId, ...idsToAdd]))
      }));
    } else if (novoCupom.tipoAlvo === "produtos") {
      const idsToAdd = filteredProducts.map(p => p.id);
      setNovoCupom(prev => ({
        ...prev,
        alvosId: Array.from(new Set([...prev.alvosId, ...idsToAdd]))
      }));
    }
  };

  const handleClearAlvos = () => {
    setNovoCupom(prev => ({ ...prev, alvosId: [] }));
  };

  const filteredCupons = cupons.filter((c) => {
    const matchSearch = c.codigo.toLowerCase().includes(search.toLowerCase()) ||
                        c.descricao.toLowerCase().includes(search.toLowerCase());
    if (isGlobalAdmin) return matchSearch;
    return matchSearch && (!c.lojaId || c.lojaId === effectiveStoreId);
  });

  // Helper para buscar detalhes dos alvos de um cupom
  const getCouponTargetDetails = (coupon: any) => {
    const targetType = coupon.tipoAlvo || (coupon.produtosIds?.length ? "produtos" : (coupon.categoriasIds?.length ? "categorias" : "todos"));
    const targets: string[] = coupon.alvosId || coupon.produtosIds || coupon.categoriasIds || [];

    if (targetType === "todos") {
      return { type: "todos", label: "Toda a loja", count: 0, items: [] };
    }

    if (targetType === "categorias") {
      const matched = categories.filter(c => targets.map(String).includes(String(c.id)));
      return { 
        type: "categorias", 
        label: `${matched.length > 0 ? matched.length : targets.length} categoria(s)`, 
        count: matched.length > 0 ? matched.length : targets.length,
        items: matched 
      };
    }

    const matched = allProducts.filter(p => targets.map(String).includes(String(p.id)) || (p.sku && targets.includes(p.sku)));
    return { 
      type: "produtos", 
      label: `${matched.length > 0 ? matched.length : targets.length} produto(s)`, 
      count: matched.length > 0 ? matched.length : targets.length,
      items: matched 
    };
  };

  const handleOpenEdit = (cupom: Coupon) => {
    const anyCupom = cupom as any;
    const targetType = anyCupom.tipoAlvo || (anyCupom.produtosIds?.length ? "produtos" : (anyCupom.categoriasIds?.length ? "categorias" : "todos"));
    const targets = anyCupom.alvosId || anyCupom.produtosIds || anyCupom.categoriasIds || [];
    const storeColors = getStoreBadgeColors(cupom.lojaId);
    setEditingCupom({
      ...cupom,
      tipoAlvo: targetType,
      alvosId: targets,
      badgeBg: cupom.badgeBg || storeColors.bg,
      badgeText: cupom.badgeText || storeColors.text,
      badgeBorder: cupom.badgeBorder || storeColors.border,
    });
    setEditSearchTarget("");
  };

  return (
    <div className="max-w-6xl space-y-6 pb-16">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold text-slate-800">{isGlobalAdmin ? "Cupons das lojas" : "Meus cupons"}</h2>
          <span className="text-sm text-slate-500">{filteredCupons.length} cupom(s)</span>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button className="font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
                <Plus className="h-4 w-4 mr-2" /> Novo Cupom
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold flex items-center gap-2">
                  <Tag className="w-5 h-5 text-primary" />
                  Criar Novo Cupom
                </DialogTitle>
              </DialogHeader>

              <div className="grid gap-4 py-3">
                {isGlobalAdmin && (
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Loja Vinculada <span className="text-red-500">*</span></label>
                    <Select value={novoCupom.lojaId} onValueChange={(v: any) => {
                      const colors = getStoreBadgeColors(v);
                      setNovoCupom({
                        ...novoCupom, 
                        lojaId: v,
                        badgeBg: colors.bg,
                        badgeText: colors.text,
                        badgeBorder: colors.border,
                      });
                    }}>
                      <SelectTrigger className="bg-white"><SelectValue placeholder="Selecione a Farmácia" /></SelectTrigger>
                      <SelectContent className="z-[200] max-h-64">
                        {pharmacies.map(loja => (
                          <SelectItem key={loja.id} value={loja.id}>
                            {loja.nome} {loja.cidade ? `(${loja.cidade} - ${loja.uf || "RS"})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Código do Cupom <span className="text-red-500">*</span></label>
                    <Input 
                      placeholder="EX: 10OFF" 
                      value={novoCupom.codigo} 
                      onChange={e => setNovoCupom({...novoCupom, codigo: e.target.value.toUpperCase()})}
                      className="font-mono font-bold tracking-wider"
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Descrição</label>
                    <Input 
                      placeholder="Ex: 10% OFF em itens selecionados" 
                      value={novoCupom.descricao} 
                      onChange={e => setNovoCupom({...novoCupom, descricao: e.target.value})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Tipo de Desconto</label>
                    <Select value={novoCupom.tipoDesconto} onValueChange={(v: any) => setNovoCupom({...novoCupom, tipoDesconto: v})}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentual">Percentual (%)</SelectItem>
                        <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Valor {novoCupom.tipoDesconto === "percentual" ? "(%)" : "(R$)"} <span className="text-red-500">*</span></label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={novoCupom.valorDesconto || ""} 
                      onChange={e => setNovoCupom({...novoCupom, valorDesconto: Number(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Pedido Mínimo (R$)</label>
                    <Input 
                      type="number" 
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={novoCupom.valorMinimo || ""} 
                      onChange={e => setNovoCupom({...novoCupom, valorMinimo: Number(e.target.value)})}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Limite de Usos (0 = ilimitado)</label>
                    <Input 
                      type="number" 
                      min="0"
                      placeholder="Ex: 100"
                      value={novoCupom.totalDisponiveis || ""} 
                      onChange={e => setNovoCupom({...novoCupom, totalDisponiveis: Number(e.target.value)})}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <label className="text-xs font-bold text-slate-700">Data de Término</label>
                    <Input 
                      type="date"
                      value={novoCupom.dataTermino} 
                      onChange={e => setNovoCupom({...novoCupom, dataTermino: e.target.value})}
                    />
                  </div>
                </div>

                {/* SELEÇÃO DO TIPO DE ALVO DO CUPOM */}
                <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-primary" />
                      Vincular Cupom A:
                    </label>
                    {novoCupom.tipoAlvo !== "todos" && (
                      <Badge variant="secondary" className="text-[11px] font-bold">
                        {novoCupom.alvosId.length} selecionado(s)
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setNovoCupom(prev => ({ ...prev, tipoAlvo: "todos", alvosId: [] }));
                        setSearchTarget("");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        novoCupom.tipoAlvo === "todos"
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Store className="w-4 h-4" />
                      Toda a Loja
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNovoCupom(prev => ({ ...prev, tipoAlvo: "categorias", alvosId: [] }));
                        setSearchTarget("");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        novoCupom.tipoAlvo === "categorias"
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Layers className="w-4 h-4" />
                      Categorias
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setNovoCupom(prev => ({ ...prev, tipoAlvo: "produtos", alvosId: [] }));
                        setSearchTarget("");
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                        novoCupom.tipoAlvo === "produtos"
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                      }`}
                    >
                      <Package className="w-4 h-4" />
                      Produtos
                    </button>
                  </div>

                  {/* LISTAGEM DE CATEGORIAS */}
                  {novoCupom.tipoAlvo === "categorias" && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          placeholder={`Buscar ${novoCupom.tipoAlvo === "categorias" ? "categoria por nome..." : "produto por nome, marca ou EAN..."}`}
                          value={searchTarget}
                          onChange={(e) => setSearchTarget(e.target.value)}
                          className="pl-8 text-xs bg-white h-8"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                        <span>{filteredCategories.length} categorias encontradas</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleSelectAllFiltered} className="text-primary font-bold hover:underline">
                            Selecionar todas
                          </button>
                          <span>•</span>
                          <button type="button" onClick={handleClearAlvos} className="text-slate-500 hover:underline">
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                        {filteredCategories.map((cat) => {
                          const isSelected = novoCupom.alvosId.includes(cat.id);
                          return (
                            <div
                              key={cat.id}
                              onClick={() => handleToggleAlvo(cat.id)}
                              className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                                isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-50 text-slate-700"
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <Checkbox checked={isSelected} onCheckedChange={() => handleToggleAlvo(cat.id)} />
                                <span>{cat.nome}</span>
                              </div>
                              <span className="text-[10px] text-slate-400">ID: {cat.id}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* LISTAGEM DE PRODUTOS */}
                  {novoCupom.tipoAlvo === "produtos" && (
                    <div className="space-y-2 pt-2 border-t border-slate-200">
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                        <Input
                          placeholder="Buscar produto por nome, marca ou EAN..."
                          value={searchTarget}
                          onChange={(e) => setSearchTarget(e.target.value)}
                          className="pl-8 text-xs bg-white h-8"
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 px-1">
                        <span>{filteredProducts.length} produtos exibidos</span>
                        <div className="flex gap-2">
                          <button type="button" onClick={handleSelectAllFiltered} className="text-primary font-bold hover:underline">
                            Selecionar listados
                          </button>
                          <span>•</span>
                          <button type="button" onClick={handleClearAlvos} className="text-slate-500 hover:underline">
                            Limpar
                          </button>
                        </div>
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-1.5 bg-white p-2 rounded-lg border border-slate-200">
                        {loadingProducts && (
                          <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-primary" /> Carregando produtos...
                          </div>
                        )}
                        {!loadingProducts && filteredProducts.map((prod) => {
                          const isSelected = novoCupom.alvosId.includes(prod.id);
                          return (
                            <div
                              key={prod.id}
                              onClick={() => handleToggleAlvo(prod.id)}
                              className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer text-xs transition-colors border ${
                                isSelected ? "bg-primary/5 border-primary/30 text-slate-900" : "hover:bg-slate-50 border-transparent text-slate-700"
                              }`}
                            >
                              <Checkbox checked={isSelected} onCheckedChange={() => handleToggleAlvo(prod.id)} />
                              <img
                                src={productImage(prod)}
                                alt={prod.nome}
                                className="w-8 h-8 object-contain rounded bg-white p-0.5 border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-semibold truncate text-[11px] leading-tight">{prod.nome}</p>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                  {prod.marca && <span>{prod.marca}</span>}
                                  {(prod.ean || (prod as any).codigoBarras || prod.sku) && (
                                    <span>EAN: {prod.ean || (prod as any).codigoBarras || prod.sku}</span>
                                  )}
                                  <span className="font-bold text-primary ml-auto">{brl(prod.precoPor || prod.preco || 0)}</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {/* PERSONALIZAÇÃO DE CORES DO DESTAQUE 'COM CUPOM' POR LOJA */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                      Cor do Destaque "Com Cupom" (Desta Loja)
                    </label>
                    <span className="text-[11px] text-slate-500">Defina as cores do selo deste cupom</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Fundo:</label>
                        <input
                          type="color"
                          value={novoCupom.badgeBg || "#ff0000"}
                          onChange={(e) => setNovoCupom({ ...novoCupom, badgeBg: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                          title="Cor de fundo do selo"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Texto:</label>
                        <input
                          type="color"
                          value={novoCupom.badgeText || "#ffffff"}
                          onChange={(e) => setNovoCupom({ ...novoCupom, badgeText: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                          title="Cor do texto do selo"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Borda:</label>
                        <input
                          type="color"
                          value={novoCupom.badgeBorder || "#ff0000"}
                          onChange={(e) => setNovoCupom({ ...novoCupom, badgeBorder: e.target.value })}
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
                          backgroundColor: novoCupom.badgeBg || "#ff0000",
                          color: novoCupom.badgeText || "#ffffff",
                          borderColor: novoCupom.badgeBorder || "#ff0000",
                        }}
                      >
                        <Ticket className="w-3.5 h-3.5 shrink-0" />
                        <span>R$ 27,54 com Cupom</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={async () => {
                  const cleanCode = sanitizeCouponCode(novoCupom.codigo);
                  if (!cleanCode || cleanCode.length < 3) return toast.error("O código do cupom deve ter pelo menos 3 caracteres.");
                  const targetLojaId = isGlobalAdmin ? novoCupom.lojaId : effectiveStoreId;
                  if (!targetLojaId) return toast.error("Selecione a farmácia vinculada ao cupom.");
                  
                  if (novoCupom.tipoAlvo !== "todos" && novoCupom.alvosId.length === 0) {
                    return toast.error(`Selecione ao menos um(a) ${novoCupom.tipoAlvo === "categorias" ? "categoria" : "produto"} para o cupom.`);
                  }

                  await addCoupon({
                    codigo: cleanCode,
                    descricao: novoCupom.descricao,
                    ativo: true,
                    totalDisponiveis: Number(novoCupom.totalDisponiveis) || 0,
                    valorMinimo: Number(novoCupom.valorMinimo) || 0,
                    dataInicio: "",
                    dataTermino: novoCupom.dataTermino,
                    exigirMinItens: false,
                    tipoDesconto: novoCupom.tipoDesconto,
                    valorDesconto: Number(novoCupom.valorDesconto) || 0,
                    aplicarFreteGratis: false,
                    aplicacaoAutomatica: false,
                    permiteAcumular: false,
                    usoUnico: false,
                    cupomPrimeiraCompra: false,
                    lojaId: targetLojaId,
                    tipoAlvo: novoCupom.tipoAlvo,
                    alvosId: novoCupom.tipoAlvo === "todos" ? [] : novoCupom.alvosId,
                    badgeBg: novoCupom.badgeBg,
                    badgeText: novoCupom.badgeText,
                    badgeBorder: novoCupom.badgeBorder,
                  });

                  // Sincroniza cores com o tema da loja para consistência
                  if (targetLojaId) {
                    const targetStore = pharmacies.find(p => p.id === targetLojaId);
                    if (targetStore) {
                      updatePharmacy(targetStore.id, {
                        ...targetStore,
                        themeColors: {
                          ...(targetStore.themeColors || {}),
                          '--coupon-badge-bg': novoCupom.badgeBg,
                          '--coupon-badge-text': novoCupom.badgeText,
                          '--coupon-badge-border': novoCupom.badgeBorder,
                        }
                      });
                    }
                  }

                  toast.success("Cupom criado com sucesso para a farmácia!");
                  setIsModalOpen(false);
                  const resetColors = getStoreBadgeColors(effectiveStoreId);
                  setNovoCupom({
                    codigo: "", descricao: "", valorDesconto: 0, tipoDesconto: "percentual", valorMinimo: 0, totalDisponiveis: 100, dataTermino: "", lojaId: "", tipoAlvo: "todos", alvosId: [],
                    badgeBg: resetColors.bg, badgeText: resetColors.text, badgeBorder: resetColors.border
                  });
                }}>
                  Salvar Cupom
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* MODAL DE EDIÇÃO DE CUPOM */}
      <Dialog open={!!editingCupom} onOpenChange={(open) => !open && setEditingCupom(null)}>
        <DialogContent className="sm:max-w-[650px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Edit2 className="w-5 h-5 text-primary" />
              Editar Cupom {editingCupom?.codigo}
            </DialogTitle>
          </DialogHeader>
          {editingCupom && (
            <div className="grid gap-4 py-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Código do Cupom</label>
                  <Input 
                    value={editingCupom.codigo} 
                    onChange={e => setEditingCupom({...editingCupom, codigo: e.target.value.toUpperCase()})}
                    className="font-mono font-bold tracking-wider"
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Descrição</label>
                  <Input 
                    value={editingCupom.descricao} 
                    onChange={e => setEditingCupom({...editingCupom, descricao: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Tipo</label>
                  <Select value={editingCupom.tipoDesconto} onValueChange={(v: any) => setEditingCupom({...editingCupom, tipoDesconto: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentual">Percentual (%)</SelectItem>
                      <SelectItem value="fixo">Valor Fixo (R$)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Valor Desconto</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editingCupom.valorDesconto || ""} 
                    onChange={e => setEditingCupom({...editingCupom, valorDesconto: Number(e.target.value)})}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Valor Mínimo (R$)</label>
                  <Input 
                    type="number" 
                    step="0.01"
                    min="0"
                    value={editingCupom.valorMinimo || ""} 
                    onChange={e => setEditingCupom({...editingCupom, valorMinimo: Number(e.target.value)})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Limite de Usos (0 = ilimitado)</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editingCupom.totalDisponiveis || ""} 
                    onChange={e => setEditingCupom({...editingCupom, totalDisponiveis: Number(e.target.value)})}
                  />
                </div>
                <div className="grid gap-1.5">
                  <label className="text-xs font-bold text-slate-700">Nº de Utilizações Atual</label>
                  <Input 
                    type="number" 
                    min="0"
                    value={editingCupom.numeroUtilizacoes ?? 0} 
                    onChange={e => setEditingCupom({...editingCupom, numeroUtilizacoes: Number(e.target.value)})}
                  />
                </div>
              </div>

              {/* SELEÇÃO DO TIPO DE ALVO DO CUPOM EM EDIÇÃO */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Vincular Cupom A:
                  </label>
                  {editingCupom.tipoAlvo !== "todos" && (
                    <Badge variant="secondary" className="text-[11px] font-bold">
                      {(editingCupom.alvosId || []).length} selecionado(s)
                    </Badge>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (editingCupom.tipoAlvo !== "todos") {
                        setEditingCupom({ ...editingCupom, tipoAlvo: "todos", alvosId: [] });
                      }
                      setEditSearchTarget("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      editingCupom.tipoAlvo === "todos"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Store className="w-4 h-4" />
                    Toda a Loja
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editingCupom.tipoAlvo !== "categorias") {
                        setEditingCupom({ ...editingCupom, tipoAlvo: "categorias", alvosId: [] });
                      }
                      setEditSearchTarget("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      editingCupom.tipoAlvo === "categorias"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Layers className="w-4 h-4" />
                    Categorias
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (editingCupom.tipoAlvo !== "produtos") {
                        setEditingCupom({ ...editingCupom, tipoAlvo: "produtos", alvosId: [] });
                      }
                      setEditSearchTarget("");
                    }}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      editingCupom.tipoAlvo === "produtos"
                        ? "bg-primary text-white border-primary shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    Produtos
                  </button>
                </div>

                {/* LISTAGEM DE CATEGORIAS NA EDIÇÃO */}
                {editingCupom.tipoAlvo === "categorias" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        placeholder={`Buscar ${editingCupom.tipoAlvo === "categorias" ? "categoria por nome..." : "produto por nome, marca ou EAN..."}`}
                        value={editSearchTarget}
                        onChange={(e) => setEditSearchTarget(e.target.value)}
                        className="pl-8 text-xs bg-white h-8"
                      />
                    </div>

                    <div className="max-h-48 overflow-y-auto space-y-1 bg-white p-2 rounded-lg border border-slate-200">
                      {editFilteredCategories.map((cat) => {
                        const isSelected = (editingCupom.alvosId || []).includes(cat.id);
                        return (
                          <div
                            key={cat.id}
                            onClick={() => handleToggleEditAlvo(cat.id)}
                            className={`flex items-center justify-between p-2 rounded-md cursor-pointer text-xs transition-colors ${
                              isSelected ? "bg-primary/10 text-primary font-bold" : "hover:bg-slate-50 text-slate-700"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Checkbox checked={isSelected} />
                              <span>{cat.nome}</span>
                            </div>
                            <span className="text-[10px] text-slate-400">ID: {cat.id}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* LISTAGEM DE PRODUTOS NA EDIÇÃO */}
                {editingCupom.tipoAlvo === "produtos" && (
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <Input
                        placeholder="Buscar produto por nome, marca ou EAN..."
                        value={editSearchTarget}
                        onChange={(e) => setEditSearchTarget(e.target.value)}
                        className="pl-8 h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="max-h-56 overflow-y-auto space-y-1.5 bg-white p-2 rounded-lg border border-slate-200">
                      {editFilteredProducts.map((prod) => {
                        const isSelected = (editingCupom.alvosId || []).includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleToggleEditAlvo(prod.id)}
                            className={`flex items-center gap-2.5 p-1.5 rounded-lg cursor-pointer text-xs transition-colors border ${
                              isSelected ? "bg-primary/5 border-primary/30 text-slate-900 font-semibold" : "hover:bg-slate-50 border-transparent text-slate-700"
                            }`}
                          >
                            <Checkbox checked={isSelected} />
                            <img
                              src={productImage(prod)}
                              alt={prod.nome}
                              className="w-8 h-8 object-contain rounded bg-white p-0.5 border shrink-0"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold truncate text-[11px] leading-tight">{prod.nome}</p>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                {prod.marca && <span>{prod.marca}</span>}
                                {(prod.ean || (prod as any).codigoBarras || prod.sku) && (
                                  <span>EAN: {prod.ean || (prod as any).codigoBarras || prod.sku}</span>
                                )}
                                <span className="font-bold text-primary ml-auto">{brl(prod.precoPor || prod.preco || 0)}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

                {/* PERSONALIZAÇÃO DE CORES DO DESTAQUE 'COM CUPOM' POR LOJA */}
                <div className="border border-slate-200 rounded-xl p-3.5 bg-gradient-to-r from-blue-50/50 via-indigo-50/30 to-white space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Palette className="w-3.5 h-3.5 text-primary" />
                      Cor do Destaque "Com Cupom" (Desta Loja)
                    </label>
                    <span className="text-[11px] text-slate-500">Defina as cores do selo deste cupom</span>
                  </div>

                  <div className="flex items-center justify-between gap-3 flex-wrap bg-white p-2.5 rounded-lg border border-slate-200">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Fundo:</label>
                        <input
                          type="color"
                          value={editingCupom.badgeBg || "#ff0000"}
                          onChange={(e) => setEditingCupom({ ...editingCupom, badgeBg: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                          title="Cor de fundo do selo"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Texto:</label>
                        <input
                          type="color"
                          value={editingCupom.badgeText || "#ffffff"}
                          onChange={(e) => setEditingCupom({ ...editingCupom, badgeText: e.target.value })}
                          className="w-7 h-7 rounded-lg border border-slate-200 cursor-pointer p-0.5 bg-white shrink-0"
                          title="Cor do texto do selo"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] font-bold text-slate-600">Borda:</label>
                        <input
                          type="color"
                          value={editingCupom.badgeBorder || "#ff0000"}
                          onChange={(e) => setEditingCupom({ ...editingCupom, badgeBorder: e.target.value })}
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
                          backgroundColor: editingCupom.badgeBg || "#ff0000",
                          color: editingCupom.badgeText || "#ffffff",
                          borderColor: editingCupom.badgeBorder || "#ff0000",
                        }}
                      >
                        <Ticket className="w-3.5 h-3.5 shrink-0" />
                        <span>R$ 27,54 com Cupom</span>
                      </div>
                    </div>
                  </div>
                </div>

              <DialogFooter className="gap-2 sm:gap-0 mt-2">
                <Button variant="outline" onClick={() => setEditingCupom(null)}>Cancelar</Button>
                <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold" onClick={async () => {
                  if (editingCupom.tipoAlvo !== "todos" && (!editingCupom.alvosId || editingCupom.alvosId.length === 0)) {
                    return toast.error(`Selecione ao menos um(a) ${editingCupom.tipoAlvo === "categorias" ? "categoria" : "produto"}.`);
                  }
                  await updateCoupon(editingCupom.id, {
                    ...editingCupom,
                    alvosId: editingCupom.tipoAlvo === "todos" ? [] : editingCupom.alvosId,
                    badgeBg: editingCupom.badgeBg,
                    badgeText: editingCupom.badgeText,
                    badgeBorder: editingCupom.badgeBorder,
                  });

                  if (editingCupom.lojaId) {
                    const targetStore = pharmacies.find(p => p.id === editingCupom.lojaId);
                    if (targetStore) {
                      updatePharmacy(targetStore.id, {
                        ...targetStore,
                        themeColors: {
                          ...(targetStore.themeColors || {}),
                          '--coupon-badge-bg': editingCupom.badgeBg,
                          '--coupon-badge-text': editingCupom.badgeText,
                          '--coupon-badge-border': editingCupom.badgeBorder,
                        }
                      });
                    }
                  }

                  toast.success("Cupom atualizado com sucesso!");
                  setEditingCupom(null);
                }}>
                  Salvar Alterações
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL DE VISUALIZAÇÃO DE ITENS ALVO */}
      <Dialog open={!!viewingCoupon} onOpenChange={(open) => !open && setViewingCoupon(null)}>
        <DialogContent className="sm:max-w-[500px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <Tag className="w-4 h-4 text-primary" />
              Itens vinculados ao Cupom {viewingCoupon?.codigo}
            </DialogTitle>
          </DialogHeader>

          {viewingCoupon && (() => {
            const targetDetails = getCouponTargetDetails(viewingCoupon);
            return (
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-600">Tipo de vínculo:</span>
                  <Badge variant="outline" className="font-bold">
                    {targetDetails.type === "todos" ? "Toda a Loja" : targetDetails.type === "categorias" ? "Categorias Específicas" : "Produtos Específicos"}
                  </Badge>
                </div>

                {targetDetails.type === "todos" ? (
                  <div className="p-6 text-center text-sm text-slate-500 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                    <Store className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    Este cupom é válido para <strong>todos os produtos</strong> da loja.
                  </div>
                ) : targetDetails.type === "categorias" ? (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Categorias ({targetDetails.count}):</p>
                    <div className="max-h-60 overflow-y-auto space-y-1 bg-slate-50 p-2 rounded-lg border">
                      {targetDetails.items.map((cat: any) => (
                        <div key={cat.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                          <span className="font-semibold text-slate-800">{cat.nome}</span>
                          <span className="text-[10px] text-slate-400 font-mono">ID: {cat.id}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-700">Produtos ({targetDetails.count}):</p>
                    <div className="max-h-64 overflow-y-auto space-y-1.5 bg-slate-50 p-2 rounded-lg border">
                      {targetDetails.items.map((prod: any) => (
                        <div key={prod.id} className="flex items-center gap-2.5 p-2 bg-white rounded-lg border text-xs">
                          <img
                            src={productImage(prod)}
                            alt={prod.nome}
                            className="w-9 h-9 object-contain rounded bg-slate-50 p-0.5 border shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-bold truncate text-slate-800 leading-tight">{prod.nome}</p>
                            <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                              {prod.marca && <span>{prod.marca}</span>}
                              {(prod.ean || (prod as any).codigoBarras || prod.sku) && (
                                <span>EAN: {prod.ean || (prod as any).codigoBarras || prod.sku}</span>
                              )}
                              <span className="font-bold text-primary ml-auto">{brl(prod.precoPor || prod.preco || 0)}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          <DialogFooter>
            <Button variant="outline" className="w-full font-bold" onClick={() => setViewingCoupon(null)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-100 flex items-center gap-4">
          <div className="relative w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              className="pl-9 bg-slate-50 border-slate-200"
              placeholder="Buscar por código ou descrição..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[11px] tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-4 py-3 w-10">
                  <Checkbox />
                </th>
                <th className="px-4 py-3">CÓDIGO</th>
                <th className="px-4 py-3">DESCRIÇÃO</th>
                <th className="px-4 py-3">DESCONTO</th>
                <th className="px-4 py-3">ALVO / REGRAS</th>
                <th className="px-4 py-3">Nº DE UTILIZAÇÃO</th>
                <th className="px-4 py-3 text-right">AÇÕES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCupons.length > 0 ? (
                filteredCupons.map((cupom) => {
                  const usos = Number(cupom.numeroUtilizacoes) || 0;
                  const limite = Number(cupom.totalDisponiveis) || 0;
                  const esgotado = limite > 0 && usos >= limite;
                  const targetDetails = getCouponTargetDetails(cupom);

                  return (
                    <tr key={cupom.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-4">
                        <Checkbox />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-900 tracking-wide font-mono text-base">{cupom.codigo}</div>
                        <div className="text-xs text-slate-500 mt-0.5">
                          {cupom.usoUnico ? "Uso único por cliente" : "Uso múltiplo"}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">
                        {cupom.descricao || <span className="text-slate-400 italic">Sem descrição</span>}
                        {isGlobalAdmin && cupom.lojaId && (
                          <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                            <Store className="h-3 w-3" />
                            {pharmacies.find(p => p.id === cupom.lojaId)?.nome || cupom.lojaId}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 font-bold text-slate-800">
                        {cupom.tipoDesconto === "percentual" ? `${cupom.valorDesconto}% OFF` : `R$ ${cupom.valorDesconto?.toFixed(2)} OFF`}
                        {cupom.valorMinimo > 0 && (
                          <div className="text-[11px] text-slate-400 font-normal mt-0.5">
                            Min: R$ {cupom.valorMinimo.toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {targetDetails.type === "todos" ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <Store className="w-3 h-3 text-slate-500" />
                              Toda a loja
                            </span>
                          ) : targetDetails.type === "categorias" ? (
                            <button
                              type="button"
                              onClick={() => setViewingCoupon(cupom)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition cursor-pointer"
                              title="Clique para ver as categorias"
                            >
                              <Layers className="w-3 h-3 text-amber-600" />
                              {targetDetails.label}
                              <Eye className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setViewingCoupon(cupom)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 transition cursor-pointer"
                              title="Clique para ver os produtos"
                            >
                              <Package className="w-3 h-3 text-indigo-600" />
                              {targetDetails.label}
                              <Eye className="w-2.5 h-2.5 ml-0.5 opacity-70" />
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-slate-900 text-base">{usos}</span>
                          {limite > 0 && (
                            <span className="text-xs text-slate-400 font-medium">/ {limite}</span>
                          )}
                        </div>
                        {esgotado && (
                          <span className="inline-block mt-1 text-[10px] uppercase font-bold text-red-600 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded">
                            Esgotado
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className={`h-2.5 w-2.5 rounded-full ${cupom.ativo && !esgotado ? "bg-emerald-500" : "bg-slate-300"}`} title={cupom.ativo ? "Ativo" : "Inativo"} />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={() => handleOpenEdit(cupom)}>
                                <Edit2 className="h-4 w-4 mr-2" /> Editar Cupom
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={async () => {
                                await updateCoupon(cupom.id, { ativo: !cupom.ativo });
                                toast.success(cupom.ativo ? "Cupom desativado" : "Cupom ativado");
                              }}>
                                {cupom.ativo ? (
                                  <><XCircle className="h-4 w-4 mr-2 text-amber-600" /> Desativar</>
                                ) : (
                                  <><CheckCircle2 className="h-4 w-4 mr-2 text-emerald-600" /> Ativar</>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="cursor-pointer font-medium" onClick={async () => {
                                await updateCoupon(cupom.id, { numeroUtilizacoes: 0 });
                                toast.success("Contador de utilizações zerado!");
                              }}>
                                <RotateCcw className="h-4 w-4 mr-2 text-blue-600" /> Zerar Utilizações
                              </DropdownMenuItem>
                              <DropdownMenuItem className="text-red-600 cursor-pointer font-medium" onClick={() => {
                                removeCoupon(cupom.id);
                                toast.success("Cupom excluído");
                              }}>
                                <Trash2 className="h-4 w-4 mr-2" /> Excluir
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    Nenhum cupom encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
