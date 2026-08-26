import { getBrandNameForHead } from "@/utils/brand";
// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { useCart, useGeoCep, getEffectivePrice } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts } from "@/stores/products";
import { useMarketing } from "@/stores/marketing";
import { useOrders, generateOrderNumber, type Pedido } from "@/stores/orders";
import { isPbmEligible } from "@/lib/pbm";
import { getDeterministicStock } from "@/lib/stock";
import { getLevePaguePromotion } from "@/lib/utils";
import { catalog } from "@/services/catalog";
import { getStoreStatus } from "@/lib/storeHours";
import { brl, productImage, tarjaColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Flame, Store, Truck, X, MapPin, AlertTriangle, Bike, Bell,
  MessageCircle, Send, CheckCircle2, Tag, Sparkles, DollarSign, CreditCard, ShoppingBag,
  Building2, Clock, Edit2
} from "lucide-react";
import { toast } from "sonner";
import { rateLimiter, checkRateLimitOrThrow, RATE_LIMIT_PRESETS } from "@/lib/rateLimit";
import { sanitizeText, validatePhone, validateCPF, validateEmail, sanitizeCouponCode } from "@/lib/security";
import type { Produto } from "@/types";
import { getCityFromCep, isCampanhaAtiva, getCepCoordinates, normalizeString } from "@/lib/utils";
import { getRoadDistanceKm } from "@/lib/distanceApis";

function getDynamicETA(inicio: string, fim: string, diasAbertos: number[], tempoMinutos: string, mode: "Entrega" | "Retirada") {
  const fallback = mode === "Entrega" ? (tempoMinutos ? `Em até ${tempoMinutos}` : "Em breve") : (tempoMinutos ? `Retirada em até ${tempoMinutos}` : "Retirada a partir de 30 minutos");
  if (!inicio || !fim || !diasAbertos || diasAbertos.length === 0) {
    return fallback;
  }

  try {
    const now = new Date();
    const currentDay = now.getDay();
    const currentHour = now.getHours();
    const currentMin = now.getMinutes();
    const currentTime = currentHour * 60 + currentMin;

    const [inicioH, inicioM] = inicio.split(":").map(Number);
    const [fimH, fimM] = fim.split(":").map(Number);
    const inicioTime = inicioH * 60 + (inicioM || 0);
    const fimTime = fimH * 60 + (fimM || 0);

    const isTodayOpen = diasAbertos.includes(currentDay);
    
    if (isTodayOpen && currentTime >= inicioTime && currentTime <= fimTime) {
      const baseTempo = tempoMinutos ? `em até ${tempoMinutos}` : "em breve";
      return mode === "Entrega" ? `Chegará hoje ${baseTempo}` : `Retire hoje ${baseTempo}`;
    }

    let nextDay = currentDay;
    let daysToAdd = 0;
    
    if (isTodayOpen && currentTime < inicioTime) {
      return mode === "Entrega" ? `Chegará hoje a partir das ${inicio}` : `Retire hoje a partir das ${inicio}`;
    }

    for (let i = 1; i <= 7; i++) {
      const checkDay = (currentDay + i) % 7;
      if (diasAbertos.includes(checkDay)) {
        daysToAdd = i;
        nextDay = checkDay;
        break;
      }
    }

    if (daysToAdd === 0) return fallback;

    if (daysToAdd === 1) {
      return mode === "Entrega" ? `Chegará amanhã a partir das ${inicio}` : `Retire amanhã a partir das ${inicio}`;
    }

    const futureDate = new Date(now.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
    const formattedDate = `${futureDate.getDate().toString().padStart(2, '0')}/${(futureDate.getMonth()+1).toString().padStart(2, '0')}`;
    
    return mode === "Entrega" ? `Chegará dia ${formattedDate} a partir das ${inicio}` : `Retire dia ${formattedDate} a partir das ${inicio}`;
  } catch (err) {
    return fallback;
  }
}

export const Route = createFileRoute("/_store/$storeSlug/cart")({
  validateSearch: (search: Record<string, unknown>): { shared?: string } => {
    return {
      shared: search.shared as string | undefined,
    }
  },
  head: () => ({ meta: [{ title: `Carrinho — ${getBrandNameForHead()}` }] }),
  component: CartPage,
});


type FreightOption = { id: string; label: string; price: number; eta: string; icon: typeof Truck };

const formatCpfCnpj = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 14) v = v.slice(0, 14);
  if (v.length <= 11) {
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  } else {
    v = v.replace(/^(\d{2})(\d)/, "$1.$2");
    v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
    v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
    v = v.replace(/(\d{4})(\d)/, "$1-$2");
  }
  return v;
};

const formatPhone = (value: string) => {
  if (!value) return "";
  let v = value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
};

function CartPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const isShared = search.shared === "true";
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const items = useCart((s) => s.items);
  const hasService = items.some(item => item.categoriaId === "200" || (item.subcategoriaId && String(item.subcategoriaId).startsWith("20")));
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const add = useCart((s) => s.add);
  const clear = useCart((s) => s.clear);
  const cartNotifications = useCart(s => s.notifications);
  const clearCartNotifications = useCart(s => s.clearNotifications);
  const subtotal = useCart((s) => s.subtotal());
  const storeDiscount = useCart((s) => s.storeDiscount());
  const pbmDisc = useCart((s) => s.pbmDiscount());
  const couponDisc = useCart((s) => s.couponDiscount());
  const appliedCoupon = useCart((s) => s.appliedCoupon);
  const applyCoupon = useCart((s) => s.applyCoupon);
  const removeCoupon = useCart((s) => s.removeCoupon);
  const pbm = useCart((s) => s.pbm);
  const total = useCart((s) => s.total());
  const user = useAuth((s) => s.user);
  const fornecedores = useAdminProducts((s) => s.fornecedores);

  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const setSelectedPharmacyId = useCart((s) => s.setSelectedPharmacyId);
  const [pharmacyDialogOpen, setPharmacyDialogOpen] = useState(false);
  const promocoes = useMarketing((s) => s.promocoes);
  
  const allPharmacies = useAdmin((s) => s.pharmacies);
  const selectedPharmacy = allPharmacies.find(p => p.id === selectedPharmacyId);

  const storeStatus = useMemo(() => {
    if (!selectedPharmacy) return null;
    return getStoreStatus(selectedPharmacy.horariosPorDia, selectedPharmacy.datasEspeciais);
  }, [selectedPharmacy]);

  const geoCep = useGeoCep((s) => s.cep);
  const geoLat = useGeoCep((s) => s.lat);
  const geoLng = useGeoCep((s) => s.lng);
  const globalCity = useGeoCep((s) => s.city);
  const rawCity = globalCity || getCityFromCep(geoCep, allPharmacies);
  const normalize = (s: string) => s ? s.normalize('NFD').replace(/[\u0300-\u036f]/g, "").toLowerCase() : "";
  const currentCity = normalize(rawCity);
  const availablePharmacies = useMemo(() => {
    return allPharmacies;
  }, [allPharmacies]);

  const [cep, setCep] = useState("");
  const [isCalcLoading, setIsCalcLoading] = useState(false);
  const [freight, setFreight] = useState<FreightOption[] | null>(null);
  const selected = useCart((s) => s.selectedFreight);
  const setSelected = useCart((s) => s.setSelectedFreight);
  const setFreightOptions = useCart((s) => s.setFreightOptions);
  const [confirmDeliveryOpen, setConfirmDeliveryOpen] = useState(false);
  const [addressStr, setAddressStr] = useState<string>("");
  const [noPharmacyAlertOpen, setNoPharmacyAlertOpen] = useState(false);
  const [noFreightAlertOpen, setNoFreightAlertOpen] = useState(false);
  const [crossSell, setCrossSell] = useState<Produto[]>([]);
  const [pharmDistances, setPharmDistances] = useState<Record<string, number | null>>({});

  // WhatsApp Order State
  const [whatsAppModalOpen, setWhatsAppModalOpen] = useState(false);
  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [couponFeedback, setCouponFeedback] = useState<string | null>(null);

  // Form details
  const [clientName, setClientName] = useState(user?.name || "");
  const [clientPhone, setClientPhone] = useState(formatPhone((user as any)?.telefone || (user as any)?.celular || (user as any)?.phone || ""));
  const [clientCpf, setClientCpf] = useState(formatCpfCnpj((user as any)?.cpf || (user as any)?.cnpj || ""));
  const [clientEmail, setClientEmail] = useState(user?.email || "");
  const [deliveryMethod, setDeliveryMethod] = useState<"entrega" | "retirada">("retirada");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNumber, setDeliveryNumber] = useState("");
  const [deliveryComplement, setDeliveryComplement] = useState("");
  const [deliveryBairro, setDeliveryBairro] = useState("");
  const [deliveryCity, setDeliveryCity] = useState(selectedPharmacy?.cidade || "");
  const [deliveryCep, setDeliveryCep] = useState(geoCep || "");
  const [paymentMethod, setPaymentMethod] = useState<"pix" | "cartao_credito" | "cartao_debito" | "dinheiro">("pix");
  const [trocoPara, setTrocoPara] = useState("");
  const [orderNotes, setOrderNotes] = useState("");
  const [isEditingAddress, setIsEditingAddress] = useState(false);

  // Auto-fill and calculate freight if geoCep is present
  useEffect(() => {
    if (geoCep && !cep) {
      setCep(geoCep);
    }
  }, [geoCep, cep]);

  // Sync user profile to form
  useEffect(() => {
    if (user) {
      setClientName(user.name || "");
      setClientEmail(user.email || "");
      setClientPhone(formatPhone((user as any)?.telefone || (user as any)?.celular || (user as any)?.phone || ""));
      setClientCpf(formatCpfCnpj((user as any)?.cpf || (user as any)?.cnpj || ""));
      
      const addr = user.enderecos?.[0];
      if (addr && !deliveryAddress && !deliveryNumber) {
        setDeliveryAddress(addr.logradouro || "");
        setDeliveryNumber(addr.numero || "");
        setDeliveryComplement(addr.complemento || "");
        setDeliveryBairro(addr.bairro || "");
        setDeliveryCity(addr.cidade || "");
        
        const cleanCep = (addr.cep || "").replace(/\D/g, "");
        if (cleanCep.length === 8 && !cep) {
          setCep(cleanCep);
        }
        
        if (addr.logradouro && addr.numero && addr.bairro && addr.cidade) {
          setAddressStr(`${addr.logradouro}, ${addr.numero} ${addr.complemento ? ' - ' + addr.complemento : ''} - ${addr.bairro} - ${addr.cidade}/${addr.estado || 'BR'}`);
        }
      }
    }
  }, [user]);

  const lastCalcCep = useRef("");
  const [isLocating, setIsLocating] = useState(false);

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não é suportada neste navegador.");
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        useGeoCep.getState().setCoordinates(lat, lng);
        
        try {
          // Busca o CEP via reverse geocoding do Nominatim
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          const foundCep = data?.address?.postcode;
          if (foundCep) {
            const cleanCep = foundCep.replace(/\D/g, "");
            await useGeoCep.getState().setCep(cleanCep);
            setCep(cleanCep);
            toast.success("Localização obtida com sucesso!");
          } else {
            toast.error("Não foi possível determinar o CEP a partir da sua localização.");
          }
        } catch (e) {
          toast.error("Erro ao buscar endereço da localização.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        if (error.code === error.PERMISSION_DENIED) {
          toast.error("Acesso à localização negado. Digite o CEP manualmente.");
        } else {
          toast.error("Erro ao obter localização.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Force open pharmacy dialog if shared link and no pharmacy selected
  useEffect(() => {
    if (mounted && isShared && !selectedPharmacyId && items.length > 0) {
      setPharmacyDialogOpen(true);
    }
  }, [mounted, isShared, selectedPharmacyId, items.length]);

  // Calcula distâncias reais das farmácias via AwesomeAPI quando o CEP mudar
  // NOTE: pharmDistances is intentionally NOT in deps to avoid infinite re-render loops.
  // We use a callback form of setPharmDistances to read current state safely.
  useEffect(() => {
    const activeCep = geoCep || cep;
    if (!activeCep) return;
    const userCepClean = activeCep.replace(/\D/g, "");
    if (userCepClean.length !== 8) return;

    let isSubscribed = true;

    setPharmDistances(currentDistances => {
      const pharmaciesNeedingGeo = availablePharmacies.filter(p => 
        !(geoLat && geoLng && p.lat && p.lng) && currentDistances[p.id] === undefined
      );
      if (pharmaciesNeedingGeo.length === 0) return currentDistances;

      // Fire-and-forget async work
      (async () => {
        const userCoords = (geoLat && geoLng)
          ? { lat: geoLat, lng: geoLng }
          : await getCepCoordinates(userCepClean);

        if (!userCoords) {
          if (isSubscribed) {
            const updates: Record<string, number | null> = {};
            pharmaciesNeedingGeo.forEach(p => { updates[p.id] = null; });
            setPharmDistances(prev => ({ ...prev, ...updates }));
          }
          return;
        }

        const updates: Record<string, number | null> = {};
        await Promise.all(
          pharmaciesNeedingGeo.map(async (p) => {
            const pharmCoords = (p.lat && p.lng)
              ? { lat: p.lat, lng: p.lng }
              : await getCepCoordinates(p.cep);
            if (pharmCoords) {
              updates[p.id] = await getRoadDistanceKm(userCoords.lat, userCoords.lng, pharmCoords.lat, pharmCoords.lng);
            } else {
              updates[p.id] = -1;
            }
          })
        );
        if (isSubscribed && Object.keys(updates).length > 0) {
          setPharmDistances(prev => ({ ...prev, ...updates }));
        }
      })();

      return currentDistances; // Return unchanged for now; async updates come later
    });
    
    return () => {
      isSubscribed = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [geoCep, cep, geoLat, geoLng, availablePharmacies]);

  const calcFreight = async () => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length < 8) return;

    setIsCalcLoading(true);
    // Update global geoCep so availablePharmacies updates
    await useGeoCep.getState().setCep(cep);

    // ---- Buscar dados do CEP do cliente ----
    let customerUf = "";
    let customerCity = "";
    let clientLat: number | null = null;
    let clientLng: number | null = null;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        customerUf = data.uf || "";
        customerCity = data.localidade || "";
        setAddressStr(`${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`);
        setDeliveryAddress(data.logradouro || "");
        setDeliveryBairro(data.bairro || "");
        setDeliveryCity(data.localidade || "");
      } else {
        setAddressStr(cep);
      }
    } catch {
      setAddressStr(cep);
    }

    // ---- Buscar coordenadas do cliente ----
    if (geoLat && geoLng) {
      clientLat = geoLat;
      clientLng = geoLng;
    } else {
      try {
        const coords = await getCepCoordinates(clean);
        if (coords) {
          clientLat = coords.lat;
          clientLng = coords.lng;
        }
      } catch {
        // coords indisponíveis — usará fallback por cidade/UF
      }
    }

    setIsCalcLoading(false);
    if (!selectedPharmacy) return;

    const p = allPharmacies.find(p => p.id === selectedPharmacyId);
    if (!p) return;

    const forcePickup = items.some(i => i.retemReceita || i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20")));
  
    const opts: FreightOption[] = [];
    
    if (p.aceitaRetirada) {
      opts.push({ id: "pickup", label: items.some(i => i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20"))) ? "Presencial na farmácia" : "Retirar grátis na loja", price: 0, eta: getDynamicETA(p.horarioInicioRetirada || "08:00", p.horarioFimRetirada || "18:00", p.diasFuncionamento || [1,2,3,4,5,6], p.tempoRetirada || "30 minutos", "Retirada"), icon: Store });
    }

    if (!forcePickup && p.aceitaEntrega) {
      // ---- Calcular distância entre cliente e loja ----
      let distance: number | null = null;

      let pLat = p.lat;
      let pLng = p.lng;
      if (!pLat || !pLng) {
        if (p.cep) {
          try {
            const pCoords = await getCepCoordinates(p.cep);
            if (pCoords) {
              pLat = pCoords.lat;
              pLng = pCoords.lng;
            }
          } catch { /* sem coordenadas */ }
        }
      }

      if (clientLat && clientLng && pLat && pLng) {
        distance = await getRoadDistanceKm(clientLat, clientLng, pLat, pLng);
      }

      // ---- Regra: não envia para outro estado ----
      if (customerUf && p.uf && customerUf.toUpperCase() !== p.uf.toUpperCase()) {
        // Estados diferentes, não oferece entrega
        setFreight(opts.length > 0 ? opts : []);
        setFreightOptions(opts.map(o => ({ id: o.id, label: o.label, price: o.price, eta: o.eta })));
        if (opts.length === 0 && !forcePickup) {
          setIsCalcLoading(false);
          return;
        }
        setIsCalcLoading(false);
        return;
      }

      const totalPrice = items.reduce((acc, item) => {
        const anyItem = item as any;
        const isCampanha = isCampanhaAtiva(anyItem);
        const itemPrice = isCampanha ? (anyItem.precoCampanha || anyItem.preco) : (anyItem.precosPorLoja?.[p.id]?.precoPor || anyItem.preco);
        return acc + (itemPrice * item.qty);
      }, 0);

      if (p.meiosEntregaPersonalizados && p.meiosEntregaPersonalizados.length > 0) {
        p.meiosEntregaPersonalizados.filter(m => m.ativo).forEach(m => {
          let deliveryPrice = null;
          
          const currentFaixasValorPedido = m.faixasValorPedido && m.faixasValorPedido.length > 0 ? m.faixasValorPedido : p.faixasValorPedido;
          if (currentFaixasValorPedido && currentFaixasValorPedido.length > 0) {
            const matchingFaixa = [...currentFaixasValorPedido].sort((a,b) => b.valorMin - a.valorMin).find(f => totalPrice >= f.valorMin);
            if (matchingFaixa) deliveryPrice = matchingFaixa.taxa;
          }

          if (deliveryPrice === null) {
            if (distance !== null && distance >= 0) {
               const sortedRaios = [...m.raios].sort((a,b) => a.ateKm - b.ateKm);
               const matchingRaio = sortedRaios.find(r => distance! <= r.ateKm);
               if (matchingRaio) deliveryPrice = matchingRaio.preco;
            } else if (customerUf && p.uf && customerUf.toUpperCase() === p.uf.toUpperCase()) {
               // Fallback: mesmo estado (caso a API de CEP falhe)
               const sortedRaios = [...m.raios].sort((a,b) => a.ateKm - b.ateKm);
               if (sortedRaios.length > 0) deliveryPrice = sortedRaios[0].preco;
            }
          }

          if (deliveryPrice !== null) {
            opts.push({
               id: m.id,
               label: m.nome,
               price: deliveryPrice,
               eta: getDynamicETA(p.horarioInicioEntrega || "08:00", p.horarioFimEntrega || "18:00", p.diasFuncionamento || [1,2,3,4,5,6], m.tempoEntrega || "60 minutos", "Entrega"),
               icon: Truck
            });
          }
        });
      } else {
        let deliveryPrice: number | null = null;
        let isEligible = false;

        // 1. Faixas de valor (Desconto/Frete Grátis por valor do pedido)
        if (p.faixasValorPedido && p.faixasValorPedido.length > 0) {
          const matchingFaixa = [...p.faixasValorPedido].sort((a,b) => b.valorMin - a.valorMin).find(f => totalPrice >= f.valorMin);
          if (matchingFaixa) {
            deliveryPrice = matchingFaixa.taxa;
            isEligible = true;
          }
        }

        // 2. Se não pegou promoção por valor, calcular pelo modeloFrete
        if (!isEligible) {
          const fallbackModelo = (p.raiosEntrega && p.raiosEntrega.length > 0) ? "raio" : "fixo";
          const currentModelo = p.modeloFrete || fallbackModelo;

          if (currentModelo === "fixo") {
             const maxKm = Number(p.raioEntregaKm) || 30;
             if (distance !== null && distance >= 0) {
                if (distance <= maxKm) {
                   deliveryPrice = Number(p.custoEntrega) || 0;
                   isEligible = true;
                }
             } else {
                // Fallback: mesmo estado, não conseguiu calcular distância
                if (customerUf && p.uf && customerUf.toUpperCase() === p.uf.toUpperCase()) {
                   deliveryPrice = Number(p.custoEntrega) || 0;
                   isEligible = true;
                }
             }
          } 
          else if (currentModelo === "raio") {
             if (distance !== null && distance >= 0) {
                const raioBase = Number(p.raioEntregaKm) || 0;
                if (raioBase > 0 && distance <= raioBase) {
                   deliveryPrice = Number(p.custoEntrega) || 0;
                   isEligible = true;
                } else if (p.raiosEntrega && p.raiosEntrega.length > 0) {
                   const sortedRaios = [...p.raiosEntrega].sort((a, b) => a.ateKm - b.ateKm);
                   const matchingRaio = sortedRaios.find(r => distance! <= r.ateKm);
                   if (matchingRaio) {
                     deliveryPrice = matchingRaio.preco;
                     isEligible = true;
                   }
                }
             } else {
                // Fallback: mesmo estado (caso a API de CEP falhe)
                if (customerUf && p.uf && customerUf.toUpperCase() === p.uf.toUpperCase()) {
                   deliveryPrice = Number(p.custoEntrega) || 0;
                   isEligible = true;
                }
             }
          } 
          else if (currentModelo === "cep") {
             if (p.faixasCep && p.faixasCep.length > 0) {
                const cleanCepInt = parseInt(clean, 10);
                const matchingFaixa = p.faixasCep.find(f => {
                   const start = parseInt(f.cepInicio.replace(/\D/g, ""), 10);
                   const end = parseInt(f.cepFim.replace(/\D/g, ""), 10);
                   return cleanCepInt >= start && cleanCepInt <= end;
                });
                if (matchingFaixa) {
                   deliveryPrice = Number(matchingFaixa.taxa) || 0;
                   isEligible = true;
                }
             }
          }
        }

        if (isEligible && deliveryPrice !== null) {
          opts.push(
            { id: "standard", label: "Entrega Padrão", price: deliveryPrice, eta: getDynamicETA(p.horarioInicioEntrega || "08:00", p.horarioFimEntrega || "18:00", p.diasFuncionamento || [1,2,3,4,5,6], p.tempoEntrega || "3 horas", "Entrega"), icon: Bike }
          );
        }

        if (p.aceitaUber && p.custoUber) {
          opts.push({ id: "uber", label: "Uber Flash", price: Number(p.custoUber), eta: "Em até 1 hora", icon: Truck });
        }
        if (p.aceita99 && p.custo99) {
          opts.push({ id: "99", label: "99 Entregas", price: Number(p.custo99), eta: "Em até 1 hora", icon: Truck });
        }
        if (p.aceitaMotoboy && p.custoMotoboy) {
          opts.push({ id: "motoboy", label: "Motoboy Expresso", price: Number(p.custoMotoboy), eta: "Em até 2 horas", icon: Bike });
        }
      }
    }

    if (opts.length > 0) {
      const firstDelivery = opts.find(o => o.id !== "pickup");
      if (!opts.find(o => o.id === selected)) {
        if (forcePickup) setSelected("pickup");
        else setSelected(firstDelivery ? firstDelivery.id : opts[0].id);
      }
    } else if (opts.length === 0) {
      if (forcePickup) {
         setSelected("pickup");
      }
    }
    
    setFreight(opts);
    // Persist to store without non-serializable icons
    setFreightOptions(opts.map(o => ({ id: o.id, label: o.label, price: o.price, eta: o.eta })));
  };

  useEffect(() => {
    if (items.length > 0) {
      catalog.crossSell(items.map((i) => i.id), 4, items[0]?.categoriaId).then(setCrossSell);
    } else {
      setCrossSell([]);
    }
  }, [items]);

  useEffect(() => {
    if (selectedPharmacyId && cep.replace(/\D/g, "").length >= 8) {
      calcFreight();
    } else {
      setFreight(null);
    }
  }, [selectedPharmacyId, cep]);

  const selectedFreight = freight?.find((f) => f.id === selected);
  const isDelivery = selected !== "pickup";
  const freightPrice = isDelivery ? (selectedFreight?.price ?? 0) : 0;
  const grandTotal = total + freightPrice;

  const closestPharmacyId = useMemo(() => {
    if (availablePharmacies.length === 0) return null;
    let closestId = availablePharmacies[0].id;
    let minDistance = Infinity;

    for (const p of availablePharmacies) {
      const distance = pharmDistances[p.id] ?? null;
      if (distance !== null && distance < minDistance) {
        minDistance = distance;
        closestId = p.id;
      }
    }
    return closestId;
  }, [availablePharmacies, geoLat, geoLng, pharmDistances]);

  const handleApplyCoupon = () => {
    try {
      checkRateLimitOrThrow("apply_coupon", RATE_LIMIT_PRESETS.COUPON_APPLY);
      const sanitized = sanitizeCouponCode(couponInput);
      if (!sanitized) {
        setCouponFeedback("Digite um código de cupom válido.");
        return;
      }
      const res = applyCoupon(sanitized);
      setCouponFeedback(res.message);
      if (res.success) {
        setCouponInput("");
      }
    } catch (err: any) {
      setCouponFeedback(err.message || "Erro ao aplicar cupom.");
    }
  };

  const goToCheckout = () => {
    if (!selectedPharmacy) {
      setNoPharmacyAlertOpen(true);
      return;
    }
    
    const forcePickup = items.some(i => i.retemReceita || i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20")));

    if (!forcePickup && !selected) {
      setNoFreightAlertOpen(true);
      return;
    }

    if (forcePickup && selected !== "pickup") {
      setSelected("pickup");
      setDeliveryMethod("retirada");
    } else if (selected === "pickup") {
      setDeliveryMethod("retirada");
    } else {
      setDeliveryMethod("entrega");
    }

    if (selected !== "pickup" && cep && !forcePickup) {
      setConfirmDeliveryOpen(true);
      return;
    }

    setWhatsAppModalOpen(true);
  };

  const handleConfirmWhatsAppOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPharmacy) return;

    try {
      setIsSubmittingOrder(true);
      checkRateLimitOrThrow("whatsapp_order_submit", RATE_LIMIT_PRESETS.ORDER_SUBMIT);

      // Validação de Entrada Estrita (Security & Anti-XSS)
      const cleanName = sanitizeText(clientName, 100);
      if (!cleanName || cleanName.length < 3) {
        toast.error("Por favor, digite seu nome completo (mínimo 3 caracteres).");
        setIsSubmittingOrder(false);
        return;
      }

      const cleanPhone = clientPhone.replace(/\D/g, "");
      if (!validatePhone(cleanPhone)) {
        toast.error("Por favor, digite um número de WhatsApp válido com DDD.");
        setIsSubmittingOrder(false);
        return;
      }

      if (clientCpf && !validateCPF(clientCpf)) {
        toast.error("CPF informado é inválido. Por favor, verifique.");
        setIsSubmittingOrder(false);
        return;
      }

      if (clientEmail && !validateEmail(clientEmail)) {
        toast.error("E-mail informado é inválido. Por favor, verifique.");
        setIsSubmittingOrder(false);
        return;
      }

      if (deliveryMethod === "entrega") {
        if (!deliveryAddress.trim() || !deliveryNumber.trim() || !deliveryBairro.trim()) {
          toast.error("Preencha o endereço completo (Rua, Número e Bairro) para a entrega.");
          setIsSubmittingOrder(false);
          return;
        }
      }

      // Sanitização de campos
      const cleanAddress = sanitizeText(deliveryAddress, 150);
      const cleanNumber = sanitizeText(deliveryNumber, 20);
      const cleanComplement = sanitizeText(deliveryComplement, 60);
      const cleanBairro = sanitizeText(deliveryBairro, 80);
      const cleanNotes = sanitizeText(orderNotes, 300);

      // Gerar ID seguro de pedido
      const orderId = generateOrderNumber();
      const nowIso = new Date().toISOString();
      const dateFormatted = new Date().toLocaleString("pt-BR");

      // Mapeamento de forma de pagamento amigável
      const paymentLabels: Record<string, string> = {
        pix: "PIX",
        cartao_credito: "Cartão de Crédito (na entrega/retirada)",
        cartao_debito: "Cartão de Débito (na entrega/retirada)",
        dinheiro: "Dinheiro em espécie",
      };
      const paymentLabel = paymentLabels[paymentMethod] || paymentMethod;

      // Criação do Pedido no estado global
      const newOrder: Pedido = {
        id: orderId,
        data: nowIso,
        lojaId: selectedPharmacy.id,
        lojaNome: selectedPharmacy.nome,
        cliente: {
          nome: cleanName,
          telefone: cleanPhone,
          email: clientEmail ? sanitizeText(clientEmail, 100) : undefined,
          cpf: clientCpf ? clientCpf.replace(/\D/g, "") : undefined,
          endereco: deliveryMethod === "entrega" ? {
            rua: cleanAddress,
            numero: cleanNumber,
            complemento: cleanComplement,
            bairro: cleanBairro,
            cidade: deliveryCity || selectedPharmacy.cidade,
            cep: deliveryCep || cep,
          } : undefined,
        },
        envio: {
          metodo: deliveryMethod === "entrega" ? "entrega" : "retirada",
          prazo: selectedFreight?.eta || (deliveryMethod === "entrega" ? "Em até 3 horas" : "A partir de 30 minutos"),
          endereco: deliveryMethod === "entrega" ? cleanAddress : selectedPharmacy.endereco,
          numero: deliveryMethod === "entrega" ? cleanNumber : "",
          bairro: deliveryMethod === "entrega" ? cleanBairro : selectedPharmacy.bairro,
          cidade: deliveryCity || selectedPharmacy.cidade,
          cep: deliveryCep || cep,
        },
        produtos: items.map((item) => {
          const ep = getEffectivePrice(item, selectedPharmacy.id);
          return {
            id: item.id,
            nome: item.nome,
            preco: ep.precoPor,
            precoRegular: ep.precoDe || ep.precoPor,
            valorUnitario: ep.precoPor,
            quantidade: item.qty,
            qtd: item.qty,
            ean: item.ean,
            foto: item.possuiImagem ? productImage(item.id) : undefined,
            imagem: item.possuiImagem ? productImage(item.id) : undefined,
          };
        }),
        itens: items.map((item) => {
          const ep = getEffectivePrice(item, selectedPharmacy.id);
          return {
            id: item.id,
            nome: item.nome,
            preco: ep.precoPor,
            precoRegular: ep.precoDe || ep.precoPor,
            valorUnitario: ep.precoPor,
            quantidade: item.qty,
            qtd: item.qty,
            ean: item.ean,
            foto: item.possuiImagem ? productImage(item.id) : undefined,
            imagem: item.possuiImagem ? productImage(item.id) : undefined,
          };
        }),
        valores: {
          subtotal,
          produtos: subtotal,
          desconto: storeDiscount + pbmDisc + couponDisc,
          descontos: storeDiscount + pbmDisc + couponDisc,
          frete: deliveryMethod === "entrega" ? freightPrice : 0,
          total: grandTotal,
        },
        pagamento: {
          metodo: paymentMethod,
          trocoPara: paymentMethod === "dinheiro" && trocoPara ? sanitizeText(trocoPara, 30) : undefined,
        },
        status: "Pendente",
        modalidade: deliveryMethod === "entrega" ? "Entrega" : "Retirada",
        origem: "whatsapp",
        cupomAplicado: appliedCoupon || undefined,
        observacoes: cleanNotes || undefined,
        historico: [
          {
            data: nowIso,
            situacao: "Pedido Realizado via WhatsApp",
            autor: "Cliente",
          }
        ],
      };

      // Adiciona pedido
      await useOrders.getState().addOrder(newOrder);
      
      // Salva o pedido localmente para mostrar na página de sucesso imediatamente
      useCart.getState().setLastOrder(newOrder);

      // Monta mensagem amigável para o WhatsApp
      const itemsListText = items.map((i) => {
        const ep = getEffectivePrice(i, selectedPharmacy.id);
        return `• ${i.qty}x *${i.nome}* — R$ ${(ep.precoPor * i.qty).toFixed(2)}`;
      }).join("\n");

      const deliveryInfoText = deliveryMethod === "entrega"
        ? `\u{1F6F5} *ENTREGA EM DOMICÍLIO:*\n${cleanAddress}, Nº ${cleanNumber} ${cleanComplement ? `(${cleanComplement})` : ""}\nBairro: ${cleanBairro} - ${deliveryCity || selectedPharmacy.cidade}/${selectedPharmacy.uf}\nCEP: ${deliveryCep || cep}`
        : `\u{1F3EC} *RETIRADA NO BALCÃO:*\nFarmácia: ${selectedPharmacy.nome}\nEndereço: ${selectedPharmacy.endereco}, ${selectedPharmacy.bairro} - ${selectedPharmacy.cidade}`;

      const whatsappText = `\u{1F3E5} *NOVO PEDIDO - FARMÁCIAS ASSOCIADAS*\n` +
        `\u{1F3EA} *Unidade:* ${selectedPharmacy.nome} (${selectedPharmacy.cidade}/${selectedPharmacy.uf})\n` +
        `\u{1F9FE} *Pedido:* #${orderId}\n` +
        `\u{1F4C5} *Data:* ${dateFormatted}\n\n` +
        `\u{1F464} *CLIENTE:*\n• *Nome:* ${cleanName}\n• *Telefone:* ${cleanPhone}\n` +
        (clientCpf ? `• *CPF:* ${clientCpf}\n` : "") +
        `\n${deliveryInfoText}\n\n` +
        `\u{1F4B3} *FORMA DE PAGAMENTO:*\n• ${paymentLabel}` +
        (paymentMethod === "dinheiro" && trocoPara ? ` (Troco para ${trocoPara})` : "") +
        `\n\n\u{1F6CD}\u{FE0F} *ITENS DO PEDIDO:*\n${itemsListText}\n\n` +
        `---\n` +
        `\u{1F4B0} *Subtotal:* R$ ${subtotal.toFixed(2)}\n` +
        (storeDiscount > 0 ? `\u{1F3F7}\u{FE0F} *Desconto Produtos:* -R$ ${storeDiscount.toFixed(2)}\n` : "") +
        (couponDisc > 0 ? `\u{1F3AB}\u{FE0F} *Cupom (${appliedCoupon}):* -R$ ${couponDisc.toFixed(2)}\n` : "") +
        (deliveryMethod === "entrega" ? `\u{1F69A} *Taxa de Entrega:* ${freightPrice === 0 ? "Grátis" : `R$ ${freightPrice.toFixed(2)}`}\n` : "") +
        `\u{1F4B2} *TOTAL: R$ ${grandTotal.toFixed(2)}*\n` +
        (cleanNotes ? `\n\u{1F4DD} *Observações:* ${cleanNotes}\n` : "") +
        `\n\u{1F517} *Acompanhe em tempo real pelo link:*\n${window.location.origin}/pedidos?id=${orderId}`;

      // Determina telefone de destino da farmácia
      const rawStorePhone = selectedPharmacy.whatsapp || selectedPharmacy.telefone || "51999999999";
      const cleanStorePhone = rawStorePhone.replace(/\D/g, "");
      const targetPhone = cleanStorePhone.startsWith("55") ? cleanStorePhone : `55${cleanStorePhone}`;

      // Abre WhatsApp
      const waUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(whatsappText)}`;
      window.open(waUrl, "_blank");

      // Limpa carrinho
      clear();
      setWhatsAppModalOpen(false);
      toast.success("Pedido gerado com sucesso! Redirecionando...");

      // Redireciona para página de sucesso
      navigate({ to: "/sucesso", search: { id: orderId } });
    } catch (err: any) {
      toast.error(err.message || "Erro ao processar pedido.");
    } finally {
      setIsSubmittingOrder(false);
    }
  };

  if (mounted && !user) {
    return (
      <div className="container-fa py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6">
          <Store className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-3">Acesse sua conta</h2>
        <p className="text-slate-500 mb-8 max-w-sm mx-auto">Você precisa estar logado para visualizar seu carrinho e finalizar compras.</p>
        <Button onClick={() => useAuth.getState().setLoginOpen(true)} className="h-14 px-10 font-bold text-lg bg-emerald-600 hover:bg-emerald-700 text-white">
          Fazer Login ou Cadastrar
        </Button>
      </div>
    );
  }

  if (mounted && items.length === 0) {
    return (
      <div className="container-fa py-16 text-center">
        <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
        <p className="text-muted-foreground mt-2">Que tal começar pelas categorias?</p>
        <Link to="/"><Button className="mt-6">Voltar à loja</Button></Link>
      </div>
    );
  }

  return (
    <div className="container-fa py-8">
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/" className="hover:underline">Início</Link> /{" "}
        <span className="text-foreground">Carrinho</span>
      </nav>
      <h1 className="text-2xl font-bold mb-6">Meu carrinho</h1>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8">
        <div className="space-y-4">
          {cartNotifications && cartNotifications.filter(n => items.some(i => i.id === n.id)).length > 0 && items.length > 0 && (
            <div className="bg-emerald-50 text-emerald-800 text-sm p-4 rounded-xl border border-emerald-200 relative">
              <button onClick={clearCartNotifications} className="absolute top-2 right-2 p-1 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors">
                <X className="h-4 w-4" />
              </button>
              <ul className="space-y-3">
                {cartNotifications.filter(n => items.some(i => i.id === n.id)).map(n => {
                  const item = items.find(i => i.id === n.id)!;
                  return (
                    <li key={n.id} className="flex flex-col gap-1">
                      <div className="font-bold flex items-center gap-1.5">
                        <Bell className="h-4 w-4 shrink-0" />
                        <span>O produto <strong>{item.nome}</strong> ficou mais barato!</span>
                      </div>
                      <div className="text-emerald-700 pl-5.5">
                        De <span className="line-through">{brl(n.oldPrice)}</span> para <strong>{brl(n.newPrice)}</strong> na farmácia <strong>{n.storeName}</strong>.
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {storeStatus && !storeStatus.isOpen && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold">A loja está fechada no momento.</p>
                <p>{storeStatus.message}</p>
                <p className="mt-1">Você ainda pode fazer o pedido, mas o processamento só iniciará quando a loja abrir.</p>
              </div>
            </div>
          )}
          <div className="bg-card border rounded-xl p-4 flex flex-col gap-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 font-bold text-sm leading-tight flex-1">
                <div className="bg-primary/10 p-2 rounded-full shrink-0">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <span>{selectedPharmacy ? selectedPharmacy.nome : (items.some(i => i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20"))) ? "Escolha a farmácia onde deseja ser atendido" : "Escolha uma farmácia para entregar ou para você retirar")}</span>
              </div>
              <Dialog 
                open={pharmacyDialogOpen} 
                onOpenChange={(open) => {
                  if (isShared && !selectedPharmacyId && !open) return;
                  setPharmacyDialogOpen(open);
                }}
              >
                
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Selecione uma farmácia</DialogTitle>
                    {isShared && !selectedPharmacyId && (
                      <p className="text-sm text-slate-500 mt-1">
                        Para ver os preços exatos dos produtos compartilhados, você precisa selecionar uma farmácia.
                      </p>
                    )}
                  </DialogHeader>
                  <div className="flex flex-col gap-3 mt-4 max-h-[60vh] overflow-auto pr-2">
                    {!geoCep ? (
                      <div className="text-sm text-muted-foreground p-4 text-center flex flex-col items-center gap-3">
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
                          <p className="font-medium">Calculando disponibilidade e preços...</p>
                        </div>
                      ) : (
                      availablePharmacies.length === 0 ? (
                      <div className="text-sm text-muted-foreground p-4 text-center">Nenhuma farmácia encontrada para o CEP informado.</div>
                    ) : (
                      (() => {
                        let mappedPharmacies = availablePharmacies
                        .map((p, index) => {
                          const itemsAvailability = items.map(item => {
                            const stock = getDeterministicStock(item, p.id);
                            const hasExternalStock = fornecedores.length > 0;
                            return {
                              item,
                              available: stock >= item.qty || hasExternalStock,
                              stock: hasExternalStock ? (stock > 0 ? stock : 100) : stock // If external stock, simulate high stock
                            };
                          });

                          const allAvailable = itemsAvailability.every(i => i.available);
                          const someAvailable = itemsAvailability.some(i => i.available);
                          
                          let stockLevel = 0;
                          if (!someAvailable) stockLevel = 2;
                          else if (!allAvailable) stockLevel = 1;
                          
                          const totalStockQty = itemsAvailability.reduce((sum, i) => sum + i.stock, 0);

                          const missingItems = itemsAvailability.filter(i => !i.available).map(i => i.item);
                          const isServiceCart = items.some(i => i.tipoProduto === "servico" || (i.tipoProduto !== "fisico" && (i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20")))));
                          
                          const totalPrice = items.reduce((acc, item) => {
                            const anyItem = item as any;
                            const isCampanha = isCampanhaAtiva(anyItem);
                            const itemPrice = isCampanha ? (anyItem.precoCampanha || anyItem.preco) : (anyItem.precosPorLoja?.[p.id]?.precoPor || anyItem.preco);
                            return acc + (itemPrice * item.qty);
                          }, 0);

                          let distance: number | null = pharmDistances[p.id] ?? null;
                            
                          const _isSameCity = geoCep ? (p.cidade && normalize(p.cidade).includes(currentCity)) || (p.endereco && normalize(p.endereco).includes(currentCity)) : true;
                          
                          const sla = (p as any).sla || (parseInt(p.id.replace(/\D/g, '') || '0') % 30) + 15;

                          return { p, originalIndex: index, stockLevel, totalStockQty, missingItems, isServiceCart, totalPrice, distance, sla, _isSameCity };
                        })
                        .sort((a, b) => {
                          // Rule 0: Se não tem estoque, fica por último
                          if (a.stockLevel !== b.stockLevel) return a.stockLevel - b.stockLevel;
                          
                          // 1. Distância (null = distância desconhecida, fica no final)
                          if (a.distance !== b.distance) {
                            if (a.distance === null && b.distance === null) return 0;
                            if (a.distance === null) return 1;
                            if (b.distance === null) return -1;
                            return a.distance - b.distance;
                          }
                          
                          // 2. Desempate por Preço
                          if (a.totalPrice !== b.totalPrice) return a.totalPrice - b.totalPrice;
                          
                          // 3. Desempate por Estoque
                          if (a.totalStockQty !== b.totalStockQty) return b.totalStockQty - a.totalStockQty;

                          return a.originalIndex - b.originalIndex;
                        });

                        const sameCityPharmaciesWithStock = mappedPharmacies.filter(p => p._isSameCity && p.stockLevel === 0);
                        if (sameCityPharmaciesWithStock.length > 0) {
                          mappedPharmacies = mappedPharmacies.filter(p => p._isSameCity);
                        }

                        // Rule: Limit delivery to 20km maximum.
                        mappedPharmacies = mappedPharmacies.filter(p => p.distance === null || p.distance <= 20);

                        const validCarts = mappedPharmacies.filter(p => p.stockLevel === 0);
                        const lowestPrice = validCarts.length > 0 ? Math.min(...validCarts.map(p => p.totalPrice)) : 0;
                        const hasDifferentPrices = validCarts.some(p => p.totalPrice > lowestPrice);

                        return mappedPharmacies.map(({ p, originalIndex, stockLevel, missingItems, isServiceCart, totalPrice, distance }, index) => {
                          const isDisabled = stockLevel === 2;
                          const isMelhorPreco = stockLevel === 0 && hasDifferentPrices && totalPrice === lowestPrice;
                          const isMaisProxima = index === 0 && stockLevel !== 2;
                          
                          const partialCount = items.length - missingItems.length;
                          const partialWord = partialCount === 1 ? 'item' : 'itens';

                          return (
                            <div 
                              key={p.id} 
                            className={`border rounded-lg p-3 transition-colors ${
                              isDisabled 
                                ? 'opacity-50 grayscale cursor-not-allowed bg-slate-50'
                                : `cursor-pointer ${
                                    selectedPharmacyId === p.id 
                                      ? 'border-primary bg-primary/5 ring-1 ring-primary' 
                                      : stockLevel === 1 
                                        ? 'border-orange-300 bg-orange-50 hover:border-orange-400' 
                                        : 'hover:border-primary/50'
                                  }`
                            }`}
                            onClick={() => {
                              if (isDisabled) return;
                              if (missingItems.length > 0) {
                                missingItems.forEach(item => remove(item.id));
                              }
                              setSelectedPharmacyId(p.id);
                              setPharmacyDialogOpen(false);
                            }}
                          >
                            <div className="font-bold text-sm mb-2 flex items-start justify-between gap-2">
                              <div className="flex flex-col gap-1.5 flex-1">
                                <span className={isDisabled ? 'text-slate-600' : (stockLevel === 1 ? 'text-orange-700' : 'text-primary')}>
                                  {p.nome}
                                </span>
                                <div className="text-[10px] text-slate-500 mt-0.5 space-y-0.5 font-normal">
                                  {p.horarioFuncionamento && <div><span className="font-semibold text-slate-700">Funcionamento:</span> {p.horarioFuncionamento}</div>}
                                  {p.aceitaEntrega && p.horarioInicioEntrega && p.horarioFimEntrega && (
                                    <div><span className="font-semibold text-slate-700">Entrega:</span> {p.horarioInicioEntrega} às {p.horarioFimEntrega}</div>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-1.5 items-center">
                                  {isMelhorPreco && <span className="inline-flex items-center bg-amber-100 text-amber-800 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded shadow-sm">Melhor Preço</span>}
                                </div>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <div className={`font-bold ${isDisabled ? 'text-slate-400' : 'text-slate-900'}`}>
                                  {brl(totalPrice)}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                              {stockLevel === 0 && (
                                <span className="inline-flex items-center text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold shadow-sm">
                              {isServiceCart ? "Este serviço está disponível nesta farmácia" : (items.length === 1 ? "Essa farmácia possui o item que você escolheu" : `Essa farmácia possui todos os ${items.length} itens que você escolheu`)}
                            </span>
                          )}
                          {stockLevel === 1 && items.length > 1 && (
                            <>
                              <span className="inline-flex items-center text-[9px] text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded font-bold shadow-sm">
                                Essa farmácia tem apenas {partialCount} {partialWord} dos {items.length} que você escolheu
                              </span>
                              {missingItems.length > 0 && (
                                <div className="w-full mt-1 text-[10px] text-red-600 font-bold bg-red-50 p-1.5 rounded border border-red-100">
                                  Produtos faltantes: {missingItems.map(m => m.nome).join(', ')}
                                </div>
                              )}
                            </>
                          )}
                          {stockLevel === 2 && (
                            <span className="inline-flex items-center text-[9px] text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded font-bold uppercase shadow-sm">
                              {items.length === 1 ? "Essa farmácia não possui esse item no estoque" : "Essa farmácia não possui esses itens no estoque"}
                            </span>
                          )}
                          
                          {/* Retirada / Entrega alinhado a esquerda com as tags */}
                          {!isServiceCart && (
                            <div className="w-full mt-1 flex flex-wrap items-center gap-2">
                              <div className="font-bold text-primary text-[10px] bg-primary/10 px-1.5 py-0.5 rounded">
                                Retirada: Grátis ({p.horarioInicioRetirada || "08:00"} às {p.horarioFimRetirada || "20:00"})
                              </div>
                              {p.aceitaEntrega && (() => {
                                let displayDeliveryPrice = null;
                                let isDeliveryPriceExact = false;
                                if (p.faixasValorPedido && p.faixasValorPedido.length > 0) {
                                  const matchingFaixa = [...p.faixasValorPedido]
                                    .sort((a, b) => b.valorMin - a.valorMin)
                                    .find(f => totalPrice >= f.valorMin);
                                  
                                  if (matchingFaixa) {
                                    displayDeliveryPrice = matchingFaixa.taxa;
                                    isDeliveryPriceExact = true;
                                  }
                                }

                                if (displayDeliveryPrice === null) {
                                  if (distance !== null && distance >= 0 && p.raiosEntrega && p.raiosEntrega.length > 0) {
                                    const matchingRaio = [...p.raiosEntrega].sort((a,b) => a.ateKm - b.ateKm).find(r => distance <= r.ateKm);
                                    if (matchingRaio) {
                                      displayDeliveryPrice = matchingRaio.preco;
                                      isDeliveryPriceExact = true;
                                    }
                                  } else if (p.raiosEntrega && p.raiosEntrega.length > 0) {
                                    displayDeliveryPrice = Math.min(...p.raiosEntrega.map(r => r.preco));
                                  } else if (p.custoEntrega !== undefined && p.custoEntrega !== null) {
                                    displayDeliveryPrice = p.custoEntrega;
                                    isDeliveryPriceExact = true;
                                  }
                                }
                                
                                if (displayDeliveryPrice === null) return null;
                                
                                return (
                                  <div className="font-bold text-orange-600 text-[10px] bg-orange-100 px-1.5 py-0.5 rounded">
                                    Entrega: {isDeliveryPriceExact ? brl(displayDeliveryPrice) : `A partir de ${brl(displayDeliveryPrice)}`}
                                  </div>
                                );
                              })()}
                            </div>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1 mt-2">
                              <p>{p.endereco}</p>
                              <p><strong className="text-foreground">Horário de funcionamento:</strong> {p.horarioFuncionamento || "Seg a Sáb: 08:00 às 22:00"}</p>
                              <p><strong className="text-foreground">CNPJ:</strong> {p.cnpj}</p>
                              <p><strong className="text-foreground">Farmacêutico:</strong> {p.respTecnico} | <strong className="text-foreground">CRF/RS:</strong> {(p as any).crf}</p>
                              <p><strong className="text-foreground">AFE:</strong> {p.afe}</p>
                            </div>
                            </div>
                          );
                        });
                      })()
                    )
                  )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            
            {selectedPharmacy && (
              <div className="border-t pt-4 mt-2">
                <div className="bg-slate-50/50 rounded-xl p-4 border border-slate-100 space-y-3">
                  <h4 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Dados da Loja
                  </h4>
                  <div className="text-xs text-slate-600 grid gap-2">
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      <span>{selectedPharmacy.endereco}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <Clock className="w-3.5 h-3.5 mt-0.5 text-slate-400 shrink-0" />
                      <span><strong className="text-slate-800">Horário:</strong> {selectedPharmacy.horarioFuncionamento || "Seg a Sáb: 08:00 às 22:00"}</span>
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-200/60">
                      <p><strong className="text-slate-800">CNPJ:</strong> {selectedPharmacy.cnpj}</p>
                      <p><strong className="text-slate-800">AFE:</strong> {selectedPharmacy.afe}</p>
                      <p className="sm:col-span-2"><strong className="text-slate-800">Farmacêutico:</strong> {selectedPharmacy.respTecnico} <span className="text-slate-300 mx-1">|</span> <strong className="text-slate-800">CRF/RS:</strong> {(selectedPharmacy as any).crf}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {items.map((i) => {
            const low = i.qty >= 3 || Math.random() < 0; // scarcity trigger
            const fakeStock = 3 + (parseInt(i.id, 10) % 5);
            const scarce = fakeStock <= 5;
            return (
              <div key={i.id} className="bg-card border rounded-xl p-3 sm:p-4 flex gap-3 sm:gap-4">
                <img
                  src={productImage(i)}
                  alt=""
                  className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 object-contain bg-white border rounded"
                />
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm">{i.nome}</div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {i.categoriaId === "142" && i.tarja && i.tarja !== "none" && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold shadow-sm ${tarjaColor(i.tarja)}`}>
                        {i.tarja === "Vermelha" || i.tarja === "Amarela" ? `Tarja ${i.tarja}` : i.tarja}
                      </span>
                    )}
                    {i.categoriaId === "142" && i.retemReceita && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded shadow-sm bg-red-600 text-white font-bold">
                        Retém receita
                      </span>
                    )}
                    {i.categoriaId === "142" && i.retemReceita === false && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 font-bold border border-slate-200">
                        Não retém receita
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-4">

                    <div className="inline-flex flex-col items-center sm:items-start">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setQty(i.id, i.qty - 1)} className="h-8 w-8 border rounded flex items-center justify-center">−</button>
                        <span className="text-sm w-8 text-center font-bold">{i.qty}</span>
                        <button 
                          onClick={() => setQty(i.id, i.qty + 1)} 
                          disabled={i.qty >= i.estoque}
                          className="h-8 w-8 border rounded flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          +
                        </button>
                      </div>
                      <button
                        onClick={() => remove(i.id)}
                        className="sm:hidden text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 mt-2"
                      >
                        <X className="h-3.5 w-3.5" /> Remover
                      </button>
                    </div>
                  </div>
                </div>
                <div className="text-right flex flex-col justify-between items-end">
                  <div>
                    {(() => { 
                      const ep = getEffectivePrice(i, selectedPharmacyId); 
                      const lojaPromos = selectedPharmacyId ? (useMarketing.getState().lojaPromocoes[selectedPharmacyId] || []) : [];
                      const promo = getLevePaguePromotion(i, promocoes, lojaPromos);
                      if (promo && i.qty >= promo.levePague_quantidade) {
                        const promoItemsCount = Math.floor(i.qty / promo.levePague_quantidade) * promo.levePague_quantidade;
                        const regularItemsCount = i.qty - promoItemsCount;
                        const promoTotal = promoItemsCount * promo.levePague_precoPorItem!;
                        const regularTotal = regularItemsCount * ep.precoPor;
                        const totalWithPromo = promoTotal + regularTotal;
                        
                        return (
                          <>
                            <div className="text-lg font-bold text-foreground leading-tight">{brl(totalWithPromo)}</div>
                            {ep.precoDe && ep.precoDe > ep.precoPor && (
                              <div className="text-xs text-muted-foreground line-through">{brl(ep.precoDe * i.qty)}</div>
                            )}
                            <div className="text-[10px] font-bold text-orange-600">Promoção aplicada!</div>
                          </>
                        );
                      }
                      
                      return (
                      <>
                        {ep.precoDe && ep.precoDe > ep.precoPor && (
                          <div className="text-xs text-muted-foreground line-through">{brl(ep.precoDe * i.qty)}</div>
                        )}
                        <div className="text-lg font-bold text-foreground leading-tight">{brl(ep.precoPor * i.qty)}</div>
                        <div className="text-xs text-muted-foreground">
                          {brl(ep.precoPor)} un.
                        </div>
                      </>
                      ); 
                    })()}
                  </div>
                  <button
                    onClick={() => remove(i.id)}
                    className="hidden sm:flex text-sm text-muted-foreground hover:text-destructive items-center gap-1 pb-1"
                  >
                    <X className="h-4 w-4" /> Remover
                  </button>
                </div>
              </div>
            );
          })}

          {/* Cross-sell — never medicines */}
          {crossSell.length > 0 && (
            <div className="bg-card border rounded-xl p-4 mt-6">
              <h2 className="font-bold mb-3">Produtos que podem te interessar</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {crossSell.map((p) => (
                  <div key={p.id} className="border rounded-lg p-2 text-xs flex flex-col">
                    <img
                      src={productImage(p)}
                      alt=""
                      className="h-20 w-full object-contain bg-white"
                    />
                    <div className="font-bold mt-1 h-[2.5em] overflow-hidden line-clamp-2 leading-tight text-ellipsis">{p.nome}</div>
                    <div className="text-foreground font-bold mt-1">{brl(p.precoPor)}</div>
                    <Button size="sm" variant="outline" className="mt-1" onClick={() => add(p)}>
                      Adicionar
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:sticky lg:top-32 h-fit space-y-4">
          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h3 className="font-bold mb-2">{items.some(i => i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20"))) ? "Local do Atendimento:" : "Opções de Frete & Entrega:"}</h3>
            {!selectedPharmacy ? (
              <p className="text-sm text-muted-foreground bg-slate-50 p-3 rounded text-center font-medium border border-slate-100">
                Por favor, selecione uma farmácia para ver as opções disponíveis para o seu carrinho.
              </p>
            ) : (
              <>
                <div className="mt-3 space-y-4">
                  {items.some(i => i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20"))) && (
                    <div className="bg-blue-50 text-blue-800 text-xs font-bold p-3 rounded border border-blue-200">
                      O carrinho contém serviços de saúde. A realização é feita presencialmente na farmácia.
                    </div>
                  )}
                  {items.some(i => i.retemReceita) && (
                    <div className="bg-red-50 text-red-800 text-xs font-bold p-3 rounded border border-red-200">
                      O carrinho contém produtos com retenção de receita. Portanto, apenas a opção de retirada está disponível.
                    </div>
                  )}

                  <div className="flex flex-col gap-2">
                    <label className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer ${selected === "pickup" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                      <input type="radio" name="deliveryMode" checked={selected === "pickup"} onChange={() => setSelected("pickup")} />
                      <Store className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-bold">Retirada na loja</div>
                        <div className="text-xs text-muted-foreground">Retirar grátis na loja</div>
                      </div>
                    </label>

                    <label className={`flex items-center gap-2 border rounded-lg p-3 ${items.some(i => i.retemReceita || i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20"))) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${selected !== "pickup" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                      <input type="radio" name="deliveryMode" disabled={items.some(i => i.retemReceita || i.categoriaId === "200" || (i.subcategoriaId && String(i.subcategoriaId).startsWith("20")))} checked={selected !== "pickup"} onChange={() => {
                          const firstDeliveryOption = freight?.find(f => f.id !== "pickup");
                          setSelected(firstDeliveryOption ? firstDeliveryOption.id : "delivery_placeholder");
                      }} />
                      <Bike className="h-4 w-4 text-primary" />
                      <div className="flex-1">
                        <div className="text-sm font-bold">Entrega em domicílio</div>
                        <div className="text-xs text-muted-foreground">Receba no seu endereço</div>
                      </div>
                    </label>
                  </div>

                  {selected !== "pickup" && (
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 mt-2 animate-in fade-in slide-in-from-top-2">
                      <p className="text-[11px] text-muted-foreground mb-2">Preencha seu CEP para estimar o valor e o prazo de entrega.</p>
                      <div className="flex gap-2 mb-2">
                        <Input 
                          placeholder="00000-000" 
                          maxLength={9} 
                          value={cep} 
                          disabled={isCalcLoading} 
                          onChange={(e) => {
                            let v = e.target.value.replace(/\D/g, "");
                            if (v.length > 5) v = v.replace(/^(\d{5})(\d)/, "$1-$2");
                            setCep(v);
                          }} 
                        />
                        <Button variant="outline" disabled={isCalcLoading} onClick={calcFreight}>
                          {isCalcLoading ? "Calculando..." : "Calcular"}
                        </Button>
                      </div>
                      
                      <button 
                        onClick={handleUseLocation} 
                        disabled={isLocating}
                        className="text-xs text-primary font-bold hover:underline flex items-center gap-1 mt-1 mb-3"
                      >
                        <MapPin className="h-3 w-3" />
                        {isLocating ? "Obtendo localização..." : "Usar minha localização atual"}
                      </button>
                      
                      {freight && freight.filter(f => f.id !== "pickup").length > 0 ? (
                        <div className="space-y-2 mt-4">
                          {freight.filter(f => f.id !== "pickup").map(f => {
                            const Icon = f.icon;
                            const active = selected === f.id || (selected === "delivery_placeholder" && f.id === freight.filter(x => x.id !== "pickup")[0]?.id);
                            return (
                              <label key={f.id} className={`flex items-center gap-2 border rounded-lg p-2.5 cursor-pointer bg-white ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                                <input type="radio" checked={active} onChange={() => setSelected(f.id)} />
                                <Icon className="h-4 w-4 text-primary" />
                                <div className="flex-1">
                                  <div className="text-sm font-bold">{f.label}</div>
                                  <div className="text-xs text-emerald-600 font-medium">{f.eta}</div>
                                </div>
                                <span className="text-sm font-bold">{f.price === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(f.price)}</span>
                              </label>
                            )
                          })}
                        </div>
                      ) : (
                         cep.replace(/\D/g, "").length >= 8 && !isCalcLoading ? (
                           <div className="text-sm text-red-600 font-medium mt-3">Não há opções de entrega disponíveis para este CEP ou farmácia.</div>
                         ) : null
                      )}
                    </div>
                  )}

                  {selected === "pickup" && selectedPharmacy && (
                    <div className="bg-emerald-50 text-emerald-900 text-xs p-3 rounded border border-emerald-200 mt-3 animate-in fade-in slide-in-from-top-2">
                      <div className="font-bold flex items-center gap-1.5 mb-1.5"><MapPin className="h-4 w-4"/> {hasService ? "Local de Realização do Serviço" : "Atenção ao Endereço de Retirada"}</div>
                      <p>{hasService ? "Dirija-se ao local abaixo para realização do serviço:" : "O seu pedido deverá ser retirado presencialmente no seguinte endereço:"}</p>
                      <p className="mt-1.5 font-bold text-sm bg-white p-2 rounded shadow-sm border border-emerald-100">{selectedPharmacy.endereco}</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          <div className="bg-card border rounded-xl p-5 shadow-sm">
            <h2 className="font-bold mb-3 flex items-center gap-2 text-base">
              <ShoppingBag className="h-5 w-5 text-primary" /> Resumo do Pedido
            </h2>
            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{brl(subtotal)}</span>
            </div>
            {storeDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-bold py-1">
                <span>Desconto Produtos</span>
                <span>−{brl(storeDiscount)}</span>
              </div>
            )}

            {couponDisc > 0 && (
              <div className="flex justify-between text-sm text-emerald-600 font-bold py-1">
                <span className="flex items-center gap-1"><Tag className="h-3.5 w-3.5"/> Desconto do Cupom ({appliedCoupon})</span>
                <span>−{brl(couponDisc)}</span>
              </div>
            )}

            <div className="flex justify-between text-sm py-1 font-medium border-t mt-1 pt-2 border-slate-100">
              <span className="text-foreground">Subtotal de Produtos</span>
              <span>{brl(Math.max(0, subtotal - storeDiscount - couponDisc))}</span>
            </div>

            <div className="flex justify-between text-sm py-1">
              <span className="text-muted-foreground">{isDelivery ? "Entrega" : "Retirada"}</span>
              <span>
                {!isDelivery ? (
                  <span className="text-emerald-600 font-bold">Grátis</span>
                ) : (selectedFreight && selectedFreight.id !== "pickup") ? (
                  freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)
                ) : (
                  <span className="text-muted-foreground text-xs">A calcular</span>
                )}
              </span>
            </div>

            {/* Cupom de Desconto */}
            <div className="border-t my-3 pt-3">
              <div className="text-xs font-bold text-muted-foreground mb-1.5 flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary" /> Cupom de Desconto
              </div>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg px-3 py-2 text-xs">
                  <div className="font-bold flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{appliedCoupon}</span>
                    <span className="text-emerald-700 font-normal">(-{brl(couponDisc)})</span>
                  </div>
                  <button onClick={removeCoupon} className="text-emerald-900 hover:text-red-600 font-bold ml-2">
                    Remover
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Ex: 10OFF"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                    className="h-9 text-xs uppercase"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 font-bold px-3 text-xs"
                    onClick={handleApplyCoupon}
                  >
                    Aplicar
                  </Button>
                </div>
              )}
              {couponFeedback && (
                <p className={`text-[11px] mt-1.5 font-medium ${couponFeedback.includes("sucesso") ? "text-emerald-600" : "text-destructive"}`}>
                  {couponFeedback}
                </p>
              )}
            </div>

            <div className="border-t pt-3 flex flex-col">
              <div className="flex justify-between text-lg font-bold">
                <span>Total Estimado</span>
                <span className="text-primary text-xl">{brl(grandTotal)}</span>
              </div>
              {(storeDiscount > 0 || couponDisc > 0) && (
                <div className="text-right text-xs text-green-600 font-bold mt-1">
                  Você está economizando {brl(storeDiscount + couponDisc)}
                </div>
              )}
            </div>

            <Button
              className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-base shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              size="lg"
              onClick={goToCheckout}
            >
              Finalizar Pedido
            </Button>
          </div>

          </aside>
      </div>

      {/* Modal de Finalização via WhatsApp */}
      <Dialog open={whatsAppModalOpen} onOpenChange={setWhatsAppModalOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-emerald-700">
              <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                <MessageCircle className="h-5 w-5 text-emerald-600" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold">Enviar Pedido para a Loja</DialogTitle>
                <p className="text-xs text-muted-foreground">
                  Unidade: <strong>{selectedPharmacy?.nome}</strong> ({selectedPharmacy?.cidade}/{selectedPharmacy?.uf})
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleConfirmWhatsAppOrder} className="space-y-4 pt-2">
            {/* Seção 1: Dados do Cliente */}
            <div className="bg-slate-50 border rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Seus Dados</div>
              <div>
                <Label className="text-xs">Seu Nome Completo *</Label>
                <Input
                  required
                  placeholder="Ex: Maria Silva"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="mt-1 bg-white h-9"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">WhatsApp para Contato *</Label>
                  <Input
                    required
                    placeholder="(99) 99999-9999"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(formatPhone(e.target.value))}
                    className="mt-1 bg-white h-9"
                  />
                </div>
                <div>
                  <Label className="text-xs">CPF / CNPJ (Obrigatório p/ nota) *</Label>
                  <Input
                    required
                    placeholder="Digite seu CPF ou CNPJ"
                    value={clientCpf}
                    onChange={(e) => setClientCpf(formatCpfCnpj(e.target.value))}
                    className="mt-1 bg-white h-9"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Modalidade de Entrega */}
            <div className="bg-slate-50 border rounded-lg p-3.5 space-y-3">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider">Entrega ou Retirada</div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                      setDeliveryMethod("entrega");
                      if (selected === "pickup") {
                        const firstDelivery = freight?.find(f => f.id !== "pickup");
                        if (firstDelivery) setSelected(firstDelivery.id);
                      }
                    }}
                  disabled={items.some(i => i.retemReceita)}
                  className={`border rounded-lg p-2.5 text-xs font-bold flex flex-col items-center gap-1 transition-all ${deliveryMethod === "entrega" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                >
                  <Bike className="h-4 w-4 text-emerald-600" />
                  <span>Entrega em Domicílio</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDeliveryMethod("retirada")}
                  className={`border rounded-lg p-2.5 text-xs font-bold flex flex-col items-center gap-1 transition-all ${deliveryMethod === "retirada" ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                >
                  <Store className="h-4 w-4 text-emerald-600" />
                  <span>Retirar na Farmácia</span>
                </button>
              </div>

              {items.some(i => i.retemReceita) && (
                <div className="bg-red-50 text-red-700 p-2.5 rounded border border-red-200 text-xs mt-2">
                  <AlertTriangle className="w-4 h-4 inline mr-1 -mt-0.5" />
                  <strong>Atenção:</strong> Seu pedido contém medicamentos de controle especial. Conforme normas da Anvisa, é necessário reter a receita original. A entrega está desabilitada e você deve retirar na farmácia.
                </div>
              )}

              {deliveryMethod === "retirada" ? (
                <div className="text-xs text-muted-foreground bg-white p-2.5 rounded border space-y-1.5">
                  <div>📍 <strong>Endereço de retirada:</strong> {selectedPharmacy?.endereco}, {selectedPharmacy?.numero ? selectedPharmacy.numero + ', ' : ''}{selectedPharmacy?.bairro} - {selectedPharmacy?.cidade}/{selectedPharmacy?.uf}</div>
                  {selectedPharmacy?.horario_funcionamento && (
                    <div className="flex items-center gap-1.5 text-slate-600 mt-1">
                      <Clock className="w-3.5 h-3.5 shrink-0" />
                      <span>{selectedPharmacy.horario_funcionamento}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {!isEditingAddress && (addressStr || deliveryAddress) ? (
                    <div className="bg-white p-3 rounded-lg border text-sm flex justify-between items-start gap-2">
                      <div>
                        <div className="font-bold flex items-center gap-1 text-slate-700 mb-1">
                          <MapPin className="w-4 h-4 text-emerald-600" /> Endereço de Entrega
                        </div>
                        <div className="text-slate-600">
                          {deliveryAddress ? `${deliveryAddress}, ${deliveryNumber ? deliveryNumber : 'S/N'}${deliveryComplement ? ' - ' + deliveryComplement : ''} - ${deliveryBairro}` : addressStr}
                        </div>
                        {(!deliveryNumber || deliveryNumber.trim() === "") && (
                          <div className="text-red-500 font-bold text-xs mt-1">
                            Atenção: Número não preenchido! Clique em Editar.
                          </div>
                        )}
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setIsEditingAddress(true)} className="text-emerald-600 h-8 px-2 shrink-0">
                        <Edit2 className="w-4 h-4 mr-1" /> Editar
                      </Button>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-2">
                          <Label className="text-xs">Endereço (Rua / Av.) *</Label>
                          <Input
                            required
                            placeholder="Ex: Av. Central"
                            value={deliveryAddress}
                            onChange={(e) => setDeliveryAddress(e.target.value)}
                            className="mt-1 bg-white h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Número *</Label>
                          <Input
                            required
                            placeholder="123"
                            value={deliveryNumber}
                            onChange={(e) => setDeliveryNumber(e.target.value)}
                            className="mt-1 bg-white h-9"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Bairro *</Label>
                          <Input
                            required
                            placeholder="Centro"
                            value={deliveryBairro}
                            onChange={(e) => setDeliveryBairro(e.target.value)}
                            className="mt-1 bg-white h-9"
                          />
                        </div>
                        <div>
                          <Label className="text-xs">Complemento</Label>
                          <Input
                            placeholder="Apto 101, Bloco B"
                            value={deliveryComplement}
                            onChange={(e) => setDeliveryComplement(e.target.value)}
                            className="mt-1 bg-white h-9"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end pt-1">
                        <Button type="button" variant="outline" size="sm" onClick={() => setIsEditingAddress(false)} disabled={!deliveryAddress || !deliveryNumber}>Confirmar Endereço</Button>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Seção 3: Forma de Pagamento */}
            <div className="bg-slate-50 border rounded-lg p-3.5 space-y-2.5">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">Como prefere pagar?</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "pix", label: "PIX", icon: Sparkles },
                  { id: "cartao_credito", label: "Crédito", icon: CreditCard },
                  { id: "cartao_debito", label: "Débito", icon: CreditCard },
                  { id: "dinheiro", label: "Dinheiro", icon: DollarSign },
                ].map((pm) => {
                  const Icon = pm.icon;
                  const active = paymentMethod === pm.id;
                  return (
                    <button
                      key={pm.id}
                      type="button"
                      onClick={() => setPaymentMethod(pm.id as any)}
                      className={`border rounded-lg p-2 text-xs font-bold flex flex-col items-center gap-1 transition-all ${active ? "border-emerald-600 bg-emerald-50 text-emerald-900 ring-2 ring-emerald-500/20" : "bg-white text-slate-700 hover:bg-slate-100"}`}
                    >
                      <Icon className="h-4 w-4 text-emerald-600" />
                      <span>{pm.label}</span>
                    </button>
                  );
                })}
              </div>

              {paymentMethod === "dinheiro" && (
                <div className="mt-2">
                  <Label className="text-xs">Precisa de troco para quanto?</Label>
                  <Input
                    placeholder="Ex: R$ 50,00 ou Não preciso"
                    value={trocoPara}
                    onChange={(e) => setTrocoPara(e.target.value)}
                    className="mt-1 bg-white h-9 text-xs"
                  />
                </div>
              )}
            </div>

            {/* Seção 4: Observações */}
            <div>
              <Label className="text-xs font-bold text-slate-800">Observações adicionais (opcional)</Label>
              <Input
                placeholder="Ex: Campainha não funciona / Ligar ao chegar"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="mt-1 h-9 text-xs"
              />
            </div>

            {/* Resumo do Valor */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
              <div className="space-y-1.5 mb-3 border-b border-emerald-200/50 pb-3">
                <div className="flex justify-between text-sm text-emerald-800">
                  <span>Subtotal ({items.length} itens)</span>
                  <span>{brl(subtotal)}</span>
                </div>
                {(storeDiscount + pbmDisc + couponDisc) > 0 && (
                  <div className="flex justify-between text-sm text-emerald-600 font-medium">
                    <span>Descontos</span>
                    <span>-{brl(storeDiscount + pbmDisc + couponDisc)}</span>
                  </div>
                )}
                {deliveryMethod === "entrega" && (
                  <div className="flex justify-between text-sm text-emerald-800">
                    <span>Frete</span>
                    <span>{(selectedFreight && selectedFreight.id !== "pickup") ? (freightPrice === 0 ? <span className="text-emerald-600 font-bold">Grátis</span> : brl(freightPrice)) : <span className="text-emerald-700/70 text-xs">A calcular</span>}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-700">Pagamento acertado na {deliveryMethod}</span>
                <div className="text-right flex items-center gap-2">
                  <span className="text-xs text-emerald-800 font-bold uppercase">Total</span>
                  <span className="text-lg font-bold text-emerald-900">{brl(grandTotal)}</span>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isSubmittingOrder || (deliveryMethod === "entrega" && (!deliveryNumber || isEditingAddress))}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-6 text-base shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2"
            >
              <Send className="h-5 w-5" />
              {isSubmittingOrder ? "Processando..." : "Finalizar Pedido"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={noPharmacyAlertOpen} onOpenChange={setNoPharmacyAlertOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-orange-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 text-center">Atenção</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Você deve selecionar uma farmácia antes de prosseguir com o pedido.
            </p>
            <Button 
              className="w-full mt-2 font-bold" 
              onClick={() => {
                setNoPharmacyAlertOpen(false);
                setPharmacyDialogOpen(true);
              }}
            >
              Selecionar Farmácia
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={noFreightAlertOpen} onOpenChange={setNoFreightAlertOpen}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex flex-col items-center justify-center gap-4 py-4">
            <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-blue-500" />
            </div>
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-slate-800 text-center">Opção de Entrega</DialogTitle>
            </DialogHeader>
            <p className="text-muted-foreground text-sm">
              Para prosseguir, escolha um meio de entrega ou selecione a retirada na farmácia.
            </p>
            <Button 
              className="w-full mt-2 font-bold" 
              onClick={() => setNoFreightAlertOpen(false)}
            >
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDeliveryOpen} onOpenChange={setConfirmDeliveryOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Confirmação de Entrega</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-muted-foreground mb-3 text-sm">Você está em: <br/><strong className="text-foreground text-base">{addressStr || cep}</strong></p>
            <p className="font-bold text-lg">Deseja entregar nesse endereço?</p>
          </div>
          <div className="flex gap-3 justify-end mt-2">
            <Button variant="outline" onClick={() => setConfirmDeliveryOpen(false)}>
              Alterar CEP
            </Button>
            <Button onClick={() => {
              setConfirmDeliveryOpen(false);
              setWhatsAppModalOpen(true);
            }}>
              Sim, continuar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}