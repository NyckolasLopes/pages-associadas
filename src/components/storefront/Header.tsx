import { useEffect, useState, useMemo, useRef } from "react";
import { Fragment } from "react";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import {
  Search, MapPin, ShoppingBasket, Menu, Phone, User, X, Truck, Sparkles, Trash2,
  Pill, Leaf, Stethoscope, Baby, Flower2, ShoppingBag, Plus, Camera, Package, Home, Tag, ShieldCheck, ChevronDown, ChevronRight, LayoutGrid, Flame, HeartPulse, Navigation,
  Eye, Smile, Scale, BriefcaseMedical, Coffee, Dumbbell, Droplets, Activity, Thermometer, Battery, Wind, Percent, Heart, Bell, Loader2, ArrowRight, ArrowLeft, Ticket, TrendingDown, Mic
} from "lucide-react";
import { toast } from "sonner";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { VoiceSearchModal } from "./VoiceSearchModal";
import { PBMAuthModal } from "@/components/storefront/PBMAuthModal";
import { useSmartSticky } from "@/hooks/useSmartSticky";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { LoginModal } from "@/components/storefront/LoginModal";
import { useAuth } from "@/stores/auth";
import { reverseGeocodeLatLon } from "@/lib/geo";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCart, useGeoCep, getEffectivePrice } from "@/stores/cart";
import { catalog } from "@/services/catalog";
import type { Produto, Categoria } from "@/types";
import { brl, productImage, getGreeting, checkIsGenerico } from "@/lib/format";
import { getDeterministicStock } from "@/lib/stock";
import { cn, getLevePaguePromotion } from "@/lib/utils";
import { getRoadDistanceKm } from "@/lib/distanceApis";
import { sanitizeHtml } from "@/lib/security";

import categoriesData from "@/data/categories.json";
import { useAdmin } from "@/stores/admin";
import { useAdminProducts, mapRowToProduto } from "@/stores/products";
import { supabase } from "@/integrations/supabase/client";
import { useAdminCategories } from "@/stores/categories";
import { useMarcasStore } from "@/stores/marcas";
import { useMarketing } from "@/stores/marketing";
import { useSearchHistory } from "@/stores/searchHistory";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";

export function getEffectiveStoreSlug(paramsSlug?: string, activePharmacy?: any): string {
  if (paramsSlug && paramsSlug !== "loja-padrao" && !SYSTEM_PAGES.has(paramsSlug)) {
    return safeSlugify(paramsSlug);
  }
  if (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao") {
    return safeSlugify(activePharmacy.slug);
  }
  if (activePharmacy?.nome) {
    return safeSlugify(activePharmacy.nome);
  }
  if (typeof window !== "undefined") {
    const parts = window.location.pathname.split("/").filter(Boolean);
    if (parts[0] && !["admin", "login", "cadastro", "reset-password", "loja-padrao"].includes(parts[0])) {
      return safeSlugify(parts[0]);
    }
    try {
      const last = sessionStorage.getItem("fa-last-store-slug");
      if (last && last !== "loja-padrao") return safeSlugify(last);
    } catch {}
  }
  return "loja-padrao";
}

const FALLBACK_CATS_IDS = ["142", "143", "147", "144", "148", "200", "300"];
const getSafeCategories = () => Array.isArray(categoriesData) ? categoriesData : (categoriesData as any)?.default || [];
const FALLBACK_CATS = FALLBACK_CATS_IDS.map(id => getSafeCategories().find((c: any) => c.id === id)).filter(Boolean) as Categoria[];
// Special categories that should always show in menu regardless of products
const ALWAYS_SHOW_CATS = new Set(["200", "300"]);



const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "142": Pill,
  "143": Sparkles,
  "146": Leaf,
  "147": Stethoscope,
  "144": Baby,
  "145": Flower2,
  "148": ShoppingBag,
  "200": HeartPulse,
  "300": ShieldCheck,
};

import { MENU_ICON_MAP } from "@/components/admin/CategoryMenuIconModal";

const LUCIDE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  ...MENU_ICON_MAP,
  "pill": Pill,
  "sparkles": Sparkles,
  "leaf": Leaf,
  "stethoscope": Stethoscope,
  "baby": Baby,
  "flower2": Flower2,
  "shopping-bag": ShoppingBag,
  "heart-pulse": HeartPulse,
  "shield-check": ShieldCheck,
  "eye": Eye,
  "smile": Smile,
  "user": User,
  "scale": Scale,
  "activity": Activity,
  "briefcase-medical": BriefcaseMedical,
  "coffee": Coffee,
  "thermometer": Thermometer,
  "battery": Battery,
  "wind": Wind,
  "droplets": Droplets,
  "dumbbell": Dumbbell,
  "tag": Tag,
  "flame": Flame,
  "percent": Percent,
};

function getSubcategoryIcon(name: string) {
  const n = String(name || "").toLowerCase();
  if (n.includes("coração") || n.includes("pressão")) return HeartPulse;
  if (n.includes("olho") || n.includes("colírio") || n.includes("ocular")) return Eye;
  if (n.includes("dente") || n.includes("bucal") || n.includes("boca")) return Smile;
  if (n.includes("unha") || n.includes("esmalte")) return Sparkles;
  if (n.includes("mulher") || n.includes("ginecologia") || n.includes("gestante")) return Flower2;
  if (n.includes("homem") || n.includes("urologia") || n.includes("barba") || n.includes("lâmina") || n.includes("depilação")) return User;
  if (n.includes("emagrecer") || n.includes("peso") || n.includes("termogênico")) return Scale;
  if (n.includes("diabetes") || n.includes("glicose")) return Activity;
  if (n.includes("aparelho") || n.includes("medidor") || n.includes("médico") || n.includes("hospitalar") || n.includes("oxímetro")) return BriefcaseMedical;
  if (n.includes("alimento") || n.includes("bebida") || n.includes("papinha") || n.includes("fórmula")) return Coffee;
  if (n.includes("nervoso") || n.includes("calmante") || n.includes("fitoterápico")) return Leaf;
  if (n.includes("osso") || n.includes("articulaç")) return Activity;
  if (n.includes("socorro") || n.includes("curativo")) return BriefcaseMedical;
  if (n.includes("vacina") || n.includes("teste")) return Stethoscope;
  if (n.includes("desodorante") || n.includes("antitranspirante")) return Wind;
  if (n.includes("shampoo") || n.includes("condicionador") || n.includes("capilar")) return Wind;
  if (n.includes("íntim")) return HeartPulse;
  if ((n.includes("dor") && !n.includes("desodor")) || n.includes("febre") || n.includes("term") || n.includes("gripe") || n.includes("resfriado") || n.includes("alergia") || n.includes("infecç") || n.includes("estômago") || n.includes("digestão")) return Thermometer;
  if (n.includes("imunidade")) return ShieldCheck;
  if (n.includes("beb") || n.includes("infantil") || n.includes("mamadeira") || n.includes("chupeta") || n.includes("fralda")) return Baby;
  if (n.includes("multivitam") || n.includes("mineral") || n.includes("vitamina")) return Battery;
  if (n.includes("suplemento") || n.includes("whey") || n.includes("colágeno")) return Dumbbell;
  if (n.includes("beleza") || n.includes("maquiagem") || n.includes("cosmético") || n.includes("creme") || n.includes("pele") || n.includes("rosto") || n.includes("solar") || n.includes("acne") || n.includes("idade") || n.includes("loç")) return Sparkles;
  if (n.includes("banho") || n.includes("sabonete") || n.includes("higiene") || n.includes("cabelo") || n.includes("tintura")) return Droplets;
  if (n.includes("repelente") || n.includes("inseto")) return Leaf;
  return Tag;
}

