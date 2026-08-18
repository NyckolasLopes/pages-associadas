// @ts-nocheck
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import productsJson from "@/data/products.json";
import { useCart, useGeoCep, getEffectivePrice } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { useOrders } from "@/stores/orders";
import { useAdmin } from "@/stores/admin";
import { useMarketing } from "@/stores/marketing";
import { brl, productImage, tarjaColor } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useEffect, useState, useMemo } from "react";
import { Lock, Store, Home, User, Truck, CreditCard, Users, QrCode, Clock, CheckCircle2, Banknote, Tag, X, AlertCircle, MapPin, Plus, Bike, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { toast } from "sonner";
import { calculateDistance, getCepCoordinates } from "@/lib/utils";
import { catalog } from "@/services/catalog";
import type { Produto } from "@/types";
import { z } from "zod";

export const Route = createFileRoute("/_store/checkout")({
  head: () => ({ meta: [{ title: "Checkout — Farmácias Associadas" }] }),
  component: Checkout,
});

const checkoutSchema = z.object({
  nome: z.string().min(3, "Nome completo é obrigatório"),
  email: z.string().email("E-mail inválido"),
  cpf: z.string().regex(/^\d{3}\.\d{3}\.\d{3}\-\d{2}$/, "CPF inválido"),
  telefone: z.string().regex(/^\(\d{2}\)\s\d{4,5}\-\d{4}$/, "Telefone inválido"),
});

function Checkout() {
  const cupons = useMarketing((s) => s.cupons);
  const [mounted, setMounted] = useState(false);
  const items = useCart((s) => s.items);
  const hasService = items.some(item => item.categoriaId === "200" || (item.subcategoriaId && String(item.subcategoriaId).startsWith("20")));
  const subtotal = useCart((s) => s.subtotal());
  const storeDisc = useCart((s) => s.storeDiscount());
  const add = useCart((s) => s.add);
  const setQty = useCart((s) => s.setQty);
  const remove = useCart((s) => s.remove);
  const [allOrderBumps, setAllOrderBumps] = useState<Produto[]>([]);
  const [orderBumps, setOrderBumps] = useState<Produto[]>([]);
  const [api, setApi] = useState<CarouselApi>();
  const [orderBumpTimeLeft, setOrderBumpTimeLeft] = useState(15);

  useEffect(() => {
    catalog.getOrderBumps().then((res) => {
      setAllOrderBumps(res);
      setOrderBumps([...res].sort(() => 0.5 - Math.random()).slice(0, 6));
    });
  }, []);

  useEffect(() => {
    if (allOrderBumps.length <= 2) return;
    const interval = setInterval(() => {
      setOrderBumpTimeLeft((prev) => {
        if (prev <= 1) {
          setOrderBumps([...allOrderBumps].sort(() => 0.5 - Math.random()).slice(0, 6));
          if (api) api.scrollTo(0);
          return 15;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [api, allOrderBumps]);
  const pbmDisc = useCart((s) => s.pbmDiscount());
  const total = useCart((s) => s.total());
  const pbm = useCart((s) => s.pbm);
  const [done, setDone] = useState(false);
  const [orderedTotal, setOrderedTotal] = useState(0);
  const [creditCardStatus, setCreditCardStatus] = useState<"approved" | "refused" | "analysis" | null>(null);
  const clear = useCart((s) => s.clear);
  const user = useAuth((s) => s.user);
  const navigate = useNavigate();
  const geoCep = useGeoCep((s) => s.cep);
  const geoLat = useGeoCep((s) => s.lat);
  const geoLng = useGeoCep((s) => s.lng);
  const addOrder = useOrders((s) => s.addOrder);
  const addToCart = useCart((s) => s.add);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const allPharmacies = useAdmin((s) => s.pharmacies);
  const orderBumpSettings = useAdmin((s) => s.orderBumpSettings);
  const activeStore = allPharmacies.find(p => p.id === selectedPharmacyId) || allPharmacies[0];

  const selectedFreight = useCart((s) => s.selectedFreight);
  const setSelectedFreight = useCart((s) => s.setSelectedFreight);
  
  const deliveryMethod = selectedFreight === "pickup" ? "store" : "home";
  const [paymentCategory, setPaymentCategory] = useState<"online" | "offline">("online");
  const [paymentMethod, setPaymentMethod] = useState<"credit" | "pix" | "credit_machine" | "debit_machine" | "cash" | "pix_machine" | "pbm" | "crediario" | string>("pix");

  const [nome, setNome] = useState(user?.name || user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [cpf, setCpf] = useState(user?.cpf || "");
  const [telefone, setTelefone] = useState(user?.celular || "");

  const [formCep, setFormCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");

  const [pickupDialogOpen, setPickupDialogOpen] = useState(false);
  const [pickupPersonType, setPickupPersonType] = useState<"self" | "other" | null>(null);
  const [hasPromptedPickup, setHasPromptedPickup] = useState(false);
  const [authName, setAuthName] = useState("");
  const [authCpf, setAuthCpf] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [userCoords, setUserCoords] = useState<{lat: number, lng: number} | null>(null);
  const [pharmCoords, setPharmCoords] = useState<{lat: number, lng: number} | null>(null);

  const [cardNumber, setCardNumber] = useState("");
  const [cardName, setCardName] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardCpf, setCardCpf] = useState("");
  const [installments, setInstallments] = useState("1");
  const [focusedField, setFocusedField] = useState<"number" | "name" | "expiry" | "cvv" | null>(null);
  const [saveCard, setSaveCard] = useState(false);

  const [pixGenerated, setPixGenerated] = useState(false);
  const [pixTimeLeft, setPixTimeLeft] = useState(1800);

  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState<{code: string, discount: number, cupomData?: any} | null>(null);
  const [couponError, setCouponError] = useState("");

  const applyCoupon = () => {
    const code = couponInput.toUpperCase().trim();
    if (!code) {
      setCouponError("");
      return;
    }
    
    const cupom = cupons.find(c => c.codigo === code);
    
    if (!cupom) {
      setCouponApplied(null);
      setCouponError("O cupom informado não existe.");
      return;
    }

    if (!cupom.ativo) {
      setCouponApplied(null);
      setCouponError("Este cupom está inativo.");
      return;
    }

    if (cupom.numeroUtilizacoes >= cupom.totalDisponiveis) {
      setCouponApplied(null);
      setCouponError("Este cupom atingiu o limite de utilizações.");
      return;
    }
    
    if (cupom.dataInicio && new Date() < new Date(cupom.dataInicio)) {
      setCouponApplied(null);
      setCouponError("Este cupom ainda não está válido.");
      return;
    }
    
    if (cupom.dataTermino && new Date() > new Date(cupom.dataTermino)) {
      setCouponApplied(null);
      setCouponError("Este cupom já expirou.");
      return;
    }
    
    if (cupom.valorMinimo > 0 && subtotal < cupom.valorMinimo) {
      setCouponApplied(null);
      setCouponError(`O valor mínimo para usar este cupom é ${brl(cupom.valorMinimo)}.`);
      return;
    }

    let discount = 0;
    if (cupom.tipoDesconto === "percentual") {
      discount = (subtotal * cupom.valorDesconto) / 100;
    } else {
      discount = cupom.valorDesconto;
      if (discount > subtotal) discount = subtotal;
    }

    setCouponApplied({ code, discount, cupomData: cupom });
    setCouponError("");
    toast.success(`Cupom aplicado com sucesso!`);
  };

  const isServiceProduct = (i: any) => {
    return i?.categoriaId === "200" || 
      (i?.subcategoriaId && String(i.subcategoriaId).startsWith("20")) ||
      (i?.internalTags && i.internalTags.some((t: string) => t.toLowerCase() === "serviços de saúde" || t.toLowerCase() === "serviços")) ||
      (i?.categoriasAdicionais && i.categoriasAdicionais.some((c: string) => c.toLowerCase() === "serviços de saúde" || c.toLowerCase() === "serviços"));
  };

  const hasPrescription = items.some(i => i.retemReceita || isServiceProduct(i));
  const noDeliveryAvailable = activeStore ? !activeStore.aceitaEntrega : false;
  const forceStore = hasPrescription || noDeliveryAvailable;
  const isServiceCart = items.some(i => isServiceProduct(i));

  useEffect(() => {
    if (pixGenerated && pixTimeLeft > 0) {
      const timer = setInterval(() => {
        setPixTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [pixGenerated, pixTimeLeft]);



  useEffect(() => {
    setMounted(true);
    // Auth session is restored globally via useAuth._initListener() in __root.tsx
  }, []);

  useEffect(() => {
    if (done) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [done]);

  useEffect(() => {
    if (mounted && user) {
      if (!nome) setNome(user.nome || user.name || "");
      if (!email) setEmail(user.email || "");
      if (!cpf && (user as any).cpf) setCpf((user as any).cpf);
      if (!telefone && ((user as any).celular || (user as any).phone)) setTelefone((user as any).celular || (user as any).phone);
    }
  }, [mounted, user]);

  useEffect(() => {
    if (mounted && geoCep && !formCep) {
      setFormCep(geoCep);
      const c = geoCep.replace(/\D/g, "");
      if (c.length === 8) {
        fetch(`https://viacep.com.br/ws/${c}/json/`)
          .then(res => res.json())
          .then(data => {
            if (!data.erro) {
              setRua(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
            }
          })
          .catch(() => {});
      }
    }
  }, [mounted, geoCep]);

  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d)/, "$1.$2");
    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    setCpf(v);
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.slice(0, 11);
    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
    setTelefone(v);
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 8) v = v.slice(0, 8);
    v = v.replace(/(\d{5})(\d)/, "$1-$2");
    setFormCep(v);
    
    if (v.replace(/\D/g, "").length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${v.replace(/\D/g, "")}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setRua(`${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}`);
        }
      } catch (err) {}
    }
  };

  useEffect(() => {
    if (!formCep) return;
    const cleanCep = formCep.replace(/\D/g, "");
    if (cleanCep.length === 8) {
      getCepCoordinates(cleanCep).then(setUserCoords).catch(() => {});
    }
  }, [formCep]);

  useEffect(() => {
    if (activeStore) {
      if (activeStore.lat && activeStore.lng) {
        setPharmCoords({ lat: activeStore.lat, lng: activeStore.lng });
      } else if (activeStore.cep) {
        const cleanCep = activeStore.cep.replace(/\D/g, "");
        if (cleanCep.length === 8) {
           getCepCoordinates(cleanCep).then(setPharmCoords).catch(() => {});
        }
      }
    }
  }, [activeStore]);

  useEffect(() => {
    if (mounted && !user) {
      navigate({ to: "/", replace: true });
    }
  }, [mounted, user, navigate]);

  useEffect(() => {
    if (forceStore && deliveryMethod === "home") {
      setSelectedFreight("pickup");
    }
  }, [forceStore, deliveryMethod, setSelectedFreight]);


  const forcePickup = hasPrescription;
  
  const cartFreightOpts = useCart((s) => s.freightOptions) || [];
  const deliveryOpts = cartFreightOpts.filter(f => f.id !== "pickup");
  
  const selectedFreightObj = deliveryOpts.find(f => f.id === selectedFreight) || deliveryOpts[0];
  let fretePrice = deliveryMethod === "home" ? (selectedFreightObj?.price || 0) : 0;
  if (couponApplied?.cupomData?.aplicarFreteGratis) {
    fretePrice = 0;
  }

  const visibleItems = mounted ? items : [];
  const orderBumpDiscount = visibleItems.reduce((acc, i) => {
    if (i.isOrderBump) {
      return acc + ((i.precoDe - i.preco) * i.qty);
    }
    return acc;
  }, 0);
  const visibleSubtotal = mounted ? subtotal : 0;
  const visibleStoreDisc = mounted ? storeDisc : 0;
  const visiblePbmDisc = mounted ? pbmDisc : 0;
  const visibleTotal = mounted ? total : 0;
  const visiblePbm = mounted ? pbm : null;
  const baseFinalTotal = Math.max(0, visibleTotal + fretePrice - (couponApplied?.discount || 0));
  const installmentCount = paymentCategory === "online" && paymentMethod === "credit" ? (Number(installments) || 1) : 1;
  const finalTotal = installmentCount > 6 
    ? baseFinalTotal * Math.pow(1.0199, installmentCount)
    : baseFinalTotal;
  
  useEffect(() => {
    if (deliveryMethod === "home" && (!selectedFreight || selectedFreight === "pickup")) {
      setSelectedFreight("standard");
    }
  }, [deliveryMethod, selectedFreight, setSelectedFreight]);

  useEffect(() => {
    if (mounted && deliveryMethod === "store" && !pickupPersonType && !hasPromptedPickup) {
      if (isServiceCart) {
        setPickupPersonType("self");
      } else {
        setPickupDialogOpen(true);
      }
      setHasPromptedPickup(true);
    }
  }, [mounted, deliveryMethod, pickupPersonType, hasPromptedPickup]);

  if (done) {
    return (
      <div className="container-fa py-12 text-center max-w-lg mx-auto min-h-[60vh] flex flex-col justify-center">
        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
          // @ts-ignore
          <MessageCircle className="w-10 h-10 text-emerald-600" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Pedido Recebido! 🎉</h1>
        <p className="text-slate-600 mb-8 text-lg">
          O seu pedido no valor de <strong className="text-slate-800">{brl(orderedTotal)}</strong> foi gerado com sucesso.
        </p>

        <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 mb-8">
          <p className="text-emerald-800 mb-4">
            Estamos redirecionando você para o nosso <strong>WhatsApp</strong> para finalizar o pagamento e combinar a entrega.
          </p>
          <Button 
            className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
            onClick={() => {
              const phone = (activeStore?.telefone || "51999999999").replace(/\D/g, "");
              const waNumber = phone.startsWith("55") ? phone : `55${phone}`;
              window.open(`https://wa.me/${waNumber}`, "_blank");
            }}
          >
            // @ts-ignore
            <MessageCircle className="w-5 h-5 mr-2" />
            Ir para o WhatsApp Agora
          </Button>
        </div>

        // @ts-ignore
        <Link to={`/${activeStore?.slug || ''}`}>
          <Button variant="outline" className="w-full h-12">Voltar para a página inicial</Button>
        </Link>
      </div>
    );
  }

  if (!mounted || !user) return null;

  return (
    <>
    <div className="container-fa py-4 md:py-8 grid lg:grid-cols-[1fr_380px] gap-6 md:gap-8 min-w-0">
      <div className="space-y-6 min-w-0">
        <h1 className="text-xl md:text-2xl font-bold">Finalizar pedido</h1>

        <div className="flex flex-wrap md:flex-nowrap items-center gap-2 md:gap-4 border-b pb-4 mb-4 text-xs md:text-sm font-bold text-muted-foreground">
          <div className="flex items-center gap-1 md:gap-2 text-primary shrink-0">
            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] md:text-xs">1</div>
            <User className="h-3 w-3 md:h-4 md:w-4" />
            <span>Identificação</span>
          </div>
          <div className="hidden md:block h-px flex-1 bg-muted min-w-[20px]"></div>
          <div className="flex items-center gap-1 md:gap-2 text-primary shrink-0">
            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] md:text-xs">2</div>
            <Truck className="h-3 w-3 md:h-4 md:w-4" />
            <span>Entrega</span>
          </div>
          <div className="hidden md:block h-px flex-1 bg-muted min-w-[20px]"></div>
          <div className="flex items-center gap-1 md:gap-2 text-primary shrink-0">
            <div className="h-5 w-5 md:h-6 md:w-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] md:text-xs">3</div>
            <CreditCard className="h-3 w-3 md:h-4 md:w-4" />
            <span>Pagamento</span>
          </div>
        </div>

        <section className="bg-card border rounded-xl p-4 md:p-5 space-y-3 shadow-sm">
          <h2 className="font-bold flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">1</div>
            Identificação
          </h2>
          <div className="grid sm:grid-cols-2 gap-3 mt-4">
            <div><Label>Nome completo</Label><Input value={nome} onChange={(e) => setNome(e.target.value)} /></div>
            <div><Label>E-mail</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
            <div><Label>CPF</Label><Input placeholder="000.000.000-00" value={cpf} onChange={handleCpfChange} /></div>
            <div><Label>Telefone</Label><Input placeholder="(51) 90000-0000" value={telefone} onChange={handleTelefoneChange} /></div>
          </div>
        </section>

        <section className="bg-card border rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
          <h2 className="font-bold flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">2</div>
            Opções de Entrega
          </h2>

          <div className="grid sm:grid-cols-2 gap-4 mt-2">
            <div className={`border rounded-lg p-4 transition ${deliveryMethod === "store" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
              <label className="cursor-pointer flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="store"
                    checked={deliveryMethod === "store"} 
                    onChange={() => {
                      setSelectedFreight("pickup");
                      if (!pickupPersonType) {
                        if (isServiceCart) {
                          setPickupPersonType("self");
                        } else {
                          setPickupDialogOpen(true);
                        }
                        setHasPromptedPickup(true);
                      }
                    }} 
                    className="h-4 w-4 text-primary accent-primary" 
                  />
                  <Store className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">{isServiceCart ? "Atendimento na Loja" : "Retirar na Loja"}</span>
                </div>
                <p className="text-xs text-muted-foreground ml-7">
                  {isServiceCart 
                    ? <>O atendimento será realizado na unidade: <strong>{activeStore?.razaoSocial || activeStore?.nome}</strong>. {activeStore?.tempoRetirada ? `Retirada em até ${activeStore.tempoRetirada}.` : 'Retirada a partir de 30 minutos.'}</>
                    : <>Você deve retirar na unidade: <strong>{activeStore?.razaoSocial || activeStore?.nome}</strong>. {activeStore?.tempoRetirada ? `Retirada em até ${activeStore.tempoRetirada}.` : 'Retirada a partir de 30 minutos.'}</>
                  }
                </p>
              </label>

              {deliveryMethod === "store" && activeStore && (
                <div className="ml-7 mt-2 bg-emerald-50 text-emerald-900 text-xs p-3 rounded border border-emerald-200 animate-in fade-in slide-in-from-top-2 cursor-default" onClick={(e) => e.preventDefault()}>
                  <div className="font-bold flex items-center gap-1.5 mb-1.5"><MapPin className="h-4 w-4"/> {hasService ? "Local de Realização do Serviço" : "Atenção ao Endereço de Retirada"}</div>
                  <p>{hasService ? "Dirija-se ao local abaixo para realização do serviço:" : "O seu pedido deverá ser retirado presencialmente no seguinte endereço:"}</p>
                  <p className="mt-1.5 font-bold text-sm bg-white p-2 rounded shadow-sm border border-emerald-100">{activeStore.endereco}</p>
                  {activeStore.horarioFuncionamento && (
                    <p className="mt-1.5"><strong>Horário de funcionamento:</strong> {activeStore.horarioFuncionamento}</p>
                  )}
                </div>
              )}

              {deliveryMethod === "store" && !pickupPersonType && (
                <div className="mt-4 pt-4 border-t border-primary/20 animate-in fade-in">
                  <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5" onClick={() => setPickupDialogOpen(true)}>
                    Informar quem irá retirar o pedido
                  </Button>
                </div>
              )}
              
              {deliveryMethod === "store" && pickupPersonType === "other" && (
                <div className="flex flex-col gap-3 mt-4 pt-4 border-t border-primary/20 animate-in fade-in">
                  <div className="font-bold text-sm text-primary">Dados da pessoa autorizada a retirar:</div>
                  <div><Label>Nome</Label><Input value={authName} onChange={(e) => setAuthName(e.target.value)} className="bg-white" /></div>
                  <div><Label>CPF</Label><Input value={authCpf} onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/(\d{3})(\d)/, "$1.$2");
                    v = v.replace(/(\d{3})(\d)/, "$1.$2");
                    v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                    setAuthCpf(v);
                  }} className="bg-white" /></div>
                  <div><Label>Telefone</Label><Input value={authPhone} onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length > 11) v = v.slice(0, 11);
                    v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
                    v = v.replace(/(\d)(\d{4})$/, "$1-$2");
                    setAuthPhone(v);
                  }} className="bg-white" /></div>
                  <div className="mt-1">
                    <Button variant="outline" size="sm" onClick={() => setPickupPersonType("self")} className="w-full sm:w-auto">Alterar para Eu mesmo vou retirar</Button>
                  </div>
                </div>
              )}
              
              {deliveryMethod === "store" && pickupPersonType === "self" && !isServiceCart && (
                <div className="mt-4 pt-4 border-t border-primary/20 animate-in fade-in">
                  <div className="flex flex-col xl:flex-row xl:items-center gap-3 xl:justify-between text-sm">
                    <span className="flex items-center gap-2"><User className="h-4 w-4 text-primary shrink-0" /><span><strong>Você mesmo</strong> irá retirar o pedido.</span></span>
                    <Button variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setPickupDialogOpen(true)}>Alterar pessoa</Button>
                  </div>
                </div>
              )}
            </div>
            
            {!forceStore && (
              <label className={`border rounded-lg p-4 cursor-pointer flex flex-col gap-2 transition h-fit ${deliveryMethod === "home" ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                <div className="flex items-center gap-3">
                  <input 
                    type="radio" 
                    name="delivery" 
                    value="home"
                    checked={deliveryMethod === "home"}
                    onChange={() => {
                      const firstHome = deliveryOpts[0];
                      if (firstHome) setSelectedFreight(firstHome.id);
                    }}
                    className="h-4 w-4 text-primary accent-primary" 
                  />
                  <Home className="h-5 w-5 text-primary" />
                  <span className="font-bold text-sm">Receber em casa</span>
                </div>
                <p className="text-xs text-muted-foreground ml-7">A <strong>{activeStore?.razaoSocial || activeStore?.nome}</strong> fará a entrega no endereço cadastrado.</p>
              </label>
            )}
            
            {forceStore && (
              <div className="col-span-full bg-red-50 text-red-800 p-3 rounded-lg text-xs border border-red-100 font-bold h-fit">
                {hasPrescription
                  ? "⚠️ Seu pedido contém medicamentos controlados ou serviços de saúde. A entrega em domicílio não está disponível, por favor escolha a opção de atendimento na Loja."
                  : "⚠️ A unidade selecionada não realiza entregas em domicílio. Por favor, escolha a opção de Retirar na Loja."}
              </div>
            )}
          </div>

          {deliveryMethod === "home" && (
            <div className="mt-4 pt-4 border-t space-y-4">
              <div className="flex flex-col gap-3">
                <Label className="font-bold">Opção de Envio</Label>
                <div className="grid sm:grid-cols-2 gap-3">
                  {deliveryOpts.map(opt => {
                    const Icon = opt.icon || Truck; // Fallback
                    const active = selectedFreight === opt.id;
                    return (
                      <label key={opt.id} className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${active ? "border-primary bg-primary/5 ring-1 ring-primary" : "hover:border-primary/50"}`}>
                        <input 
                          type="radio" 
                          name="freightSpeed" 
                          checked={active} 
                          onChange={() => setSelectedFreight(opt.id)}
                          className="accent-primary" 
                        />
                        <Icon className={`h-4 w-4 ${opt.price === 0 ? "text-green-600" : "text-primary"}`} />
                        <div className="flex-1">
                          <div className="font-bold text-sm">{opt.label}</div>
                          <div className="text-xs text-muted-foreground">{opt.eta}</div>
                        </div>
                        <span className={`font-bold text-sm ${opt.price === 0 ? "text-green-600" : ""}`}>
                          {opt.price === 0 ? "Grátis" : brl(opt.price)}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="grid sm:grid-cols-4 gap-3 pt-4 border-t">
                <div className="sm:col-span-1"><Label>CEP</Label><Input placeholder="00000-000" value={formCep} onChange={handleCepChange} /></div>
                <div className="sm:col-span-3"><Label>Endereço</Label><Input placeholder="Nome da rua, avenida..." value={rua} onChange={(e) => setRua(e.target.value)} /></div>
                <div className="sm:col-span-1">
                  <Label>Número <span className="text-red-500">*</span></Label>
                  <Input placeholder="Ex: 123" value={numero} onChange={(e) => setNumero(e.target.value)} />
                </div>
                <div className="sm:col-span-3"><Label>Complemento</Label><Input placeholder="Apto, Bloco, Casa (Opcional)" value={complemento} onChange={(e) => setComplemento(e.target.value)} /></div>
              </div>
            </div>
          )}
        </section>

        <section className="bg-card border rounded-xl p-4 md:p-5 space-y-4 shadow-sm">
          <h2 className="font-bold flex items-center gap-2">
            <div className="h-5 w-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs">3</div>
            Forma de Pagamento
          </h2>
          
          <div className="space-y-6">
            <div className="flex gap-2 p-1 bg-slate-100 rounded-lg">
              <button 
                onClick={() => { setPaymentCategory("online"); setPaymentMethod("credit"); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${paymentCategory === "online" ? "bg-white shadow text-primary" : "text-muted-foreground hover:bg-white/50"}`}
              >
                Pagar online
              </button>
              <button 
                onClick={() => { setPaymentCategory("offline"); setPaymentMethod("credit_machine"); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition ${paymentCategory === "offline" ? "bg-white shadow text-primary" : "text-muted-foreground hover:bg-white/50"}`}
              >
                {deliveryMethod === "store" ? (isServiceCart ? "Pagar no local do atendimento" : "Pagar na retirada na farmácia") : "Pagar na entrega"}
              </button>
            </div>

            {paymentCategory === "online" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid sm:grid-cols-2 gap-3">
                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "credit" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "credit"} onChange={() => setPaymentMethod("credit")} className="accent-primary" />
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold leading-tight mt-1">Cartão de Crédito</span>
                  </label>
                  
                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "pix" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "pix"} onChange={() => setPaymentMethod("pix")} className="accent-primary" />
                      <QrCode className="w-5 h-5 text-primary" />
                    </div>
                    <span className="text-sm font-bold leading-tight mt-1">Pix</span>
                  </label>
                </div>
              </div>
            )}

            {paymentCategory === "offline" && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "credit_machine" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "credit_machine"} onChange={() => setPaymentMethod("credit_machine")} className="accent-primary" />
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Cartão de Crédito<br/><span className="text-[10px] font-medium text-muted-foreground">(Maquininha)</span></span>
                  </label>
                  
                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "debit_machine" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "debit_machine"} onChange={() => setPaymentMethod("debit_machine")} className="accent-primary" />
                      <CreditCard className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Cartão de Débito<br/><span className="text-[10px] font-medium text-muted-foreground">(Maquininha)</span></span>
                  </label>

                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "cash" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "cash"} onChange={() => setPaymentMethod("cash")} className="accent-primary" />
                      <Banknote className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Dinheiro</span>
                  </label>

                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "pix_machine" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "pix_machine"} onChange={() => setPaymentMethod("pix_machine")} className="accent-primary" />
                      <QrCode className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Pix</span>
                  </label>

                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "pbm" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "pbm"} onChange={() => setPaymentMethod("pbm")} className="accent-primary" />
                      <Tag className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Convênio</span>
                  </label>

                  <label className={`border rounded-lg p-3 cursor-pointer flex flex-col gap-1.5 transition ${paymentMethod === "crediario" ? "border-primary bg-primary/5 ring-1 ring-primary shadow-sm" : "hover:border-primary/50"}`}>
                    <div className="flex items-center justify-between">
                      <input type="radio" name="payment" checked={paymentMethod === "crediario"} onChange={() => setPaymentMethod("crediario")} className="accent-primary" />
                      <Users className="w-4 h-4 text-primary" />
                    </div>
                    <span className="text-xs font-bold leading-tight mt-1">Crediário</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {paymentCategory === "online" && paymentMethod === "credit" && (
            <div className="grid gap-8 pt-6 border-t lg:grid-cols-[1fr_1fr] items-start">
              
              <div className="relative w-full max-w-[340px] h-[200px] mx-auto [perspective:1000px] mt-2">
                <div className={`relative w-full h-full transition-transform duration-700 [transform-style:preserve-3d] ${focusedField === 'cvv' ? '[transform:rotateY(180deg)]' : ''}`}>
                  {/* Front */}
                  <div className="absolute w-full h-full [backface-visibility:hidden] bg-gradient-to-tr from-slate-800 to-slate-600 rounded-2xl shadow-xl text-white p-5 flex flex-col justify-between border border-slate-700">
                    <div className="flex justify-between items-start">
                      <div className="w-12 h-9 bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-md opacity-90 shadow-sm" />
                      <div className="font-black italic text-lg opacity-80">{
                        (cardNumber.replace(/\D/g, "").startsWith("4") && "VISA") ||
                        (/^5[1-5]/.test(cardNumber.replace(/\D/g, "")) && "MASTERCARD") ||
                        (/^3[47]/.test(cardNumber.replace(/\D/g, "")) && "AMEX") ||
                        (/^6/.test(cardNumber.replace(/\D/g, "")) && "DISCOVER") ||
                        "CARTÃO"
                      }</div>
                    </div>
                    <div className={`text-2xl font-mono tracking-widest p-1.5 -mx-1.5 rounded transition-colors ${focusedField === 'number' ? 'ring-2 ring-emerald-400 bg-white/10' : ''}`}>
                      {cardNumber || "•••• •••• •••• ••••"}
                    </div>
                    <div className="flex justify-between items-end">
                      <div className={`p-1.5 -mx-1.5 rounded transition-colors ${focusedField === 'name' ? 'ring-2 ring-emerald-400 bg-white/10' : ''}`}>
                        <div className="text-[10px] uppercase opacity-70 font-medium tracking-wider mb-0.5">Nome do Titular</div>
                        <div className="font-bold truncate max-w-[180px]">{cardName.toUpperCase() || "NOME DO TITULAR"}</div>
                      </div>
                      <div className={`p-1.5 -mx-1.5 rounded transition-colors text-right ${focusedField === 'expiry' ? 'ring-2 ring-emerald-400 bg-white/10' : ''}`}>
                        <div className="text-[10px] uppercase opacity-70 font-medium tracking-wider mb-0.5">Validade</div>
                        <div className="font-bold">{cardExpiry || "MM/AA"}</div>
                      </div>
                    </div>
                  </div>
                  {/* Back */}
                  <div className="absolute w-full h-full [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-bl from-slate-700 to-slate-800 rounded-2xl shadow-xl text-white flex flex-col overflow-hidden border border-slate-600">
                    <div className="w-full h-10 bg-black mt-6 opacity-80" />
                    <div className="px-5 mt-4">
                      <div className="text-[10px] text-right pr-2 uppercase opacity-70 mb-1 font-medium tracking-wider">CVV</div>
                      <div className="bg-slate-200 h-10 rounded text-slate-800 flex items-center justify-end px-3">
                        <span className={`font-mono transition-colors px-2 py-0.5 rounded italic ${focusedField === 'cvv' ? 'ring-2 ring-emerald-500 bg-white' : ''}`}>
                          {cardCvv || "•••"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                <div>
                  <Label>Número do cartão</Label>
                  <Input 
                    placeholder="0000 0000 0000 0000" 
                    value={cardNumber} 
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 16) v = v.slice(0,16);
                      v = v.replace(/(\d{4})(?=\d)/g, "$1 ");
                      setCardNumber(v.trim());
                    }}
                    onFocus={() => setFocusedField("number")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div>
                  <Label>Nome do titular</Label>
                  <Input 
                    placeholder="Como escrito no cartão" 
                    value={cardName} 
                    onChange={e => setCardName(e.target.value)}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Validade</Label>
                    <Input 
                      placeholder="MM/AA" 
                      value={cardExpiry}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0,4);
                        if (v.length > 2) v = v.replace(/(\d{2})(\d)/, "$1/$2");
                        setCardExpiry(v);
                      }}
                      onFocus={() => setFocusedField("expiry")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </div>
                  <div>
                    <Label>CVV</Label>
                    <Input 
                      placeholder="123" 
                      value={cardCvv}
                      onChange={e => {
                        let v = e.target.value.replace(/\D/g, "");
                        if (v.length > 4) v = v.slice(0,4);
                        setCardCvv(v);
                      }}
                      onFocus={() => setFocusedField("cvv")}
                      onBlur={() => setFocusedField(null)}
                      type="password"
                      maxLength={4}
                    />
                  </div>
                </div>
                <div>
                  <Label>CPF do titular do cartão</Label>
                  <Input 
                    placeholder="000.000.000-00" 
                    value={cardCpf} 
                    onChange={e => {
                      let v = e.target.value.replace(/\D/g, "");
                      if (v.length > 11) v = v.slice(0, 11);
                      v = v.replace(/(\d{3})(\d)/, "$1.$2");
                      v = v.replace(/(\d{3})(\d)/, "$1.$2");
                      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                      setCardCpf(v);
                    }}
                  />
                </div>
                <div>
                  <Label>Parcelamento</Label>
                  <select 
                    value={installments} 
                    onChange={e => setInstallments(e.target.value)}
                    className="w-full flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => {
                      const totalForNum = num <= 6 ? baseFinalTotal : baseFinalTotal * Math.pow(1.0199, num);
                      return (
                        <option key={num} value={String(num)}>
                          {num}x de {brl(totalForNum / num)} {num <= 6 ? "sem juros" : "com juros"}
                        </option>
                      );
                    })}
                  </select>
                </div>
              </div>

            </div>
          )}

          {paymentCategory === "online" && paymentMethod === "pix" && (
            <p className="text-sm text-muted-foreground mt-4 pt-6 border-t">
              O QR Code e o código Pix Copia e Cola serão gerados na próxima etapa, após você clicar em "Finalizar pedido". A aprovação é imediata.
            </p>
          )}
        </section>
      </div>

      <aside className="lg:sticky lg:top-32 h-fit bg-card border rounded-xl p-4 md:p-5 shadow-elevated min-w-0">
        <h2 className="font-bold mb-3">Resumo do Pedido</h2>
        <div className="space-y-3 max-h-72 overflow-auto scrollbar-thin">
          {visibleItems.map((i) => (
            <div key={i.id} className="flex gap-2 text-sm border-b pb-2 last:border-0 last:pb-0">
              <img src={productImage(i)} className="h-10 w-10 object-contain bg-white border rounded shadow-sm" alt="" />
              <div className="flex-1 min-w-0">
                <div className="line-clamp-2 font-bold text-[11px] leading-tight mb-1">{i.nome}</div>
                <div className="flex flex-wrap gap-1 mb-1">
                  {i.categoriaId === "142" && i.tarja && i.tarja !== "Sem Tarja" && (
                    <span className={`text-[9px] px-1 py-0.5 rounded font-bold shadow-sm ${tarjaColor(i.tarja)}`}>
                      Tarja: {i.tarja}
                    </span>
                  )}
                  {i.categoriaId === "142" && i.retemReceita && (
                    <span className="text-[9px] px-1 py-0.5 rounded shadow-sm bg-red-600 text-white font-bold">
                      Retém receita
                    </span>
                  )}
                  {i.categoriaId === "142" && i.tarja && i.tarja !== "Sem Tarja" && !i.retemReceita && (
                    <span className="text-[9px] px-1 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 font-bold border border-slate-200">
                      Não retém receita
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1.5">
                  <div className="flex items-center border rounded-md">
                    <button type="button" onClick={() => i.qty > 1 ? setQty(i.id, i.qty - 1) : remove(i.id)} className="px-2 py-0.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-900 transition-colors">-</button>
                    <span className="px-2 py-0.5 text-xs font-medium border-x bg-slate-50 min-w-[2rem] text-center">{i.qty}</span>
                    <button type="button" onClick={() => setQty(i.id, i.qty + 1)} className="px-2 py-0.5 text-muted-foreground hover:bg-slate-100 hover:text-slate-900 transition-colors">+</button>
                  </div>
                  <div className="text-muted-foreground text-xs">{brl(getEffectivePrice(i, selectedPharmacyId).precoPor)} cada</div>
                </div>
              </div>
              <div className="font-bold text-xs pl-2">{brl(getEffectivePrice(i, selectedPharmacyId).precoPor * i.qty)}</div>
            </div>
          ))}
        </div>


        <div className="border-t mt-4 pt-4 space-y-1.5 text-sm">
          <div className="mb-4 space-y-1">
            <Label className="font-bold text-xs text-muted-foreground uppercase tracking-wider">Cupom de Desconto</Label>
            {!couponApplied ? (
              <>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Ex: PROMO10" 
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError("");
                    }}
                    className="uppercase"
                  />
                  <Button variant="secondary" onClick={applyCoupon}>Aplicar</Button>
                </div>
                {couponError && <p className="text-red-500 text-xs font-bold mt-1">{couponError}</p>}
              </>
            ) : (
              <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                  <Tag className="w-4 h-4" />
                  <span>{couponApplied.code} aplicado</span>
                </div>
                <button 
                  onClick={() => {
                    setCouponApplied(null);
                    setCouponInput("");
                    toast.info("Cupom removido.");
                  }}
                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 transition"
                  title="Remover cupom"
                >
                  <span className="hidden sm:inline">Remover</span>
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="font-medium">{brl(visibleSubtotal)}</span>
          </div>
          {visibleStoreDisc > 0 && (
            <div className="flex justify-between text-green-600 font-bold">
              <span>Desconto loja</span>
              <span>−{brl(visibleStoreDisc)}</span>
            </div>
          )}
          {orderBumpDiscount > 0 && (
            <div className="flex justify-between font-bold">
              <span className="text-purple-700">Desconto da Oferta Especial</span>
              <span className="text-emerald-600">−{brl(orderBumpDiscount)}</span>
            </div>
          )}
          {visiblePbmDisc > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Desconto {visiblePbm ? visiblePbm.provider : "Laboratório"}</span>
              <span className="text-accent font-bold">−{brl(visiblePbmDisc)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">{deliveryMethod === "store" ? "Retirada" : "Frete"}</span>
            <span className={`font-medium ${fretePrice === 0 ? "text-green-600 font-bold" : ""}`}>
              {fretePrice === 0 ? "Grátis" : brl(fretePrice)}
            </span>
          </div>
          {couponApplied && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Desconto do cupom:</span>
              <span>−{brl(couponApplied.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-4 border-t mt-4">
            <span>Total</span>
            <span className="text-foreground">{brl(finalTotal)}</span>
          </div>
        </div>

        {orderBumps.length > 0 && (
          <div className="bg-pink-50/50 border border-pink-100 rounded-xl p-4 mt-6">
            <h2 className="font-bold text-pink-800 mb-3 flex items-center justify-between flex-wrap gap-2">
              <span className="flex items-center gap-2">
                <Star className="w-5 h-5 fill-pink-500 text-pink-500" /> Oferta Especial para Você
              </span>
              {orderBumps.length > 2 && (
                <span className="flex items-center gap-1.5 text-xs bg-pink-100 px-2 py-1 rounded-full text-pink-700 font-medium whitespace-nowrap">
                  <Clock className="w-3.5 h-3.5" />
                  Novas ofertas em 00:{orderBumpTimeLeft.toString().padStart(2, '0')}
                </span>
              )}
            </h2>
            <div className="relative px-6 min-w-0">
              <Carousel 
                opts={{ align: "start", loop: true, slidesToScroll: 2 }} 
                setApi={setApi}
                className="w-full"
              >
                <CarouselContent className="-ml-3">
                  {orderBumps.map((p) => {
                    const originalPrice = p.precoPor || p.preco || 0;
                    const discountValue = originalPrice * ((orderBumpSettings?.discountPercentage || 1) / 100);
                    const newPrice = originalPrice - discountValue;

                    return (
                      <CarouselItem key={p.id} className="pl-3 basis-1/2">
                        <div className="border bg-white rounded-lg p-2 text-xs flex flex-col shadow-sm h-full">
                          <div className="flex-1 flex flex-col">
                            <div className="h-24 w-full flex items-center justify-center bg-white rounded mb-2">
                              <img
                                src={productImage(p)}
                                alt={p.nome}
                                className="max-h-full max-w-full object-contain"
                                onError={(e) => { (e.target as HTMLImageElement).src = 'https://via.placeholder.com/150?text=Sem+Imagem'; }}
                              />
                            </div>
                            <div className="line-clamp-2 font-bold mt-1 min-h-[32px] text-[11px] leading-snug">{p.nome}</div>
                            <div className="mt-auto pt-2">
                              <div className="flex items-baseline gap-1.5 flex-wrap">
                                <span className="font-bold text-sm text-foreground">{brl(newPrice)}</span>
                                <span className="text-[9px] text-muted-foreground line-through">{brl(originalPrice)}</span>
                              </div>
                              <div className="text-[9px] text-emerald-600 font-bold mt-1 bg-emerald-50 px-1 py-0.5 rounded w-fit border border-emerald-100">
                                Você economiza {brl(discountValue)}
                              </div>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full mt-3 h-8 text-xs flex items-center justify-center gap-1 font-bold"
                            variant="outline"
                            onClick={() => {
                              add({ ...p, precoPor: newPrice } as any, 1, true);
                              toast.success("Oferta adicionada ao pedido!");
                            }}
                          >
                            <Plus className="w-3 h-3" /> Adicionar
                          </Button>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                {orderBumps.length > 2 && (
                  <>
                    <CarouselPrevious className="absolute -left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white text-slate-700 hover:text-slate-900 shadow-md border-slate-200" />
                    <CarouselNext className="absolute -right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white text-slate-700 hover:text-slate-900 shadow-md border-slate-200" />
                  </>
                )}
              </Carousel>
            </div>
          </div>
        )}

        {(() => {
          const missingRequirements: string[] = [];
          if (visibleItems.length === 0) missingRequirements.push("Carrinho vazio");
          if (!nome.trim()) missingRequirements.push("Nome completo");
          if (!email.trim()) missingRequirements.push("E-mail");
          if (cpf.replace(/\D/g,"").length !== 11) missingRequirements.push("CPF válido");
          if (telefone.replace(/\D/g,"").length < 10) missingRequirements.push("Telefone válido");
          if (deliveryMethod === "home" && !numero.trim()) missingRequirements.push("Número do endereço");
          if (deliveryMethod === "store" && !pickupPersonType) missingRequirements.push("Quem irá retirar");
          if (deliveryMethod === "store" && pickupPersonType === "other") {
            if (!authName.trim()) missingRequirements.push("Nome do autorizado");
            if (authCpf.replace(/\D/g,"").length !== 11) missingRequirements.push("CPF do autorizado");
            if (authPhone.replace(/\D/g,"").length < 10) missingRequirements.push("Telefone do autorizado");
          }
          if (paymentCategory === "online" && paymentMethod === "credit") {
            if (cardNumber.replace(/\D/g, "").length < 13) missingRequirements.push("Número do Cartão");
            if (!cardName.trim()) missingRequirements.push("Nome no Cartão");
            if (cardExpiry.length < 5) missingRequirements.push("Validade do Cartão");
            if (cardCvv.length < 3) missingRequirements.push("CVV do Cartão");
            if (cardCpf.replace(/\D/g, "").length !== 11) missingRequirements.push("CPF do Titular do Cartão");
          }

          if (missingRequirements.length === 0) return null;

          return (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg text-xs mt-4 mb-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="font-bold mb-1.5 flex items-center gap-1.5"><AlertCircle className="w-4 h-4"/> Campos obrigatórios:</div>
              <ul className="list-disc pl-5 space-y-0.5">
                {missingRequirements.map(req => (
                  <li key={req}>{req}</li>
                ))}
              </ul>
            </div>
          );
        })()}

        <Button
          className="w-full mt-6 h-12 text-base font-bold shadow-sm disabled:opacity-50"
          size="lg"
          disabled={
            visibleItems.length === 0 || 
            !nome.trim() || 
            !email.trim() || 
            cpf.replace(/\D/g,"").length !== 11 || 
            telefone.replace(/\D/g,"").length < 10 || 
            (deliveryMethod === "home" && !numero.trim()) ||
            (deliveryMethod === "store" && !pickupPersonType) ||
            (deliveryMethod === "store" && pickupPersonType === "other" && (!authName.trim() || authCpf.replace(/\D/g,"").length !== 11 || authPhone.replace(/\D/g,"").length < 10)) ||
            (paymentCategory === "online" && paymentMethod === "credit" && (cardNumber.replace(/\D/g, "").length < 13 || !cardName.trim() || cardExpiry.length < 5 || cardCvv.length < 3 || cardCpf.replace(/\D/g, "").length !== 11))
          }
          onClick={() => { 
            try {
              checkoutSchema.parse({ nome, email, cpf, telefone });
            } catch (err) {
              if (err instanceof z.ZodError) {
                toast.error(err.errors[0].message);
                return;
              }
            }

            const newOrder = {
              id: String(Math.floor(Math.random() * 10000)),
              lojaId: activeStore?.id || "loja-poa-centro",
              data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
              cliente: {
                nome: nome,
                email: email,
                telefone: telefone,
                cpf: cpf,
                ip: "127.0.0.1",
                tipo: "Padrão"
              },
              pagamento: {
                metodo: {
                  credit: "Cartão de Crédito",
                  pix: "Pix",
                  credit_machine: "Cartão de Crédito (Maquininha)",
                  debit_machine: "Cartão de Débito (Maquininha)",
                  cash: "Dinheiro",
                  pix_machine: "Pix",
                  pbm: "Convênio",
                  crediario: "Crediário"
                }[paymentMethod as string] || "Outro",
                idTransacao: "TX" + Math.floor(Math.random() * 100000),
                cartaoFinal: paymentCategory === "online" && paymentMethod === "credit" && cardNumber.replace(/\D/g, "").length >= 4 
                  ? cardNumber.replace(/\D/g, "").slice(-4) 
                  : undefined
              },
              envio: {
                metodo: deliveryMethod === "store" ? "Retirada na Loja" : (selectedFreightObj?.label || "Entrega Padrão"),
                prazo: deliveryMethod === "store" ? "A partir de 30 minutos" : (selectedFreightObj?.eta || "Até 3 horas"),
                endereco: deliveryMethod === "home" ? `${rua}, ${numero} ${complemento}` : (activeStore?.endereco || ""),
                cidade: activeStore?.cidade || "",
                cep: deliveryMethod === "home" ? formCep : (geoCep || "")
              },
              status: "Pago",
              produtos: visibleItems.map(i => ({
                nome: i.nome,
                sku: String(i.id),
                cores: "N/A",
                disponibilidade: "Imediata",
                qtd: i.qty,
                valorUnitario: getEffectivePrice(i, selectedPharmacyId).precoPor,
                foto: productImage(i)
              })),
              valores: {
                produtos: visibleSubtotal,
                desconto: visibleStoreDisc + visiblePbmDisc + (couponApplied?.discount || 0),
                frete: fretePrice,
                total: finalTotal
              },
              historico: [
                { data: new Date().toLocaleDateString('pt-BR') + ' ' + new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }), situacao: "Pedido Efetuado", autor: "Cliente" }
              ],
              anotacoes: pickupPersonType === "other" ? `Autorizado para retirada: ${authName} (CPF: ${authCpf} - Tel: ${authPhone})` : ""
            };
              let localCardStatus = creditCardStatus;
              if (paymentCategory === "online" && paymentMethod === "credit") {
                const rand = Math.random();
                if (rand < 0.6) localCardStatus = "approved";
                else if (rand < 0.8) localCardStatus = "refused";
                else localCardStatus = "analysis";
                setCreditCardStatus(localCardStatus);
              }
              if (paymentCategory !== "online" || paymentMethod !== "credit" || localCardStatus !== "refused") {
                addOrder(newOrder);
                clear();
                
                // Gerar mensagem do WhatsApp
                const phone = (activeStore?.telefone || "51999999999").replace(/\D/g, "");
                const waNumber = phone.startsWith("55") ? phone : `55${phone}`;
                const itemsText = visibleItems.map(i => `- ${i.qty}x ${i.nome}`).join("%0A");
                const deliveryText = deliveryMethod === "store" ? "Retirada na Loja" : "Entrega em Domicílio";
                const totalText = brl(finalTotal);
                
                const text = `Olá! Acabei de fazer um pedido na loja virtual.%0A%0A*Pedido:* #${newOrder.id}%0A*Cliente:* ${nome}%0A*Entrega:* ${deliveryText}%0A%0A*Itens:*%0A${itemsText}%0A%0A*Total:* ${totalText}%0A%0AGostaria de prosseguir com o pedido.`;
                
                const waLink = `https://wa.me/${waNumber}?text=${text}`;
                window.open(waLink, "_blank");
              }
              setOrderedTotal(finalTotal);
              setDone(true); 
            }}
        >
          <Lock className="h-4 w-4 mr-2 opacity-50" />
          Finalizar Pedido {brl(finalTotal)}
        </Button>
      </aside>
    </div>
    
      <Dialog open={pickupDialogOpen} onOpenChange={(open) => {
        if (!open && !pickupPersonType) setPickupPersonType("self");
        setPickupDialogOpen(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Quem irá retirar o pedido?</DialogTitle>
          </DialogHeader>
          
          {pickupPersonType !== "other" ? (
            <div className="flex flex-col gap-3 py-4">
              <Button variant="outline" className="h-14 text-base font-bold justify-start px-6" onClick={() => {
                setPickupPersonType("self");
                setPickupDialogOpen(false);
              }}>
                <User className="h-5 w-5 mr-3" />
                Eu mesmo irei retirar
              </Button>
              <Button variant="outline" className="h-14 text-base font-bold justify-start px-6" onClick={() => {
                setPickupPersonType("other");
              }}>
                <Users className="h-5 w-5 mr-3" />
                Outra pessoa irá retirar
              </Button>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <p className="text-sm text-muted-foreground font-bold mb-2">Preencha os dados da pessoa autorizada a retirar o pedido.</p>
              <div>
                <Label>Nome completo do autorizado</Label>
                <Input value={authName} onChange={(e) => setAuthName(e.target.value)} />
              </div>
              <div>
                <Label>CPF do autorizado</Label>
                <Input placeholder="000.000.000-00" value={authCpf} onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length > 11) v = v.slice(0, 11);
                  v = v.replace(/(\d{3})(\d)/, "$1.$2");
                  v = v.replace(/(\d{3})(\d)/, "$1.$2");
                  v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
                  setAuthCpf(v);
                }} />
              </div>
              <div>
                <Label>Telefone do autorizado</Label>
                <Input placeholder="(51) 90000-0000" value={authPhone} onChange={(e) => {
                  let v = e.target.value.replace(/\D/g, "");
                  if (v.length > 11) v = v.slice(0, 11);
                  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
                  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
                  setAuthPhone(v);
                }} />
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="w-full" onClick={() => setPickupPersonType(null)}>Voltar</Button>
                <Button className="w-full" disabled={!authName.trim() || authCpf.replace(/\D/g, "").length !== 11 || authPhone.replace(/\D/g, "").length < 10} onClick={() => setPickupDialogOpen(false)}>Confirmar</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}