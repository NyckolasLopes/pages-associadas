import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, notFound, Link, useParams } from "@tanstack/react-router";
import mascotNotFound from "@/assets/produto-nao-encontrado.png";
import { catalog } from "@/services/catalog";
import { brl, productImage, tarjaColor, checkIsGenerico, getInstallmentText, formatPbmName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useGeoCep } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { FileText, MapPin, Search, ChevronRight, ChevronLeft, X, Heart, Share2, Plus, Minus, Truck, Handshake, ShieldCheck, Store, CheckCircle2, AlertCircle, ChevronDown, Bike, Zap, Star, StarHalf, Calendar, Youtube, Play, ExternalLink, ShoppingBasket, Info, Ticket, Check } from "lucide-react";
import { NotFound } from "@/components/storefront/NotFound";
import categoriesData from "@/data/categories.json";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { sanitizeHtml } from "@/lib/security";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";
import { ProductStory } from "@/components/storefront/ProductStory";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Flame, Gift, ShoppingBag, Stethoscope } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { useReviews } from "@/stores/reviews";
import { useQuestions } from "@/stores/questions";
import { toast } from "sonner";
import { useWaitlist } from "@/stores/waitlist";
import { useAuth } from "@/stores/auth";
import { useSelos } from "@/stores/selos";
import { LoginModal } from "@/components/storefront/LoginModal";
import { getCityFromCep, getCityFromCepAsync, isCampanhaAtiva, getCepCoordinates, getDeliveryEstimation, isRecentlyAdded, getLevePaguePromotion, getPadraoPromotionWithTimer } from "@/lib/utils";
import { getRoadDistanceKm } from "@/lib/distanceApis";
import { useRegionsStore } from "@/stores/regions";
import { useMarketing } from "@/stores/marketing";
import { PromoProductPageBanner, PromoLevePagueOfferBox } from "@/components/storefront/PromoCountdown";
import { getDeterministicStock } from "@/lib/stock";

const PromoIcon = ({ id, className }: { id: string, className?: string }) => {
  if (id === 'gift') return <Gift className={className} />;
  if (id === 'star') return <Star className={className} />;
  if (id === 'zap') return <Zap className={className} />;
  if (id === 'shopping-bag') return <ShoppingBag className={className} />;
  return <Flame className={className} />;
};

