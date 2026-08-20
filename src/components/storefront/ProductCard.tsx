import { Link, useParams, useNavigate } from "@tanstack/react-router";
import { Heart, ShoppingBasket, Zap, Star, StarHalf, Calendar, Stethoscope, Truck, Bell, Flame, Gift, ShoppingBag, Youtube } from "lucide-react";
import React, { useEffect, useState } from "react";
import type { Produto } from "@/types";
import { brl, getInstallmentText, productImage, tarjaColor, checkIsGenerico, formatPbmName } from "@/lib/format";
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
import { getCityFromCep, isCampanhaAtiva, calculateCepDistanceAsync, getDeliveryEstimation, isRecentlyAdded, getLevePaguePromotion, getPadraoPromotionWithTimer } from "@/lib/utils";
import { useRegionsStore } from "@/stores/regions";
import { useMarketing } from "@/stores/marketing";
import { PromoCardBadge } from "./PromoCountdown";

// Removed isSameDayDeliveryWindow

const WHATSAPP_PHONE = "5551999999999"; // mock

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
  const recentlyAdded = isRecentlyAdded(p);
  
  const add = useCart((s) => s.add);
  const pbm = isPbmEligible(p);
  const cep = useGeoCep((s) => s.cep);
  
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [wlName, setWlName] = useState("");
  const [wlPhone, setWlPhone] = useState("");
  const addWaitlistEntry = useWaitlist((s) => s.addEntry);
  
  const handleWaitlistSubmit = () => {
    if (!wlName || !wlPhone) {
      toast.error("Preencha todos os campos");
      return;
    }
    addWaitlistEntry({
      produtoId: p.id,
      clienteNome: wlName,
      whatsapp: wlPhone
    });
    toast.success("Avisaremos você quando o produto chegar!");
    setWaitlistOpen(false);
    setWlName("");
    setWlPhone("");
  };
  const [distances, setDistances] = useState<Record<string, number>>({});
  const globalCity = useGeoCep((s) => s.city);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const fornecedores = useAdminProducts((s) => s.fornecedores);

  useEffect(() => {
    if (!cep || pharmacies.length === 0) return;
    let mounted = true;
    Promise.all(pharmacies.map(async (ph) => {
      const d = await calculateCepDistanceAsync(cep, ph.cep);
      return { id: ph.id, d };
    })).then(results => {
      if (!mounted) return;
      const dists: Record<string, number> = {};
      results.forEach(r => dists[r.id] = r.d);
      setDistances(dists);
    });
    return () => { mounted = false; };
  }, [cep, pharmacies]);
  
  let maxStock = 0;
  let activeStoreId: string | null = null;
  let activeFornecedor = null;
  let isLocalStock = false;
  // isStoreContext: true when rendered inside a specific store route (has storeSlug param)
  const params = useParams({ strict: false });
  const isStoreContext = !!((params as any)?.storeSlug);

  if (selectedStoreId) {
    activeStoreId = selectedStoreId;
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
      const canDeliver = f.aceitaEntrega && (f.raiosEntrega || []).some(r => dist <= r.ateKm);
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
      maxStock = availablePharmacies[0].stock;
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
    
    const supplierStock = getDeterministicStock(p.id, String(activeFornecedor.id) + "supp");
    maxStock = supplierStock > 0 ? supplierStock : 0;
    if (maxStock > 0) {
      activeStoreId = null; // Clear local store constraint if using infinite shelf
    }
  }

  const isService = p.tipoProduto === "servico" || p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"));
  
  const activePharm = pharmacies.find(f => f.id === activeStoreId);
  if (isService && activePharm?.offersServices === false) {
    return null;
  }

  const isGlobalActive = p.ativo !== false && p.aVenda !== false;
  const isLocalActive = !activeStoreId || p.precosPorLoja?.[activeStoreId]?.ativo !== false;
  const isAvailable = (maxStock > 0 || isService) && isGlobalActive && isLocalActive;
  const isCampanha = isAvailable && isCampanhaAtiva(p);
  let finalPrecoPor = p.precoPor;
  let finalPrecoDe = p.precoDe;
  let isLojaPromoActiva = false;

  if (isCampanha) {
    finalPrecoPor = p.precoCampanha || p.precoPor;
  } else if (activeStoreId) {
    // 1. Base table price
    const activePharm = pharmacies.find(f => f.id === activeStoreId);
    if (activePharm) {
      const activeTabela = activePharm.tabelaPrecoId || "poa";
      const regPrice = regionalPrices[`${activeTabela}-${p.id}`];
      if (regPrice !== undefined) finalPrecoPor = regPrice;
    }
    
    // 2. Specific store override
    if (p.precosPorLoja?.[activeStoreId]) {
      const pLoja = p.precosPorLoja[activeStoreId];
      finalPrecoPor = pLoja.precoPor ?? finalPrecoPor;
      finalPrecoDe = pLoja.precoDe ?? finalPrecoDe;
      
      if (pLoja.campanhaInicio || pLoja.campanhaFim) {
        const now = new Date();
        let valid = true;
        if (pLoja.campanhaInicio && new Date(pLoja.campanhaInicio + 'T00:00:00') > now) valid = false;
        if (pLoja.campanhaFim && new Date(pLoja.campanhaFim + 'T23:59:59') < now) valid = false;
        if (valid) isLojaPromoActiva = true;
      }
    }
  }

  // 3. Store-specific & Global Promotions
  const isMedicamento = p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142"));

  const lojaPromocoes = activeStoreId ? lojaPromocoesMap?.[activeStoreId] || [] : [];
  const globalPromocoes = promocoes.filter(p => !p.lojaId);
  const padraoPromo = getPadraoPromotionWithTimer(p, globalPromocoes, lojaPromocoes);
  const levePaguePromo = getLevePaguePromotion(p, globalPromocoes, lojaPromocoes);

  if (isAvailable && padraoPromo) {
    if (padraoPromo.precoPromocional && padraoPromo.precoPromocional > 0) {
      finalPrecoDe = finalPrecoPor;
      finalPrecoPor = padraoPromo.precoPromocional;
    } else if (padraoPromo.descontoPercentual && padraoPromo.descontoPercentual > 0) {
      finalPrecoDe = finalPrecoPor;
      finalPrecoPor = finalPrecoPor * (1 - padraoPromo.descontoPercentual / 100);
    } else if (padraoPromo.levePague_precoPorItem && padraoPromo.levePague_precoPorItem > 0) {
      finalPrecoDe = finalPrecoPor;
      finalPrecoPor = padraoPromo.levePague_precoPorItem;
    }
  }

  const activePromo = isAvailable ? (padraoPromo || levePaguePromo) : null;

  const desconto =
    finalPrecoDe > finalPrecoPor ? Math.round((1 - finalPrecoPor / finalPrecoDe) * 100) : 0;

  const fav = useFavorites((s) => s.ids.includes(p.id));
  const toggleFav = useFavorites((s) => s.toggle);

  const [mounted, setMounted] = useState(false);  const { getAvaliacoesPorProduto } = useReviews();
  
  useEffect(() => {
    setMounted(true);
    useFavorites.persist.rehydrate();
  }, []);

  const isGenerico = checkIsGenerico(p);
  const wppText = encodeURIComponent(
    `Olá! Quero comprar: ${p.nome} (EAN ${p.ean}) — ${brl(p.precoPor)}`,
  );
  
  const allSelos = useSelos((s) => s.selos);
  const activeSelos = allSelos.filter(s => s.ativo && p.selosIds?.includes(s.id));
  const servicoSelo = allSelos.find(s => s.id === "servico");

  return (
    <article className="group bg-card rounded-xl border hover:border-primary hover:shadow-elevated transition overflow-hidden flex flex-col relative h-full w-full">
      {/* Floating Actions */}
      <div className="absolute top-2 right-2 z-10 flex flex-col items-end gap-2">
        {p.youtubeVideoUrl && (
          <div className="bg-black/80 backdrop-blur text-white text-[10px] font-bold px-2 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
            <Youtube className="h-3.5 w-3.5 text-red-500 fill-current" />
            <span className="tracking-wide">Vídeo do Produto</span>
          </div>
        )}
        <button
          type="button"
          aria-label={fav ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          onClick={(e) => {
            e.preventDefault();
            if (!user) {
              toast.info("Por favor, faça login para adicionar aos favoritos.");
              navigate({ to: "/login", search: { redirect: window.location.pathname } as any });
              return;
            }
            toggleFav(p.id, finalPrecoPor);
          }}
          className="h-8 w-8 rounded-full bg-white/90 backdrop-blur border shadow-sm flex items-center justify-center hover:bg-white text-muted-foreground"
        >
          <Heart className={`h-4 w-4 transition ${mounted && fav ? "fill-red-500 text-red-500" : ""}`} />
        </button>
        <button
          type="button"
          aria-label={isService ? "Agendar serviço" : "Adicionar à cesta"}
          onClick={(e) => {
            e.preventDefault();
            add({ ...p, estoque: maxStock });
          }}
          className="h-8 w-8 rounded-full bg-white/90 backdrop-blur border shadow-sm flex items-center justify-center hover:bg-white text-muted-foreground relative"
        >
          {isService ? <Calendar className="h-4 w-4 text-teal-600" /> : <ShoppingBasket className="h-4 w-4" />}
          {!isService && <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-primary text-white flex items-center justify-center rounded-full text-[9px] font-bold">+</span>}
        </button>
      </div>



      <Link
        to="/p/$slug"
        preload="intent"
        params={{ slug: p.url || p.id }}
        className="relative aspect-square bg-white p-4 block"
      >
        <img
          src={productImage(p)}
          alt={p.nome}
          loading="lazy"
          decoding="async"
          width={400}
          height={400}
          className={`w-full h-full object-contain transition-transform duration-500 md:group-hover:scale-110 ${maxStock === 0 && !isService ? 'grayscale opacity-75' : ''}`}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1 z-10 pointer-events-none items-start">
          {recentlyAdded && (
            <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm w-max">
              ACABOU DE CHEGAR
            </span>
          )}

          {isCampanha && (
            <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 w-max">
              <Calendar className="h-3 w-3" /> Oferta de {new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
            </span>
          )}
          {isService && servicoSelo?.ativo && (
            <span style={{ backgroundColor: servicoSelo?.corFundo, color: servicoSelo?.corTexto }} className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm flex items-center gap-1 w-max">
              <Stethoscope className="h-3 w-3" /> {servicoSelo?.nome?.toUpperCase() || "SERVIÇO"}
            </span>
          )}
          {!isService && isGenerico && (
            <span className="bg-yellow-400 text-black text-[10px] font-bold px-2 py-0.5 rounded shadow-sm w-max">
              GENÉRICO
            </span>
          )}
          {activeSelos.map(selo => (
            <span key={selo.id} style={{ backgroundColor: selo.corFundo, color: selo.corTexto }} className="text-[10px] font-bold px-2 py-0.5 rounded shadow-sm w-max">
              {selo.nome}
            </span>
          ))}
        </div>
      </Link>

      <div className="p-3 flex-1 flex flex-col">
        {/* Promotional Badge (Timer / Leve + Pague) */}
        {activePromo && (
          <div className="mb-1.5">
            <PromoCardBadge promo={activePromo} precoOriginal={finalPrecoDe} />
          </div>
        )}

        {/* Marca em negrito */}
        <div className="text-[11px] uppercase font-bold text-muted-foreground truncate mb-1">
          {p.marca}
        </div>
        <Link
          to="/p/$slug"
          preload="intent"
          params={{ slug: p.url || p.id }}
          className="text-sm md:text-[15px] font-bold line-clamp-2 h-[2.5em] hover:text-primary-dark leading-tight overflow-hidden"
        >
          {p.nome}
        </Link>
          <div className="flex flex-col mt-1">
            {p.precoSobConsulta ? (
              <div className="text-lg sm:text-xl font-bold text-slate-700 min-h-[50px] flex items-center">
                Preço sob consulta
              </div>
            ) : levePaguePromo ? (
              <div className="flex flex-col justify-center min-h-[50px] border-l-2 border-primary px-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-primary">{levePaguePromo.levePague_quantidade} por</span>
                  <div className="text-lg sm:text-2xl font-bold text-foreground">
                    {brl(levePaguePromo.levePague_precoPorItem || 0)}
                  </div>
                  <span className="text-sm font-medium text-primary">cada</span>
                </div>
                <div className="text-[11px] text-muted-foreground font-semibold mt-0.5">
                  1 por {brl(finalPrecoPor)}
                </div>
              </div>
            ) : (
              <>
                {finalPrecoDe > finalPrecoPor ? (
                  <div className="text-xs sm:text-sm text-muted-foreground line-through decoration-red-500/50 min-h-[20px]">
                    {brl(finalPrecoDe)}
                  </div>
                ) : (
                  <div className="min-h-[20px]" aria-hidden="true" />
                )}
                <div className="flex items-center gap-2">
                  <div className="text-lg sm:text-2xl font-bold text-foreground truncate">{brl(finalPrecoPor)}</div>
                  {desconto > 0 && (
                    <span className="inline-flex shrink-0 items-center bg-[#e6f4ea] text-[#137333] text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2 py-0.5 rounded-full">
                      -{desconto}%
                    </span>
                  )}
                </div>

                {getInstallmentText(finalPrecoPor) && (
                  <div className="text-[10px] text-slate-500 font-medium h-[15px]">
                    {getInstallmentText(finalPrecoPor)}
                  </div>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap gap-1 mt-1 mb-1 min-h-[18px]">
            {isMedicamento && p.tarja && p.tarja !== "none" && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm ${tarjaColor(p.tarja)}`}>
                {p.tarja === "Vermelha" || p.tarja === "Amarela" ? `Tarja ${p.tarja}` : p.tarja}
              </span>
            )}
            {isMedicamento && p.retemReceita ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded shadow-sm bg-red-600 text-white font-bold">
                Retém receita
              </span>
            ) : (isMedicamento && p.retemReceita === false ? (
              <span className="text-[9px] px-1.5 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Não retém receita
              </span>
            ) : null)}
          </div>
          
          {isMedicamento && (
            <div className="text-[7.5px] leading-[1.2] font-semibold text-slate-500 uppercase mb-2 line-clamp-2" title="AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO.">
              {p.alertaTexto || "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."}
            </div>
          )}

          {isService && (
            <div className="text-[11px] text-primary font-bold mb-3 inline-flex items-center gap-1">
              Agendamento rápido <Zap className="h-3 w-3 fill-primary text-primary" />
            </div>
          )}

          <div className="flex flex-col gap-2 mt-auto">
            {isAvailable ? (
              <button 
                onClick={(e) => { 
                  e.preventDefault(); 
                  if (!p.precoSobConsulta) {
                    add({ ...p, estoque: Math.max(1, maxStock) }); 
                  } else {
                    window.location.href = `/p/${p.url || p.id}`;
                  }
                }}
                style={
                  activePromo?.corBotao
                    ? { backgroundColor: activePromo.corBotao, color: activePromo.corTextoBotao || '#ffffff' }
                    : undefined
                }
                className={`w-full font-bold text-xs py-2.5 rounded transition flex items-center justify-center gap-2 shadow-sm hover:brightness-110 active:scale-[0.99] ${
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
                    <ShoppingBasket className="h-4 w-4" />
                    <span>{activePromo?.textoBotao || "COMPRAR"}</span>
                  </>
                ))}
              </button>
            ) : (
              <div className="flex flex-col gap-2 w-full mt-auto">
                <span className="w-full bg-slate-200 text-slate-500 font-bold text-xs py-1.5 rounded text-center">
                  INDISPONÍVEL
                </span>
                <button 
                  onClick={(e) => { e.preventDefault(); setWaitlistOpen(true); }}
                  className="w-full bg-white border-2 border-slate-200 hover:border-primary hover:text-primary text-slate-600 font-bold text-xs py-2 rounded flex items-center justify-center gap-1.5 transition"
                >
                  <Bell className="h-3.5 w-3.5" />
                  AVISE-ME
                </button>
              </div>
            )}
          </div>
        </div>



        <div className="mt-auto pt-3 flex flex-col gap-1">
          {isLojaPromoActiva && isStoreContext && (
              <span className="inline-block self-start text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded uppercase tracking-wider mb-1">
                EM OFERTA
              </span>
            )}
            {p.selo && p.selo.toUpperCase() !== "SEM SELO" && p.selo.toUpperCase() !== "NENHUMA AÇÃO" && (
            <span className="inline-block self-start text-[10px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">
              {formatPbmName(p.selo)}
            </span>
          )}
          
      </div>

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="max-w-md" onClick={(e) => e.stopPropagation()}>
          <DialogHeader>
            <DialogTitle>Avise-me quando chegar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Deixe seus dados e entraremos em contato via WhatsApp assim que este produto voltar ao estoque.</p>
            <div className="space-y-2">
              <label className="text-sm font-medium">Nome completo</label>
              <Input placeholder="Seu nome" value={wlName} onChange={(e) => setWlName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">WhatsApp</label>
              <Input placeholder="(00) 00000-0000" value={wlPhone} onChange={(e) => setWlPhone(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setWaitlistOpen(false); }}>Cancelar</Button>
            <Button onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleWaitlistSubmit(); }}>Avisar-me</Button>
          </div>
        </DialogContent>
      </Dialog>
    </article>
  );
}

export const ProductCard = React.memo(ProductCardComponent);


