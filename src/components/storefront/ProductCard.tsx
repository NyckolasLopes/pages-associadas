import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBasket, Zap, Star, Calendar, Stethoscope, Bell, Flame, Gift, ShoppingBag, Youtube, Minus, Plus, Ticket } from "lucide-react";
import React, { useEffect, useState, useMemo } from "react";
import type { Produto } from "@/types";
import { brl, getInstallmentText, productImage, tarjaColor, checkIsGenerico, formatPbmName, highlightGratis } from "@/lib/format";
import { useCart } from "@/stores/cart";
import { useWaitlist } from "@/stores/waitlist";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/stores/favorites";
import { useAuth } from "@/stores/auth";
import { useGeoCep } from "@/stores/cart";
import { isPbmEligible } from "@/lib/pbm";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { useReviews } from "@/stores/reviews";
import { useSelos } from "@/stores/selos";
import { getDeterministicStock } from "@/lib/stock";
import { getCityFromCep, isCampanhaAtiva, calculateCepDistanceAsync, isRecentlyAdded, getLevePaguePromotion, getPadraoPromotionWithTimer } from "@/lib/utils";
import { useRegionsStore } from "@/stores/regions";
import { useMarketing } from "@/stores/marketing";
import { PromoCardBadge } from "./PromoCountdown";
import { safeSlugify, SYSTEM_PAGES } from "@/hooks/useActivePharmacy";

const PromoIcon = ({ id, className, style }: { id: string, className?: string, style?: React.CSSProperties }) => {
  if (id === 'gift') return <Gift className={className} style={style} />;
  if (id === 'star') return <Star className={className} style={style} />;
  if (id === 'zap') return <Zap className={className} style={style} />;
  if (id === 'shopping-bag') return <ShoppingBag className={className} style={style} />;
  return <Flame className={className} style={style} />;
};

interface ProductCardProps {
  p: Produto;
  layout?: "grid" | "list";
  hideCartButton?: boolean;
  hideDiscountBadge?: boolean;
  forceDiscountValue?: number | null;
  forceStock?: number | null;
  availablePharmacies?: any[];
  selectedStoreId?: string | null;
}