export const Route = createFileRoute("/_store/$storeSlug/produto/$slug")({
  validateSearch: (search: Record<string, unknown>): { shared?: string } => {
    return {
      shared: search.shared as string | undefined,
    }
  },
  loader: async ({ params }) => {
    const storeSlug = params.storeSlug;
    const { useAdmin } = await import("@/stores/admin");
    const pharmacies = useAdmin.getState().pharmacies;
    let loja = pharmacies.find((ph: any) => (ph.slug || "").toLowerCase() === (storeSlug || "").toLowerCase());
    if (!loja) {
      loja = pharmacies.filter((ph: any) => ph.ativo !== false)[0] || pharmacies[0];
    }
    const p = await catalog.getProductBySlug(params.slug, loja?.id);
    if (!p) throw notFound();
    const [cat, subcat, crossSell, compreJuntoPartner] = await Promise.all([
      p.categoriaId ? catalog.getCategoryById(p.categoriaId) : Promise.resolve(null),
      p.subcategoriaId ? catalog.getCategoryById(p.subcategoriaId) : Promise.resolve(null),
      catalog.crossSell([p.id], 5, p.categoriaId),
      p.compreJuntoProdutoId ? catalog.getProductById(p.compreJuntoProdutoId) : Promise.resolve(null)
    ]);
    
    // Find variations (same exact title excluding numbers/units and colors)
    const normalizeForVariation = (nome: any) => 
      String(nome || '').replace(/[0-9]+(?:,[0-9]+)?\s*(?:MG|G|ML|KG|UNIDADES|COMPRIMIDOS|CÁPSULAS|SACHÊS|FPS|UI|UN|UI\/G|MG\/G|ML\/ML)?/gi, '')
          .replace(/\b(AZUL|VERDE|VERMELHO|VERMELHA|AMARELO|AMARELA|BRANCO|BRANCA|PRETO|PRETA|ROSA|ROXO|LARANJA|MARROM|CINZA)\b/gi, '')
          .replace(/\s+/g, ' ').trim();
      
    const normalizedTarget = normalizeForVariation(p.nome);
    
    const allProducts = await catalog.listProducts();
    const variations = allProducts.filter(p2 => 
      p2.id !== p.id && 
      p2.categoriaId === p.categoriaId &&
      normalizeForVariation(p2.nome) === normalizedTarget
    ).slice(0, 5);

    return { p, loja, cat, subcat, crossSell, variations, compreJuntoPartner };
  },
  head: ({ loaderData, params }: any) => {
    if (!loaderData) return {};
    const p = loaderData.p;
    const loja = loaderData.loja;
    const storeSlug = params?.storeSlug || "loja-padrao";
    if (!p) return {};
    const title = `${p.nome} — Farmácias Associadas`;
    const desc = (p.descricao || `Compre ${p.nome} com o melhor preço nas Farmácias Associadas${loja?.cidade ? ` em ${loja.cidade}` : ''}. Entrega rápida e segura.`).slice(0, 160);
    const img = productImage(p);
    const prodUrl = `https://farmaciasassociadas.com.br/${storeSlug}/produto/${p.url || p.slug || p.id}`;
    const priceAmount = (p.precoPor || p.precoDe || 0).toString();

    return {
      links: [
        { rel: "canonical", href: prodUrl },
      ],
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { property: "og:url", content: prodUrl },
        { property: "og:type", content: "product" },
        { property: "og:site_name", content: "Farmácias Associadas" },
        { property: "product:price:amount", content: priceAmount },
        { property: "product:price:currency", content: "BRL" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
    };
  },
  notFoundComponent: () => <NotFound type="product" />,
  errorComponent: ({ error }) => (
    <div className="container-fa py-12 text-center text-red-500">
      <h1 className="text-2xl font-bold mb-4">Erro ao carregar produto</h1>
      <pre className="text-left p-4 bg-red-50 rounded overflow-auto text-xs">{error?.message || String(error)}</pre>
      <pre className="text-left p-4 bg-red-50 rounded overflow-auto text-xs mt-4">{error?.stack}</pre>
    </div>
  ),
  component: PDP,
});

function isSameDayDeliveryWindow(d = new Date()) {
  const day = d.getDay();
  const hour = d.getHours();
  return day >= 1 && day <= 5 && hour >= 9 && hour < 21;
}



function AnvisaDisclaimer({ 
  p, confirmDeliveryOpen, setConfirmDeliveryOpen, forcedPharmacyModal, setForcedPharmacyModal, isShared, globalCep, cep, setCep, isCalcLoading, availablePharmacies, selectedPharmacyId, setSelectedPharmacyId, setSelectedFreight, qty, isService, add, maxStock 
}: { 
  p: any, confirmDeliveryOpen: boolean, setConfirmDeliveryOpen: (o: boolean) => void, forcedPharmacyModal: boolean, setForcedPharmacyModal: (o: boolean) => void, isShared: boolean, globalCep: string | null, cep: string, setCep: (cep: string) => void, isCalcLoading: boolean, availablePharmacies: any[], selectedPharmacyId: string | null, setSelectedPharmacyId: (id: string) => void, setSelectedFreight: (f: string) => void, qty: number, isService: boolean, add: any, maxStock: number 
}) {
  if (p.categoriaId !== "142") return null;

  const isGenerico = checkIsGenerico(p);
  const isRetencao = !!p.retemReceita;
  const tarja = String(p.tarja || "").toLowerCase();

  let text = "";

  if (tarja.includes("preta")) {
    text = "VENDA SOB PRESCRIÇÃO MÉDICA. O ABUSO DESTE MEDICAMENTO PODE CAUSAR DEPENDÊNCIA. ATENÇÃO: SÓ PODE SER VENDIDO COM RETENÇÃO DA RECEITA.";
    if (isGenerico) text += " Medicamento Genérico - Lei 9.787/99.";
    text += " Este produto é um medicamento. O seu uso pode trazer riscos. Procure o médico e o farmacêutico. Leia a bula. Se persistirem os sintomas, o médico deverá ser consultado.";
  } else if (tarja.includes("vermelha")) {
    text = "VENDA SOB PRESCRIÇÃO MÉDICA.";
    if (isRetencao) text += " SÓ PODE SER VENDIDO COM RETENÇÃO DA RECEITA.";
    if (isGenerico) text += " Medicamento Genérico - Lei 9.787/99.";
    text += " Este produto é um medicamento. " + (isRetencao ? "O seu uso" : "Seu uso") + " pode trazer riscos. Procure o médico e o farmacêutico. Leia a bula. Se persistirem os sintomas, o médico deverá ser consultado.";
  } else {
    text = "MEDICAMENTO ISENTO DE PRESCRIÇÃO. Este produto é um medicamento. Seu uso pode trazer riscos. Procure o médico e o farmacêutico. Leia a bula. Se persistirem os sintomas, o médico deverá ser consultado.";
  }

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 shadow-sm">
      <div className="flex items-start gap-3">
        <ShieldCheck className="h-6 w-6 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-[13px] font-bold text-slate-700 uppercase tracking-tight mb-1">Informações Legais - ANVISA</p>
          <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{text}</p>
        </div>
      </div>
      {isRetencao && (
        <div className="mt-4 pt-4 border-t border-slate-200 flex items-start gap-3">
          <Store className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-bold text-red-700 uppercase tracking-tight mb-1">IMPORTANTE – RETIRADA EM LOJA:</p>
            <p className="text-[13px] text-slate-600 leading-relaxed font-medium">Este medicamento não está disponível para entrega em domicílio. Devido às normas da ANVISA (Portaria 344/98), a venda deste produto só pode ser concluída presencialmente em uma de nossas farmácias, mediante a apresentação e retenção da Notificação de Receita original pelo farmacêutico.</p>
          </div>
        </div>
      )}
      
      <Dialog 
        open={forcedPharmacyModal} 
        onOpenChange={(open) => {
          if (isShared && !globalCep && !open) return;
          setForcedPharmacyModal(open);
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Selecione uma farmácia</DialogTitle>
            <p className="text-sm text-slate-500 mt-1">
              Para ver os preços exatos deste produto, precisamos saber onde você está.
            </p>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-auto pr-2">
            {!globalCep ? (
              <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-muted-foreground flex flex-col items-center gap-3">
                <span>Para encontrar a farmácia mais próxima, precisamos do seu CEP.</span>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite seu CEP..." 
                    value={cep}
                    onChange={(e) => setCep(e.target.value.replace(/\D/g, ''))}
                    maxLength={8}
                    disabled={isCalcLoading}
                  />
                </div>
                <Button 
                  className="w-full flex items-center justify-center gap-2"
                  variant="outline"
                  onClick={() => {
                    setTimeout(() => {
                      document.dispatchEvent(new CustomEvent('open-geo-popup'));
                    }, 150);
                  }}
                  disabled={isCalcLoading}
                >
                  <MapPin className="h-4 w-4" />
                  Usar minha localização
                </Button>
              </div>
            ) : isCalcLoading ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mb-3"></div>
                <p className="font-medium">Calculando preços e distâncias...</p>
              </div>
            ) : availablePharmacies.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 text-center">Nenhuma farmácia encontrada para o CEP informado.</div>
            ) : (
              (() => {
                const validPharmacies = availablePharmacies.filter(f => f._calculatedStock > 0);
                const lowestPrice = validPharmacies.length > 0 ? Math.min(...validPharmacies.map(f => f._preco)) : 0;
                const hasDifferentPrices = validPharmacies.some(f => f._preco > lowestPrice);

                return availablePharmacies.map((f, i) => {
                  const id = f.id || String(f._originalIndex);
                  const stock = f._calculatedStock;
                  const isDisabled = stock < qty;
                  const isSelected = selectedPharmacyId === id;
                  const isMelhorPreco = !isDisabled && hasDifferentPrices && f._preco === lowestPrice;

                  return (
                    <button 
                      key={id} 
                      className={`w-full text-left border rounded-lg p-3 transition-colors relative z-10 ${
                        isDisabled 
                          ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50'
                          : `cursor-pointer ${
                              isSelected 
                                ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                : 'hover:border-primary/50'
                            }`
                      }`}
                      onClick={(e) => {
                        e.preventDefault();
                        if (!isDisabled) {
                          setSelectedFreight('pickup');
                          setSelectedPharmacyId(id);
                          setForcedPharmacyModal(false);
                          
                          // Replace URL to clear shared param after selection
                          const newUrl = new URL(window.location.href);
                          newUrl.searchParams.delete("shared");
                          window.history.replaceState({}, "", newUrl.toString());
                        }
                      }}
                    >
                      <div className="mb-1 flex items-start justify-between">
                        <div className="font-bold text-sm flex flex-col gap-1.5">
                          <span className={isDisabled ? 'text-slate-600' : 'text-primary'}>
                            {f.nome}
                          </span>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {i === 0 && <span className="inline-flex items-center bg-green-100 text-green-700 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Mais próxima</span>}
                            {isMelhorPreco && <span className="inline-flex items-center bg-amber-100 text-amber-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Melhor Preço</span>}
                            {!isDisabled && (
                              <span className="inline-flex items-center text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold shadow-sm">
                                {isService ? "Serviço disponível" : (stock === 1 ? "1 unidade em estoque" : `${stock} unidades em estoque`)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <div className={`font-bold ${isDisabled ? 'text-slate-400' : 'text-slate-900'} text-lg`}>
                            {brl(f._preco)}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs text-muted-foreground space-y-1 mt-2">
                        <p>{f.endereco}</p>
                        {f.horarioFuncionamento && <p><strong className="text-foreground">Horário:</strong> {f.horarioFuncionamento}</p>}
                        <p className="mt-1"><strong className="text-foreground">Distância:</strong> <span className="inline-flex items-center text-primary bg-primary/10 px-1.5 rounded text-[10px] ml-1"><MapPin className="h-3 w-3 mr-0.5"/>{f._distance != null ? (f._distance === -1 ? 'Indisponível' : `${Number(f._distance).toFixed(1)} km`) : "Calculando..."}</span></p>
                      </div>
                    </button>
                  );
                });
              })()
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeliveryOpen} onOpenChange={setConfirmDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmação de Entrega</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-3">Você está em: <strong className="text-foreground">{cep}</strong></p>
            <p className="font-bold text-lg">Deseja entregar nesse endereço?</p>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setConfirmDeliveryOpen(false)}>
              Alterar CEP
            </Button>
            <Button onClick={() => {
              add({ ...p, estoque: maxStock }, qty);
              setConfirmDeliveryOpen(false);
            }}>
              Sim, continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function extractCharacteristics(htmlDesc: string): string[] {
  if (!htmlDesc) return [];
  const text = htmlDesc.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
  const sentences = text.split(/\.\s+/).map(s => s.trim()).filter(s => s.length > 10 && s.length < 150);
  if (sentences.length === 0 && text.length > 10) return [text.slice(0, 150) + "..."];
  return sentences.slice(0, 4).map(s => s.endsWith('.') ? s : s + '.');
}

function PDP() {
  const params = useParams({ strict: false });
  const isStoreContext = !!(params && (params as any).storeSlug);
  const activePharmacy = useActivePharmacy();
  const { p: initialProduct, loja, cat, subcat, crossSell, variations, compreJuntoPartner } = Route.useLoaderData();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro' || loja?.categoriaAssociado === 'Parceiro';
  const customProducts = useAdminProducts(s => s.customProducts);
  const p = customProducts?.find(c => c.id === initialProduct.id) || initialProduct;
  const { prices: regionalPrices } = useRegionsStore();
  
  const normalizeForVariation = (nome: any) => 
    String(nome || '').replace(/[0-9]+(?:,[0-9]+)?\s*(?:MG|G|ML|KG|UNIDADES|COMPRIMIDOS|CÁPSULAS|SACHÊS|FPS|UI|UN|UI\/G|MG\/G|ML\/ML)?/gi, '')
        .replace(/\b(AZUL|VERDE|VERMELHO|VERMELHA|AMARELO|AMARELA|BRANCO|BRANCA|PRETO|PRETA|ROSA|ROXO|LARANJA|MARROM|CINZA)\b/gi, '')
        .replace(/\s+/g, ' ').trim();
  const normalizedTarget = normalizeForVariation(p.nome);

  const search = Route.useSearch();
  const isShared = search.shared === "true";
  const add = useCart((s) => s.add);
  const user = useAuth((s) => s.user);
  const setLoginOpen = useAuth((s) => s.setLoginOpen);
  const allSelos = useSelos((s) => s.selos);
  const isGenericoProd = checkIsGenerico(p);
  const productSelosIds = new Set(p.selosIds || []);
  if (isGenericoProd) {
    productSelosIds.add("gen");
  }
  const activeSelos = allSelos.filter(s => 
    s.ativo && (
      productSelosIds.has(s.id) || 
      (isGenericoProd && (s.id === "gen" || s.nome.toLowerCase().includes("genérico") || s.nome.toLowerCase().includes("generico")))
    )
  );
  const normalizeForMatch = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
  const activeSeloNormalizedNames = activeSelos.map(s => normalizeForMatch(s.nome));
  const fav = useFavorites((s) => s.ids.includes(p.id));
  const toggleFav = useFavorites((s) => s.toggle);
  const [mounted, setMounted] = useState(false);
  const { getAvaliacoesPorProduto } = useReviews();
  const [qty, setQty] = useState(1);
  const globalCep = useGeoCep((s) => s.cep);
  const geoLat = useGeoCep((s) => s.lat);
  const geoLng = useGeoCep((s) => s.lng);
  const globalCity = useGeoCep((s) => s.city);
  const [cep, setCep] = useState(globalCep || "");
  const [freteCalculado, setFreteCalculado] = useState(!!globalCep);
  // Distâncias reais calculadas via API (CEP → coordenadas reais)
  const [pharmDistances, setPharmDistances] = useState<Record<string, number>>({});
  const selectedFreight = useCart((s) => s.selectedFreight);
  const setSelectedFreight = useCart((s) => s.setSelectedFreight);
  const isRetencao = (p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142"))) && !!p.retemReceita;
  const [freightTab, setFreightTab] = useState<"entrega" | "retirada">(isRetencao ? "retirada" : "entrega");
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  
  const [waitlistOpen, setWaitlistOpen] = useState(false);
  const [wlName, setWlName] = useState("");
  const [wlPhone, setWlPhone] = useState("");
  const [wlQty, setWlQty] = useState(1);
  const [wlAccepted, setWlAccepted] = useState(false);
  const addWaitlistEntry = useWaitlist((s) => s.addEntry);
  const [forcedPharmacyModal, setForcedPharmacyModal] = useState(false);
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const loginOpen = useAuth((s) => s.loginOpen);
  
  const marketingState = useMarketing();
  const promocoes = marketingState.promocoes;
  const recentlyAdded = isRecentlyAdded(p);

  const [couponCopied, setCouponCopied] = useState(false);

  const [newQuestion, setNewQuestion] = useState("");
  const { questions, addQuestion } = useQuestions();
  
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const { avaliacoes: allReviews, addAvaliacao, loadAvaliacoes } = useReviews();

  useEffect(() => {
    loadAvaliacoes();
    useMarketing.getState().loadMarketing();
  }, [loadAvaliacoes]);


  const handleAskQuestion = () => {
    if (!user || !newQuestion.trim()) return;
    addQuestion({
      produtoId: p.id,
      produtoNome: p.nome,
      clienteNome: user.nome || "Cliente",
      pergunta: newQuestion,
    });
    setNewQuestion("");
    toast.success("Sua pergunta foi enviada com sucesso! Em breve responderemos.");
  };

  const handleSubmitReview = () => {
    if (!user || !newReviewText.trim()) return;
    addAvaliacao({
      produtoId: p.id,
      usuario: user.nome || "Cliente",
      texto: newReviewText,
      nota: newReviewRating,
      status: "pendente"
    });
    setNewReviewText("");
    setNewReviewRating(5);
    toast.success("Sua avaliação foi enviada e está aguardando aprovação.");
  };

  const productQuestions = questions.filter(q => q.produtoId === p.id);
  const avaliacoes = allReviews.filter(av => av.produtoId === p.id && av.status === "aprovada");
  const hasReviews = avaliacoes.length > 0;
  let calculatedRating = 0;
  if (hasReviews) {
    calculatedRating = avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length;
  }
  
  const handleWaitlistSubmit = () => {
    if (!wlName || !wlPhone) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (!wlAccepted) {
      toast.error("É necessário aceitar os termos de preço para continuar.");
      return;
    }
    
    const productPrice = (p as any).precoPromocional && isCampanhaAtiva((p as any).campanha) ? (p as any).precoPromocional : (p.precoPor || 0);
    const safeQty = Math.max(1, Number(wlQty) || 1);

    addWaitlistEntry({
      produtoId: p.id,
      clienteNome: wlName.trim(),
      whatsapp: wlPhone.trim(),
      quantidade: safeQty,
      mensagem: `Gostaria desse produto mas notei que não possui estoque, consegue me avisar quando voltar ao estoque?\nProduto: ${p.nome}\nValor: R$ ${productPrice.toFixed(2).replace('.', ',')}\nQuantidade desejada: ${safeQty}`
    });

    const targetLoja = currentLoja || loja || allPharmacies[0];
    const rawZap = targetLoja?.whatsapp || targetLoja?.telefone || "51989444818";
    const cleanZap = rawZap.replace(/\D/g, "");
    const waNumber = cleanZap.startsWith("55") ? cleanZap : `55${cleanZap}`;

    const effectiveSlug = (storeSlug && storeSlug !== "loja-padrao" && !SYSTEM_PAGES.has(storeSlug))
      ? safeSlugify(storeSlug)
      : (targetLoja?.slug ? safeSlugify(targetLoja.slug) : "loja-padrao");

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
    setWlAccepted(false);
  };

  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const setSelectedPharmacyId = useCart((s) => s.setSelectedPharmacyId);
  const characteristics = extractCharacteristics(p.descricao);
  
  const allPharmacies = useAdmin((s) => s.pharmacies);
  const fornecedores = useAdminProducts((s) => s.fornecedores);

  const [resolvedCity, setResolvedCity] = useState<string>("Porto Alegre");

  useEffect(() => {
    if (!freteCalculado || !cep) {
      setResolvedCity("Porto Alegre");
      return;
    }
    if (cep === globalCep && globalCity) {
      setResolvedCity(globalCity);
      return;
    }
    (async () => {
      try {
        const city = await getCityFromCepAsync(cep, allPharmacies);
        setResolvedCity(city);
      } catch {
        setResolvedCity("Porto Alegre");
      }
    })();
  }, [freteCalculado, cep, globalCep, globalCity, allPharmacies]);

  const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const currentCity = normalize(resolvedCity);
  
  let cityPharmacies = (freteCalculado && cep) ? allPharmacies.filter(f => 
    normalize(f.cidade).includes(currentCity) || 
    normalize(f.endereco).includes(currentCity)
  ) : allPharmacies;

  const isCampanha = isCampanhaAtiva(p);

  // Busca coordenadas reais e calcula distância por estrada para todas as farmácias
  useEffect(() => {
    if (!cep && !(geoLat && geoLng)) return;
    const userCep = cep ? cep.replace(/\D/g, "") : "";
    if (userCep && userCep.length !== 8 && !(geoLat && geoLng)) return;

    const pharmaciesToCalc = allPharmacies.filter(f => pharmDistances[f.id] === undefined);
    if (pharmaciesToCalc.length === 0) return;

    (async () => {
      setIsCalcLoading(true);
      // Busca coordenadas do usuário (GPS ou via CEP)
      const userCoords = (geoLat && geoLng)
        ? { lat: geoLat, lng: geoLng }
        : await getCepCoordinates(userCep);

      if (!userCoords) {
        const updates: Record<string, number> = {};
        pharmaciesToCalc.forEach(f => updates[f.id] = -1);
        setPharmDistances(prev => ({ ...prev, ...updates }));
        setIsCalcLoading(false);
        return;
      }

      const updates: Record<string, number> = {};
      await Promise.all(
        pharmaciesToCalc.map(async (f) => {
          const pharmCoords = (f.lat && f.lng)
            ? { lat: f.lat, lng: f.lng }
            : await getCepCoordinates(f.cep);
          if (pharmCoords) {
            updates[f.id] = await getRoadDistanceKm(userCoords.lat, userCoords.lng, pharmCoords.lat, pharmCoords.lng);
          } else {
            updates[f.id] = -1;
          }
        })
      );
      if (Object.keys(updates).length > 0) {
        setPharmDistances(prev => ({ ...prev, ...updates }));
      }
      setIsCalcLoading(false);
    })();
  }, [cep, geoLat, geoLng, cityPharmacies, pharmDistances, allPharmacies]);

  // Calculate stock and resolve prices
  let availablePharmacies = allPharmacies.map((f, i) => {
    const isAtivoLocal = p.precosPorLoja?.[f.id]?.ativo ?? true;
    const stock = isAtivoLocal === false ? 0 : getDeterministicStock(p, f.id);
    
    let preco = p.precoPor;
    if (isCampanha) {
      preco = p.precoCampanha || p.precoPor;
    } else {
      // 1. Base table price
      const activeTabela = f.tabelaPrecoId || "poa";
      const regPrice = regionalPrices[`${activeTabela}-${p.id}`];
      if (regPrice !== undefined) {
        preco = regPrice;
      }
      
      // 2. Specific store override
      if (p.precosPorLoja?.[f.id] && Number(p.precosPorLoja[f.id].precoPor) > 0) {
        preco = Number(p.precosPorLoja[f.id].precoPor);
      }
    }
    // Distância já foi calculada de forma assíncrona (com fallback ORS/Haversine)
    const distance = pharmDistances[f.id] ?? null;
      
    const isSameCity = normalize(f.cidade).includes(currentCity) || normalize(f.endereco).includes(currentCity);
    
    // Check if pharmacy can deliver or pickup
    const canPickup = f.aceitaRetirada !== false;
    let canDeliver = false;
    let deliveryPrice: number | null = null;
    
    if (f.aceitaEntrega && distance !== null && distance >= 0 && distance <= 20) {
      if (f.raiosEntrega && f.raiosEntrega.length > 0) {
        const sortedRaios = [...f.raiosEntrega].sort((a, b) => a.ateKm - b.ateKm);
        const matchingRaio = sortedRaios.find(r => distance <= r.ateKm);
        if (matchingRaio) {
          canDeliver = true;
          deliveryPrice = matchingRaio.preco;
        }
      } else if (f.meiosEntregaPersonalizados && f.meiosEntregaPersonalizados.length > 0) {
        let lowestCustom: number | null = null;
        f.meiosEntregaPersonalizados.filter(m => m.ativo).forEach(m => {
          if (m.raios && m.raios.length > 0) {
             const matchingRaio = [...m.raios].sort((a, b) => a.ateKm - b.ateKm).find(r => distance <= r.ateKm);
             if (matchingRaio && (lowestCustom === null || matchingRaio.preco < lowestCustom)) lowestCustom = matchingRaio.preco;
          }
        });
        if (lowestCustom !== null) {
          canDeliver = true;
          deliveryPrice = lowestCustom;
        }
      } else {
        canDeliver = true;
        deliveryPrice = f.custoEntrega ?? null;
      }
    } else if (f.aceitaEntrega && distance === null) {
      canDeliver = true;
      if (f.raiosEntrega && f.raiosEntrega.length > 0) {
        deliveryPrice = Math.min(...f.raiosEntrega.map(r => r.preco));
      } else if (f.meiosEntregaPersonalizados && f.meiosEntregaPersonalizados.length > 0) {
        const allPrecos: number[] = [];
        f.meiosEntregaPersonalizados.filter(m => m.ativo).forEach(m => {
          if (m.raios) allPrecos.push(...m.raios.map(r => r.preco));
        });
        if (allPrecos.length > 0) deliveryPrice = Math.min(...allPrecos);
      } else if (f.custoEntrega !== undefined && f.custoEntrega !== null) {
        deliveryPrice = f.custoEntrega;
      }
    }

    return {
      ...f, 
      _calculatedStock: stock, 
      _preco: preco,
      _originalIndex: i,
      _distance: distance,
      _isSameCity: isSameCity,
      _canFulfill: canDeliver || canPickup,
      _deliveryPrice: deliveryPrice
    };
  }).filter(f => f._canFulfill && (f._distance === null || f._distance <= 20)).sort((a, b) => {
    // 1. Prioritize Same City
    if (a._isSameCity && !b._isSameCity) return -1;
    if (!a._isSameCity && b._isSameCity) return 1;
    
    // 2. Both out of stock?
    if (a._calculatedStock === 0 && b._calculatedStock === 0) {
      if (a._distance === null && b._distance === null) return 0;
      if (a._distance === null) return 1;
      if (b._distance === null) return -1;
      return a._distance - b._distance;
    }
    if (a._calculatedStock === 0) return 1;
    if (b._calculatedStock === 0) return -1;
    
    // 3. Both in stock? Sort by distance asc!
    if (a._distance !== b._distance) {
      if (a._distance === null && b._distance === null) return 0;
      if (a._distance === null) return 1;
      if (b._distance === null) return -1;
      return a._distance - b._distance;
    }
    
    // 4. Same distance? Best price first
    return a._preco - b._preco;
  });

  const sameCityPharmaciesWithStock = availablePharmacies.filter(f => f._isSameCity && f._calculatedStock > 0);
  if (sameCityPharmaciesWithStock.length > 0) {
    // Apenas mostrar farmácias da mesma cidade já que alguma delas tem estoque
    availablePharmacies = availablePharmacies.filter(f => f._isSameCity);
  }

  const { storeSlug } = Route.useParams();
  const currentLoja = loja || allPharmacies.find(ph => (ph.slug || "").toLowerCase() === (storeSlug || "").toLowerCase()) || (selectedPharmacyId ? allPharmacies.find(ph => ph.id === selectedPharmacyId) : null) || allPharmacies[0];
  const effectiveStoreId = selectedPharmacyId || currentLoja?.id;

  // Priority 1: Check active store stock
  let maxStock = 0;
  if (effectiveStoreId) {
    const isAtivoLocal = p.precosPorLoja?.[effectiveStoreId]?.ativo !== false;
    maxStock = isAtivoLocal ? getDeterministicStock(p, effectiveStoreId) : 0;
  }

  // Priority 2: Check any available pharmacy with stock
  if (maxStock === 0 && availablePharmacies.length > 0) {
    const highestStock = Math.max(0, ...availablePharmacies.map(f => f._calculatedStock || 0));
    if (highestStock > 0) {
      maxStock = highestStock;
    }
  }

  // Priority 3: Fallback to Suppliers / Infinite Shelf
  let activeFornecedor = null;
  if (maxStock === 0 && fornecedores && fornecedores.length > 0) {
    const citySuppliers = fornecedores.filter(f => normalize(f.cidade).includes(currentCity));
    activeFornecedor = citySuppliers.length > 0 ? citySuppliers[0] : fornecedores[0];
    const supplierStock = getDeterministicStock(p, String(activeFornecedor.id) + "supp");
    if (supplierStock > 0) {
      maxStock = supplierStock;
    }
  }

  // Priority 4: Fallback to global product stock
  if (maxStock === 0 && Number(p.estoque || 0) > 0) {
    maxStock = Number(p.estoque);
  }

  let isLocalStock = maxStock > 0;
  let isLojaPromoActiva = false;

  const activePharmacyId = effectiveStoreId || selectedPharmacyId || (availablePharmacies.length > 0 ? availablePharmacies[0].id : null);
  const rawBasePrecoPor = Number(p.precoPor || p.preco || p.precoBase || 0);
  const rawBasePrecoDe = Number(p.precoDe || rawBasePrecoPor);
  let finalPrecoDe = rawBasePrecoDe;
  let finalPrecoPor = rawBasePrecoPor;

  if (isCampanha && p.precoCampanha && Number(p.precoCampanha) > 0) {
    finalPrecoPor = Number(p.precoCampanha);
  } else if (activePharmacyId) {
    // 1. Base table price
    const activePharm = allPharmacies.find(f => f.id === activePharmacyId);
    if (activePharm) {
      const activeTabela = activePharm.tabelaPrecoId || "poa";
      const regPrice = regionalPrices[`${activeTabela}-${p.id}`];
      if (regPrice !== undefined && Number(regPrice) > 0) finalPrecoPor = Number(regPrice);
    }
    
    // 2. Specific store override
    if (p.precosPorLoja?.[activePharmacyId]) {
      const pLoja = p.precosPorLoja[activePharmacyId];
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
  const currentStoreId = String(activePharmacy?.id || currentLoja?.id || effectiveStoreId || loja?.id || activePharmacyId || "");
  const storePromos = promocoes.filter((pr: any) => pr.lojaId && String(pr.lojaId) === currentStoreId);
  const lojaPromocoes = storePromos.length > 0 
    ? storePromos 
    : (marketingState.lojaPromocoes[currentStoreId] || []);
  const globalPromocoes = promocoes.filter((p: any) => !p.lojaId || p.lojaId === "" || p.lojaId === "global" || p.lojaId === "all");
  const padraoPromo = getPadraoPromotionWithTimer(p, globalPromocoes, lojaPromocoes);
  const levePaguePromo = getLevePaguePromotion(p, globalPromocoes, lojaPromocoes);

  if (padraoPromo) {
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

  const activePromo = padraoPromo || levePaguePromo;

  const desconto = finalPrecoDe > finalPrecoPor ? Math.round((1 - finalPrecoPor / finalPrecoDe) * 100) : 0;

  const allImages = React.useMemo(() => {
    const list: string[] = [];
    const parsedImagens = (p.imagens || []).map((imgObj: any) => {
      return typeof imgObj === 'string' ? imgObj : (imgObj?.caminhoImagem || imgObj?.url || imgObj);
    }).filter((url: any) => typeof url === 'string' && url.length > 0);

    parsedImagens.forEach((img: string) => {
      if (!list.includes(img)) list.push(img);
    });

    const capa = p.imagem || p.foto;
    if (capa && typeof capa === 'string' && capa !== "/produtos/generico.webp" && !list.includes(capa)) {
      list.unshift(capa);
    }

    if (list.length === 0) {
      list.push(productImage(p));
    }

    return list;
  }, [p.imagem, p.foto, p.imagens]);

  const defaultImg = allImages[0];
  const [selectedImage, setSelectedImage] = useState(defaultImg);
  const thumbScrollRef = useRef<HTMLDivElement>(null);

  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState('0% 0%');
  const [isYoutubeModalOpen, setIsYoutubeModalOpen] = useState(false);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos(`${x}% ${y}%`);
    setIsZoomed(true);
  };

  const handleMouseLeave = () => setIsZoomed(false);

  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const youtubeId = p.youtubeVideoUrl ? getYoutubeId(p.youtubeVideoUrl) : null;

  useEffect(() => {
    setMounted(true);
    useFavorites.persist.rehydrate();
    window.scrollTo(0, 0);
    setSelectedImage(allImages[0]);
    
    const isMedicationCheck = p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142"));
    setFreightTab((isMedicationCheck && !!p.retemReceita) ? "retirada" : "entrega");

    if (isShared && !globalCep) {
      setForcedPharmacyModal(true);
    }

    // Auto-select closest pharmacy on load (only if not forced to select)
    if (availablePharmacies.length > 0 && (!isShared || globalCep)) {
      const currentSelected = selectedPharmacyId ? availablePharmacies.find((f: any) => f.id === selectedPharmacyId) : null;
      if (currentSelected) {
        // Already selected and valid, just set freight
        setSelectedFreight("pickup");
      } else {
        const closest = availablePharmacies[0];
        if (closest._calculatedStock > 0 || isService) {
          setSelectedPharmacyId(closest.id);
          setSelectedFreight("pickup");
        }
      }
    }
  }, [p.id, p.imagens, selectedPharmacyId]);

  useEffect(() => {
    if (globalCep !== cep) {
      setCep(globalCep || "");
      if (globalCep) setFreteCalculado(true);
    }
  }, [globalCep]);

  const handleWishlist = () => {
    if (!user) {
      toast.info("Por favor, faça login para adicionar aos favoritos.");
      setLoginOpen(true);
      return;
    }
    toggleFav(p.id, finalPrecoPor);
  };

  const handleShare = async () => {
    try {
      const shareUrl = new URL(window.location.href);
      shareUrl.searchParams.set("shared", "true");
      
      await navigator.share({
        title: p.nome,
        text: 'Confira este produto nas Farmácias Associadas!',
        url: shareUrl.toString(),
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copiado!");
    }
  };

  const isGenerico = isGenericoProd;
  const isMedication = String(cat?.nome || "").toLowerCase().includes("medicamento") || String(p.nome || "").toLowerCase().includes("medicamento") || p.categoriaId === "142" || (p.tarja && p.tarja.trim() !== "") || isGenerico;
  const showPrincipioAtivo = isMedication;
  const hideReviews = p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142")) || p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"));
  const isService = p.tipoProduto === "servico" || (p.tipoProduto !== "fisico" && !!(p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"))));
  
  // Produto precisa ter estoque (ou ser serviço suportado pela loja) e estar ativo globalmente
  // Além disso, se uma farmácia foi selecionada, deve estar ativo nessa farmácia.
  const isGlobalActive = p.ativo !== false && p.aVenda !== false;
  const isLocalActive = !activePharmacyId || p.precosPorLoja?.[activePharmacyId]?.ativo !== false;
  const storeOffersServices = !currentLoja || currentLoja.offersServices !== false;
  const isAvailable = (maxStock > 0 || (isService && storeOffersServices)) && isGlobalActive && isLocalActive;

  // Cupom da loja aplicável para este produto / categoria
  const eligibleCoupon = React.useMemo(() => {
    if (!isAvailable || finalPrecoPor <= 0 || !marketingState.cupons || marketingState.cupons.length === 0) return null;

    const activeStoreId = activePharmacy?.id || currentLoja?.id || effectiveStoreId || loja?.id || activePharmacyId;

    const validCoupons = (marketingState.cupons as any[]).filter((c: any) => {
      if (c.ativo === false) return false;

      // Validação de Loja
      const couponLojaId = c.lojaId || c.farmaciaId;
      if (activeStoreId && couponLojaId && String(couponLojaId) !== String(activeStoreId)) {
        return false;
      }

      // Validação de Data
      const now = new Date();
      if (c.dataInicio && new Date(c.dataInicio) > now) return false;
      const validUntil = c.dataTermino || c.validade;
      if (validUntil && new Date(validUntil + (validUntil.includes('T') ? '' : 'T23:59:59')) < now) return false;

      // Validação de Alvo (O selo no card/página SÓ deve aparecer para produtos ou categorias especificamente selecionados na loja)
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
        const matchCat = (catId && alvos.includes(catId)) || (subId && alvos.includes(subId)) || extraCats.some((id: string) => alvos.includes(id));
        if (!matchCat) return false;
        return true;
      }

      // Se for "todos" ou não tiver produtos/categorias específicos selecionados, NÃO exibe o selo
      return false;
    });

    if (validCoupons.length === 0) return null;

    let bestCoupon: any = null;
    let bestPrice = finalPrecoPor;

    for (const c of validCoupons) {
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
          savings: finalPrecoPor - discountedPrice,
          isPercent,
          discountValue: val,
        };
      }
    }

    return bestCoupon;
  }, [marketingState.cupons, isAvailable, finalPrecoPor, activePharmacy?.id, currentLoja?.id, effectiveStoreId, loja?.id, activePharmacyId, p]);

  const getTargetExplanation = (c: any) => {
    const tipoAlvo = c?.tipoAlvo || (c?.produtosIds?.length ? "produtos" : (c?.categoriasIds?.length ? "categorias" : "todos"));
    if (tipoAlvo === "produtos") return "Aplicável para produtos específicos";
    if (tipoAlvo === "categorias") return "Aplicável para categorias selecionadas";
    return "Válido para todos os produtos da loja";
  };

  const handleApplyCoupon = () => {
    if (!eligibleCoupon) return;
    const code = eligibleCoupon.codigo || eligibleCoupon.code;
    navigator.clipboard.writeText(code);
    setCouponCopied(true);
    toast.success(`Cupom ${code} copiado com sucesso!`);
    setTimeout(() => setCouponCopied(false), 3500);
  };


  const marcasProprias = ["revitart", "santo habito", "santo hábito", "revigore", "revimel", "crescendo", "vita magna", "associadas"];
  // @ts-ignore
  const isMarcaPropria = p.marca && marcasProprias.some(m => p.marca.toLowerCase().includes(m));
  
  let hash = 0;
  for (let i = 0; i < p.id.length; i++) {
    hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const rating = isMarcaPropria 
    ? [4.8, 4.9][hash % 2]
    : [4.5, 4.7, 4.9, 5.0][hash % 4];
  
  const effectiveStoreSlug = (params?.storeSlug && params.storeSlug !== "loja-padrao" && !SYSTEM_PAGES.has(params.storeSlug))
    ? safeSlugify(params.storeSlug)
    : (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao")
    ? safeSlugify(activePharmacy.slug)
    : "loja-padrao";

  const productUrl = `https://farmaciasassociadas.com.br/${effectiveStoreSlug}/produto/${p.url || p.slug || p.id}`;
  const storeUrl = `https://farmaciasassociadas.com.br/${effectiveStoreSlug}`;

  const schemaOrg = [
    {
      "@context": "https://schema.org/",
      "@type": "Product",
      "@id": `${productUrl}#product`,
      "name": p.nome,
      "image": [productImage(p)],
      "description": (p.descricao || `Compre ${p.nome} nas Farmácias Associadas.`).slice(0, 200),
      "sku": String(p.id),
      ...(p.ean ? { "gtin13": p.ean, "gtin": p.ean } : {}),
      "brand": {
        "@type": "Brand",
        "name": p.marca || "Farmácias Associadas"
      },
      "offers": {
        "@type": "Offer",
        "url": productUrl,
        "priceCurrency": "BRL",
        "price": (finalPrecoPor || 0).toFixed(2),
        "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        "itemCondition": "https://schema.org/NewCondition",
        "availability": maxStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        "seller": {
          "@type": "Pharmacy",
          "name": activePharmacy?.nome || "Farmácias Associadas",
          "url": storeUrl
        }
      },
      ...(hasReviews ? {
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": calculatedRating.toFixed(1),
          "reviewCount": avaliacoes.length,
          "bestRating": "5",
          "worstRating": "1"
        }
      } : {})
    },
    {
      "@context": "https://schema.org/",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Início",
          "item": storeUrl
        },
        ...(cat ? [{
          "@type": "ListItem",
          "position": 2,
          "name": cat.nome,
          "item": `${storeUrl}/c/${cat.slug}`
        }] : []),
        ...(subcat ? [{
          "@type": "ListItem",
          "position": 3,
          "name": subcat.nome,
          "item": `${storeUrl}/c/${cat?.slug || 'categoria'}?sub=${subcat.id}`
        }] : []),
        {
          "@type": "ListItem",
          "position": (cat ? (subcat ? 4 : 3) : 2),
          "name": p.nome,
          "item": productUrl
        }
      ]
    }
  ];

  return (
    <div className="container-fa py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      {(() => {
        const homeStoreSlug = (params?.storeSlug && params.storeSlug !== "loja-padrao" && !SYSTEM_PAGES.has(params.storeSlug))
          ? safeSlugify(params.storeSlug)
          : (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao")
          ? safeSlugify(activePharmacy.slug)
          : null;

        const catStoreSlug = homeStoreSlug || (activePharmacy?.slug ? safeSlugify(activePharmacy.slug) : "poa");

        return (
          <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
            <Link 
              to={homeStoreSlug ? "/$storeSlug" : "/"} 
              params={homeStoreSlug ? { storeSlug: homeStoreSlug } : undefined} 
              className="hover:text-primary transition flex items-center gap-1"
            >
              <FileText className="h-3 w-3"/> Início
            </Link>
            <ChevronRight className="h-3 w-3" />
            {cat && (
              <>
                <Link to="/$storeSlug/c/$slug" params={{ storeSlug: catStoreSlug, slug: cat.slug }} className="hover:text-primary transition">{cat.nome}</Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            {subcat && (
              <>
                <Link to="/$storeSlug/c/$slug" params={{ storeSlug: catStoreSlug, slug: subcat.slug }} className="hover:text-primary transition">{subcat.nome}</Link>
                <ChevronRight className="h-3 w-3" />
              </>
            )}
            <span className="text-foreground font-medium truncate max-w-[200px]">{p.nome}</span>
          </div>
        );
      })()}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4 lg:mt-8 lg:items-start">
        <div className="contents lg:flex lg:flex-1 lg:flex-col lg:gap-8 lg:min-w-0">
          <div className="space-y-6 max-w-full overflow-hidden order-1 lg:order-none">
            <h1 className="text-2xl font-bold leading-tight lg:hidden block">{p.nome}</h1>
            
            {/* Mobile Promotional Displays */}
            {isAvailable && padraoPromo && (
              <div className="lg:hidden mt-3 mb-2">
                <PromoProductPageBanner promo={padraoPromo} precoOriginal={finalPrecoDe} precoPromocional={finalPrecoPor} />
              </div>
            )}

            {isAvailable && levePaguePromo && (
              <div className="lg:hidden mt-3 mb-2">
                <PromoLevePagueOfferBox 
                  promo={levePaguePromo} 
                  precoUnitarioOriginal={finalPrecoDe ?? finalPrecoPor} 
                  onAddToCart={() => {
                    add({ ...p, estoque: maxStock }, levePaguePromo.levePague_quantidade || 1);
                    toast.success("Oferta Leve + Pague adicionada ao carrinho!");
                  }}
                />
              </div>
            )}
            


            <div 
              className="bg-white border rounded-2xl p-4 md:p-8 flex items-center justify-center aspect-square w-full max-w-[500px] mx-auto relative shadow-sm overflow-hidden cursor-zoom-in group"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              style={{
                backgroundImage: isZoomed ? `url(${selectedImage})` : 'none',
                backgroundPosition: zoomPos,
                backgroundSize: '200%',
                backgroundRepeat: 'no-repeat'
              }}
            >
              <img 
                src={selectedImage} 
                alt={p.nome} 
                fetchPriority="high"
                className={`w-full h-full object-contain p-4 pb-8 transition-opacity duration-300 ${isZoomed ? 'opacity-0' : 'opacity-100'}`}
              />
              {isMedication && p.tarja && p.tarja !== 'Sem Tarja' && p.tarja !== 'none' && (
                <div className={`absolute bottom-0 left-0 w-full h-8 flex items-center justify-center font-black text-[10px] uppercase tracking-wider z-20 ${tarjaColor(p.tarja)}`}>
                  {p.retemReceita ? "Venda sob prescrição médica - Retém Receita" : "Venda sob prescrição médica"}
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 items-start pointer-events-none">
                {activeSelos.length > 0 && activeSelos.map(selo => (
                  <span key={selo.id} style={{ backgroundColor: selo.corFundo, color: selo.corTexto }} className="text-xs font-bold px-3 py-1 rounded shadow-sm flex items-center gap-1 w-max">
                    {selo.id === 'servico' && <Stethoscope className="h-3 w-3" />}
                    {selo.id === 'servico' ? (selo.nome?.toUpperCase() || "SERVIÇO") : selo.nome}
                  </span>
                ))}
              </div>
              {youtubeId && (
                <button
                  onClick={(e) => { e.stopPropagation(); setIsYoutubeModalOpen(true); }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur border border-slate-200 shadow-sm rounded-full py-1.5 px-3 flex items-center gap-2 hover:bg-slate-50 transition-colors z-20 group/yt"
                >
                  <span className="text-[11px] font-bold text-slate-700">Vídeo do produto</span>
                  <Youtube className="h-5 w-5 text-red-600 group-hover/yt:scale-110 transition-transform" />
                </button>
              )}
            </div>
            {(allImages.length > 1 || (p.storiesProduto && p.storiesProduto.length > 0)) && (
              <div className="relative max-w-[500px] mx-auto w-full group">
                <div ref={thumbScrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none scroll-smooth">
                  {p.storiesProduto && p.storiesProduto.length > 0 && p.storiesProduto.map((storyUrl: string, idx: number) => (
                    <div key={`story-${idx}`} className="shrink-0 snap-start">
                      <ProductStory videoUrl={storyUrl} productName={p.nome} inline={true} />
                    </div>
                  ))}
                  {allImages.map((imgUrl: string, idx: number) => {
                    return (
                      <button 
                        key={idx} 
                        onClick={() => setSelectedImage(imgUrl)}
                        className={`w-20 h-20 shrink-0 snap-start border-2 rounded-xl overflow-hidden cursor-pointer bg-white transition ${selectedImage === imgUrl ? 'border-primary' : 'border-slate-200 hover:border-primary/50'}`}
                      >
                        <img src={imgUrl} alt={`Imagem ${idx + 1} de ${p.nome}`} className="w-full h-full object-contain p-2" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-8 order-3 lg:order-none pt-4 lg:pt-0">
            <AnvisaDisclaimer 
                p={p} 
                confirmDeliveryOpen={confirmDeliveryOpen} 
                setConfirmDeliveryOpen={setConfirmDeliveryOpen} 
                forcedPharmacyModal={forcedPharmacyModal}
                setForcedPharmacyModal={setForcedPharmacyModal}
                isShared={isShared}
                globalCep={globalCep}
                cep={cep}
                setCep={setCep}
                isCalcLoading={isCalcLoading}
                availablePharmacies={availablePharmacies}
                selectedPharmacyId={selectedPharmacyId}
                setSelectedPharmacyId={setSelectedPharmacyId}
                setSelectedFreight={setSelectedFreight}
                qty={qty}
                isService={isService}
                add={add}
                maxStock={maxStock}
            />

            {p.alertaRegulatorio && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 mb-8 shadow-sm">
                <div className="flex items-start gap-3">
                  <Info className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-[13px] font-bold text-amber-800 uppercase tracking-tight mb-1">ALERTA REGULATÓRIO:</p>
                    <p className="text-[13px] text-amber-900 leading-relaxed font-semibold">
                      {p.alertaTexto || "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <section>
              <h2 className="text-xl font-bold mb-4">
                Características
              </h2>
              <div className="bg-white border rounded-xl p-6 shadow-sm space-y-8">
                <div className="overflow-hidden rounded-lg">
                  <table className="w-full text-sm text-left">
                    <tbody>
                      {[
                        { label: "Ref.", value: p.codigoInterno || p.sku || p.id },
                        { label: "SKU", value: p.sku || 'Não informado' },
                        { label: "Código de barras", value: p.ean || p.ean2 || p.ean3 || 'Não informado' },
                        ...(p.eansSecundarios && p.eansSecundarios.length > 0 ? [{ label: "EANs Secundários", value: p.eansSecundarios.join(', ') }] : []),
                        { label: "Marca", value: p.marca || 'Não informada' },
                        ...(p.classeTerapeutica && p.classeTerapeutica !== 'none' ? [{ label: "Classe Terapêutica", value: p.classeTerapeutica }] : []),
                        ...(p.indicacaoTerapeutica && p.indicacaoTerapeutica !== 'none' ? [{ label: "Indicação Terapêutica", value: p.indicacaoTerapeutica }] : []),
                        ...(p.ncm ? [{ label: "NCM", value: p.ncm }] : []),
                        ...(p.registroAnvisa ? [{ label: "Registro ANVISA", value: p.registroAnvisa }] : []),
                        ...(p.tarja && p.tarja !== "Sem Tarja" && p.tarja !== "none" ? [{ label: "Tarja", value: p.tarja }] : []),
                        ...(p.tipoReceita ? [{ label: "Tipo de Receita", value: p.tipoReceita }] : []),
                        ...(p.retemReceita !== undefined ? [{ label: "Retém receita", value: p.retemReceita ? 'Sim' : 'Não' }] : []),
                        ...(p.tipoMedicamento && p.tipoMedicamento !== 'none' ? [{ label: "Tipo de medicamento", value: p.tipoMedicamento.charAt(0).toUpperCase() + p.tipoMedicamento.slice(1) }] : (checkIsGenerico(p) ? [{ label: "Tipo de medicamento", value: "Genérico" }] : [])),
                        ...(p.produtoNatureza ? [{ label: "Natureza", value: p.produtoNatureza === 'servico' ? 'Serviço' : 'Produto Físico' }] : []),
                        ...(p.categoriasIds && p.categoriasIds.length > 0 ? [
                          { 
                            label: "Categorias Adicionais", 
                            value: p.categoriasIds.map((catId: string, i: number) => {
                              const cats = Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.default || [];
                              const cat = cats.find((c: any) => String(c.id) === String(catId));
                              const subId = p.subcategoriasIds?.[i];
                              const sub = subId ? cats.find((c: any) => String(c.id) === String(subId)) : null;
                              if (!cat) return null;
                              return sub ? `${cat.nome} > ${sub.nome}` : cat.nome;
                            }).filter(Boolean).join(" / ")
                          }
                        ] : []),
                        { label: "É kit", value: String(p.tipoProduto || '').toLowerCase() === 'kit' ? 'Sim' : 'Não' },
                        ...(Array.isArray(p.caracteristicas) ? p.caracteristicas.map((c: any) => ({ label: c.titulo, value: c.descricao })) : [])
                      ].filter(row => row.value !== null && row.value !== '' && row.value !== undefined).map((row, idx) => (
                        <tr key={idx} className={`${idx % 2 === 0 ? 'bg-slate-50 ' : ''}border-b last:border-b-0`}>
                          <td className="py-3 px-4 text-slate-500 w-1/3">{row.label}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {p.principiosAtivos && Array.isArray(p.principiosAtivos) && p.principiosAtivos.length > 0 && (
                  <div className="pt-4 border-t">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Princípios ativos</h3>
                    <div className="overflow-hidden rounded-lg border border-slate-200">
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="bg-slate-100 text-slate-700 border-b">
                            <th className="py-3 px-4 font-bold w-1/3">Nome</th>
                            <th className="py-3 px-4 font-bold w-1/3">Concentração</th>
                            <th className="py-3 px-4 font-bold w-1/3">Unidade</th>
                          </tr>
                        </thead>
                        <tbody>
                          {p.principiosAtivos.map((pa: any, i: number) => {
                            const nome = typeof pa === 'string' ? pa : (pa?.nome || '-');
                            const conc = typeof pa === 'object' ? (pa?.concentracao || '-') : '-';
                            const unid = typeof pa === 'object' ? (pa?.unidadeMedida || '-') : '-';
                            return (
                              <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : "bg-white"}>
                                <td className="py-3 px-4 font-bold text-slate-900">{nome}</td>
                                <td className="py-3 px-4 text-slate-700 font-medium">{conc}</td>
                                <td className="py-3 px-4 text-slate-700 font-medium">{unid}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Descrição do Produto</h2>
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.descricao) }}
                />
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold mb-4">Dúvidas Frequentes</h2>
              <div className="space-y-3">
                <details className="group bg-white border rounded-xl shadow-sm open:bg-muted/10 transition">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-bold text-sm">
                    Como devo utilizar este produto?
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    {isMedication 
                      ? "Recomendamos seguir as instruções contidas na bula ou na embalagem do produto. Em caso de dúvidas, consulte um farmacêutico ou médico." 
                      : "Siga as instruções de uso contidas na embalagem original do produto para garantir o melhor resultado."}
                  </div>
                </details>
                <details className="group bg-white border rounded-xl shadow-sm open:bg-muted/10 transition">
                  <summary className="flex cursor-pointer items-center justify-between p-4 font-bold text-sm">
                    Qual o prazo de validade?
                    <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                  </summary>
                  <div className="px-4 pb-4 text-sm text-muted-foreground leading-relaxed">
                    Todos os nossos produtos são enviados com prazo de validade longo. A data exata consta na embalagem do item enviado.
                  </div>
                </details>
              </div>
            </section>



            </div>
        </div>

        <div className="contents lg:flex lg:w-[400px] lg:shrink-0 lg:flex-col lg:gap-8">
          <aside className="space-y-4 order-2 lg:order-none">
            <h1 className="text-2xl font-bold leading-tight hidden lg:block">{p.nome}</h1>
            
            {/* Desktop Promotional Displays */}
            {isAvailable && padraoPromo && (
              <div className="hidden lg:block mt-2 mb-2">
                <PromoProductPageBanner promo={padraoPromo} precoOriginal={finalPrecoDe} precoPromocional={finalPrecoPor} />
              </div>
            )}

            {isAvailable && levePaguePromo && (
              <div className="hidden lg:block mt-2 mb-2">
                <PromoLevePagueOfferBox 
                  promo={levePaguePromo} 
                  precoUnitarioOriginal={finalPrecoDe ?? finalPrecoPor} 
                  onAddToCart={() => {
                    add({ ...p, estoque: maxStock }, levePaguePromo.levePague_quantidade || 1);
                    toast.success("Oferta Leve + Pague adicionada ao carrinho!");
                  }}
                />
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="text-xs text-muted-foreground font-mono bg-muted/50 inline-block px-2 py-1 rounded">
                CÓD: {(p.id || '').substring(0, 6)}
              </div>
              

            </div>

          <div className="flex flex-wrap gap-2">
            {p.tarja && p.tarja !== "none" && (
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold shadow-sm ${tarjaColor(p.tarja)}`}>
                {p.tarja === "Vermelha" || p.tarja === "Amarela" ? `Tarja ${p.tarja}` : p.tarja}
              </span>
            )}
            {isMedication && p.retemReceita ? (
              <span className="text-[11px] px-2 py-0.5 rounded shadow-sm bg-red-600 text-white font-bold">
                Retém receita
              </span>
            ) : (isMedication && p.retemReceita === false ? (
              <span className="text-[11px] px-2 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Não retém receita
              </span>
            ) : null)}
          </div>


          <div className="bg-card border rounded-xl p-5 shadow-elevated">
            {eligibleCoupon && isAvailable && !p.precoSobConsulta && (
              <div className="mb-4 pb-3 border-b border-slate-100">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#f1f3fd] text-[#334155] border border-dashed border-[#c7d2fe] font-mono font-black text-xs uppercase tracking-wide shadow-2xs">
                      <Ticket className="h-3.5 w-3.5 text-primary" />
                      <span>{eligibleCoupon.codigo || eligibleCoupon.code}</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="text-xs font-bold text-primary hover:underline hover:text-primary/80 transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      {couponCopied ? (
                        <span className="text-emerald-600 flex items-center gap-1 font-bold">
                          <Check className="h-3.5 w-3.5" /> Cupom copiado!
                        </span>
                      ) : (
                        "Aplicar cupom"
                      )}
                    </button>
                  </div>

                  {/* Campo de explicação do cupom */}
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5 ml-auto">
                    <span>{getTargetExplanation(eligibleCoupon)}</span>
                    {eligibleCoupon.valorMinimo > 0 && (
                      <span className="text-slate-400 text-[11px] font-normal">• Mín. {brl(eligibleCoupon.valorMinimo)}</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {!isAvailable ? (
              <div className="flex flex-col gap-1 min-h-[60px] justify-center">
                <span className="text-xl font-bold text-slate-500">
                  Preço indisponível
                </span>
                <span className="text-xs text-muted-foreground">
                  Consulte a disponibilidade e valores quando o item retornar ao estoque.
                </span>
              </div>
            ) : p.precoSobConsulta ? (
              <div className="flex items-center gap-3 mt-1 min-h-[60px]">
                <div className="text-2xl font-bold text-slate-700">Preço sob consulta</div>
              </div>
            ) : levePaguePromo ? (
              <div className="flex flex-col justify-center min-h-[80px] border-l-4 border-primary px-4 bg-primary/5 rounded-r">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{levePaguePromo.levePague_quantidade} por</span>
                  <div className="text-5xl font-bold text-foreground">
                    {brl(levePaguePromo.levePague_precoPorItem || 0)}
                  </div>
                  <span className="text-lg font-medium text-primary">cada</span>
                </div>
                <div className="text-base text-muted-foreground font-semibold mt-1">
                  1 por {brl(finalPrecoPor)}
                </div>
              </div>
            ) : (
              <>
                {isLojaPromoActiva && isStoreContext && (
                <span className="inline-block self-start text-[11px] font-black bg-red-600 text-white px-3 py-1 rounded uppercase tracking-wider mb-2 mr-2">
                  EM OFERTA
                </span>
              )}
              {p.selo && p.selo.toUpperCase() !== "SEM SELO" && p.selo.toUpperCase() !== "NENHUMA AÇÃO" && !activeSeloNormalizedNames.includes(normalizeForMatch(p.selo)) && (
                  <div className="mb-1">
                    <span className="inline-block text-[11px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">
                      {formatPbmName(p.selo)}
                    </span>
                  </div>
                )}
                {finalPrecoDe > finalPrecoPor && (
                  <div className="text-sm text-muted-foreground line-through font-medium">{brl(finalPrecoDe)}</div>
                )}
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                  <div className="text-4xl font-bold text-foreground">{brl(finalPrecoPor)}</div>
                  {!eligibleCoupon && desconto > 0 && (
                    <span className="bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      -{desconto}%
                    </span>
                  )}
                </div>
                {eligibleCoupon && (
                  <div 
                    className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-md shadow-2xs self-start font-bold border text-xs sm:text-sm"
                    style={{
                      backgroundColor: 'var(--coupon-badge-bg, #EBF3FE)',
                      color: 'var(--coupon-badge-text, #1a73e8)',
                      borderColor: 'var(--coupon-badge-border, #d2e3fc)',
                    }}
                  >
                    <span>{brl(eligibleCoupon.finalPrice)} com Cupom</span>
                  </div>
                )}
                {getInstallmentText(finalPrecoPor) && (
                  <div className="text-sm text-slate-500 font-medium mt-2">
                    {getInstallmentText(finalPrecoPor)}
                  </div>
                )}
              </>
            )}

            {isAvailable ? (
              <div className="flex flex-col gap-3 mt-6">
                <div className="flex items-center gap-3">
                  {!p.precoSobConsulta && (
                    <div className="flex items-center border rounded-lg h-12 w-32 bg-white">
                      <button 
                        onClick={() => setQty(Math.max(1, qty - 1))}
                        className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground transition"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <div className="flex-1 flex items-center justify-center font-bold">{qty}</div>
                      <button 
                        onClick={() => setQty(Math.min(maxStock, qty + 1))}
                        disabled={qty >= maxStock}
                        className="flex-1 flex items-center justify-center hover:bg-muted text-muted-foreground transition disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <Button 
                    size="lg" 
                    style={
                      activePromo?.corBotao
                        ? { backgroundColor: activePromo.corBotao, color: activePromo.corTextoBotao || '#ffffff' }
                        : undefined
                    }
                    className={`flex-1 h-12 text-base font-bold shadow-sm transition-transform active:scale-[0.99] hover:brightness-110 ${
                      activePromo?.corBotao
                        ? ''
                        : p.precoSobConsulta
                        ? 'bg-slate-800 hover:bg-slate-900'
                        : ''
                    }`}
                    onClick={() => {
                      if (p.precoSobConsulta) {
                        const text = encodeURIComponent(`Olá! Gostaria de consultar o preço do produto: ${p.nome} (Ref: ${p.sku || p.id})`);
                        window.open(`https://wa.me/5551999999999?text=${text}`, "_blank");
                        return;
                      }
                      if (freteCalculado && selectedFreight !== "pickup" && cep && !isService) {
                        setConfirmDeliveryOpen(true);
                      } else {
                        add({ ...p, estoque: maxStock }, qty);
                        toast.success("Produto adicionado ao carrinho!");
                      }
                    }}
                  >
                    {isService ? "AGENDAR" : (p.precoSobConsulta ? "CONSULTAR PREÇO" : (
                      <span className="flex items-center justify-center gap-2">
                        <ShoppingBasket className="h-5 w-5" />
                        <span>{activePromo?.textoBotao || "COMPRAR"}</span>
                      </span>
                    ))}
                  </Button>
                </div>
                {p.linkProduto && (
                  <Button 
                    variant="outline" 
                    className="w-full h-12 font-bold border-primary text-primary"
                    onClick={() => window.open(p.linkProduto, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Acessar Link do Produto
                  </Button>
                )}
              </div>
            ) : (
              <div className="p-4 bg-slate-100 text-slate-500 rounded-lg text-center font-bold mt-6 border border-slate-200">
                Produto Temporariamente Indisponível
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-4">
              <Button
                variant="outline"
                className="w-full text-xs font-bold"
                onClick={handleWishlist}
              >
                <Heart className={`h-4 w-4 mr-2 ${mounted && fav ? "fill-red-500 text-red-500" : ""}`} />
                {mounted && fav ? "Favoritado" : "Favoritar"}
              </Button>
              <Button
                variant="outline"
                className="w-full text-xs font-bold"
                onClick={handleShare}
              >
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>


            {maxStock === 0 && (
                <div className="mt-6 flex flex-col gap-3">
                  <div className="p-3 bg-slate-100 text-slate-500 rounded-lg text-center font-bold border border-slate-200">
                    Produto Indisponível
                  </div>
                  <Button 
                    variant="outline"
                    size="lg"
                    className="w-full h-12 text-base font-bold text-primary border-primary hover:bg-primary/5"
                    onClick={() => setWaitlistOpen(true)}
                  >
                    Avise-me quando chegar
                  </Button>
                </div>
            )}

            <ul className="mt-6 space-y-3 text-xs font-medium bg-muted/30 p-4 rounded-lg">
              {isService ? (
                <>
                  <li className="flex items-center gap-3">
                    <Heart className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Cuidado e atenção à sua saúde</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Serviço realizado presencialmente na farmácia</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-center gap-3">
                    <Handshake className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Receba o que comprou ou seu dinheiro de volta</span>
                  </li>
                  {!isParceiro && (
                    <li className="flex items-center gap-3">
                      <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                      <span>Compre na maior rede associativa do pais</span>
                    </li>
                  )}
                  <li className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Retire na loja mais próxima</span>
                  </li>
                </>
              )}
            </ul>
          </div>
          </aside>
          
          <aside className="space-y-6 order-4 lg:order-none mt-8 lg:mt-0">
            <div className="bg-muted/40 border rounded-xl p-5 text-sm leading-relaxed h-fit shadow-sm">
              <h3 className="font-bold text-base mb-4 border-b pb-2">Informações Técnicas</h3>
              <div className="space-y-3">
                <div>
                  <strong className="block text-xs text-muted-foreground">marca</strong>
                  <div className="font-medium">{p.marca}</div>
                </div>
                <div>
                  <strong className="block text-xs text-muted-foreground">EAN (Código de barras)</strong>
                  <div className="font-medium">{p.ean}</div>
                </div>
                {p.ean2 && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">EAN Secundário</strong>
                    <div className="font-medium">{p.ean2}</div>
                  </div>
                )}
                {p.ean3 && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">EAN Terciário</strong>
                    <div className="font-medium">{p.ean3}</div>
                  </div>
                )}
                
                {showPrincipioAtivo && (
                  <>
                    <div>
                      <strong className="block text-xs text-muted-foreground">Princípios Ativos</strong>
                      <div className="font-medium">
                        {p.principiosAtivos && p.principiosAtivos.length > 0 
                          ? p.principiosAtivos.map((pa: any) => typeof pa === 'string' ? pa : pa.nome).filter(Boolean).join(', ')
                          : (p.nome || '').split(/[0-9]/)[0].replace(/COM|GOTAS|XAROPE|GENÉRICO|-/gi, '').trim() || 'Não informado'}
                      </div>
                    </div>
                    <div>
                      <strong className="block text-xs text-muted-foreground">Dosagem</strong>
                      <div className="font-medium">
                        {(p.principiosAtivos && p.principiosAtivos.length > 0 && p.principiosAtivos.some((pa: any) => typeof pa === 'object' && pa?.concentracao))
                          ? p.principiosAtivos.filter((pa: any) => typeof pa === 'object' && pa?.concentracao).map((pa: any) => `${pa.concentracao}${pa.unidadeMedida ? ` ${pa.unidadeMedida}` : ''}`).join(', ')
                          : ((p.nome || '').match(/\d+(?:,\d+)?\s*(?:MG\/ML|MG\/G|MG|G|ML|MCG|UI\/G|UI|UI\/ML|U)\b/gi)?.join(', ') || 'Não informada')
                        }
                      </div>
                    </div>
                  </>
                )}

                {p.registroAnvisa && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">Registro MS (ANVISA)</strong>
                    <div className="font-medium">{p.registroAnvisa}</div>
                  </div>
                )}
                {p.tipoMedicamento && p.tipoMedicamento !== 'none' && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">Tipo de Medicamento</strong>
                    <div className="font-medium capitalize">{p.tipoMedicamento.replace(/_/g, ' ')}</div>
                  </div>
                )}
                {p.classificacaoRegistro && p.classificacaoRegistro !== 'none' && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">Classificação</strong>
                    <div className="font-medium capitalize">{p.classificacaoRegistro.replace(/_/g, ' ')}</div>
                  </div>
                )}
                {p.classeTerapeutica && p.classeTerapeutica !== 'none' && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">Classe Terapêutica</strong>
                    <div className="font-medium capitalize">{p.classeTerapeutica.replace(/_/g, ' ')}</div>
                  </div>
                )}
                {p.indicacaoTerapeutica && p.indicacaoTerapeutica !== 'none' && (
                  <div>
                    <strong className="block text-xs text-muted-foreground">Indicação Terapêutica</strong>
                    <div className="font-medium capitalize">{p.indicacaoTerapeutica.replace(/_/g, ' ')}</div>
                  </div>
                )}
              </div>
              
              {p.alertaRegulatorio && (
                <div className="mt-6 p-3.5 bg-amber-50 text-amber-900 rounded-xl text-xs font-bold text-center border border-amber-200 uppercase tracking-tight shadow-xs">
                  {p.alertaTexto || '"AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."'}
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>

      {/* Compre Junto Fixo */}
      {compreJuntoPartner && (
        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-bold mb-6 text-slate-800">Aproveite e leve também</h2>
          <div className="bg-slate-50 border rounded-2xl p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-8">
            {/* Produto Atual */}
            <div className="flex flex-col items-center flex-1 max-w-[200px] relative">
              <span className="absolute -top-3 bg-emerald-600 text-white text-xs font-bold px-3 py-1 rounded-full z-10 shadow-sm">
                Está vendo
              </span>
              <div className="bg-white border rounded-xl p-4 w-full aspect-square flex items-center justify-center shadow-sm">
                <img src={p.imagens?.[0] || productImage(p)} alt={p.nome} className="w-full h-full object-contain" />
              </div>
              <div className="mt-4 text-center">
                <p className="font-bold text-sm text-slate-800 line-clamp-2">{p.nome}</p>
                <p className="font-black text-lg text-emerald-700 mt-1">R$ {p.precoPor?.toFixed(2)}</p>
              </div>
            </div>

            <Plus className="h-8 w-8 text-slate-400 shrink-0" />

            {/* Parceiro */}
            <div className="flex flex-col items-center flex-1 max-w-[200px]">
              <div className="bg-white border-2 border-emerald-500 rounded-xl p-4 w-full aspect-square flex items-center justify-center shadow-sm relative">
                <div className="absolute top-2 left-2">
                  <div className="w-5 h-5 rounded border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  </div>
                </div>
                <img src={compreJuntoPartner.imagens?.[0] || productImage(compreJuntoPartner)} alt={compreJuntoPartner.nome} className="w-full h-full object-contain" />
              </div>
              <div className="mt-4 text-center">
                <p className="font-bold text-sm text-slate-800 line-clamp-2">{compreJuntoPartner.nome}</p>
                <p className="font-black text-lg text-emerald-700 mt-1">R$ {compreJuntoPartner.precoPor?.toFixed(2)}</p>
              </div>
            </div>

            <div className="h-[2px] w-full lg:h-32 lg:w-[2px] bg-slate-200 shrink-0 mx-4" />

            {/* Resumo e Botão */}
            <div className="flex-1 text-center lg:text-left flex flex-col items-center lg:items-start justify-center">
              <p className="text-slate-500 font-medium mb-2">Compre os 2 itens por:</p>
              <div className="flex items-end gap-2 mb-6">
                <p className="text-slate-400 line-through text-lg">R$ {((p.precoDe || p.precoPor || 0) + (compreJuntoPartner.precoDe || compreJuntoPartner.precoPor || 0)).toFixed(2)}</p>
                <p className="text-4xl font-black text-emerald-800">R$ {((p.precoPor || 0) + (compreJuntoPartner.precoPor || 0)).toFixed(2)}</p>
              </div>
              <Button 
                onClick={() => {
                  add(p, 1, true);
                  add(compreJuntoPartner, 1);
                }}
                className="w-full max-w-[250px] h-14 text-lg font-bold bg-emerald-600 hover:bg-emerald-700 shadow-md transition-transform hover:scale-105 active:scale-95"
              >
                Comprar Kit
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Cross-Sell Carousel */}
      {crossSell.length > 0 && (
        <section className="mt-16 border-t pt-10">
          <h2 className="text-2xl font-bold mb-6">Produtos da mesma categoria</h2>
          <div className="flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 md:grid md:grid-cols-5 md:overflow-visible md:pb-0 scrollbar-none -mx-4 px-4 md:mx-0 md:px-0">
            {crossSell.map((cp: any) => (
              <div key={cp.id} className="shrink-0 w-[40vw] md:w-auto snap-start">
                <ProductCard p={cp} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Story Bubbles */}
      <ProductStory videoUrl={p.videoUrl} productName={p.nome} />

      <Dialog open={waitlistOpen} onOpenChange={setWaitlistOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Avise-me quando chegar</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-slate-500">Deixe seus dados e entraremos em contato via WhatsApp assim que este produto voltar ao estoque.</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">Nome completo <span className="text-red-500">*</span></label>
                <Input placeholder="Seu nome" value={wlName} onChange={(e) => setWlName(e.target.value)} />
              </div>
              <div className="space-y-2 col-span-2 md:col-span-1">
                <label className="text-sm font-medium">WhatsApp <span className="text-red-500">*</span></label>
                <Input placeholder="(00) 00000-0000" value={wlPhone} onChange={(e) => setWlPhone(e.target.value)} />
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantidade desejada <span className="text-red-500">*</span></label>
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setWlQty(Math.max(1, wlQty - 1))}
                  className="h-9 w-9"
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <span className="font-bold w-4 text-center">{wlQty}</span>
                <Button 
                  variant="outline" 
                  size="icon" 
                  onClick={() => setWlQty(wlQty + 1)}
                  className="h-9 w-9"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Mensagem que será enviada à loja:</label>
              <div className="p-3 bg-slate-50 rounded-lg border text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">
                {`Gostaria desse produto mas notei que não possui estoque, consegue me avisar quando voltar ao estoque?
Produto: ${p.nome}
Valor: R$ ${((p as any).precoPromocional && isCampanhaAtiva((p as any).campanha) ? (p as any).precoPromocional : (p.precoPor || 0)).toFixed(2).replace('.', ',')}
Quantidade desejada: ${wlQty}`}
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input 
                type="checkbox" 
                id="wl-accept" 
                className="mt-1" 
                checked={wlAccepted}
                onChange={(e) => setWlAccepted(e.target.checked)}
              />
              <label htmlFor="wl-accept" className="text-xs text-slate-600 leading-tight cursor-pointer">
                Estou ciente de que o preço exibido é válido apenas no momento desta solicitação e pode sofrer alterações sem aviso prévio. <span className="text-red-500">*</span>
              </label>
            </div>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setWaitlistOpen(false)}>Cancelar</Button>
            <Button 
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2"
              onClick={handleWaitlistSubmit} 
              disabled={!wlAccepted}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
              </svg>
              Avisar-me no WhatsApp
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vídeo Flutuante */}
      {p.videoFlutuante && (
        <div 
          className="fixed bottom-4 left-4 z-50 rounded-xl overflow-hidden shadow-2xl border-4 border-white group cursor-pointer bg-black" 
          style={{ width: 140, height: 140 }} 
          onClick={() => {
            // Pode abrir numa modal ou nova janela dependendo da preferência. Nova aba para simplificar:
            window.open(p.videoFlutuante, '_blank');
          }}
        >
          <video 
            src={p.videoFlutuante} 
            autoPlay 
            muted 
            loop 
            playsInline 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white">
            <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm mb-1">
              <Share2 className="h-4 w-4" />
            </div>
            <span className="font-bold text-[10px] uppercase tracking-wider">Ampliar</span>
          </div>
        </div>
      )}

      <LoginModal 
        open={loginOpen} 
        onOpenChange={setLoginOpen} 
        onLoginSuccess={() => setLoginOpen(false)} 
      />



      <Dialog open={isYoutubeModalOpen} onOpenChange={setIsYoutubeModalOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-none h-auto aspect-video sm:rounded-xl">
          {youtubeId && isYoutubeModalOpen && (
            <iframe
              width="100%"
              height="100%"
              src={`https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0`}
              title="YouTube video player"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="w-full h-full"
            ></iframe>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