export function Header() {
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const pharmacies = useAdmin(s => s.pharmacies);
  const params = useParams({ strict: false });
  const isStoreContext = !!(params && (params as any).storeSlug);
  const urlSlug = (params as any)?.storeSlug as string | undefined;
  
  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  const storeSlug = getEffectiveStoreSlug(urlSlug, activePharmacy);
  const customProducts = useAdminProducts(s => s.customProducts);
  const { featuredCategories, storeFeaturedCategories } = useAdmin();
  const contentPages = useAdmin(s => s.contentPages);
  const marcas = useMarcasStore(s => s.marcas);
  const allCategories = useAdminCategories(s => s.categories);
  
  const cats = useMemo(() => {
    // Use the admin store's featuredCategories list to determine which categories show in the menu
    // If the store has its own custom featured categories, use that instead.
    const effectiveFeatured = (selectedPharmacyId && storeFeaturedCategories[selectedPharmacyId]?.length > 0) 
      ? storeFeaturedCategories[selectedPharmacyId] 
      : featuredCategories;

    // Preserve the order from featuredCategories
    return effectiveFeatured
      .map(id => allCategories.find((c: any) => c.id === id && !c.parentId))
      .filter(Boolean) as Categoria[];
  }, [allCategories, featuredCategories, storeFeaturedCategories, selectedPharmacyId]);
  
  const searchHistory = useSearchHistory(s => s.history);
  const topSearchTerms = useMemo(() => {
    if (!selectedPharmacyId) return [];
    const storeHistory = searchHistory[selectedPharmacyId];
    if (!storeHistory) return [];
    const sortedEntries = Object.entries(storeHistory)
      .sort(([, countA], [, countB]) => countB - countA);
    return sortedEntries.slice(0, 5).map(([term]) => term);
  }, [searchHistory, selectedPharmacyId]);

  const defaultSuggestions = ["vitamina c", "dor de cabeça", "fralda", "desodorante", "shampoo"];
  const suggestions = topSearchTerms.length > 0 ? topSearchTerms : defaultSuggestions;
  
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Produto[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { cep, setCep } = useGeoCep();
  const [cepInput, setCepInput] = useState(cep);
  const count = useCart((s) => s.count());
  const drawerOpen = useCart((s) => s.drawerOpen);
  const setDrawer = useCart((s) => s.setDrawer);
  const navigate = useNavigate();
  const [loginOpen, setLoginOpen] = useState(false);
  const [cepDialogOpen, setCepDialogOpen] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);
  const [voiceOpen, setVoiceOpen] = useState(false);

  const handleVoiceSearch = () => {
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setVoiceOpen(true);
  };

  const handleVoiceResult = (transcript: string) => {
    const clean = transcript.trim();
    if (!clean) return;
    setQ(clean);
    setSearchOpen(false);
    setMobileSearchOpen(false);
    setVoiceOpen(false);

    // Redireciona diretamente para os resultados de busca achando o produto
    navigate({
      to: "/$storeSlug/busca",
      params: { storeSlug },
      search: { q: clean } as any,
    });
  };

  const handleCheckoutClick = () => {
    if (!useAuth.getState().user) {
      setDrawer(false);
      navigate({ to: "/$storeSlug/login", params: { storeSlug }, search: { redirect: `/${storeSlug}/cart` } as any });
    } else {
      setDrawer(false);
      navigate({ to: "/$storeSlug/cart", params: { storeSlug } as any });
    }
  };

  useEffect(() => {
    const handleOpenGeo = () => setCepDialogOpen(true);
    document.addEventListener("open-geo-popup", handleOpenGeo);
    return () => {
      document.removeEventListener("open-geo-popup", handleOpenGeo);
    };
  }, []);

  const handleClearError = () => {
    setScanError(null);
  };
  const rawUser = useAuth((s) => s.user);
  const user = useMemo(() => {
    if (rawUser && rawUser.storeSlug === storeSlug) return rawUser;
    return useAuth.getState().getUserForStore(storeSlug);
  }, [rawUser, storeSlug]);

  useEffect(() => {
    if (storeSlug) {
      useAuth.getState().syncStoreSession(storeSlug);
    }
  }, [storeSlug]);

  const detectCep = (closeFn: () => void) => {
    if (navigator.geolocation) {
      setIsGeoLoading(true);
      const toastId = toast.loading("Localizando você...");

      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          useGeoCep.getState().setCoordinates(lat, lng);

          try {
            const foundCep = await reverseGeocodeLatLon(lat, lng);

            if (foundCep && foundCep.length === 8) {
              await setCep(foundCep);
              setCepInput(foundCep);

              setIsGeoLoading(false);
              closeFn();
              toast.success("CEP localizado com sucesso!", { id: toastId });

              const pharmacies = useAdmin.getState().pharmacies;
              const withCoords = pharmacies.filter(p => p.lat && p.lng);
              if (withCoords.length > 0) {
                const dists = await Promise.all(withCoords.map(p => getRoadDistanceKm(lat, lng, p.lat!, p.lng!)));
                let closest: any = null;
                let minD = Infinity;
                dists.forEach((d, i) => { if (d < minD) { minD = d; closest = withCoords[i]; } });
                if (closest) {
                  setTimeout(() => toast.success(`Encontramos a loja mais próxima! ${closest.nome} a ${minD.toFixed(1)} km`), 1500);
                }
              }
            } else {
              setIsGeoLoading(false);
              toast.error("Não foi possível identificar seu CEP. Digite manualmente.", { id: toastId });
            }
          } catch (e) {
            console.error("Geocoding error:", e);
            setIsGeoLoading(false);
            toast.error("Erro ao localizar CEP. Tente digitar manualmente.", { id: toastId });
          }
        },
        () => {
          setIsGeoLoading(false);
          toast.error("Permissão de localização negada. Por favor, digite seu CEP manualmente.", { id: toastId });
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setIsGeoLoading(false);
      toast.error("Não suportado pelo navegador. Por favor, digite seu CEP manualmente.");
      closeFn();
    }
  };

  const handleApplyCep = async (inputVal: string, closeFn: () => void) => {
    if (inputVal.trim()) {
      setIsGeoLoading(true);
      const toastId = toast.loading("Aguarde um momento validando seu cep...");

      await setCep(inputVal.trim());
      const { lat, lng } = useGeoCep.getState();

      setIsGeoLoading(false);
      closeFn();
      toast.success("CEP validado com sucesso!", { id: toastId });

      if (lat && lng) {
        const pharmacies = useAdmin.getState().pharmacies;
        const withCoords = pharmacies.filter(p => p.lat && p.lng);
        if (withCoords.length > 0) {
          const dists = await Promise.all(withCoords.map(p => getRoadDistanceKm(lat, lng, p.lat!, p.lng!)));
          let closest: any = null;
          let minD = Infinity;
          dists.forEach((d, i) => { if (d < minD) { minD = d; closest = withCoords[i]; } });
          if (closest) {
            setTimeout(() => toast.success(`Encontramos a loja mais próxima! ${closest.nome} a ${minD.toFixed(1)} km`), 1000);
          }
        }
      }
    } else {
      closeFn();
    }
  };

  useEffect(() => {
    setMounted(true);
    // Note: useAuth and useGeoCep are already hydrated in __root.tsx
  }, []);

  useEffect(() => {
    const trimmed = q.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    let cancelled = false;
    const t = setTimeout(() => {
      catalog.search(trimmed, { pageSize: 6 }, activePharmacy?.id || selectedPharmacyId)
        .then((res) => {
          if (!cancelled) {
            setResults(res || []);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setResults([]);
          }
        })
        .finally(() => {
          if (!cancelled) {
            setIsSearching(false);
          }
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [q, activePharmacy?.id, selectedPharmacyId]);

  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) {
      setSearchOpen(false);
      setMobileSearchOpen(false);
      navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: q.trim() } } as any);
    }
  };

  const handleScan = async (rawCode: string) => {
    const code = rawCode.trim();
    if (!code) return;
    const cleanDigits = code.replace(/\D/g, "");

    // 1. Try catalog search first
    const res = await catalog.search(code);
    let p = res.find((x) => {
      const eanStr = String(x.ean || "");
      const idStr = String(x.id || "");
      const skuStr = String(x.sku || "");
      const codIntStr = String(x.codigoInterno || "");
      const anvisaStr = String(x.registroAnvisa || (x as any).registro_anvisa || "").replace(/\D/g, "");
      const secEans = Array.isArray(x.eansSecundarios) ? x.eansSecundarios.map(String) : [];
      return eanStr === code || idStr === code || skuStr === code || codIntStr === code ||
        (cleanDigits.length >= 6 && anvisaStr === cleanDigits) ||
        secEans.includes(code) || eanStr === '0' + code || '0' + eanStr === code;
    });

    // 2. Fallback to direct Supabase search if not in immediate catalog cache
    if (!p) {
      try {
        const clauses = [`ean.eq.${code}`, `id.eq.${code}`, `codigo_interno.eq.${code}`];
        if (cleanDigits.length >= 6) {
          clauses.push(`registro_anvisa.ilike.%${cleanDigits}%`);
        }
        const { data } = await supabase
          .from('produtos')
          .select('*')
          .or(clauses.join(','))
          .limit(1)
          .maybeSingle();

        if (data) {
          p = mapRowToProduto(data);
        }
      } catch (e) {}
    }

    if (p) {
      toast.success("Produto escaneado com sucesso!");
      setScannerOpen(false);
      navigate({ 
        to: "/$storeSlug/produto/$slug", 
        params: { 
          storeSlug, 
          slug: p.url || p.slug || p.id 
        } as any 
      });
    } else {
      setScanError(`Produto não encontrado para o código: ${code}`);
    }
  };

  const { visible: smartVisible, isAtTop } = useSmartSticky(120);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const visible = isMobile ? isAtTop : smartVisible;

  return (
    <>
      <VoiceSearchModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={handleVoiceResult}
      />
      <BarcodeScannerModal 
        open={scannerOpen} 
        onOpenChange={(open) => {
          setScannerOpen(open);
          if (!open) setScanError(null);
        }} 
        onScan={handleScan}
        scanError={scanError}
        onClearError={handleClearError}
      />
      <header 
        className="sticky top-0 z-40 border-b shadow-sm"
        style={{ backgroundColor: 'var(--header-bg, var(--background))' }}
      >
      {/* Top Announcement Bar */}
      {(activePharmacy?.topBarText || !activePharmacy) && (
        <div 
          className="text-center text-xs py-1.5 font-bold flex items-center justify-center overflow-hidden"
          style={{ 
            backgroundColor: `var(--topbar-bg, ${activePharmacy?.topBarBgColor || 'var(--accent)'})`, 
            color: `var(--topbar-text, ${activePharmacy?.topBarTextColor || 'var(--accent-foreground)'})` 
          }}
        >
          <div>
            {activePharmacy?.topBarText || "Cupom de primeira compra: use 10OFF em compras acima de R$ 100,00"}
          </div>
        </div>
      )}

      {/* Top utility bar */}
      <div 
        className="text-xs hidden md:block"
        style={{ 
          backgroundColor: 'var(--info-bar-bg, var(--primary))', 
          color: 'var(--info-bar-text, var(--primary-foreground))' 
        }}
      >
        <div className="container-fa flex items-center justify-between h-9 gap-4">
          <span className="hidden md:inline font-bold text-[15.5px] tracking-wide">
            {activePharmacy?.apelido || (
              !(activePharmacy?.categoriaAssociado === 'Parceiro')
                ? "Aqui você tem amigos."
                : ""
            )}
          </span>
          <div className="flex items-center gap-2 md:gap-4 ml-auto overflow-x-auto whitespace-nowrap scrollbar-none">
            {contentPages.filter(p => p.location === "header" || p.location === "both").map(p => (
              p.type === "external" ? (
                <a key={p.id} href={p.externalUrl} target="_blank" rel="noreferrer" className="hidden lg:inline-flex items-center gap-1 hover:underline">
                  {p.title}
                </a>
              ) : (
                <Link key={p.id} to={"/pagina/$slug" as any} params={{ slug: p.slug } as any} className="hidden lg:inline-flex items-center gap-1 hover:underline">
                  {p.title}
                </Link>
              )
            ))}
            {(activePharmacy?.telefone || !activePharmacy) && (
              <a href={`tel:${(activePharmacy?.telefone || "5133633900").replace(/\D/g, '')}`} className="hidden lg:inline-flex items-center gap-1 hover:underline">
                <Phone className="h-3.5 w-3.5" /> {activePharmacy?.telefone || "(51) 3363-3900"}
              </a>
            )}
            {(activePharmacy?.whatsapp || !activePharmacy) && (
              <a href={`https://wa.me/55${(activePharmacy?.whatsapp || "51989444818").replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="hidden lg:inline-flex items-center gap-1 hover:underline">
                Whatsapp: {activePharmacy?.whatsapp || "(51) 98944-4818"}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* === DESKTOP MAIN BAR === */}
      <div className="container-fa hidden md:flex items-center gap-2 lg:gap-4 py-3">
        <Logo className="max-h-16 h-auto max-w-[240px]" />


        {/* Search */}
        <form onSubmit={onSubmit} className="flex-1 relative">
          <Popover open={searchOpen} onOpenChange={setSearchOpen}>
            <PopoverTrigger asChild>
              <div className="relative w-full">
                <Search 
                  className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" 
                  style={isParceiro ? { color: 'var(--search-icon, var(--muted-foreground))' } : undefined}
                />
                <Input
                  value={q}
                  onFocus={() => setSearchOpen(true)}
                  onChange={(e) => {
                    setQ(e.target.value);
                    setSearchOpen(true);
                  }}
                  placeholder="Escreva o que procura ou escaneie o código de barras"
                  style={isParceiro ? {
                    backgroundColor: 'var(--search-bg, #ffffff)',
                    color: 'var(--search-text, inherit)',
                    borderColor: 'var(--search-border, var(--border))',
                  } : undefined}
                  className="pl-10 h-11 rounded-full border-2 focus-visible:border-primary w-full pr-20"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    aria-label="Pesquisar por voz"
                    onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
                    className={`text-muted-foreground hover:text-primary transition-colors ${
                      voiceOpen ? "text-red-500 animate-pulse" : ""
                    }`}
                    style={isParceiro ? { color: voiceOpen ? undefined : 'var(--search-icon, var(--muted-foreground))' } : undefined}
                  >
                    <Mic className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Escanear código"
                    onClick={() => setScannerOpen(true)}
                    className="text-muted-foreground hover:text-primary transition-colors"
                    style={isParceiro ? { color: 'var(--search-icon, var(--muted-foreground))' } : undefined}
                  >
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] overflow-auto shadow-elevated border"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              {q.trim().length < 2 ? (
                <div className="p-3">
                  <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Sugestões de busca</div>
                  {suggestions.map((sug, i) => (
                    <button
                      key={i}
                      type="button"
                      className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted rounded text-sm transition font-medium"
                      onClick={() => {
                        setQ(sug);
                        setSearchOpen(false);
                        navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: sug } } as any);
                      }}
                    >
                      <Search className="h-3.5 w-3.5 text-primary" />
                      {sug}
                    </button>
                  ))}
                </div>
              ) : isSearching ? (
                <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Buscando produtos...
                </div>
              ) : results.length === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  <p>Nenhum produto encontrado para "<span className="font-semibold text-foreground">{q}</span>".</p>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchOpen(false);
                      navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: q.trim() } } as any);
                    }}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full"
                  >
                    <Search className="h-3.5 w-3.5" /> Ver todos os produtos
                  </button>
                </div>
              ) : (
                <>
                  <div className="divide-y">
                    {results.map((p) => {
                      const storeId = activePharmacy?.id || selectedPharmacyId;
                      const ep = getEffectivePrice(p, storeId);
                      const stock = getDeterministicStock(p, storeId || '');
                      const isAvail = (stock > 0 || p.tipoProduto === "servico") && p.ativo !== false && (p.precosPorLoja?.[storeId || '']?.ativo !== false);

                      return (
                        <Link
                          key={p.id}
                          to={"/$storeSlug/produto/$slug" as any}
                          params={{ storeSlug, slug: p.url || p.slug || p.id } as any}
                          onClick={() => setSearchOpen(false)}
                          className="flex items-center gap-3 p-3 hover:bg-muted/80 transition"
                        >
                          <img
                            src={productImage(p)}
                            alt=""
                            loading="lazy"
                            className="h-12 w-12 object-contain rounded bg-white border shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-bold truncate text-foreground">{p.nome}</div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                              <span className="font-medium text-slate-700 dark:text-slate-300">{p.marca || "Associadas"}</span>
                              {p.tarja && !p.tarja.toLowerCase().includes("sem") && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                  p.tarja.toLowerCase().includes("preta") 
                                    ? "bg-slate-900 text-white" 
                                    : "bg-red-600 text-white"
                                }`}>
                                  {p.tarja}
                                </span>
                              )}
                            </div>
                            {Array.isArray(p.principiosAtivos) && p.principiosAtivos.length > 0 && (
                              <div className="text-[11px] text-muted-foreground/80 truncate">
                                {p.principiosAtivos.map((pa: any) => typeof pa === "string" ? pa : pa.nome).filter(Boolean).join(", ")}
                              </div>
                            )}
                          </div>
                          <div className="text-right shrink-0">
                            {isAvail ? (
                              <div className="text-sm font-bold text-primary">{brl(ep.precoPor)}</div>
                            ) : (
                              <span className="text-xs font-semibold text-slate-400">Indisponível</span>
                            )}
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t bg-muted/30">
                    <button
                      type="button"
                      className="w-full text-center text-sm font-bold text-primary py-2 hover:underline flex items-center justify-center gap-1.5"
                      onClick={() => {
                        setSearchOpen(false);
                        navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: q.trim() } } as any);
                      }}
                    >
                      Ver todos os resultados para "{q.trim()}" <ArrowRight className="h-4 w-4" />
                    </button>
                  </div>
                </>
              )}
            </PopoverContent>
          </Popover>
        </form>

        {/* Account & Pedidos */}
        <div className="hidden lg:flex items-center gap-4 ml-4">
          <Link to={user ? "/$storeSlug/pedidos" : "/$storeSlug/login"} params={{ storeSlug }} search={user ? undefined : { redirect: `/${storeSlug}/pedidos` } as any} className="flex items-center gap-2 hover:opacity-80 transition group">
            <div className={`p-2 rounded-full transition group-hover:bg-primary/20 ${!isParceiro ? 'bg-primary/10' : ''}`} style={isParceiro ? { backgroundColor: 'color-mix(in srgb, var(--header-icons, var(--primary)) 10%, transparent)' } : undefined}>
              <Package className={`h-5 w-5 ${!isParceiro ? 'text-primary' : ''}`} style={isParceiro ? { color: 'var(--header-icons, var(--primary))' } : undefined} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">Acompanhar</span>
              <span className="text-xs font-bold leading-tight">Meus Pedidos</span>
            </div>
          </Link>

          <Link to={user ? "/$storeSlug/perfil" : "/$storeSlug/login"} params={{ storeSlug }} search={user ? { tab: "favoritos" } : { redirect: `/${storeSlug}/perfil`, tab: "favoritos" } as any} className="flex items-center gap-2 hover:opacity-80 transition group">
            <div className={`p-2 rounded-full transition group-hover:bg-primary/20 ${!isParceiro ? 'bg-primary/10' : ''}`} style={isParceiro ? { backgroundColor: 'color-mix(in srgb, var(--header-icons, var(--primary)) 10%, transparent)' } : undefined}>
              <Heart className={`h-5 w-5 ${!isParceiro ? 'text-primary' : ''}`} style={isParceiro ? { color: 'var(--header-icons, var(--primary))' } : undefined} />
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-muted-foreground leading-tight">Ver Lista</span>
              <span className="text-xs font-bold leading-tight">Meus Favoritos</span>
            </div>
          </Link>

          <div className="w-px h-8 bg-border"></div>

          {mounted && user ? (
            <Link to="/$storeSlug/perfil" params={{ storeSlug }} className="flex flex-col items-start text-sm max-w-[120px] hover:opacity-80 transition cursor-pointer">
              <span className="text-[10px] font-bold text-muted-foreground leading-tight truncate w-full">
                {getGreeting()}
              </span>
              <span className="font-bold text-primary truncate w-full leading-tight">{user?.name?.split(" ")[0]}</span>
            </Link>
          ) : (
            <Button 
              variant="ghost" 
              onClick={() => navigate({ to: "/$storeSlug/login", params: { storeSlug }, search: { redirect: window.location.pathname } as any })}
              className="font-bold gap-1.5 transition-colors hover:!bg-primary/10 hover:!text-primary active:scale-95 text-slate-700"
              style={isParceiro ? { color: 'var(--header-icons, var(--foreground))' } : undefined}
            >
              <User className="h-4 w-4 mr-0.5" /> Entrar
            </Button>
          )}
        </div>
        {/* Cesta */}
        <Sheet open={mounted && drawerOpen} onOpenChange={setDrawer}>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              style={isParceiro ? {
                backgroundColor: 'var(--cart-btn-bg, #ffffff)',
                color: 'var(--cart-btn-text, var(--header-icons, var(--primary)))',
                borderColor: 'var(--cart-btn-text, var(--header-icons, var(--primary)))'
              } : undefined}
              className={`relative gap-2 transition-colors ${!isParceiro ? 'border-primary text-primary hover:bg-primary hover:text-white' : ''}`}
            >
              <ShoppingBasket className="h-5 w-5" />
              <span className="hidden sm:inline">Cesta</span>
              {mounted && count > 0 && (
                <span 
                  style={isParceiro ? {
                    backgroundColor: 'var(--cart-badge-bg, var(--accent))',
                    color: 'var(--cart-badge-text, var(--accent-foreground))'
                  } : undefined}
                  className="absolute -top-2 -right-2 bg-accent text-accent-foreground h-5 min-w-[1.25rem] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black leading-none text-center shadow-sm border border-white/20"
                >
                  {count}
                </span>
              )}
            </Button>
          </SheetTrigger>
          <CartDrawer onCheckoutClick={handleCheckoutClick} storeSlug={storeSlug} />
        </Sheet>
      </div>

      {/* === MOBILE HEADER (4 linhas) === */}
      <div className="md:hidden">
        {/* Apelido — mobile (equivalente à top bar do desktop) */}
        {activePharmacy?.apelido && (
          <div
            className="text-center text-xs py-1 font-bold tracking-wide truncate px-4"
            style={{
              backgroundColor: 'var(--info-bar-bg, var(--primary))',
              color: 'var(--info-bar-text, var(--primary-foreground))',
            }}
          >
            {activePharmacy.apelido}
          </div>
        )}
        {/* Linha 1: Logo | Cesta + Menu */}
        <div className="container-fa flex items-center justify-between py-2.5">
          <Logo className="max-h-12 h-auto max-w-[180px]" />
          <div className="flex items-center gap-2">
            <button
              aria-label="Pesquisar"
              className="relative h-10 w-10 rounded-full border flex items-center justify-center bg-background"
              onClick={() => {
                setMobileSearchOpen(!mobileSearchOpen);
                if (!mobileSearchOpen) {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
            >
              <Search className="h-5 w-5 text-primary" />
            </button>
            <Sheet open={mounted && drawerOpen} onOpenChange={setDrawer}>
              <SheetTrigger asChild>
                <button
                  aria-label="Abrir cesta"
                  style={isParceiro ? {
                    backgroundColor: 'var(--cart-btn-bg, var(--background))',
                    borderColor: 'var(--cart-btn-text, var(--border))'
                  } : undefined}
                  className="relative h-10 w-10 rounded-full border flex items-center justify-center bg-background"
                >
                  <ShoppingBasket 
                    className="h-5 w-5" 
                    style={isParceiro ? { color: 'var(--cart-btn-text, var(--primary))' } : undefined} 
                  />
                  {mounted && count > 0 && (
                    <span 
                      style={isParceiro ? {
                        backgroundColor: 'var(--cart-badge-bg, var(--accent))',
                        color: 'var(--cart-badge-text, var(--accent-foreground))'
                      } : undefined}
                      className="absolute -top-1.5 -right-1.5 bg-accent text-accent-foreground h-5 min-w-[1.25rem] px-1.5 rounded-full flex items-center justify-center text-[10px] font-black leading-none text-center shadow-sm border border-white/20"
                    >
                      {count}
                    </span>
                  )}
                </button>
              </SheetTrigger>
              <CartDrawer onCheckoutClick={handleCheckoutClick} storeSlug={storeSlug} />
            </Sheet>
            <MobileMenu cats={cats} />
          </div>
        </div>

        <div className={`transition-all duration-300 overflow-hidden ${mobileSearchOpen ? 'max-h-[100px] opacity-100' : 'max-h-0 opacity-0'}`}>
          {/* Linha 2: Busca 100% com lupa e câmera */}
          <div className="container-fa pb-2 pt-1">
            <form onSubmit={onSubmit} className="relative">
              <Popover open={mobileSearchOpen && searchOpen} onOpenChange={setSearchOpen}>
                <PopoverTrigger asChild>
                  <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={q}
                      onFocus={() => setSearchOpen(true)}
                      onChange={(e) => {
                        setQ(e.target.value);
                        setSearchOpen(true);
                      }}
                      placeholder="Escreva o que procura ou escaneie o código de barras"
                      className="pl-10 h-11 rounded-full border-2 w-full pr-20"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        type="button"
                        aria-label="Pesquisar por voz"
                        onClick={(e) => { e.stopPropagation(); handleVoiceSearch(); }}
                        className={`transition-colors ${
                          voiceOpen ? "text-red-500 animate-pulse" : "text-primary"
                        }`}
                      >
                        <Mic className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        aria-label="Escanear código"
                        onClick={() => setScannerOpen(true)}
                        className="text-primary"
                      >
                        <Camera className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0 max-h-[60vh] overflow-auto shadow-elevated border"
                  align="start"
                  onOpenAutoFocus={(e) => e.preventDefault()}
                >
                  {q.trim().length < 2 ? (
                    <div className="p-3">
                      <div className="text-xs font-bold text-muted-foreground mb-2 uppercase tracking-wide">Sugestões de busca</div>
                      {suggestions.map((sug, i) => (
                        <button
                          key={i}
                          type="button"
                          className="flex items-center gap-2 w-full text-left p-2 hover:bg-muted rounded text-sm transition font-medium"
                          onClick={() => {
                            setQ(sug);
                            setSearchOpen(false);
                            setMobileSearchOpen(false);
                            navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: sug } } as any);
                          }}
                        >
                          <Search className="h-3.5 w-3.5 text-primary" />
                          {sug}
                        </button>
                      ))}
                    </div>
                  ) : isSearching ? (
                    <div className="p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      Buscando produtos...
                    </div>
                  ) : results.length === 0 ? (
                    <div className="p-6 text-center text-sm text-muted-foreground">
                      <p>Nenhum produto encontrado para "<span className="font-semibold text-foreground">{q}</span>".</p>
                      <button
                        type="button"
                        onClick={() => {
                          setSearchOpen(false);
                          setMobileSearchOpen(false);
                          navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: q.trim() } } as any);
                        }}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline bg-primary/10 px-3 py-1.5 rounded-full"
                      >
                        <Search className="h-3.5 w-3.5" /> Ver todos os produtos
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="divide-y">
                        {results.map((p) => {
                          const ep = getEffectivePrice(p, activePharmacy?.id || selectedPharmacyId);
                          return (
                            <Link
                              key={p.id}
                              to={"/$storeSlug/produto/$slug" as any}
                              params={{ storeSlug, slug: p.url || p.slug || p.id } as any}
                              onClick={() => {
                                setSearchOpen(false);
                                setMobileSearchOpen(false);
                              }}
                              className="flex items-center gap-3 p-3 hover:bg-muted/80 transition"
                            >
                              <img
                                src={productImage(p)}
                                alt=""
                                loading="lazy"
                                className="h-12 w-12 object-contain rounded bg-white border shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold truncate text-foreground">{p.nome}</div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                                  <span className="font-medium text-slate-700 dark:text-slate-300">{p.marca || "Associadas"}</span>
                                  {p.tarja && !p.tarja.toLowerCase().includes("sem") && (
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold uppercase ${
                                      p.tarja.toLowerCase().includes("preta") 
                                        ? "bg-slate-900 text-white" 
                                        : "bg-red-600 text-white"
                                    }`}>
                                      {p.tarja}
                                    </span>
                                  )}
                                </div>
                                {Array.isArray(p.principiosAtivos) && p.principiosAtivos.length > 0 && (
                                  <div className="text-[11px] text-muted-foreground/80 truncate">
                                    {p.principiosAtivos.map((pa: any) => typeof pa === "string" ? pa : pa.nome).filter(Boolean).join(", ")}
                                  </div>
                                )}
                              </div>
                              <div className="text-sm font-bold text-primary shrink-0">{brl(ep.precoPor)}</div>
                            </Link>
                          );
                        })}
                      </div>
                      <div className="p-2 border-t bg-muted/30">
                        <button
                          type="button"
                          className="w-full text-center text-sm font-bold text-primary py-2 hover:underline flex items-center justify-center gap-1.5"
                          onClick={() => {
                            setSearchOpen(false);
                            setMobileSearchOpen(false);
                            navigate({ to: "/$storeSlug/busca", params: { storeSlug }, search: { q: q.trim() } } as any);
                          }}
                        >
                          Ver todos os resultados para "{q.trim()}" <ArrowRight className="h-4 w-4" />
                        </button>
                      </div>
                    </>
                  )}
                </PopoverContent>
              </Popover>
            </form>
          </div>
        </div>
      </div>

      {/* Mega menu (desktop only) */}
      <MegaMenu cats={cats} />
    </header>

    {/* Mobile Bottom Nav Bar (Queixo) */}
      <div 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-background border-t shadow-[0_-4px_12px_rgba(0,0,0,0.1)] z-[100] flex items-center justify-between px-6 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] transform-gpu translate-z-0 transition-none"
      >
        <Link to={isStoreContext ? "/$storeSlug" : "/"} params={isStoreContext ? { storeSlug: params?.storeSlug as any } : undefined} className="flex flex-col items-center gap-1 text-primary">
          <Home className="h-5 w-5" />
          <span className="text-[10px] font-bold">Início</span>
        </Link>
        <MobileMenu 
          cats={cats} 
          trigger={
            <button className="flex flex-col items-center gap-1 text-primary">
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-bold">Categorias</span>
            </button>
          } 
        />
        <button 
          onClick={() => {
            setMobileSearchOpen(!mobileSearchOpen);
            if (!mobileSearchOpen) {
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }
          }}
          className="flex flex-col items-center gap-1 text-primary"
        >
          <Search className="h-5 w-5" />
          <span className="text-[10px] font-bold">Busca</span>
        </button>
        <button onClick={() => setDrawer(true)} className="flex flex-col items-center gap-1 text-primary relative">
          <ShoppingBasket className="h-5 w-5" />
          <span className="text-[10px] font-bold">Cesta</span>
          {mounted && count > 0 && (
            <span className="absolute -top-1 -right-2 bg-accent text-accent-foreground h-4 min-w-4 px-0.5 rounded-full flex items-center justify-center text-[9px] font-black leading-none text-center shadow-xs">
              {count}
            </span>
          )}
        </button>
        <a href={activePharmacy?.whatsapp ? (activePharmacy.whatsapp.startsWith('55') ? 'https://wa.me/' + activePharmacy.whatsapp.replace(/\D/g, '') : 'https://wa.me/55' + activePharmacy.whatsapp.replace(/\D/g, '')) : "https://wa.me/5508000000000"} className="flex flex-col items-center gap-1 text-primary">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
          </svg>
          <span className="text-[10px] font-bold">WhatsApp</span>
        </a>
      </div>

      <Dialog open={cepDialogOpen} onOpenChange={(o) => {
        if (isGeoLoading) return;
        setCepDialogOpen(o);
      }}>
        <DialogContent
          className="z-[120] w-[90vw] sm:w-full rounded-xl"
          onInteractOutside={(e) => isGeoLoading && e.preventDefault()}
          onEscapeKeyDown={(e) => isGeoLoading && e.preventDefault()}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" /> Onde você está?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Informe seu CEP para vermos preços, prazos e estoque da farmácia mais próxima de você.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="00000-000"
              value={cepInput}
              disabled={isGeoLoading}
              onChange={(e) => setCepInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !isGeoLoading) {
                  handleApplyCep(cepInput, () => setCepDialogOpen(false));
                }
              }}
              maxLength={9}
            />
            <Button disabled={isGeoLoading} onClick={() => handleApplyCep(cepInput, () => setCepDialogOpen(false))}>
              {isGeoLoading ? "Validando..." : "Buscar"}
            </Button>
          </div>
          <Button
            variant="outline"
            disabled={isGeoLoading}
            onClick={() => detectCep(() => setCepDialogOpen(false))}
            className="w-full text-xs font-bold mt-2"
          >
            <Navigation className="h-4 w-4 mr-2" /> Usar minha localização atual
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MobileMenu({ cats, trigger }: { cats: Categoria[], trigger?: React.ReactNode }) {
  const params = useParams({ strict: false });
  const [open, setOpen] = useState(false);
  const { cep, setCep } = useGeoCep();
  const [cepInput, setCepInput] = useState(cep);
  const [cepDialogOpen, setCepDialogOpen] = useState(false);
  const [isGeoLoading, setIsGeoLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const rawUser = useAuth((s) => s.user);
  const marcas = useMarcasStore((s) => s.marcas);
  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  const allCategories = useAdminCategories(s => s.categories);
  const storeCategoryIcons = useAdmin(s => s.storeCategoryIcons);
  const categoryIcons = useAdmin(s => s.categoryIcons);
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId) || activePharmacy?.id;
  const storeSlug = getEffectiveStoreSlug((params as any)?.storeSlug, activePharmacy);
  const cupons = useMarketing(s => s.cupons);
  const hasStoreCupons = useMemo(() => {
    if (!cupons || cupons.length === 0) return false;
    const now = new Date();
    return cupons.some((c: any) => {
      if (c.ativo === false) return false;
      const cLoja = c.lojaId || c.farmaciaId;
      if (selectedPharmacyId && cLoja && String(cLoja) !== String(selectedPharmacyId)) return false;
      if (c.dataInicio && new Date(c.dataInicio) > now) return false;
      const validUntil = c.dataTermino || c.validade;
      if (validUntil && new Date(validUntil + (validUntil.includes('T') ? '' : 'T23:59:59')) < now) return false;
      return true;
    });
  }, [cupons, selectedPharmacyId]);

  const user = useMemo(() => {
    if (rawUser && rawUser.storeSlug === storeSlug) return rawUser;
    return useAuth.getState().getUserForStore(storeSlug);
  }, [rawUser, storeSlug]);
  
  const detectCep = (closeFn: () => void) => {
    if (!navigator.geolocation) return;
    setIsGeoLoading(true);
    const toastId = toast.loading("Localizando você...");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        useGeoCep.getState().setCoordinates(lat, lng);
        
        try {
          const foundCep = await reverseGeocodeLatLon(lat, lng);

          if (foundCep && foundCep.length === 8) {
            await setCep(foundCep);
            setCepInput(foundCep);
            toast.success("CEP localizado com sucesso!", { id: toastId });
            setIsGeoLoading(false);
            closeFn();
            return;
          }
        } catch (e) {
          console.error("Geocoding error:", e);
        }
        
        toast.error("Não foi possível identificar seu CEP. Digite manualmente.", { id: toastId });
        setIsGeoLoading(false);
      },
      () => {
        toast.error("Permissão de localização negada. Digite seu CEP manualmente.", { id: toastId });
        setIsGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleApplyCep = async (inputVal: string, closeFn: () => void) => {
    if (inputVal.trim()) {
      setIsGeoLoading(true);
      const toastId = toast.loading("Aguarde um momento validando seu cep...");
      await setCep(inputVal.trim());
      toast.success("CEP validado com sucesso!", { id: toastId });
      setIsGeoLoading(false);
    }
    closeFn();
  };

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        {trigger || (
          <button
            aria-label="Abrir menu"
            className="h-10 w-10 rounded-full border flex items-center justify-center bg-background"
          >
            <Menu className="h-5 w-5 text-primary" />
          </button>
        )}
      </SheetTrigger>
      <SheetContent side="left" className="w-[85vw] sm:max-w-sm p-0 z-[110] flex flex-col">
        <SheetHeader className="p-4 border-b text-left shrink-0">
          {mounted && user ? (
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 p-2.5 rounded-full">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <SheetTitle className="truncate text-base leading-tight text-primary">{getGreeting()} {user?.name?.split(" ")[0]}</SheetTitle>
                <Link to="/$storeSlug/perfil" params={{ storeSlug }} className="text-muted-foreground text-xs font-bold hover:underline" onClick={() => setOpen(false)}>Meus Dados</Link>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="bg-muted p-2.5 rounded-full">
                <User className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="flex-1 overflow-hidden">
                <SheetTitle className="text-base leading-tight">{getGreeting()} visitante</SheetTitle>
                <div className="text-xs text-muted-foreground">
                  <Link to="/$storeSlug/login" params={{ storeSlug }} search={{ redirect: typeof window !== "undefined" ? window.location.pathname : undefined } as any} className="text-primary font-bold hover:underline" onClick={() => setOpen(false)}>Entre</Link> ou cadastre-se
                </div>
              </div>
            </div>
          )}
        </SheetHeader>
        <nav className="p-2 overflow-y-auto flex-1 pb-16">
          {/* Links rápidos no Menu (Mobile) */}
          <div className="mb-4 space-y-2">

            <Link to={user ? "/$storeSlug/pedidos" : "/$storeSlug/login"} params={{ storeSlug }} search={user ? undefined : { redirect: `/${storeSlug}/pedidos` } as any} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/70 transition">
              <Package className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-bold flex-1">Acompanhe seus pedidos</span>
            </Link>

            <Link to={user ? "/$storeSlug/perfil" : "/$storeSlug/login"} params={{ storeSlug }} search={user ? { tab: "favoritos" } : { redirect: `/${storeSlug}/perfil`, tab: "favoritos" } as any} onClick={() => setOpen(false)} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted hover:bg-muted/70 transition">
              <Heart className="h-5 w-5 text-primary shrink-0" />
              <span className="text-sm font-bold flex-1">Meus Favoritos</span>
            </Link>
          </div>
          <div className="border-t my-2" />

          {hasStoreCupons && (
            <Link
              to="/$storeSlug/cupons"
              params={{ storeSlug }}
              onClick={() => setOpen(false)}
              className="flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-bold bg-primary/10 text-primary hover:bg-primary/20 transition mb-2 border border-primary/20 shadow-2xs"
            >
              <div className="flex items-center gap-3">
                <Ticket className="h-5 w-5 text-primary" />
                <span>Cupons da Loja</span>
              </div>
              <span className="text-[10px] uppercase font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                Descontos
              </span>
            </Link>
          )}

          {/* Opção Todas as categorias no Mobile */}
          <Link
            to="/$storeSlug/categorias"
            params={{ storeSlug }}
            onClick={() => setOpen(false)}
            className="flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold hover:bg-muted transition text-foreground"
          >
            <div className="flex items-center gap-3">
              <LayoutGrid className="h-5 w-5 text-primary shrink-0" />
              <span>Todas as categorias</span>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Link>

          {cats.map((c) => {
            const storeIconKey = (selectedPharmacyId && storeCategoryIcons?.[selectedPharmacyId]?.[c.id])
              || categoryIcons?.[c.id]
              || c.icone;
            const Icon = (storeIconKey && LUCIDE_ICONS[storeIconKey]) ? LUCIDE_ICONS[storeIconKey] : (CAT_ICONS[c.id] || getSubcategoryIcon(c.nome));
            const isNossasMarcas = c.id === "300" || c.slug === "nossas-marcas";
            const isOfertas = String(c.nome || "").toLowerCase().includes("oferta") || String(c.nome || "").toLowerCase().includes("promoç");
            
            let renderItems: any[] = [];
            
            if (isNossasMarcas) {
              renderItems = marcas.filter(m => m.marcaPropria);
            } else {
              renderItems = allCategories.filter((sub: any) => sub.parentId === c.id);
            }
            
            if (renderItems.length === 0) {
              return (
                <Link
                  key={c.id}
                  to="/$storeSlug/c/$slug"
                  params={{ storeSlug, slug: isNossasMarcas ? "nossas-marcas" : c.slug }}
                  onClick={() => setOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg text-sm font-bold transition ${isOfertas ? 'bg-red-600 text-white hover:bg-red-700' : 'hover:bg-muted'}`}
                >
                  {isNossasMarcas ? (
                    !isParceiro && <img src="/icone-associadas.png" alt="" className="h-5 w-5 object-contain mix-blend-multiply" />
                  ) : Icon ? (
                    <Icon className="h-5 w-5" />
                  ) : null}
                  {c.nome}
                </Link>
              );
            }

            return (
              <details key={c.id} className="group">
                <summary className={`flex items-center justify-between px-3 py-3 rounded-lg text-sm font-bold cursor-pointer transition list-none [&::-webkit-details-marker]:hidden ${isOfertas ? 'bg-red-600 text-white hover:bg-red-700' : 'hover:bg-muted'}`}>
                  <div className="flex items-center gap-3">
                    {isNossasMarcas ? (
                      !isParceiro && <img src="/icone-associadas.png" alt="" className="h-5 w-5 object-contain mix-blend-multiply" />
                    ) : Icon ? (
                      <Icon className="h-5 w-5" />
                    ) : null}
                    <span onClick={(e) => {
                      if (isOfertas) {
                        e.preventDefault();
                        setOpen(false);
                        document.dispatchEvent(new CustomEvent('open-ofertas'));
                      }
                    }}>{c.nome}</span>
                  </div>
                  <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180 text-muted-foreground" />
                </summary>
                <div className="pl-11 pr-3 pb-2 flex flex-col">
                  <Link
                    to="/$storeSlug/c/$slug"
                    params={{ storeSlug, slug: isNossasMarcas ? "nossas-marcas" : c.slug }}
                    onClick={() => setOpen(false)}
                    className="text-sm py-2 hover:text-primary text-muted-foreground font-medium border-b border-muted/30 last:border-0"
                  >
                    Ver tudo em {c.nome}
                  </Link>
                  {renderItems.map((item: any) => (
                    <Link
                      key={item.id}
                      to={isNossasMarcas ? "/$storeSlug/m/$slug" : "/$storeSlug/c/$slug"}
                      params={{ storeSlug, slug: item.seoUrl || item.slug }}
                      onClick={() => setOpen(false)}
                      className="text-sm py-2 hover:text-primary text-muted-foreground font-medium border-b border-muted/30 last:border-0 flex items-center gap-2"
                    >
                      {isNossasMarcas ? (
                        <img src={item.logo} alt={item.nome} title={item.nome} className="h-6 w-auto object-contain mix-blend-multiply" />
                      ) : (
                        <span>{item.nome}</span>
                      )}
                    </Link>
                  ))}
                </div>
              </details>
            );
          })}
          <div className="border-t my-2" />
          <Link to="/$storeSlug/faq" params={{ storeSlug }} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-muted rounded">FAQ</Link>
          <Link to="/$storeSlug/mapa-site" params={{ storeSlug }} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-muted rounded">Mapa do site</Link>
          <Link to="/$storeSlug/ajuda/$page" params={{ storeSlug, page: "como-comprar" }} onClick={() => setOpen(false)} className="block px-3 py-2 text-sm hover:bg-muted rounded">Como comprar</Link>
        </nav>
      </SheetContent>
    </Sheet>
  );
}

