import { createFileRoute, notFound, Link, useParams } from "@tanstack/react-router";
import { catalog } from "@/services/catalog";
import { brl, productImage, tarjaColor, checkIsGenerico, getInstallmentText, formatPbmName } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart, useGeoCep } from "@/stores/cart";
import { useFavorites } from "@/stores/favorites";
import { FileText, MapPin, Search, ChevronRight, ChevronLeft, X, Heart, Share2, Plus, Minus, Truck, Handshake, ShieldCheck, Store, CheckCircle2, AlertCircle, ChevronDown, Bike, Zap, Star, StarHalf, Calendar, Youtube, Play, ExternalLink, ShoppingBasket } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import React, { useEffect, useState, useRef } from "react";
import { ProductStory } from "@/components/storefront/ProductStory";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Flame, Gift, ShoppingBag } from "lucide-react";
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
import { getCityFromCep, isCampanhaAtiva, calculateDistance, getCepCoordinates, getDeliveryEstimation, isRecentlyAdded, getLevePaguePromotion, getPadraoPromotionWithTimer } from "@/lib/utils";
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

export const Route = createFileRoute("/_store/p/$slug")({
  validateSearch: (search: Record<string, unknown>): { shared?: string } => {
    return {
      shared: search.shared as string | undefined,
    }
  },
  loader: async ({ params }) => {
    const p = await catalog.getProductBySlug(params.slug);
    if (!p) throw notFound();
    const [loja, cat, subcat, crossSell, compreJuntoPartner] = await Promise.all([
      catalog.activeStore(),
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
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const p = loaderData.p;
    if (!p) return {};
    const title = `${p.nome} — Farmácias Associadas`;
    const desc = (p.descricao || `Compre ${p.nome} com o melhor preço nas Farmácias Associadas. Entrega rápida e segura.`).slice(0, 160);
    const img = productImage(p);
    
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: img },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: img },
      ],
    };
  },
  notFoundComponent: () => (
    <div className="container-fa py-12 text-center">Produto não encontrado.</div>
  ),
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
                  const id = f.id || f._originalIndex.toString();
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
                        <p className="mt-1"><strong className="text-foreground">Distância:</strong> <span className="inline-flex items-center text-primary bg-primary/10 px-1.5 rounded text-[10px] ml-1"><MapPin className="h-3 w-3 mr-0.5"/>{f._distance !== null ? (f._distance === -1 ? 'Indisponível' : `${f._distance.toFixed(1)} km`) : "Calculando..."}</span></p>
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
  const { p: initialProduct, loja, cat, subcat, crossSell, variations, compreJuntoPartner } = Route.useLoaderData();
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
  const activeSelos = allSelos.filter(s => s.ativo && p.selosIds?.includes(s.id));
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
  const isRetencao = !!p.retemReceita;
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

  const [newQuestion, setNewQuestion] = useState("");
  const { questions, addQuestion } = useQuestions();
  
  const [newReviewText, setNewReviewText] = useState("");
  const [newReviewRating, setNewReviewRating] = useState(5);
  const { avaliacoes: allReviews, addAvaliacao, loadAvaliacoes } = useReviews();

  useEffect(() => {
    loadAvaliacoes();
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
    
    const productPrice = p.precoPromocional && isCampanhaAtiva(p.campanha) ? p.precoPromocional : p.preco;
    
    addWaitlistEntry({
      produtoId: p.id,
      clienteNome: wlName,
      whatsapp: wlPhone,
      quantidade: wlQty,
      mensagem: `Gostaria desse produto mas notei que não possui estoque, consegue me avisar quando voltar ao estoque?\nProduto: ${p.nome}\nValor: R$ ${productPrice.toFixed(2).replace('.', ',')}\nQuantidade desejada: ${wlQty}`
    });
    toast.success("Avisaremos você quando o produto chegar!");
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

  const rawCity = (freteCalculado && cep) ? (
    (cep === globalCep && globalCity) ? globalCity : getCityFromCep(cep, allPharmacies)
  ) : "Porto Alegre";
  const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const currentCity = normalize(rawCity);
  
  let cityPharmacies = (freteCalculado && cep) ? allPharmacies.filter(f => 
    normalize(f.cidade).includes(currentCity) || 
    normalize(f.endereco).includes(currentCity)
  ) : allPharmacies;

  if (cityPharmacies.length === 0 && allPharmacies.length > 0 && cep) {
    const userCepNum = parseInt(cep.replace(/\D/g, ""), 10);
    const sortedByDistance = [...allPharmacies].sort((a, b) => {
      const aDist = Math.abs(userCepNum - parseInt(a.cep.replace(/\D/g, ""), 10));
      const bDist = Math.abs(userCepNum - parseInt(b.cep.replace(/\D/g, ""), 10));
      return aDist - bDist;
    });
    const closestCity = sortedByDistance[0].cidade;
    cityPharmacies = allPharmacies.filter(f => normalize(f.cidade) === normalize(closestCity));
  }

  const isCampanha = isCampanhaAtiva(p);

  // Busca coordenadas reais para farmácias que não têm lat/lng cadastrados
  useEffect(() => {
    if (!cep) return;
    const userCep = cep.replace(/\D/g, "");
    if (userCep.length !== 8) return;

    const pharmaciesWithoutCoords = allPharmacies.filter(f => 
      !(geoLat && geoLng && f.lat && f.lng) && pharmDistances[f.id] === undefined
    );
    if (pharmaciesWithoutCoords.length === 0) return;

    (async () => {
      setIsCalcLoading(true);
      // Busca coordenadas do CEP do usuário (se não tiver do GPS)
      const userCoords = (geoLat && geoLng)
        ? { lat: geoLat, lng: geoLng }
        : await getCepCoordinates(userCep);

      if (!userCoords) {
        setIsCalcLoading(false);
        return;
      }
      if (!userCoords) {
        const updates: Record<string, number> = {};
        pharmaciesWithoutCoords.forEach(f => updates[f.id] = -1);
        setPharmDistances(prev => ({ ...prev, ...updates }));
        setIsCalcLoading(false);
        return;
      }

      const updates: Record<string, number> = {};
      await Promise.all(
        pharmaciesWithoutCoords.map(async (f) => {
          const pharmCoords = (f.lat && f.lng)
            ? { lat: f.lat, lng: f.lng }
            : await getCepCoordinates(f.cep);
          if (pharmCoords) {
            updates[f.id] = calculateDistance(userCoords.lat, userCoords.lng, pharmCoords.lat, pharmCoords.lng);
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
  }, [cep, geoLat, geoLng, cityPharmacies, pharmDistances]);

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
      if (p.precosPorLoja?.[f.id]) {
        preco = p.precosPorLoja[f.id].precoPor;
      }
    }
    // Prioridade: GPS do usuário + coords da farmácia > coords buscadas via API > placeholder
    const distance = (geoLat && geoLng && f.lat && f.lng)
      ? calculateDistance(geoLat, geoLng, f.lat, f.lng)
      : (pharmDistances[f.id] ?? null);
      
    const isSameCity = normalize(f.cidade).includes(currentCity) || normalize(f.endereco).includes(currentCity);
    
    // Check if pharmacy can deliver or pickup
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
      } else {
        canDeliver = true;
        deliveryPrice = f.custoEntrega ?? null;
      }
    } else if (f.aceitaEntrega && distance === null) {
      // If we don't have distance yet, assume can deliver if same city
      canDeliver = isSameCity;
      if (f.raiosEntrega && f.raiosEntrega.length > 0) {
        deliveryPrice = Math.min(...f.raiosEntrega.map(r => r.preco));
      } else if (f.custoEntrega !== undefined && f.custoEntrega !== null) {
        deliveryPrice = f.custoEntrega;
      }
    }
    const canPickup = f.aceitaRetirada;

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

  let maxStock = 0;
  let activeFornecedor = null;
  let isLocalStock = false;
  let isLojaPromoActiva = false;

  if (availablePharmacies.length > 0) {
    maxStock = Math.max(0, ...availablePharmacies.map(f => f._calculatedStock));
  }

  isLocalStock = maxStock > 0;

  if (!isLocalStock && fornecedores && fornecedores.length > 0) {
    const citySuppliers = fornecedores.filter(f => normalize(f.cidade).includes(currentCity));
    activeFornecedor = citySuppliers.length > 0 ? citySuppliers[0] : fornecedores[0];
    
    const supplierStock = getDeterministicStock(p, String(activeFornecedor.id) + "supp");
    maxStock = supplierStock > 0 ? supplierStock : 10;
  }

  const activeStoreId = selectedPharmacyId || (availablePharmacies.length > 0 ? availablePharmacies[0].id : null);
  let finalPrecoPor = p.precoPor;
  let finalPrecoDe = p.precoDe;

  if (isCampanha) {
    finalPrecoPor = p.precoCampanha || p.precoPor;
  } else if (activeStoreId) {
    // 1. Base table price
    const activePharm = availablePharmacies.find(f => f.id === activeStoreId);
    if (activePharm) {
      const activeTabela = activePharm.tabelaPrecoId || "poa";
      const regPrice = regionalPrices[`${activeTabela}-${p.id}`];
      if (regPrice !== undefined) finalPrecoPor = regPrice;
    }
    
    // 2. Specific store override
      if (p.precosPorLoja?.[activeStoreId]) {
        const pLoja = p.precosPorLoja[activeStoreId];
        finalPrecoPor = pLoja.precoPor;
        finalPrecoDe = pLoja.precoDe;
        
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
  const lojaPromocoes = activeStoreId ? marketingState.lojaPromocoes[activeStoreId] || [] : [];
  const padraoPromo = getPadraoPromotionWithTimer(p, promocoes, lojaPromocoes);
  const levePaguePromo = getLevePaguePromotion(p, promocoes, lojaPromocoes);

  if (padraoPromo) {
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

  const activePromo = padraoPromo || levePaguePromo;

  const desconto = finalPrecoDe > finalPrecoPor ? Math.round((1 - finalPrecoPor / finalPrecoDe) * 100) : 0;

  const defaultImg = p.imagens?.[0] || productImage(p);
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
    setSelectedImage(p.imagens?.[0] || productImage(p));
    setFreightTab(!!p.retemReceita ? "retirada" : "entrega");

    if (isShared && !globalCep) {
      setForcedPharmacyModal(true);
    }

    // Auto-select closest pharmacy on load (only if not forced to select)
    if (availablePharmacies.length > 0 && (!isShared || globalCep)) {
      const closest = availablePharmacies[0];
      if (closest._calculatedStock > 0 || isService) {
        setSelectedPharmacyId(closest.id);
        setSelectedFreight("pickup");
      }
    }
  }, [p.id, p.imagens]);

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

  const isGenerico = checkIsGenerico(p);
  const isMedication = String(cat?.nome || "").toLowerCase().includes("medicamento") || String(p.nome || "").toLowerCase().includes("medicamento") || p.categoriaId === "142" || (p.tarja && p.tarja.trim() !== "") || isGenerico;
  const showPrincipioAtivo = isMedication;
  const hideReviews = p.categoriaId === "142" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("142")) || p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20"));
  const isService = p.tipoProduto === "servico" || !!(p.categoriaId === "200" || (p.subcategoriaId && String(p.subcategoriaId).startsWith("20")));

  const marcasProprias = ["revitart", "santo habito", "santo hábito", "revigore", "revimel", "crescendo", "vita magna", "associadas"];
  const isMarcaPropria = p.fabricante && marcasProprias.some(m => p.fabricante.toLowerCase().includes(m));
  
  let hash = 0;
  for (let i = 0; i < p.id.length; i++) {
    hash = p.id.charCodeAt(i) + ((hash << 5) - hash);
  }
  hash = Math.abs(hash);

  const rating = isMarcaPropria 
    ? [4.8, 4.9][hash % 2]
    : [4.5, 4.7, 4.9, 5.0][hash % 4];
  
  const reviewsCount = 12 + (hash % 150);

  const schemaOrg = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": p.nome,
    "image": [productImage(p)],
    "description": (p.descricao || `Compre ${p.nome} nas Farmácias Associadas.`).slice(0, 160),
    "sku": p.id,
    "brand": {
      "@type": "Brand",
      "name": p.fabricante || "Associadas"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://associadas.com.br/p/${p.url || p.slug || p.id}`,
      "priceCurrency": "BRL",
      "price": finalPrecoPor.toString(),
      "availability": maxStock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(hasReviews ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": calculatedRating.toFixed(1),
        "reviewCount": avaliacoes.length
      }
    } : {})
  };

  return (
    <div className="container-fa py-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <div className="text-sm text-muted-foreground mb-4 flex items-center gap-2 overflow-x-auto whitespace-nowrap pb-2 scrollbar-none">
        <Link to="/" className="hover:text-primary transition flex items-center gap-1"><FileText className="h-3 w-3"/> Início</Link>
        <ChevronRight className="h-3 w-3" />
        {cat && (
          <>
            <Link to="/c/$slug" params={{ slug: cat.slug }} className="hover:text-primary transition">{cat.nome}</Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        {subcat && (
          <>
            <Link to="/c/$slug" params={{ slug: subcat.slug }} className="hover:text-primary transition">{subcat.nome}</Link>
            <ChevronRight className="h-3 w-3" />
          </>
        )}
        <span className="text-foreground font-medium truncate max-w-[200px]">{p.nome}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 mt-4 lg:mt-8 lg:items-start">
        <div className="contents lg:flex lg:flex-1 lg:flex-col lg:gap-8 lg:min-w-0">
          <div className="space-y-6 max-w-full overflow-hidden order-1 lg:order-none">
            <h1 className="text-2xl font-bold leading-tight lg:hidden block">{p.nome}</h1>
            
            {/* Mobile Promotional Displays */}
            {padraoPromo && (
              <div className="lg:hidden mt-3 mb-2">
                <PromoProductPageBanner promo={padraoPromo} precoOriginal={finalPrecoDe} precoPromocional={finalPrecoPor} />
              </div>
            )}

            {levePaguePromo && (
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
            
            {!hideReviews && (() => {
              const avaliacoes = getAvaliacoesPorProduto(p.id);
              const hasReviews = avaliacoes.length > 0;
              let rating = 0;
              if (hasReviews) {
                rating = avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length;
              }
              return (
                <div className="flex items-center gap-1.5 lg:hidden mt-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                    ))}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
                  <span className="text-sm text-slate-500">({hasReviews ? avaliacoes.length : 0})</span>
                </div>
              );
            })()}

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
              {p.tarja && p.tarja !== 'Sem Tarja' && p.tarja !== 'none' && (
                <div className={`absolute bottom-0 left-0 w-full h-8 flex items-center justify-center font-black text-[10px] uppercase tracking-wider z-20 ${tarjaColor(p.tarja)}`}>
                  {p.retemReceita ? "Venda sob prescrição médica - Retém Receita" : "Venda sob prescrição médica"}
                </div>
              )}

              <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 items-start pointer-events-none">
                {isCampanha && (
                  <span className="bg-gradient-to-r from-orange-500 to-orange-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm flex items-center gap-1.5 w-max">
                    <Calendar className="h-3.5 w-3.5" /> Oferta de {new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase())}
                  </span>
                )}
                {isGenerico && (
                  <span className="bg-yellow-400 text-black text-xs font-bold px-3 py-1 rounded shadow-sm w-max">
                    GENÉRICO
                  </span>
                )}
                {recentlyAdded && (
                  <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded shadow-sm w-max">
                    ACABOU DE CHEGAR
                  </span>
                )}

                {activeSelos.length > 0 && activeSelos.map(selo => (
                  <span key={selo.id} style={{ backgroundColor: selo.corFundo, color: selo.corTexto }} className="text-xs font-bold px-3 py-1 rounded shadow-sm w-max">
                    {selo.nome}
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
            {((p.imagens && p.imagens.length > 1) || (p.storiesProduto && p.storiesProduto.length > 0)) && (
              <div className="relative max-w-[500px] mx-auto w-full group">
                <div ref={thumbScrollRef} className="flex gap-3 overflow-x-auto pb-2 snap-x scrollbar-none scroll-smooth">
                  {p.storiesProduto && p.storiesProduto.length > 0 && p.storiesProduto.map((storyUrl: string, idx: number) => (
                    <div key={`story-${idx}`} className="shrink-0 snap-start">
                      <ProductStory videoUrl={storyUrl} productName={p.nome} inline={true} />
                    </div>
                  ))}
                  {(p.imagens || []).map((img: string, idx: number) => (
                    <button 
                      key={idx} 
                      onClick={() => setSelectedImage(img)}
                      className={`w-20 h-20 shrink-0 snap-start border-2 rounded-xl overflow-hidden cursor-pointer bg-white transition ${selectedImage === img ? 'border-primary' : 'border-slate-200 hover:border-primary/50'}`}
                    >
                      <img src={img} alt={`Imagem ${idx + 1} de ${p.nome}`} className="w-full h-full object-contain p-2" />
                    </button>
                  ))}
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

            {isMedication && (
              <section>
                <h2 className="text-xl font-bold mb-4">
                  Características
                </h2>
                <div className="bg-white border rounded-xl p-6 shadow-sm space-y-8">
                  <div className="overflow-hidden rounded-lg">
                    <table className="w-full text-sm text-left">
                      <tbody>
                        <tr className="bg-slate-50 border-b">
                          <td className="py-3 px-4 text-slate-500 w-1/3">Ref.</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.codigoInterno || p.id}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-slate-500">SKU</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.sku || 'Não informado'}</td>
                        </tr>
                        <tr className="bg-slate-50 border-b">
                          <td className="py-3 px-4 text-slate-500">Código de barras</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.ean || p.ean2 || p.ean3 || 'Não informado'}</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-3 px-4 text-slate-500">Fabricante</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.marca || p.fabricante || 'Não informada'}</td>
                        </tr>
                        <tr className="bg-slate-50 border-b">
                          <td className="py-3 px-4 text-slate-500">Registro Anvisa</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.registroAnvisa || 'Isento/Não informado'}</td>
                        </tr>
                        {p.tarja && (
                          <tr className="border-b">
                            <td className="py-3 px-4 text-slate-500">Tarja</td>
                            <td className="py-3 px-4 font-bold text-slate-900">{p.tarja}</td>
                          </tr>
                        )}
                        <tr className={`${p.tarja ? 'bg-slate-50 ' : ''}border-b`}>
                          <td className="py-3 px-4 text-slate-500">Retém receita</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.retemReceita ? 'Sim' : 'Não'}</td>
                        </tr>
                        <tr className={`${!p.tarja ? 'bg-slate-50 ' : ''}border-b`}>
                          <td className="py-3 px-4 text-slate-500">Tipo de medicamento</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{p.tipoMedicamento ? p.tipoMedicamento.charAt(0).toUpperCase() + p.tipoMedicamento.slice(1) : 'Referência'}</td>
                        </tr>
                        <tr className={`${p.tarja ? 'bg-slate-50 ' : ''}`}>
                          <td className="py-3 px-4 text-slate-500">É kit</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{String(p.tipoProduto || '').toLowerCase() === 'kit' ? 'Sim' : 'Não'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {p.principiosAtivosDetalhes && p.principiosAtivosDetalhes.length > 0 && (
                    <div className="pt-4 border-t">
                      <h3 className="text-lg font-bold text-slate-900 mb-4">Princípios ativos</h3>
                      <div className="overflow-hidden rounded-lg">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="text-slate-500 border-b">
                              <th className="py-3 px-4 font-medium w-1/3">Nome</th>
                              <th className="py-3 px-4 font-medium w-1/3">Concentração</th>
                              <th className="py-3 px-4 font-medium w-1/3">Unidade</th>
                            </tr>
                          </thead>
                          <tbody>
                            {p.principiosAtivosDetalhes.map((pa: any, i: number) => (
                              <tr key={i} className={i % 2 === 0 ? "bg-slate-50" : ""}>
                                <td className="py-3 px-4 font-bold text-slate-900">{pa.nome}</td>
                                <td className="py-3 px-4 text-slate-700">{pa.concentracao}</td>
                                <td className="py-3 px-4 text-slate-700">{pa.unidadeMedida}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            )}

            <section>
              <h2 className="text-xl font-bold mb-4">Descrição do Produto</h2>
              <div className="bg-white border rounded-xl p-6 shadow-sm">
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  dangerouslySetInnerHTML={{ __html: p.descricao || "" }}
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

            {!isStoreContext && (
              <section id="avaliacoes" className={`grid grid-cols-1 ${!isMedication ? 'md:grid-cols-2' : ''} gap-6 pt-4`}>
              <div className="bg-white border rounded-xl p-6 shadow-sm relative overflow-hidden">
                <h2 className="text-xl font-bold mb-4">Perguntas</h2>
                
                <div className="space-y-4">
                  <div className={`space-y-4 ${!user ? 'blur-sm pointer-events-none opacity-40' : ''}`}>
                    <Input 
                      placeholder="Faça uma pergunta sobre o produto..." 
                      className="bg-slate-50" 
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                    />
                    <Button className="w-full font-bold" onClick={handleAskQuestion}>Enviar pergunta</Button>
                  </div>
                  
                  <div className="pt-4 border-t border-slate-100">
                    {productQuestions.length === 0 ? (
                      <div className="text-sm text-muted-foreground text-center">
                        Ainda não há perguntas para este produto. Seja o primeiro a perguntar!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {productQuestions.map(q => (
                          <div key={q.id} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-800 text-sm">{q.clienteNome}</span>
                              <span className="text-[10px] text-slate-500">{new Date(q.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <p className="text-sm text-slate-600 mb-3">{q.pergunta}</p>
                            
                            {q.resposta ? (
                              <div className="bg-white p-3 rounded border border-slate-200 ml-4 relative">
                                <div className="absolute -left-2 top-3 w-2 h-2 bg-white border-l border-t border-slate-200 rotate-[-45deg]"></div>
                                <p className="text-xs font-bold text-emerald-800 mb-1">Farmácias Associadas Responde:</p>
                                <p className="text-sm text-slate-700">{q.resposta}</p>
                              </div>
                            ) : (
                              <div className="ml-4 text-xs text-slate-400 italic">Aguardando resposta...</div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {!user && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
                    <Button className="font-bold shadow-lg" onClick={() => setLoginOpen(true)}>
                      Você precisa estar logado para perguntar
                    </Button>
                  </div>
                )}
              </div>
              {!isMedication && (() => {

                return (
                  <div className="bg-white border rounded-xl p-6 shadow-sm flex flex-col gap-6">
                    <div className="flex flex-col justify-center items-center text-center pb-6 border-b">
                      <h2 className="text-xl font-bold mb-2">Avaliações do produto</h2>
                      <div className="flex items-center gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star key={i} className={`h-6 w-6 ${i <= calculatedRating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                        ))}
                      </div>
                      {hasReviews ? (
                        <>
                          <div className="text-3xl font-black text-slate-800">{calculatedRating.toFixed(1)}<span className="text-base text-muted-foreground font-medium">/5</span></div>
                          <div className="text-sm text-muted-foreground mt-1">({avaliacoes.length} {avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})</div>
                        </>
                      ) : (
                        <div className="text-sm text-slate-500 font-medium italic">Esse produto ainda não teve avaliação, seja o primeiro.</div>
                      )}
                    </div>
                    
                    <div className="relative border-b pb-6">
                      <h3 className="font-bold text-sm mb-3">Deixe sua avaliação</h3>
                      <div className={`space-y-4 ${!user ? 'blur-sm pointer-events-none opacity-40' : ''}`}>
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star 
                              key={i} 
                              className={`h-6 w-6 cursor-pointer transition-colors ${i <= newReviewRating ? 'fill-yellow-400 text-yellow-400 hover:fill-yellow-500 hover:text-yellow-500' : 'text-slate-300 hover:text-yellow-400 hover:fill-yellow-400'}`} 
                              onClick={() => setNewReviewRating(i)}
                            />
                          ))}
                        </div>
                        <textarea 
                          placeholder="O que achou deste produto?" 
                          className="w-full bg-slate-50 border border-slate-200 rounded p-3 text-sm min-h-[80px]"
                          value={newReviewText}
                          onChange={(e) => setNewReviewText(e.target.value)}
                        />
                        <Button className="w-full font-bold" onClick={handleSubmitReview}>Enviar avaliação</Button>
                      </div>

                      {!user && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/40">
                          <Button className="font-bold shadow-lg" onClick={() => setLoginOpen(true)}>
                            Você precisa estar logado para avaliar
                          </Button>
                        </div>
                      )}
                    </div>
                    
                    {hasReviews && (
                      <div className="space-y-4">
                        {avaliacoes.map((av, idx) => (
                          <div key={idx} className="bg-slate-50 p-4 rounded-lg">
                            <div className="flex justify-between items-start mb-2">
                              <span className="font-bold text-slate-800 text-sm">{av.usuario}</span>
                              <span className="text-[10px] text-slate-500">{new Date(av.data).toLocaleDateString('pt-BR')}</span>
                            </div>
                            <div className="flex items-center mb-2">
                              {[1, 2, 3, 4, 5].map(i => (
                                <Star key={i} className={`h-3 w-3 ${i <= av.nota ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                              ))}
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{av.texto}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    <div className="relative mt-2">
                      <div className={!user ? 'blur-sm pointer-events-none opacity-40' : ''}>
                        <Button variant="outline" className="font-bold w-full">Deixar uma avaliação</Button>
                      </div>
                      {!user && (
                        <div className="absolute inset-0 z-10 flex items-center justify-center">
                          <Button className="font-bold shadow-lg w-full" onClick={() => setLoginOpen(true)}>
                            Você precisa estar logado para avaliar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </section>
            )}
            </div>
        </div>

        <div className="contents lg:flex lg:w-[400px] lg:shrink-0 lg:flex-col lg:gap-8">
          <aside className="space-y-4 order-2 lg:order-none">
            <h1 className="text-2xl font-bold leading-tight hidden lg:block">{p.nome}</h1>
            
            {/* Desktop Promotional Displays */}
            {padraoPromo && (
              <div className="hidden lg:block mt-2 mb-2">
                <PromoProductPageBanner promo={padraoPromo} precoOriginal={finalPrecoDe} precoPromocional={finalPrecoPor} />
              </div>
            )}

            {levePaguePromo && (
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
              
              {!isMedication && (() => {
                const avaliacoes = getAvaliacoesPorProduto(p.id);
                const hasReviews = avaliacoes.length > 0;
                let rating = 0;
                if (hasReviews) {
                  rating = avaliacoes.reduce((acc, curr) => acc + curr.nota, 0) / avaliacoes.length;
                }
                return (
                  <a href="#avaliacoes" className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map(i => (
                        <Star key={i} className={`h-4 w-4 ${i <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
                      ))}
                    </div>
                    <span className="text-sm font-bold text-slate-700">{rating.toFixed(1)}</span>
                    <span className="text-sm text-slate-500 underline">({hasReviews ? avaliacoes.length : 0} {hasReviews && avaliacoes.length === 1 ? 'avaliação' : 'avaliações'})</span>
                  </a>
                );
              })()}
            </div>

          <div className="flex flex-wrap gap-2">
            {p.tarja && p.tarja !== "none" && (
              <span className={`text-[11px] px-2 py-0.5 rounded font-bold shadow-sm ${tarjaColor(p.tarja)}`}>
                {p.tarja === "Vermelha" || p.tarja === "Amarela" ? `Tarja ${p.tarja}` : p.tarja}
              </span>
            )}
            {p.retemReceita ? (
              <span className="text-[11px] px-2 py-0.5 rounded shadow-sm bg-red-600 text-white font-bold">
                Retém receita
              </span>
            ) : (p.retemReceita === false ? (
              <span className="text-[11px] px-2 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 font-bold border border-slate-200">
                Não retém receita
              </span>
            ) : null)}
          </div>

          {variations.length > 0 && (
            <div className="border-y py-4 my-4">
              <div className="text-sm font-bold mb-3 flex items-center gap-2">
                Outras opções deste produto
              </div>
              <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-none items-start">
                {/* Current Product */}
                <div className="w-[80px] shrink-0 flex flex-col items-center">
                  <div className="border-2 border-primary rounded-xl p-2 relative bg-primary/5 cursor-default flex items-center justify-center h-[80px] w-full">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-primary text-white text-[9px] font-bold px-2 py-0.5 rounded-full z-10 whitespace-nowrap shadow-sm">
                      Selecionado
                    </div>
                    <img src={defaultImg} alt={p.nome} className="w-full h-full object-contain mix-blend-multiply" />
                  </div>
                  <div className="text-[10px] font-bold text-center text-primary leading-tight mt-1.5 line-clamp-2 px-1">
                    {p.nome.replace(new RegExp(normalizedTarget, 'ig'), '').trim() || "Atual"}
                  </div>
                </div>
                
                {/* Other Variations */}
                {variations.map((v: any) => (
                  <Link key={v.id} to="/p/$slug" params={{ slug: v.url }} className="w-[80px] shrink-0 flex flex-col items-center group">
                    <div className="border border-slate-200 group-hover:border-primary/50 transition-colors rounded-xl p-2 bg-white flex items-center justify-center h-[80px] w-full cursor-pointer relative">
                      <img src={v.imagens?.[0] || productImage(v)} alt={v.nome} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform" />
                    </div>
                    <div className="text-[10px] font-medium text-center text-slate-500 group-hover:text-primary leading-tight mt-1.5 line-clamp-2 px-1 transition-colors">
                      {v.nome.replace(new RegExp(normalizedTarget, 'ig'), '').trim() || v.nome}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="bg-card border rounded-xl p-5 shadow-elevated">
            {p.precoSobConsulta ? (
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
              {p.selo && p.selo.toUpperCase() !== "SEM SELO" && p.selo.toUpperCase() !== "NENHUMA AÇÃO" && (
                  <div className="mb-1">
                    <span className="inline-block text-[11px] font-bold bg-accent text-accent-foreground px-2 py-0.5 rounded">
                      {formatPbmName(p.selo)}
                    </span>
                  </div>
                )}
                {desconto > 0 && (
                  <div className="text-sm text-muted-foreground line-through font-medium">{brl(finalPrecoDe)}</div>
                )}
                <div className="flex items-center gap-3 mt-1">
                  <div className="text-4xl font-bold text-foreground">{brl(finalPrecoPor)}</div>
                  {desconto > 0 && (
                    <span className="bg-[#e6f4ea] text-[#137333] text-[11px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                      -{desconto}%
                    </span>
                  )}
                </div>
                {getInstallmentText(finalPrecoPor) && (
                  <div className="text-sm text-slate-500 font-medium mt-2">
                    {getInstallmentText(finalPrecoPor)}
                  </div>
                )}
              </>
            )}

            {maxStock > 0 ? (
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

            <div className="mt-6 border-t pt-5">
              {!isLocalStock && activeFornecedor && maxStock > 0 ? (
                <>
                  <div className="text-sm font-bold mb-3 flex items-center gap-2">
                    Disponibilidade Prateleira Infinita
                  </div>
                  <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-800 text-sm relative overflow-hidden group">
                    <div className="blur-sm pointer-events-none opacity-50 select-none">
                      <p className="font-bold flex items-center gap-2 mb-1"><Truck className="h-4 w-4" /> Entregue por parceiro logístico</p>
                      <p>O prazo estimado para sua região é de <strong>{activeFornecedor.prazo} dias úteis</strong>.</p>
                    </div>
                    <div className="absolute inset-0 z-10 flex items-center justify-center">
                      <span className="font-black text-lg text-orange-900 bg-orange-100/80 px-4 py-2 rounded-lg backdrop-blur-md shadow-sm border border-orange-200/50">
                        Prateleira infinita em breve
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold mb-3 flex items-center gap-2">
                    Esse produto está disponível na(s) unidade(s):
                  </div>

                  <div className="animate-in fade-in slide-in-from-top-2">
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 scrollbar-none">
                        {!globalCep ? (
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-muted-foreground flex flex-col items-center gap-3">
                            <span>Para ver as opções de retirada ou entrega, precisamos do seu CEP.</span>
                            <Button onClick={() => {
                              setTimeout(() => {
                                document.dispatchEvent(new CustomEvent('open-geo-popup'));
                              }, 150);
                            }}>
                              Validar CEP
                            </Button>
                          </div>
                        ) : availablePharmacies.length > 0 ? (() => {
                          const validPharmacies = availablePharmacies.filter(f => f._calculatedStock > 0);
                          const lowestPrice = validPharmacies.length > 0 ? Math.min(...validPharmacies.map(f => f._preco)) : 0;
                          const hasDifferentPrices = validPharmacies.some(f => f._preco > lowestPrice);

                          return availablePharmacies.map((f, i) => {
                            const id = f.id || f._originalIndex.toString();
                            const stock = f._calculatedStock;
                            const isDisabled = stock < qty;
                            const isSelected = selectedFreight === 'pickup' && selectedPharmacyId === id && !isDisabled;
                            const isMelhorPreco = !isDisabled && hasDifferentPrices && f._preco === lowestPrice;

                            return (
                              <button 
                                type="button"
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
                                      {isDisabled && (
                                        <span className="inline-flex items-center text-[9px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                                          {stock === 0 ? "Fora de estoque" : "Quantidade insuficiente"}
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
                                {!isService && (
                                  <div className="flex flex-wrap items-center gap-2 mb-3 mt-2">
                                    <div className="font-bold text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                                      Retirada: Grátis ({f.horarioInicioRetirada || "08:00"} às {f.horarioFimRetirada || "20:00"})
                                    </div>
                                    {!p.retemReceita && f.aceitaEntrega && f._deliveryPrice !== null && (
                                      <div className="font-bold text-orange-600 text-[10px] bg-orange-100 px-1.5 py-0.5 rounded">
                                        Entrega: {f._distance === null && f.raiosEntrega && f.raiosEntrega.length > 0 ? `A partir de ${brl(f._deliveryPrice)}` : brl(f._deliveryPrice)}
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <p>{f.endereco}</p>
                                  <p><strong className="text-foreground">CNPJ:</strong> {f.cnpj}</p>
                                  <p><strong className="text-foreground">Farmacêutico:</strong> {f.respTecnico} | <strong className="text-foreground">CRF/RS:</strong> {(f as any).crf}</p>
                                  <p><strong className="text-foreground">AFE:</strong> {f.afe}</p>
                                  <p className="mt-1"><strong className="text-foreground">Distância:</strong> <span className="inline-flex items-center text-primary bg-primary/10 px-1.5 rounded text-[10px] ml-1"><MapPin className="h-3 w-3 mr-0.5"/>{f._distance !== null ? (f._distance === -1 ? 'Indisponível' : `${f._distance.toFixed(1)} km`) : "Calculando..."}</span></p>
                                </div>
                                {!isDisabled && !isService && (() => {
                                  const est = getDeliveryEstimation(f);
                                  if (!est) return null;
                                  return (
                                    <div className={`mt-2 text-[11px] font-bold inline-flex items-center gap-1 ${est.color}`}>
                                      {est.text}
                                      {est.hasLightning && <Zap className="h-3 w-3 fill-green-600 text-green-600" />}
                                    </div>
                                  );
                                })()}
                              </button>
                            );
                          });
                        })() : (
                          <div className="text-center p-4 bg-slate-50 rounded-lg border border-slate-200 text-sm text-muted-foreground">
                            Nenhuma farmácia com disponibilidade encontrada para o CEP informado.
                          </div>
                        )}
                      </div>
                  </div>
                </>
              )}
            </div>

            {maxStock > 0 ? (
                <Button 
                  size="lg" 
                  className="w-full h-12 text-base font-bold shadow-sm mt-6" 
                  onClick={() => {
                    const effectiveFreight = selectedFreight === "pickup" ? "pickup" : "pickup"; // Force pickup selection internally when choosing a pharmacy
                    if (availablePharmacies.length > 0) {
                      const selectedPharm = availablePharmacies.find(f => f.id === selectedPharmacyId);
                      if (!selectedPharmacyId || (selectedPharm && selectedPharm._calculatedStock < qty)) {
                        const firstAvailable = availablePharmacies.find(f => f._calculatedStock >= qty);
                        if (firstAvailable) {
                          setSelectedPharmacyId(firstAvailable.id);
                        }
                      }
                    }
                    setSelectedFreight(effectiveFreight);

                    if (freteCalculado && effectiveFreight !== "pickup" && cep && !isService) {
                      setConfirmDeliveryOpen(true);
                    } else {
                      add({ ...p, estoque: maxStock }, qty);
                    }
                  }}
                >
                  {isService ? "AGENDAR AGORA" : (
                    <span className="flex items-center justify-center gap-2">
                      <ShoppingBasket className="h-5 w-5" /> COMPRAR AGORA
                    </span>
                  )}
                </Button>
              ) : (
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
                  <li className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Compre na maior rede associativa do pais</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <Store className="h-5 w-5 text-green-600 shrink-0" />
                    <span>Retire na loja mais próxima hoje mesmo</span>
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
                  <strong className="block text-xs text-muted-foreground">Fabricante</strong>
                  <div className="font-medium">{p.fabricante}</div>
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
                          ? p.principiosAtivos.join(', ')
                          : (p.nome || '').split(/[0-9]/)[0].replace(/COM|GOTAS|XAROPE|GENÉRICO|-/gi, '').trim() || 'Não informado'}
                      </div>
                    </div>
                    <div>
                      <strong className="block text-xs text-muted-foreground">Dosagem</strong>
                      <div className="font-medium">
                        {(p.nome || '').match(/\d+(?:,\d+)?\s*(?:MG\/ML|MG\/G|MG|G|ML|MCG|UI\/G|UI|UI\/ML|U)\b/gi)?.join(', ') || 'Não informada'}
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
              
              {isMedication && (
                <div className="mt-6 p-3 bg-red-50 text-red-800 rounded-lg text-xs font-bold text-center border border-red-100">
                  "AO PERSISTIREM OS SINTOMAS, O MÉDICO DEVERÁ SER CONSULTADO."
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
          <h2 className="text-2xl font-bold mb-6">Compre Junto</h2>
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
Valor: R$ ${(p.precoPromocional && isCampanhaAtiva(p.campanha) ? p.precoPromocional : p.preco).toFixed(2).replace('.', ',')}
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
            <Button onClick={handleWaitlistSubmit} disabled={!wlAccepted}>Avisar-me</Button>
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