function ProductCardComponent({
  p: initialProduct,
  layout = "grid",
  hideCartButton = false,
  hideDiscountBadge = false,
  forceDiscountValue = null,
  forceStock = null,
  availablePharmacies: propPharmacies,
  selectedStoreId,
}: ProductCardProps) {
  // Bridge static SSR/loader product with live admin edits
  const customProducts = useAdminProducts(s => s.customProducts);
  const p = customProducts?.find(c => c.id === initialProduct.id) || initialProduct;
  const regionalPrices = useRegionsStore(s => s.prices);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const promocoes = useMarketing((s) => s.promocoes);
  const lojaPromocoesMap = useMarketing((s) => s.lojaPromocoes);
  const cupons = useMarketing((s) => s.cupons);
  const recentlyAdded = isRecentlyAdded(p);
  
  const add = useCart((s) => s.add);
  const showAddedNotification = useCart((s) => s.showAddedNotification);
  const [justAdded, setJustAdded] = useState(false);


  const cartItems = useCart((s) => s.items);
  const cartItem = cartItems.find((item) => String(item.id) === String(p.id));
  const inCartQty = cartItem?.qty || 0;
  const pbm = isPbmEligible(p);
  const cep = useGeoCep((s) => s.cep);
  
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [wlName, setWlName] = useState("");
  const [wlPhone, setWlPhone] = useState("");
  const [wlQty, setWlQty] = useState(1);
  const addWaitlistEntry = useWaitlist((s) => s.addEntry);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId) || selectedStoreId;
  const params = useParams({ strict: false });
  const storeSlug = (params as any)?.storeSlug;

  const currentPharmacy = useMemo(() => {
    if (selectedPharmacyId) {
      return pharmacies.find(ph => String(ph.id) === String(selectedPharmacyId));
    }
    if (storeSlug && storeSlug !== "loja-padrao" && !SYSTEM_PAGES.has(storeSlug)) {
      return pharmacies.find(ph => safeSlugify(ph.slug || "") === safeSlugify(storeSlug));
    }
    return pharmacies[0];
  }, [pharmacies, selectedPharmacyId, storeSlug]);
  
  const handleWaitlistSubmit = async () => {
    if (!wlName.trim() || !wlPhone.trim()) {
      toast.error("Preencha todos os campos");
      return;
    }
    const safeQty = Math.max(1, Number(wlQty) || 1);

    const targetLojaId = currentPharmacy?.id ? String(currentPharmacy.id) : "loja-padrao";
    const targetLojaNome = currentPharmacy?.nome || (currentPharmacy?.categoriaAssociado === 'Parceiro' ? "Loja Parceira" : "Farmácias Associadas");

    await addWaitlistEntry({
      lojaId: targetLojaId,
      lojaNome: targetLojaNome,
      produtoId: p.id,
      produtoNome: p.nome,
      produtoImagem: productImage(p),
      clienteNome: wlName.trim(),
      whatsapp: wlPhone.trim(),
      quantidade: safeQty,
      precoMomento: (p as any).precoPor || (p as any).preco || 0
    });

    const rawZap = currentPharmacy?.whatsapp || currentPharmacy?.telefone || "51989444818";
    const cleanZap = rawZap.replace(/\D/g, "");
    const waNumber = cleanZap.startsWith("55") ? cleanZap : `55${cleanZap}`;

    const effectiveSlug = (storeSlug && storeSlug !== "loja-padrao" && !SYSTEM_PAGES.has(storeSlug))
      ? safeSlugify(storeSlug)
      : (currentPharmacy?.slug ? safeSlugify(currentPharmacy.slug) : "loja-padrao");

    const productUrl = `https://farmaciasassociadas.com.br/${effectiveSlug}/produto/${p.url || p.slug || p.id}`;

    const message = `Olá! Gostaria de ser avisado(a) quando este produto estiver disponível no estoque:\n\n` +
      `📦 *Produto:* ${p.nome}\n` +
      `🔢 *Quantidade de interesse:* ${safeQty} unidade(s)\n` +
      `👤 *Cliente:* ${wlName.trim()}\n` +
      `📱 *Contato:* ${wlPhone.trim()}\n` +
      `🔗 *Link:* ${productUrl}`;

    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`;

    toast.success("Redirecionando para o WhatsApp da loja...");
    window.open(waUrl, "_blank");

    setWaitlistOpen(false);
    setWlName("");
    setWlPhone("");
    setWlQty(1);
  };
  const [distances, setDistances] = useState<Record<string, number>>({});
  const globalCity = useGeoCep((s) => s.city);
  const fornecedores = useAdminProducts((s) => s.fornecedores);

  const isStoreContext = !!storeSlug || !!selectedStoreId;

  useEffect(() => {
    // Quando já está dentro de uma loja específica, o estoque e preços são diretos da loja — não precisa calcular distâncias de CEP em cada card
    if (isStoreContext || !cep || pharmacies.length === 0) return;
    let mounted = true;
    Promise.all(pharmacies.map(async (ph) => {
      if (!ph?.cep || !cep) return { id: ph.id, d: 1.5 };
      const d = await calculateCepDistanceAsync(cep, ph.cep);
      return { id: ph.id, d };
    })).then(results => {
      if (!mounted) return;
      const dists: Record<string, number> = {};
      results.forEach(r => dists[r.id] = r.d);
      setDistances(dists);
    }).catch(() => {});
    return () => { mounted = false; };
  }, [cep, pharmacies, isStoreContext]);
  
  let maxStock = 0;
  let activeStoreId: string | null = null;
  let activeFornecedor = null;
  let isLocalStock = false;
  const storeFromSlug = storeSlug 
    ? pharmacies.find(ph => ph.slug === storeSlug || safeSlugify(ph.slug || ph.nome || ph.id) === safeSlugify(storeSlug) || ph.id === storeSlug) 
    : null;

  if (selectedStoreId || storeFromSlug) {
    activeStoreId = selectedStoreId || storeFromSlug!.id;
    const isAtivoLocal = p.precosPorLoja?.[activeStoreId]?.ativo !== false;
    maxStock = isAtivoLocal ? getDeterministicStock(p, activeStoreId) : 0;
    isLocalStock = maxStock > 0;
  } else if (cep && Object.keys(distances).length > 0) {
    const rawCity = globalCity || getCityFromCep(cep, pharmacies);
    const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    const citySearch = normalize(rawCity);
    
    const eligiblePharmacies = pharmacies.filter(f => {
      const dist = distances[f.id];
      if (dist === undefined) return false;
      const hasRaios = (f.raiosEntrega || []).some(r => dist <= r.ateKm);
      const hasMeiosCustomizados = (f.meiosEntregaPersonalizados || []).filter(m => m.ativo).some(m => (m.raios || []).some(r => dist <= r.ateKm));
      const canDeliver = f.aceitaEntrega && (hasRaios || hasMeiosCustomizados);
      const canPickup = f.aceitaRetirada;
      // Active for this product
      const productActive = p.precosPorLoja?.[f.id]?.ativo !== false;
      return (canDeliver || canPickup) && productActive;
    }).map(f => {
      return {
        ...f,
        stock: getDeterministicStock(p, f.id),
        isSameCity: normalize(f.cidade).includes(citySearch) || normalize(f.endereco).includes(citySearch)
      };
    });

    // Sort priority: Same city + has stock > Other city + has stock
    const availablePharmacies = eligiblePharmacies.filter(f => f.stock > 0);
    
    if (availablePharmacies.length > 0) {
      // Prioritize by same city, then by distance
      availablePharmacies.sort((a, b) => {
        if (a.isSameCity && !b.isSameCity) return -1;
        if (!a.isSameCity && b.isSameCity) return 1;
        return (distances[a.id] || 0) - (distances[b.id] || 0);
      });
      activeStoreId = availablePharmacies[0].id;
      maxStock = getDeterministicStock(p, activeStoreId);
    } else {
      maxStock = 0;
    }

    isLocalStock = maxStock > 0;
  } else if (!cep) {
    // Find the first pharmacy in the region that has stock AND is active
    const storeWithStock = pharmacies.find(pharm => {
      const isAtivoLocal = p.precosPorLoja?.[pharm.id]?.ativo !== false;
      return isAtivoLocal && getDeterministicStock(p, pharm.id) > 0;
    });
    
    if (storeWithStock) {
      maxStock = getDeterministicStock(p, storeWithStock.id);
      activeStoreId = storeWithStock.id;
    } else {
      // If no pharmacy has stock, just use the first one (stock will be 0)
      maxStock = 0;
      activeStoreId = pharmacies.length > 0 ? pharmacies[0].id : null;
    }
    isLocalStock = maxStock > 0;
  }

  // Prateleira Infinita Fallback (Applies even without CEP)
  if (!isLocalStock && fornecedores && fornecedores.length > 0) {
    const rawCity = globalCity || (cep ? getCityFromCep(cep, pharmacies) : "");
    const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
    const citySearch = normalize(rawCity);
    const citySuppliers = citySearch ? fornecedores.filter(f => normalize(f.cidade).includes(citySearch)) : [];
    activeFornecedor = citySuppliers.length > 0 ? citySuppliers[0] : fornecedores[0];
    
    const supplierStock = getDeterministicStock(p, String(activeFornecedor.id) + "supp");
    maxStock = supplierStock > 0 ? supplierStock : 0;
    if (maxStock > 0) {
      activeStoreId = null; // Clear local store constraint if using infinite shelf
    }
  }

  const isService = p.tipoProduto === "servico" || (p.tipoProduto !== "fisico" && (p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"))));
  
  const activePharm = pharmacies.find(f => f.id === activeStoreId);
  if (isService && activePharm?.offersServices === false) {
    return null;
  }

  const isGlobalActive = p.ativo !== false && p.aVenda !== false;
  const isLocalActive = !activeStoreId || p.precosPorLoja?.[activeStoreId]?.ativo !== false;
  const isAvailable = (maxStock > 0 || isService) && isGlobalActive && isLocalActive;
  const isCampanha = isAvailable && isCampanhaAtiva(p);

  const rawBasePrecoPor = Number(p.precoPor || p.preco || p.precoBase || 0);
  const rawBasePrecoDe = Number(p.precoDe || rawBasePrecoPor);
  let finalPrecoPor = rawBasePrecoPor;
  let finalPrecoDe = rawBasePrecoDe;
  let isLojaPromoActiva = false;

  if (isCampanha && p.precoCampanha && Number(p.precoCampanha) > 0) {
    finalPrecoPor = Number(p.precoCampanha);
  } else if (activeStoreId) {
    // 1. Base table price
    const activePharm = pharmacies.find(f => f.id === activeStoreId);
    if (activePharm) {
      const activeTabela = activePharm.tabelaPrecoId || "poa";
      const regPrice = regionalPrices[`${activeTabela}-${p.id}`];
      if (regPrice !== undefined && Number(regPrice) > 0) finalPrecoPor = Number(regPrice);
    }
    
    // 2. Specific store override
    if (p.precosPorLoja?.[activeStoreId]) {
      const pLoja = p.precosPorLoja[activeStoreId];
      const lojaPrecoPor = pLoja.precoPor ? Number(pLoja.precoPor) : 0;
      const lojaPrecoDe = pLoja.precoDe ? Number(pLoja.precoDe) : 0;
      
      if (lojaPrecoPor > 0) {
        finalPrecoPor = lojaPrecoPor;
      }
      if (lojaPrecoDe > 0) {
        finalPrecoDe = lojaPrecoDe;
      }
      
      if (pLoja.campanhaInicio || pLoja.campanhaFim) {
        const now = new Date();
        let valid = true;
        if (pLoja.campanhaInicio && new Date(pLoja.campanhaInicio + 'T00:00:00') > now) valid = false;
        if (pLoja.campanhaFim && new Date(pLoja.campanhaFim + 'T23:59:59') < now) valid = false;
        if (valid) isLojaPromoActiva = true;
      }
    }
  }

  // Ensure final price is NEVER 0 if base price was positive
  if (finalPrecoPor <= 0 && rawBasePrecoPor > 0) {
    finalPrecoPor = rawBasePrecoPor;
  }
  if (finalPrecoDe < finalPrecoPor) {
    finalPrecoDe = finalPrecoPor;
  }

  // 3. Store-specific & Global Promotions
  const isMedicamento = p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142"));

  const lojaPromocoes = activeStoreId 
    ? (lojaPromocoesMap?.[activeStoreId] || promocoes.filter(pr => pr.lojaId && String(pr.lojaId) === String(activeStoreId))) 
    : [];
  const globalPromocoes = promocoes.filter(p => !p.lojaId || p.lojaId === "" || p.lojaId === "global" || p.lojaId === "all");
  const padraoPromo = getPadraoPromotionWithTimer(p, globalPromocoes, lojaPromocoes);
  const levePaguePromo = getLevePaguePromotion(p, globalPromocoes, lojaPromocoes);

  if (isAvailable && padraoPromo) {
    const promoPreco = (padraoPromo.precoPromocional && padraoPromo.precoPromocional > 0)
      ? padraoPromo.precoPromocional
      : ((padraoPromo.levePague_precoPorItem && padraoPromo.levePague_precoPorItem > 0) ? padraoPromo.levePague_precoPorItem : 0);

    if (promoPreco > 0) {
      finalPrecoDe = Number(p.precoDe) > promoPreco ? Number(p.precoDe) : (Number(p.precoPor) > promoPreco ? Number(p.precoPor) : finalPrecoPor);
      finalPrecoPor = promoPreco;
    } else if (padraoPromo.descontoPercentual && padraoPromo.descontoPercentual > 0) {
      finalPrecoDe = Number(p.precoDe) > 0 ? Number(p.precoDe) : finalPrecoPor;
      finalPrecoPor = finalPrecoPor * (1 - padraoPromo.descontoPercentual / 100);
    }
  }

  const activePromo = isAvailable ? (padraoPromo || levePaguePromo) : null;

  // Cupom da loja aplicável para este produto / categoria
  const eligibleCoupon = useMemo(() => {
    if (!isAvailable || finalPrecoPor <= 0 || !cupons || cupons.length === 0) return null;

    const validCoupons = cupons.filter((c: any) => {
      if (c.ativo === false) return false;

      // Validação de Loja
      const couponLojaId = c.lojaId || c.farmaciaId;
      if (activeStoreId && couponLojaId && couponLojaId !== "global" && couponLojaId !== "all" && String(couponLojaId) !== String(activeStoreId)) {
        return false;
      }

      // Validação de Data
      const now = new Date();
      if (c.dataInicio && new Date(c.dataInicio) > now) return false;
      const validUntil = c.dataTermino || c.validade;
      if (validUntil && new Date(validUntil + (validUntil.includes('T') ? '' : 'T23:59:59')) < now) return false;

      // Validação de Alvo
      const tipoAlvo = c.tipoAlvo || (c.produtosIds?.length ? "produtos" : (c.categoriasIds?.length ? "categorias" : "todos"));
      const alvos: string[] = (c.alvosId || c.produtosIds || c.categoriasIds || []).map((id: any) => String(id).trim().toLowerCase());

      if (tipoAlvo === "produtos" && alvos.length > 0) {
        const pId = String(p.id).toLowerCase();
        const pSku = p.sku ? String(p.sku).toLowerCase() : "";
        if (!alvos.includes(pId) && !alvos.includes(pSku)) return false;
        return true;
      } else if (tipoAlvo === "categorias" && alvos.length > 0) {
        const catId = p.categoriaId ? String(p.categoriaId).toLowerCase() : "";
        const subId = p.subcategoriaId ? String(p.subcategoriaId).toLowerCase() : "";
        const extraCats = (p.categoriasIds || []).map((id: any) => String(id).toLowerCase());
        const matchCat = (catId && alvos.includes(catId)) || (subId && alvos.includes(subId)) || extraCats.some(id => alvos.includes(id));
        if (!matchCat) return false;
        return true;
      }

      // Se for "todos" ou não tiver alvos específicos, aplica para todos os produtos da loja!
      return true;
    });

    if (validCoupons.length === 0) return null;

    let bestCoupon: any = null;
    let bestPrice = finalPrecoPor;

    for (const c of (validCoupons as any[])) {
      const isPercent = c.tipoDesconto === "percentual" || c.tipo === "percent" || Boolean(c.descontoPercentual);
      const val = Number(c.valorDesconto || c.valor || c.descontoPercentual || c.descontoFixo || 0);
      if (val <= 0) continue;

      let discountedPrice = finalPrecoPor;
      if (isPercent) {
        discountedPrice = finalPrecoPor * (1 - val / 100);
      } else {
        discountedPrice = Math.max(0, finalPrecoPor - val);
      }

      if (discountedPrice < bestPrice) {
        bestPrice = discountedPrice;
        bestCoupon = {
          ...c,
          codigo: c.codigo || c.code,
          finalPrice: discountedPrice,
          savings: finalPrecoPor - discountedPrice
        };
      }
    }

    return bestCoupon;
  }, [cupons, isAvailable, finalPrecoPor, activeStoreId, p]);

  const desconto =
    finalPrecoDe > finalPrecoPor ? Math.round((1 - finalPrecoPor / finalPrecoDe) * 100) : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) {
      toast.error("Produto indisponível no momento.");
      return;
    }
    add({
      ...p,
      preco: finalPrecoPor,
      precoPor: finalPrecoPor,
      precoDe: finalPrecoDe,
      estoque: maxStock
    }, 1, true); // silent: true -> NÃO abre carrinho lateral
    showAddedNotification(p.nome, productImage(p));
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 3000);
  };

  const handleBuy = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAvailable) {
      toast.error("Produto indisponível no momento.");
      return;
    }
    useCart.getState().hideAddedNotification();
    add({
      ...p,
      preco: finalPrecoPor,
      precoPor: finalPrecoPor,
      precoDe: finalPrecoDe,
      estoque: maxStock
    }, 1, false); // silent: false -> abre carrinho lateral
    useCart.getState().setDrawer(true);
  };

  const fav = useFavorites((s) => s.ids.map(String).includes(String(p.id).trim()));
  const toggleFav = useFavorites((s) => s.toggle);

  const [mounted, setMounted] = useState(false);
  const { getAvaliacoesPorProduto } = useReviews();
  
  useEffect(() => {
    setMounted(true);
    useFavorites.persist.rehydrate();
  }, []);

  const isGenerico = checkIsGenerico(p);
  
  const allSelos = useSelos((s) => s.selos);
  const productSelosIds = new Set(p.selosIds || []);
  if (isGenerico) {
    productSelosIds.add("gen");
  }
  const activeSelos = allSelos.filter(s => 
    s.ativo && (
      productSelosIds.has(s.id) || 
      (isGenerico && (s.id === "gen" || s.nome.toLowerCase().includes("genérico") || s.nome.toLowerCase().includes("generico")))
    )
  );
  
  const normalizeForMatch = (text: string) => (text || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const activeSeloNormalizedNames = activeSelos.map(s => normalizeForMatch(s.nome));
  const currentUrlSlug = (params as any)?.storeSlug;
  const targetStoreSlug = (currentUrlSlug && currentUrlSlug !== "loja-padrao" && !SYSTEM_PAGES.has(currentUrlSlug))
    ? safeSlugify(currentUrlSlug)
    : activePharm?.slug
    ? safeSlugify(activePharm.slug)
    : (pharmacies[0]?.slug ? safeSlugify(pharmacies[0].slug) : "poa");

  const hasMedicamentoTags = isMedicamento && ((p.tarja && p.tarja !== "none") || p.retemReceita !== undefined);

  return (
    <article className="group/card bg-card rounded-xl border border-slate-200/90 hover:border-primary hover:shadow-elevated transition overflow-hidden flex flex-col justify-between relative w-full h-full">
      {/* Floating Actions */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-1.5">
        {p.youtubeVideoUrl && (
          <div className="bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm flex items-center gap-1">
            <Youtube className="h-3 w-3 text-red-500 fill-current" />
            <span className="tracking-wide">Vídeo</span>
          </div>
        )}
        <button
          type="button"
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              toast.info("Por favor, faça login para adicionar aos favoritos.");
              navigate({ 
                to: "/$storeSlug/login", 
                params: { storeSlug: targetStoreSlug },
                search: { redirect: window.location.pathname } as any 
              });
              return;
            }
            const willBeFav = !fav;
            toggleFav(p.id, finalPrecoPor, !isAvailable);
            if (willBeFav) {
              toast.success("Produto adicionado aos favoritos!");
            } else {
              toast.info("Produto removido dos favoritos.");
            }
          }}
          className="h-7 w-7 sm:h-8 sm:w-8 rounded-full bg-white/95 backdrop-blur border shadow-xs flex items-center justify-center hover:bg-white text-muted-foreground transition-transform active:scale-95"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 transition ${mounted && fav ? "fill-red-500 text-red-500" : ""}`} />
        </button>
        {isAvailable && (
          <button
            type="button"
            aria-label={isService ? "Agendar serviço" : (inCartQty > 0 ? `${inCartQty} no carrinho` : "Adicionar à cesta")}
            onClick={isService ? undefined : handleAddToCart}
            className={`h-7 w-7 sm:h-8 sm:w-8 rounded-full backdrop-blur border shadow-xs flex items-center justify-center transition-all duration-200 active:scale-95 relative overflow-hidden ${
              inCartQty > 0 
                ? "bg-primary text-white border-primary shadow-sm hover:brightness-105" 
                : "bg-white/95 hover:bg-white text-muted-foreground border-slate-200"
            }`}
            title={inCartQty > 0 ? `${inCartQty} no carrinho (clique para adicionar mais)` : "Adicionar ao carrinho"}
          >
            {isService ? (
              <Calendar className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-teal-600" />
            ) : inCartQty > 0 ? (
              <span className="text-white font-black text-[11px] leading-none">
                {inCartQty > 99 ? "99+" : inCartQty}
              </span>
            ) : (
              <ShoppingBasket className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            )}
          </button>
        )}
      </div>

      {/* Product Image Link */}
      <Link
        to="/$storeSlug/produto/$slug"
        preload="intent"
        params={{ storeSlug: targetStoreSlug, slug: p.slug || p.url || p.id }}
        className="relative aspect-square bg-white p-2.5 sm:p-3.5 block overflow-hidden"
      >
        <img
          src={productImage(p)}
          alt={p.nome}
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
          className={`w-full h-full object-contain transition-transform duration-300 md:group-hover/card:scale-105 ${maxStock === 0 && !isService ? 'grayscale opacity-75' : ''}`}
          onError={(e) => {
            const target = e.currentTarget as HTMLImageElement;
            if (!target.src.includes("/produtos/sem-imagem.webp")) {
              target.src = "/produtos/sem-imagem.webp";
            }
          }}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none items-start">
          {activeSelos.map(selo => (
            <span key={selo.id} style={{ backgroundColor: selo.corFundo, color: selo.corTexto }} className="text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-1 w-max">
              {selo.id === 'servico' && <Stethoscope className="h-2.5 w-2.5" />}
              {selo.id === 'servico' ? (selo.nome?.toUpperCase() || "SERVIÇO") : highlightGratis(selo.nome)}
            </span>
          ))}
        </div>
      </Link>

      {/* Product Content */}
      <div className="p-2.5 sm:p-3 flex-1 flex flex-col justify-between">
        <div>
          {/* Promotional Badge (Timer / Leve + Pague) */}
          {activePromo && (
            <div className="mb-1.5">
              <PromoCardBadge promo={activePromo} precoOriginal={finalPrecoDe} />
            </div>
          )}

          {/* Marca */}
          {p.marca && (
            <div className="text-[10px] sm:text-[11px] uppercase font-bold text-muted-foreground truncate mb-0.5">
              {p.marca}
            </div>
          )}

          {/* Nome do Produto */}
          <Link
            to="/$storeSlug/produto/$slug"
            preload="intent"
            params={{ storeSlug: targetStoreSlug, slug: p.slug || p.url || p.id }}
            style={{ color: 'var(--headings, inherit)' }}
            className="product-title-clamp text-[12px] sm:text-sm font-bold text-slate-800 hover:text-primary-dark transition-colors"
            title={p.nome}
          >
            {p.nome}
          </Link>

          {/* Preços */}
          <div className="flex flex-col mt-1 min-h-[42px] sm:min-h-[46px] justify-center">
            {!isAvailable ? (
              <div className="py-0.5 flex flex-col justify-center">
                <span className="text-xs sm:text-sm font-semibold text-slate-400">
                  Indisponível
                </span>
                <span className="text-[10px] text-muted-foreground">
                  Sem estoque no momento
                </span>
              </div>
            ) : p.precoSobConsulta ? (
              <div className="text-sm sm:text-base font-bold text-slate-700 py-0.5 flex items-center">
                Preço sob consulta
              </div>
            ) : levePaguePromo ? (
              <div className="flex flex-col justify-center border-l-2 border-primary px-2 py-0.5 my-0.5">
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-primary">{levePaguePromo.levePague_quantidade} por</span>
                  <div className="text-base sm:text-xl font-bold text-foreground" style={{ color: 'var(--price-main, inherit)' }}>
                    {brl(levePaguePromo.levePague_precoPorItem || 0)}
                  </div>
                  <span className="text-xs font-medium text-primary">cada</span>
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold">
                  1 por {brl(finalPrecoPor)}
                </div>
              </div>
            ) : (
              <>
                {finalPrecoDe > finalPrecoPor ? (
                  <div 
                    className="text-[11px] sm:text-xs text-muted-foreground line-through decoration-red-500/50 leading-tight"
                    style={{ color: 'var(--price-old, inherit)' }}
                  >
                    {brl(finalPrecoDe)}
                  </div>
                ) : null}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <div 
                    className="text-base sm:text-xl font-bold text-foreground leading-tight"
                    style={{ color: 'var(--price-main, inherit)' }}
                  >
                    {brl(finalPrecoPor)}
                  </div>
                  {!eligibleCoupon && desconto > 0 && (
                    <span 
                      className="inline-flex shrink-0 items-center text-[9px] sm:text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{
                        backgroundColor: 'var(--price-discount-badge-bg, #e6f4ea)',
                        color: 'var(--price-discount-badge-text, #137333)',
                      }}
                    >
                      -{desconto}%
                    </span>
                  )}
                </div>

                {eligibleCoupon ? (() => {
                  const targetPharmacy = pharmacies.find(ph => ph.id === (eligibleCoupon.lojaId || activeStoreId));
                  const storeBg = targetPharmacy?.themeColors?.['--coupon-badge-bg'] || targetPharmacy?.themeColors?.couponBadgeBg || targetPharmacy?.themeColors?.['--primary'] || targetPharmacy?.themeColors?.primary;
                  const storeText = targetPharmacy?.themeColors?.['--coupon-badge-text'] || targetPharmacy?.themeColors?.couponBadgeText || targetPharmacy?.themeColors?.['--primary-foreground'] || targetPharmacy?.themeColors?.primaryForeground || '#ffffff';
                  const storeBorder = targetPharmacy?.themeColors?.['--coupon-badge-border'] || targetPharmacy?.themeColors?.couponBadgeBorder || storeBg;

                  const badgeBg = eligibleCoupon.badgeBg || storeBg || 'var(--coupon-badge-bg, #00b5ad)';
                  const badgeText = eligibleCoupon.badgeText || storeText || 'var(--coupon-badge-text, #ffffff)';
                  const badgeBorder = eligibleCoupon.badgeBorder || storeBorder || 'var(--coupon-badge-border, transparent)';

                  return (
                    <div 
                      className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] sm:text-xs font-bold tracking-tight border shadow-2xs self-start transition-all"
                      style={{
                        backgroundColor: badgeBg,
                        color: badgeText,
                        borderColor: badgeBorder,
                      }}
                      title={`Cupom da loja: ${eligibleCoupon.codigo || eligibleCoupon.code}`}
                    >
                      <Ticket className="w-3 h-3 shrink-0" />
                      <span>{brl(eligibleCoupon.finalPrice)} com Cupom</span>
                    </div>
                  );
                })() : (
                  getInstallmentText(finalPrecoPor) && (
                    <div className="text-[10px] text-slate-500 font-medium leading-tight">
                      {getInstallmentText(finalPrecoPor)}
                    </div>
                  )
                )}
              </>
            )}
          </div>

          {/* Tarjas e Receita */}
          {hasMedicamentoTags && (
            <div className="flex flex-wrap gap-1 mt-1 mb-0.5">
              {p.tarja && p.tarja !== "none" && (
                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shadow-2xs ${tarjaColor(p.tarja)}`}>
                  {p.tarja === "Vermelha" || p.tarja === "Amarela" ? `Tarja ${p.tarja}` : p.tarja}
                </span>
              )}
              {p.retemReceita === true ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded shadow-2xs bg-red-600 text-white font-bold">
                  Retém receita
                </span>
              ) : p.retemReceita === false ? (
                <span className="text-[9px] px-1.5 py-0.5 rounded shadow-2xs bg-slate-100 text-slate-700 font-bold border border-slate-200">
                  Não retém receita
                </span>
              ) : null}
            </div>
          )}
          
          {/* Disclaimer para medicamentos */}
          {isMedicamento && (
            <div className="text-[7.5px] leading-tight font-semibold text-slate-400 uppercase mt-0.5 mb-1 line-clamp-1" title="AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.">
              {p.alertaTexto || "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."}
            </div>
          )}

          {isService && (
            <div className="text-[10px] text-primary font-bold my-1 inline-flex items-center gap-1">
              Agendamento rápido <Zap className="h-3 w-3 fill-primary text-primary" />
            </div>
          )}

          {/* Oferta / Selo Extra */}
          {isLojaPromoActiva && isStoreContext && (
            <span className="inline-block self-start text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider my-0.5">
              EM OFERTA
            </span>
          )}
          {p.selo && p.selo.toUpperCase() !== "SEM SELO" && p.selo.toUpperCase() !== "NENHUMA AÇÃO" && (() => {
            const normalizedPSelo = normalizeForMatch(p.selo);
            const isSeloServicoLinked = p.selosIds?.includes('servico');
            const isSeloGenLinked = p.selosIds?.includes('gen');
            
            if (activeSeloNormalizedNames.includes(normalizedPSelo)) return false;
            if (isSeloServicoLinked && normalizedPSelo.includes("SERVICO")) return false;
            if (isSeloGenLinked && normalizedPSelo.includes("GENERICO")) return false;
            
            return true;
          })() && (
            <span className="inline-block self-start text-[9px] font-bold bg-accent text-accent-foreground px-1.5 py-0.5 rounded my-0.5">
              {highlightGratis(formatPbmName(p.selo))}
            </span>
          )}
        </div>

        {/* Botão de Compra */}
        <div className="flex flex-col gap-1.5 mt-auto pt-1 w-full">
          {isAvailable ? (
            <button 
              onClick={(e) => { 
                if (isService) return;
                if (!p.precoSobConsulta) {
                  handleBuy(e);
                } else {
                  e.preventDefault();
                  window.location.href = `/${(params as any)?.storeSlug || pharmacies.find(f => f.id === activeStoreId)?.slug || "loja-padrao"}/produto/${p.slug || p.url || p.id}`;
                }
              }}
              style={
                activePromo?.corBotao
                  ? { backgroundColor: activePromo.corBotao, color: activePromo.corTextoBotao || '#ffffff' }
                  : (!isService && !p.precoSobConsulta
                      ? { backgroundColor: 'var(--btn-primary-bg, var(--primary))', color: 'var(--btn-primary-text, var(--primary-foreground, #ffffff))' }
                      : undefined)
              }
              className={`w-full font-bold text-xs py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] rounded-lg transition flex items-center justify-center gap-1.5 shadow-xs hover:brightness-110 active:scale-[0.99] relative overflow-hidden ${
                activePromo?.corBotao
                  ? ''
                  : isService
                  ? 'bg-teal-600 hover:bg-teal-700 text-white'
                  : p.precoSobConsulta
                  ? 'bg-slate-800 hover:bg-slate-900 text-white'
                  : 'bg-primary hover:bg-primary-dark text-white'
              }`}
            >
              {isService ? "AGENDAR" : (p.precoSobConsulta ? "CONSULTAR PREÇO" : (
                <>
                  <ShoppingBasket className="h-3.5 w-3.5" />
                  <span>{activePromo?.textoBotao || "COMPRAR"}</span>
                </>
              ))}

              {/* Barrinha de carregamento rápido (cerca de 3 segundos) no botão */}
              {justAdded && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30 overflow-hidden rounded-b-lg">
                  <div 
                    className="h-full bg-emerald-400"
                    style={{
                      animation: 'cartBtnProgress 3s linear forwards'
                    }}
                  />
                </div>
              )}
            </button>
          ) : (
            <button 
              onClick={(e) => { e.preventDefault(); setWaitlistOpen(true); }}
              className="w-full bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs py-2 sm:py-2.5 min-h-[36px] sm:min-h-[40px] rounded-lg flex items-center justify-center gap-1.5 transition active:scale-[0.99] shadow-2xs"
              title="Produto indisponível no momento. Clique para ser avisado quando chegar."
            >
              <Bell className="h-3.5 w-3.5 text-slate-500" />
              <span>AVISE-ME</span>
            </button>
          )}
        </div>
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Avise-me quando chegar
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Deixe seus dados e entraremos em contato via WhatsApp assim que este produto voltar ao estoque.</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome completo <span className="text-red-500">*</span></label>
              <Input placeholder="Seu nome" value={wlName} onChange={(e) => setWlName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp <span className="text-red-500">*</span></label>
              <Input placeholder="(00) 00000-0000" value={wlPhone} onChange={(e) => setWlPhone(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade de interesse <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWlQty(Math.max(1, wlQty - 1)); }}
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={wlQty}
                  onChange={(e) => setWlQty(Math.max(1, parseInt(e.target.value, 10) || 1))}
                  className="w-20 text-center font-bold"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="icon" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWlQty(wlQty + 1); }}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWaitlistOpen(false); }}>Cancelar</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWaitlistSubmit(); }}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Avisar-me no WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export const ProductCard = React.memo(ProductCardComponent);