function MegaMenu({ cats }: { cats: Categoria[] }) {
  const [open, setOpen] = useState<string | null>(null);
  const [subs, setSubs] = useState<Categoria[]>([]);
  const [catProducts, setCatProducts] = useState<Produto[]>([]);
  const [mounted, setMounted] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const marcas = useMarcasStore(s => s.marcas);
  const allCategories = useAdminCategories(s => s.categories);
  const storeCategoryIcons = useAdmin(s => s.storeCategoryIcons);
  const categoryIcons = useAdmin(s => s.categoryIcons);
  const params = useParams({ strict: false });
  const activePharmacy = useActivePharmacy();
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId) || activePharmacy?.id;
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  const storeSlug = getEffectiveStoreSlug((params as any)?.storeSlug, activePharmacy);
  const cupons = useMarketing(s => s.cupons);
  const hasStoreCupons = useMemo(() => {
    if (!cupons || cupons.length === 0) return false;
    const now = new Date();
    return cupons.some((c: any) => {
      if (c.ativo === false) return false;
      const cLoja = c.lojaId || c.farmaciaId;
      if (selectedPharmacyId && cLoja && String(cLoja) !== String(selectedPharmacyId)) return false;
      if (c.dataInicio && new Date(c.dataInicio) > now) return false;
      const validUntil = c.dataTermino || c.validade;
      if (validUntil && new Date(validUntil + (validUntil.includes('T') ? '' : 'T23:59:59')) < now) return false;
      return true;
    });
  }, [cupons, selectedPharmacyId]);

  const allSubs = useMemo(() => {
    const subs: Record<string, Categoria[]> = {};
    allCategories.filter((c: any) => c.parentId).forEach((c: any) => {
      if (!subs[c.parentId]) subs[c.parentId] = [];
      subs[c.parentId].push(c);
    });
    // Sort all subs array by name
    Object.keys(subs).forEach(key => {
      subs[key].sort((a, b) => a.nome.localeCompare(b.nome));
    });
    return subs;
  }, [allCategories]);

  const allRootCats = useMemo(() => {
    return allCategories.filter((c: any) => !c.parentId) as Categoria[];
  }, [allCategories]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleMouseEnter = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpen(id);
    }, 50);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => {
      setOpen(null);
    }, 100);
  };

  useEffect(() => {
    if (!open) {
      setSubs([]);
      setCatProducts([]);
      return;
    }
    if (open === "all") {
      return;
    }

    catalog.listSubcategories(open, true).then(setSubs);
    catalog.productsByCategory(open).then(products => setCatProducts(products.slice(0, 6)));
  }, [open, cats]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  const active = cats.find((c) => c.id === open);

  return (
    <nav
      className={`hidden md:block border-t relative transition-opacity duration-300 ${mounted ? "opacity-100" : "opacity-0"}`}
      style={{ backgroundColor: 'var(--menu-bg, var(--primary))', color: 'var(--menu-text, var(--primary-foreground))' }}
      onMouseLeave={handleMouseLeave}
    >
      <div className="container-fa">
        <ul className="flex items-stretch justify-start lg:justify-between w-full gap-1 lg:gap-2 xl:gap-8 overflow-x-auto scrollbar-none">
          <li onMouseEnter={() => handleMouseEnter("all")} className="shrink-0 flex items-center">
            <Link
              to="/$storeSlug/categorias"
              params={{ storeSlug }}
              style={isParceiro ? { color: 'var(--all-cats-text, var(--menu-text, inherit))' } : undefined}
              className={`inline-flex items-center gap-1 xl:gap-2 px-1 lg:px-2 py-3 text-[11px] lg:text-[12px] xl:text-[13px] font-bold transition border-b-2 whitespace-nowrap ${
                open === "all"
                  ? "border-accent"
                  : "border-transparent opacity-90 hover:opacity-100"
              }`}
            >
              <Menu 
                className="h-4 w-4" 
                style={isParceiro ? { color: 'var(--all-cats-icon, var(--menu-text, inherit))' } : undefined}
              />
              Todas as categorias
            </Link>
          </li>
          
          {cats.map((c) => {
            const storeIconKey = (selectedPharmacyId && storeCategoryIcons?.[selectedPharmacyId]?.[c.id])
              || categoryIcons?.[c.id]
              || c.icone;
            const Icon = (storeIconKey && LUCIDE_ICONS[storeIconKey]) ? LUCIDE_ICONS[storeIconKey] : (CAT_ICONS[c.id] || getSubcategoryIcon(c.nome));
            const isOfertas = c.nome.toLowerCase().includes("oferta") || c.nome.toLowerCase().includes("promoç");
            const isNossasMarcas = c.id === "300" || c.slug === "nossas-marcas";
            return (
              <li key={c.id} onMouseEnter={() => handleMouseEnter(c.id)} className="shrink-0 flex items-center">
                <Link
                  to="/$storeSlug/c/$slug"
                  params={{ storeSlug, slug: isNossasMarcas ? "nossas-marcas" : c.slug }}
                  style={isParceiro && !isOfertas ? { color: 'var(--menu-text, inherit)' } : undefined}
                  className={`inline-flex items-center gap-1 xl:gap-2 text-[11px] lg:text-[12px] xl:text-[13px] font-bold transition whitespace-nowrap ${
                    isOfertas 
                      ? "bg-red-600 text-white hover:bg-red-700 px-3 py-1.5 rounded-full"
                      : (open === c.id
                          ? "border-b-2 border-accent text-white py-3 px-1 lg:px-2"
                          : "border-b-2 border-transparent text-white/95 hover:text-white py-3 px-1 lg:px-2")
                  }`}
                >
                  {isNossasMarcas ? (
                    !isParceiro && <img src="/icone-associadas.png" alt="" className="h-4 w-4 object-contain brightness-0 invert" />
                  ) : Icon ? (
                    <span style={isParceiro ? { color: 'var(--menu-text, inherit)' } : undefined} className="inline-flex items-center">
                      <Icon className="h-4 w-4" />
                    </span>
                  ) : null}
                  {c.nome}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      <Fragment>
        {open === "all" ? (
          <div
            key="all"
            className="absolute left-0 right-0 top-full z-50 bg-popover text-foreground border-b shadow-elevated max-h-[70vh] overflow-auto pointer-events-none animate-in slide-in-from-top-2 fade-in duration-200"
          >
            <div className="container-fa py-8 flex flex-col gap-8 pointer-events-auto">
              {hasStoreCupons && (
                <div className="bg-gradient-to-r from-primary/10 via-amber-500/10 to-emerald-500/10 p-4 rounded-xl border border-primary/20 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary text-white p-2.5 rounded-full shadow-2xs">
                      <Ticket className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">Cupons da Loja</h4>
                      <p className="text-xs text-slate-600">Confira todos os cupons de desconto ativos para esta loja.</p>
                    </div>
                  </div>
                  <Link
                    to="/$storeSlug/cupons"
                    params={{ storeSlug }}
                    onClick={() => setOpen(null)}
                    className="inline-flex items-center gap-1.5 bg-primary text-white text-xs font-bold px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors shrink-0"
                  >
                    <span>Ver Cupons</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              <div className="columns-2 md:columns-4 lg:columns-5 gap-8">
                {allRootCats.filter(c => c.id !== "300" && c.slug !== "nossas-marcas").map((c) => (
                  <div key={c.id} className="flex flex-col break-inside-avoid mb-10">
                    <Link
                      to="/$storeSlug/c/$slug"
                      params={{ storeSlug, slug: c.slug }}
                      onClick={() => setOpen(null)}
                      className="font-bold text-primary-dark hover:underline text-sm mb-3 border-b border-muted pb-1.5 flex items-center gap-2"
                    >
                      {(() => {
                        const Icon = CAT_ICONS[c.id] || getSubcategoryIcon(c.nome);
                        return Icon ? <Icon className="h-4 w-4" /> : null;
                      })()}
                      {c.nome}
                    </Link>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {(allSubs[c.id] || []).slice(0, 10).map(s => (
                        <Link
                          key={s.id}
                          to="/$storeSlug/c/$slug"
                          params={{ storeSlug, slug: s.slug }}
                          onClick={() => setOpen(null)}
                          className="text-[11px] text-muted-foreground hover:text-primary hover:bg-primary/5 transition bg-muted/30 px-2.5 py-1.5 rounded-md leading-tight line-clamp-2 block"
                        >
                          {s.nome}
                        </Link>
                      ))}
                      {(allSubs[c.id] || []).length > 10 && (
                        <Link to="/$storeSlug/c/$slug" params={{ storeSlug, slug: c.slug }} onClick={() => setOpen(null)} className="text-[11px] font-bold text-primary uppercase hover:underline flex items-center px-2 py-1.5">
                          Ver mais...
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Nossas Marcas outside of columns layout */}
              {(allRootCats.find(c => c.id === "300" || c.slug === "nossas-marcas") || true) && (() => {
                const brandsCat = allRootCats.find(c => c.id === "300" || c.slug === "nossas-marcas") || { nome: "Nossas Marcas" };
                return (
                  <div className="pt-6 mt-4 border-t border-slate-100/50">
                    <Link
                      to="/$storeSlug/c/$slug"
                      params={{ storeSlug, slug: "nossas-marcas" }}
                      onClick={() => setOpen(null)}
                      className="font-bold text-primary-dark hover:underline text-base mb-6 flex items-center gap-2"
                    >
                      {!isParceiro && <img src="/icone-associadas.png" alt="" className="h-5 w-5 object-contain mix-blend-multiply" />}
                      {brandsCat.nome}
                    </Link>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                      {marcas.filter(m => m.marcaPropria).map(m => (
                        <Link
                          key={m.id}
                          to="/$storeSlug/m/$slug"
                          params={{ storeSlug, slug: m.seoUrl || m.slug }}
                          onClick={() => setOpen(null)}
                          className="flex flex-col items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-primary hover:shadow-md hover:-translate-y-1 transition-all h-[100px] text-center group/mb"
                          title={m.nome}
                        >
                          <div className="w-full flex-1 flex items-center justify-center overflow-hidden">
                            {m.logo ? (
                              <img src={m.logo} alt={m.nome} title={m.nome} className="max-h-[44px] max-w-full object-contain mix-blend-multiply group-hover/mb:scale-105 transition-transform" />
                            ) : null}
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 group-hover/mb:text-primary transition-colors truncate w-full pt-1 border-t border-slate-100">
                            {m.nome}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : open && active && (subs.length > 0 || catProducts.length > 0 || active.id === "300" || active.slug === "nossas-marcas") ? (
          <div
            key="cat"
            className="absolute left-0 right-0 top-full z-50 bg-popover text-foreground border-b shadow-elevated pointer-events-none animate-in slide-in-from-top-2 fade-in duration-200"
          >
            <div className="container-fa py-6 grid grid-cols-12 gap-6 pointer-events-auto">
              <div className="col-span-3 border-r pr-6">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold">
                  Categoria
                </div>
                <Link
                  to="/$storeSlug/c/$slug"
                  params={{ storeSlug, slug: active.slug }}
                  onClick={() => setOpen(null)}
                  className="block mt-2 text-xl font-bold text-primary-dark hover:underline leading-tight"
                >
                  {active.nome}
                </Link>
                <div 
                  className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-3"
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(active.descricaoHtml) }}
                />
                <Link
                  to="/$storeSlug/c/$slug"
                  params={{ storeSlug, slug: active.slug }}
                  onClick={() => setOpen(null)}
                  className="inline-flex items-center gap-1 mt-4 text-xs font-bold text-white bg-accent hover:bg-accent/90 px-3 py-1.5 rounded transition shadow-sm"
                >
                  <Plus className="h-3 w-3" /> Ver todos
                </Link>
              </div>
              <div className={(active.id === "300" || active.slug === "nossas-marcas") ? "col-span-9 grid grid-cols-4 sm:grid-cols-5 gap-4 max-h-[60vh] overflow-auto content-start" : "col-span-4 grid grid-cols-2 gap-x-6 gap-y-1 max-h-[60vh] overflow-auto"}>
                {((active.id === "300" || active.slug === "nossas-marcas") ? marcas.filter(m => m.marcaPropria) : subs).map((s) => (
                  <Link
                    key={s.id}
                    to={(active.id === "300" || active.slug === "nossas-marcas") ? "/$storeSlug/m/$slug" : "/$storeSlug/c/$slug"}
                    params={{ storeSlug, slug: (s as any).seoUrl || s.slug }}
                    onClick={() => setOpen(null)}
                    className={(active.id === "300" || active.slug === "nossas-marcas")
                      ? "aspect-square flex items-center justify-center p-4 bg-white border border-slate-200 rounded-2xl hover:border-primary hover:shadow-lg hover:-translate-y-0.5 transition-all" 
                      : "text-sm py-1.5 px-2 rounded hover:bg-secondary/10 hover:text-primary-dark transition leading-snug flex items-center gap-2"
                    }
                  >
                    {(active.id === "300" || active.slug === "nossas-marcas") ? (
                      <img src={(s as any).logo} alt={s.nome} title={s.nome} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                    ) : (
                      <span>{s.nome}</span>
                    )}
                  </Link>
                ))}
              </div>
              {(active.id !== "300" && active.slug !== "nossas-marcas") && (
                <div className="col-span-5 border-l pl-6 flex flex-col">
                <div className="text-[10px] uppercase tracking-wide text-muted-foreground font-bold mb-4">
                  Destaques da categoria
                </div>
                <div className="grid grid-cols-3 gap-4 flex-1 content-start">
                  {catProducts.map(p => {
                    const ep = getEffectivePrice(p, activePharmacy?.id || "");
                    return (
                    <Link
                      key={p.id}
                      to="/$storeSlug/produto/$slug"
                      params={{ storeSlug, slug: p.url || p.slug || p.id }}
                      onClick={() => setOpen(null)}
                      className="group flex flex-col bg-white rounded border hover:border-primary transition p-3"
                    >
                      <div className="aspect-square w-full bg-white mb-3 flex items-center justify-center p-1 rounded overflow-hidden relative">
                        <img 
                          src={productImage(p)} 
                          alt={p.nome} 
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        {checkIsGenerico(p) && (
                          <span className="absolute top-0 left-0 bg-yellow-400 text-black text-[9px] font-bold px-1 rounded shadow-sm">
                            GENÉRICO
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] font-bold text-muted-foreground uppercase truncate mb-1">{p.marca}</div>
                      <div className="text-xs font-bold line-clamp-2 leading-tight mb-3 group-hover:text-primary transition min-h-[32px]">{p.nome}</div>
                      <div className="text-sm font-bold text-foreground mt-auto">{brl(ep.precoPor)}</div>
                    </Link>
                  )})}
                </div>
              </div>
              )}
            </div>
          </div>
        ) : null}
      </Fragment>
    </nav>
  );
}

function CartDrawer({ onCheckoutClick, storeSlug }: { onCheckoutClick: () => void; storeSlug?: string }) {
    const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
    const items = useCart((s) => s.items);
  const remove = useCart((s) => s.remove);
  const setQty = useCart((s) => s.setQty);
  const add = useCart((s) => s.add);
  const subtotal = useCart((s) => s.subtotal());
  const storeDisc = useCart((s) => s.storeDiscount());
  const pbmDisc = useCart((s) => s.pbmDiscount());
  const total = useCart((s) => s.total());
  const pbm = useCart((s) => s.pbm);
  
  const cartNotifications = useCart((s) => s.notifications);
  const clearCartNotifications = useCart((s) => s.clearNotifications);
  const promocoes = useMarketing((s) => s.promocoes);

  const [crossSell, setCrossSell] = useState<Produto[]>([]);
  useEffect(() => {
    if (items.length > 0) {
      catalog.crossSell(items.map((i) => i.id), 4, items[0]?.categoriaId).then(setCrossSell);
    } else {
      setCrossSell([]);
    }
  }, [items]);

  const navigate = useNavigate();
  const params = useParams({ strict: false });
  const activePharmacy = useActivePharmacy();
  const urlSlug = (params as any)?.storeSlug as string | undefined;
  const effectiveStoreSlug = storeSlug || getEffectiveStoreSlug(urlSlug, activePharmacy);

  const handleContinueShopping = () => {
    useCart.getState().setDrawer(false);
    if (effectiveStoreSlug) {
      navigate({ to: "/$storeSlug", params: { storeSlug: effectiveStoreSlug } as any });
    } else {
      navigate({ to: "/" });
    }
  };

  return (
    <SheetContent className="flex flex-col w-full sm:max-w-md p-6">
      <SheetHeader className="mb-4">
        <SheetTitle>Seu carrinho</SheetTitle>
      </SheetHeader>
      {items.some(i => i.retemReceita) && (
        <div className="bg-red-50 text-red-800 text-xs font-bold p-3 -mx-6 mb-2 border-y border-red-200 text-center">
          Medicamentos com retenção de receita só podem ser retirados na loja.
        </div>
      )}
      {cartNotifications && cartNotifications.filter(n => items.some(i => i.id === n.id)).length > 0 && items.length > 0 && (
        <div className="bg-emerald-50 text-emerald-900 text-xs p-3 -mx-6 mb-2 border-y border-emerald-200 relative shadow-2xs">
          <button onClick={clearCartNotifications} className="absolute top-2 right-2 p-1 text-emerald-600 hover:bg-emerald-100 rounded-full transition-colors" title="Fechar aviso">
            <X className="h-3 w-3" />
          </button>
          <ul className="space-y-3">
            {cartNotifications.filter(n => items.some(i => i.id === n.id)).map(n => {
              const item = items.find(i => i.id === n.id)!;
              return (
                <li key={n.id} className="flex flex-col gap-1 pr-5">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-800">
                    <TrendingDown className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                    <span>O produto <strong>{item.nome}</strong> ficou mais barato!</span>
                  </div>
                  <div className="text-emerald-700 pl-5 text-xs">
                    De <span className="line-through text-slate-500">{brl(n.oldPrice)}</span> por <strong className="text-emerald-800 font-black">{brl(n.newPrice)}</strong>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="flex-1 overflow-auto -mx-6 px-6 divide-y">
        {items.length === 0 && (
          <div className="text-center text-muted-foreground py-12 flex flex-col items-center gap-3">
            <span>Seu carrinho está vazio.</span>
            <Button 
              variant="outline"
              size="sm"
              onClick={handleContinueShopping}
            >
              Continuar comprando
            </Button>
          </div>
        )}
        {items.filter(i => i && i.id && Number(i.qty) > 0).map((i) => {
          const fakeStock = getDeterministicStock(i, selectedPharmacyId!);
          const scarce = fakeStock > 0 && fakeStock <= 5;
          const itemQty = Number(i.qty) || 1;
          return (
          <div key={i.id} className="py-4 flex gap-3">
            <img
              src={productImage(i)}
              alt={i.nome || ""}
              className="h-16 w-16 object-contain bg-white border rounded"
              onError={(e) => {
                const target = e.currentTarget as HTMLImageElement;
                if (!target.src.includes("/produtos/sem-imagem.webp")) {
                  target.src = "/produtos/sem-imagem.webp";
                }
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold line-clamp-2">{i.nome}</div>
              <div className="flex items-center gap-2 mt-1">
                {i.retemReceita && (
                  <span className="text-[10px] text-red-600 font-bold">
                    Retém receita
                  </span>
                )}
              </div>
              <div className="mt-2 flex flex-col gap-2">

                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={() => {
                      if (itemQty <= 1) {
                        toast.info("Atenção", { description: "Clique no botão 'Remover' para limpar seu carrinho." });
                      } else {
                        setQty(i.id, itemQty - 1);
                      }
                    }} 
                    className="h-8 w-8 border rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    −
                  </button>
                  <div className="w-8 text-center text-sm font-bold text-slate-800">{itemQty}</div>
                  <button 
                    onClick={() => setQty(i.id, itemQty + 1)} 
                    disabled={itemQty >= (i.estoque || 999)}
                    className="h-8 w-8 border rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    +
                  </button>
                  <button
                    onClick={() => remove(i.id)}
                    className="ml-3 h-8 w-8 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                    aria-label="Remover"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
            {(() => {
              const ep = getEffectivePrice(i, selectedPharmacyId);
              const lojaPromos = selectedPharmacyId ? (useMarketing.getState().lojaPromocoes[selectedPharmacyId] || []) : [];
              const promo = getLevePaguePromotion(i, promocoes, lojaPromos);
              if (promo && itemQty >= promo.levePague_quantidade) {
                const promoItemsCount = Math.floor(itemQty / promo.levePague_quantidade) * promo.levePague_quantidade;
                const regularItemsCount = itemQty - promoItemsCount;
                const promoTotal = promoItemsCount * promo.levePague_precoPorItem!;
                const regularTotal = regularItemsCount * ep.precoPor;
                const totalWithPromo = promoTotal + regularTotal;
                
                return (
                  <div className="flex flex-col items-end">
                    <div className="text-sm font-bold text-foreground">{brl(totalWithPromo)}</div>
                    <div className="text-[10px] text-muted-foreground line-through">{brl(ep.precoPor * itemQty)}</div>
                    <div className="text-[9px] font-bold text-orange-600">Promoção aplicada!</div>
                  </div>
                );
              }
              return <div className="text-sm font-bold text-foreground">{brl(ep.precoPor * itemQty)}</div>;
            })()}
          </div>
        )})}

        {/* Cross-sell (non-medicine only) */}
        {items.length > 0 && crossSell.length > 0 && (
          <div className="py-4">
            <div className="text-xs font-bold uppercase text-muted-foreground mb-2">
              Produtos que podem te interessar
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 snap-x scrollbar-none -mx-6 px-6">
              {crossSell.map((p) => (
                <div key={p.id} className="border rounded-lg p-2 text-xs flex flex-col shrink-0 w-[140px] snap-start">
                  <img
                    src={productImage(p)}
                    alt=""
                    className="h-16 w-full object-contain bg-white"
                  />
                  <div className="font-bold mt-1 h-[2.5em] overflow-hidden line-clamp-2 text-[11px] leading-tight text-ellipsis">{p.nome}</div>
                  <div className="text-foreground font-bold mt-1">{brl(p.precoPor)}</div>
                  <button
                    onClick={() => add(p)}
                    className="mt-1 inline-flex items-center justify-center gap-1 text-[11px] border border-primary text-primary rounded py-1 hover:bg-primary hover:text-primary-foreground transition"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="border-t pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{brl(subtotal)}</span>
        </div>
        {storeDisc > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Desconto loja</span>
            <span className="text-primary-dark">−{brl(storeDisc)}</span>
          </div>
        )}
        
        <div className="flex justify-between font-bold text-lg pt-2 border-t">
          <span>Total</span>
          <span className="text-foreground">{brl(total)}</span>
        </div>
        <Button 
          className="w-full" 
          size="lg" 
          disabled={items.length === 0}
          onClick={onCheckoutClick}
        >
          Ir para a cesta
        </Button>
        <Button 
          type="button"
          className="w-full mt-2 h-11 font-bold rounded-xl bg-slate-100 hover:bg-primary/10 text-slate-700 hover:text-primary border border-slate-200 hover:border-primary transition-all flex items-center justify-center gap-2 group active:scale-98" 
          onClick={handleContinueShopping}
        >
          <ArrowLeft className="w-4 h-4 text-primary transition-transform duration-200 group-hover:-translate-x-1" />
          <span>Continuar comprando</span>
        </Button>
      </div>
    </SheetContent>
  );
}


