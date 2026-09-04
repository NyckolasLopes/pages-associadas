import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo, useRef } from "react";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, MapPin, Navigation, ArrowRight, Sparkles, Building2, Store, ExternalLink, X } from "lucide-react";
import { getSafeMediaUrl } from "@/utils/media";
import { getCepCoordsWithFallback, haversineKm } from "@/lib/distanceApis";
import { toast } from "sonner";
import AssociadasLogo from "@/assets/logo.png";
import { resetStoreTheme } from "@/lib/themeUtils";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [
      { rel: "canonical", href: "https://farmaciasassociadas.com.br" },
    ],
    meta: [
      { title: "Farmácias Associadas — Encontre a Farmácia Mais Próxima | Compre Online" },
      { name: "description", content: "Encontre a unidade das Farmácias Associadas mais próxima de você em sua cidade. Compre medicamentos, dermocosméticos e perfumaria com entrega rápida ou retire na loja." },
      { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
      { property: "og:title", content: "Farmácias Associadas — Encontre a Farmácia Mais Próxima" },
      { property: "og:description", content: "Encontre a farmácia mais próxima da sua casa. Peça online e receba rápido com a tradição e confiança das Farmácias Associadas." },
      { property: "og:url", content: "https://farmaciasassociadas.com.br" },
      { property: "og:type", content: "website" },
      { property: "og:image", content: "https://farmaciasassociadas.com.br/logo.png" },
      { property: "og:site_name", content: "Farmácias Associadas" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Farmácias Associadas — Encontre a Farmácia Mais Próxima" },
      { name: "twitter:description", content: "Compre online medicamentos e perfumaria na unidade mais próxima de você." },
      { name: "twitter:image", content: "https://farmaciasassociadas.com.br/logo.png" },
    ],
  }),
  component: IndexGateway,
});

function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function normalizeText(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function formatCep(value: string) {
  const v = value.replace(/\D/g, "");
  return v.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function IndexGateway() {
  const navigate = useNavigate();
  const { pharmacies, pharmaciesLoaded, loadPharmacies, logoUrl: globalLogo, faviconUrl: globalFavicon } = useAdmin();
  const setSelectedPharmacyId = useCart((s) => s.setSelectedPharmacyId);

  const [cep, setCep] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [foundStores, setFoundStores] = useState<any[]>([]);
  const [isSearchByLocation, setIsSearchByLocation] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");
  const [selectedBairro, setSelectedBairro] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (window.innerWidth < 768) return;
    const x = (e.clientX / window.innerWidth - 0.5) * 40;
    const y = (e.clientY / window.innerHeight - 0.5) * 40;
    setMousePos({ x, y });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      const isStandalone = window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone === true;
      if (isStandalone) {
        const lockedSlug = localStorage.getItem("fa_installed_store_slug") || sessionStorage.getItem("fa-last-store-slug");
        if (lockedSlug && lockedSlug !== "loja-padrao") {
          window.location.replace(`/${lockedSlug}`);
          return;
        }
      }
    }

    resetStoreTheme();
    if (!pharmaciesLoaded) {
      loadPharmacies();
    }
  }, [pharmaciesLoaded, loadPharmacies]);

  // Click outside to close search suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
        setShowSearchSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const activeStores = useMemo(() => {
    return (pharmacies || []).filter(p => p.ativo !== false && p.virtualStoreStatus !== 'Inativa');
  }, [pharmacies]);

  // Lista única de cidades com contagem de lojas
  const cidades = useMemo(() => {
    const cityMap = new Map<string, { nome: string; count: number; uf?: string }>();
    activeStores.forEach(store => {
      const c = store.cidade?.trim();
      if (c) {
        const norm = normalizeText(c);
        if (!cityMap.has(norm)) {
          cityMap.set(norm, { nome: c, count: 1, uf: store.uf });
        } else {
          cityMap.get(norm)!.count += 1;
        }
      }
    });
    return Array.from(cityMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [activeStores]);

  // Lista de bairros disponíveis para a cidade selecionada
  const bairrosDaCidade = useMemo(() => {
    if (!selectedCity) return [];
    const normSelectedCity = normalizeText(selectedCity);
    const bairroMap = new Map<string, { nome: string; count: number }>();
    
    activeStores.forEach(store => {
      if (normalizeText(store.cidade || "") === normSelectedCity) {
        const b = store.bairro?.trim();
        if (b) {
          const normB = normalizeText(b);
          if (!bairroMap.has(normB)) {
            bairroMap.set(normB, { nome: b, count: 1 });
          } else {
            bairroMap.get(normB)!.count += 1;
          }
        }
      }
    });
    return Array.from(bairroMap.values()).sort((a, b) => a.nome.localeCompare(b.nome));
  }, [activeStores, selectedCity]);

  // Sugestões de busca dinâmica (por cidade ou bairro)
  const searchSuggestions = useMemo(() => {
    const q = normalizeText(searchTerm);
    if (!q || q.length < 2) return { cidades: [], bairros: [] };

    // 1. Cidades correspondentes
    const matchedCities = cidades.filter(c => normalizeText(c.nome).includes(q));

    // 2. Bairros correspondentes em qualquer cidade
    const bairroMap = new Map<string, { bairro: string; cidade: string; uf?: string; count: number }>();
    activeStores.forEach(store => {
      const b = store.bairro?.trim();
      const c = store.cidade?.trim();
      if (b && c) {
        const normB = normalizeText(b);
        const normC = normalizeText(c);
        if (normB.includes(q) || `${normB} ${normC}`.includes(q)) {
          const key = `${normB}_${normC}`;
          if (!bairroMap.has(key)) {
            bairroMap.set(key, { bairro: b, cidade: c, uf: store.uf, count: 1 });
          } else {
            bairroMap.get(key)!.count += 1;
          }
        }
      }
    });

    const matchedBairros = Array.from(bairroMap.values()).sort((a, b) => a.bairro.localeCompare(b.bairro));

    return {
      cidades: matchedCities.slice(0, 5),
      bairros: matchedBairros.slice(0, 8),
    };
  }, [searchTerm, cidades, activeStores]);

  // Handler ao trocar de Cidade
  const handleCityChange = (cidade: string) => {
    setSelectedCity(cidade);
    setSelectedBairro("");
    setIsSearchByLocation(false);

    const cityStores = activeStores.filter(p => normalizeText(p.cidade || "") === normalizeText(cidade));
    if (cityStores.length > 0) {
      setFoundStores(cityStores);
    }
  };

  // Handler ao trocar de Bairro
  const handleBairroChange = (bairro: string) => {
    setSelectedBairro(bairro);
    setIsSearchByLocation(false);

    const normCity = normalizeText(selectedCity);
    if (bairro === "ALL_BAIRROS" || !bairro) {
      const cityStores = activeStores.filter(p => normalizeText(p.cidade || "") === normCity);
      setFoundStores(cityStores);
      return;
    }

    const normBairro = normalizeText(bairro);
    const filtered = activeStores.filter(p => {
      const isCity = normalizeText(p.cidade || "") === normCity;
      const isBairro = normalizeText(p.bairro || "") === normBairro;
      return isCity && isBairro;
    });

    if (filtered.length > 0) {
      setFoundStores(filtered);
    } else {
      // Fallback para todas da cidade
      const cityStores = activeStores.filter(p => normalizeText(p.cidade || "") === normCity);
      setFoundStores(cityStores);
    }
  };

  // Handler ao selecionar sugestão de busca (Cidade ou Bairro)
  const handleSelectSearchCity = (cityName: string) => {
    setSearchTerm("");
    setShowSearchSuggestions(false);
    handleCityChange(cityName);
  };

  const handleSelectSearchBairro = (bairroName: string, cityName: string) => {
    setSearchTerm("");
    setShowSearchSuggestions(false);
    setSelectedCity(cityName);
    handleBairroChange(bairroName);
  };

  // Busca livre ao pressionar Enter no campo de busca de cidade/bairro
  const handleExecuteFreeSearch = () => {
    const q = normalizeText(searchTerm);
    if (!q) return;

    setShowSearchSuggestions(false);
    setIsSearchByLocation(false);

    // 1. Verificar se coincide exatamente com uma cidade
    const exactCity = cidades.find(c => normalizeText(c.nome) === q);
    if (exactCity) {
      handleCityChange(exactCity.nome);
      return;
    }

    // 2. Buscar lojas onde cidade, bairro ou nome contenham o termo
    const matched = activeStores.filter(store => {
      const c = normalizeText(store.cidade || "");
      const b = normalizeText(store.bairro || "");
      const n = normalizeText(store.nome || "");
      const end = normalizeText(store.endereco || "");
      return c.includes(q) || b.includes(q) || n.includes(q) || end.includes(q);
    });

    if (matched.length > 0) {
      setFoundStores(matched);
      // Se todas forem da mesma cidade, preencher selectedCity
      const firstCity = matched[0].cidade;
      const allSameCity = matched.every(m => normalizeText(m.cidade || "") === normalizeText(firstCity || ""));
      if (allSameCity && firstCity) {
        setSelectedCity(firstCity);
      } else {
        setSelectedCity(searchTerm);
      }
    } else {
      toast.error(`Nenhuma loja encontrada para "${searchTerm}". Tente selecionar a cidade na lista.`);
    }
  };

  const findNearestStore = (lat: number, lng: number) => {
    let storesWithDist: any[] = [];

    for (const store of activeStores) {
      const sLat = (store as any).latitude || store.lat;
      const sLng = (store as any).longitude || (store as any).lng; 
        
      if (sLat && sLng) {
        const dist = haversineKm(lat, lng, Number(sLat), Number(sLng));
        storesWithDist.push({ ...store, distanceKm: dist });
      }
    }

    if (storesWithDist.length > 0) {
      storesWithDist.sort((a, b) => a.distanceKm - b.distanceKm);
      setFoundStores(storesWithDist);
      setSelectedCity("");
      setSelectedBairro("");
      setIsSearchByLocation(true);
    } else {
      toast.error("Não encontramos lojas com coordenadas cadastradas.");
    }
    setLoadingLoc(false);
  };

  const handleCepSearch = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) {
      toast.error("Digite um CEP válido");
      return;
    }

    setLoadingLoc(true);
    try {
      const coords = await getCepCoordsWithFallback(cleanCep);
      if (coords) {
        findNearestStore(coords.lat, coords.lng);
      } else {
        toast.error("Não foi possível encontrar a localização deste CEP.");
        setLoadingLoc(false);
      }
    } catch (error) {
      toast.error("Erro ao buscar CEP.");
      setLoadingLoc(false);
    }
  };

  const handleGeoLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocalização não suportada pelo seu navegador.");
      return;
    }

    setLoadingLoc(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        findNearestStore(position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        console.error(error);
        toast.error("Permissão de localização negada ou falhou.");
        setLoadingLoc(false);
      },
      { timeout: 10000 }
    );
  };

  const goToStore = (store: any) => {
    setSelectedPharmacyId(store.id);
    const slug = store.slug ? slugify(store.slug) : slugify(store.nome || store.id);
    navigate({ to: "/$storeSlug", params: { storeSlug: slug } as any, replace: true });
  };

  const resetSelection = () => {
    setFoundStores([]);
    setSelectedCity("");
    setSelectedBairro("");
    setSearchTerm("");
    setIsSearchByLocation(false);
  };

  const portalSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://farmaciasassociadas.com.br/#organization",
        "name": "Farmácias Associadas",
        "url": "https://farmaciasassociadas.com.br",
        "logo": "https://farmaciasassociadas.com.br/logo.png",
        "image": "https://farmaciasassociadas.com.br/logo.png",
        "description": "Rede de farmácias associadas presente no Rio Grande do Sul e outras regiões, oferecendo medicamentos, perfumaria e tele-entrega rápida."
      },
      {
        "@type": "WebSite",
        "@id": "https://farmaciasassociadas.com.br/#website",
        "url": "https://farmaciasassociadas.com.br",
        "name": "Farmácias Associadas",
        "publisher": {
          "@id": "https://farmaciasassociadas.com.br/#organization"
        },
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://farmaciasassociadas.com.br/busca?q={search_term_string}",
          "query-input": "required name=search_term_string"
        }
      }
    ]
  };

  return (
    <div 
      className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans group transition-all"
      onMouseMove={handleMouseMove}
    >
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(portalSchema) }} />
      {/* Animated Background Image - Parallax on Mouse Move */}
      <div 
        className="absolute -inset-10 bg-cover bg-center transition-transform duration-[400ms] ease-out opacity-90" 
        style={{ 
          backgroundImage: "url('/bg-home.jpg')",
          transform: `translate(${mousePos.x}px, ${mousePos.y}px) scale(1.02)`
        }}
      ></div>
      {/* Overlay Escuro para destacar o modal principal */}
      <div className="absolute inset-0 bg-emerald-950/30 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-60"></div>

      {/* Background decoration - Light Premium Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative z-10 flex flex-col transition-all duration-500">
        {/* Header */}
        <div className="pt-8 pb-4 px-8 text-center relative">
          <img 
            src={AssociadasLogo} 
            alt="Farmácias Associadas" 
            className="h-12 sm:h-14 w-auto mx-auto mb-4" 
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
            Bem-vindo(a)!
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-1">
            Encontre a farmácia mais próxima de você
          </p>
        </div>

        <div className="p-6 sm:p-8 pt-2 space-y-6 flex-1 flex flex-col min-h-[380px]">
          {/* Location Gateway */}
          {foundStores.length === 0 ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
              
              {/* 1. BUSCA POR CIDADE OU BAIRRO (DIGITAÇÃO) */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 tracking-wide flex items-center gap-1.5">
                  <Search className="h-3.5 w-3.5 text-[#F37021]" />
                  BUSCAR CIDADE OU BAIRRO
                </label>
                <div ref={searchContainerRef} className="relative">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input 
                        placeholder="Ex: Porto Alegre, Centro, Pelotas..."
                        value={searchTerm}
                        onChange={(e) => {
                          setSearchTerm(e.target.value);
                          setShowSearchSuggestions(true);
                        }}
                        onFocus={() => setShowSearchSuggestions(true)}
                        onKeyDown={(e) => e.key === "Enter" && handleExecuteFreeSearch()}
                        className="h-12 text-sm font-medium pr-8 shadow-sm border-slate-200 focus-visible:ring-orange-500/30 rounded-xl"
                      />
                      {searchTerm && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm("");
                            setShowSearchSuggestions(false);
                          }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <Button 
                      className="h-12 px-4 rounded-xl shadow-sm bg-[#F37021] hover:bg-[#d95d14] text-white font-bold shrink-0 transition-colors" 
                      onClick={handleExecuteFreeSearch}
                      disabled={!searchTerm.trim()}
                    >
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Dropdown de sugestões dinâmicas da busca */}
                  {showSearchSuggestions && searchTerm.trim().length >= 2 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 max-h-[260px] overflow-y-auto divide-y divide-slate-100 animate-in fade-in slide-in-from-top-2 duration-200">
                      {searchSuggestions.cidades.length === 0 && searchSuggestions.bairros.length === 0 ? (
                        <div className="p-4 text-center text-xs text-slate-500">
                          Nenhuma cidade ou bairro encontrado para "<span className="font-bold">{searchTerm}</span>"
                        </div>
                      ) : (
                        <>
                          {/* Sugestões de Cidades */}
                          {searchSuggestions.cidades.length > 0 && (
                            <div className="p-2">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
                                <Building2 className="h-3 w-3 text-[#F37021]" /> Cidades
                              </div>
                              {searchSuggestions.cidades.map(c => (
                                <button
                                  key={c.nome}
                                  type="button"
                                  onClick={() => handleSelectSearchCity(c.nome)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-orange-50 hover:text-orange-900 rounded-lg flex items-center justify-between transition-colors"
                                >
                                  <span className="flex items-center gap-2">
                                    <span className="font-bold">{c.nome}</span>
                                    {c.uf && <span className="text-[10px] text-slate-400">({c.uf})</span>}
                                  </span>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                    {c.count} {c.count === 1 ? 'loja' : 'lojas'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}

                          {/* Sugestões de Bairros */}
                          {searchSuggestions.bairros.length > 0 && (
                            <div className="p-2">
                              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400 px-2 py-1 flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-[#F37021]" /> Bairros
                              </div>
                              {searchSuggestions.bairros.map((b, idx) => (
                                <button
                                  key={`${b.bairro}_${b.cidade}_${idx}`}
                                  type="button"
                                  onClick={() => handleSelectSearchBairro(b.bairro, b.cidade)}
                                  className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-800 hover:bg-orange-50 hover:text-orange-900 rounded-lg flex items-center justify-between transition-colors"
                                >
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900">{b.bairro}</span>
                                    <span className="text-[10px] text-slate-400">{b.cidade} - {b.uf}</span>
                                  </div>
                                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
                                    {b.count} {b.count === 1 ? 'loja' : 'lojas'}
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 2. SELEÇÃO CASCATA: 1º CIDADE -> 2º BAIRRO */}
              <div className="space-y-3 pt-1">
                <div className="grid grid-cols-1 gap-2.5">
                  {/* Dropdown Cidade */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1">
                      <Building2 className="h-3.5 w-3.5 text-[#F37021]" />
                      1. Selecione a Cidade
                    </label>
                    <Select value={selectedCity} onValueChange={handleCityChange}>
                      <SelectTrigger className="w-full h-12 bg-slate-50/70 hover:bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-800 shadow-sm focus:ring-orange-500/30">
                        <SelectValue placeholder="Escolha a sua cidade..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[280px]">
                        {cidades.map(c => (
                          <SelectItem key={c.nome} value={c.nome} className="cursor-pointer py-2.5 text-xs font-medium focus:bg-orange-50 focus:text-orange-900">
                            <div className="flex items-center justify-between w-full gap-4">
                              <span>{c.nome} {c.uf ? `(${c.uf})` : ''}</span>
                              <span className="text-[10px] text-slate-400 font-semibold">{c.count} {c.count === 1 ? 'loja' : 'lojas'}</span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dropdown Bairro (Habilitado quando Cidade é escolhida) */}
                  {selectedCity && (
                    <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <label className="text-[11px] font-bold uppercase text-slate-600 tracking-wider flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-[#F37021]" />
                        2. Selecione o Bairro em {selectedCity}
                      </label>
                      <Select value={selectedBairro} onValueChange={handleBairroChange}>
                        <SelectTrigger className="w-full h-12 bg-slate-50/70 hover:bg-slate-50 border-slate-200 rounded-xl font-medium text-slate-800 shadow-sm focus:ring-orange-500/30">
                          <SelectValue placeholder="Todos os bairros da cidade" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[280px]">
                          <SelectItem value="ALL_BAIRROS" className="cursor-pointer py-2.5 text-xs font-bold text-[#F37021] focus:bg-orange-50 focus:text-orange-900">
                            ★ Todos os bairros de {selectedCity}
                          </SelectItem>
                          {bairrosDaCidade.map(b => (
                            <SelectItem key={b.nome} value={b.nome} className="cursor-pointer py-2.5 text-xs font-medium focus:bg-orange-50 focus:text-orange-900">
                              <div className="flex items-center justify-between w-full gap-4">
                                <span>{b.nome}</span>
                                <span className="text-[10px] text-slate-400 font-semibold">{b.count} {b.count === 1 ? 'loja' : 'lojas'}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </div>

              {/* DIVISOR OU */}
              <div className="relative py-1">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center text-[10px] uppercase">
                  <span className="bg-white px-3 text-slate-400 font-bold tracking-widest">ou busque por CEP / GPS</span>
                </div>
              </div>

              {/* 3. BUSCA POR CEP E GPS */}
              <div className="space-y-3">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Digite seu CEP (00000-000)"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="h-12 text-sm font-bold tracking-wider text-center shadow-sm border-slate-200 focus-visible:ring-orange-500/30 rounded-xl"
                    maxLength={9}
                    onKeyDown={(e) => e.key === "Enter" && handleCepSearch()}
                  />
                  <Button 
                    className="h-12 px-5 rounded-xl shadow-sm bg-[#F37021] hover:bg-[#d95d14] text-white font-bold shrink-0 transition-colors" 
                    onClick={handleCepSearch}
                    disabled={loadingLoc || cep.length < 9}
                  >
                    {loadingLoc ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>

                <Button 
                  variant="outline" 
                  className="w-full h-11 border-[#F37021]/30 text-[#F37021] bg-orange-50/50 hover:bg-orange-100/60 hover:border-[#F37021]/50 font-bold rounded-xl transition-all text-xs shadow-sm group"
                  onClick={handleGeoLocation}
                  disabled={loadingLoc}
                >
                  {loadingLoc ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin text-[#F37021]" />
                  ) : (
                    <Navigation className="h-4 w-4 mr-2 text-[#F37021] group-hover:scale-110 transition-transform" />
                  )}
                  Utilizar minha localização atual
                </Button>
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-5 animate-in zoom-in-95 duration-300 flex-1 flex flex-col">
              <div className="text-center space-y-1">
                <h2 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                  Lojas Encontradas ({foundStores.length})
                </h2>
                {isSearchByLocation ? (
                  <p className="text-xs text-slate-500 font-medium">Lojas mais próximas da sua localização</p>
                ) : (
                  <p className="text-xs text-slate-500 font-medium flex items-center justify-center gap-1 flex-wrap">
                    Lojas em 
                    <span className="text-[#F37021] bg-orange-50 px-2 py-0.5 rounded-md font-bold">
                      {selectedCity || "Sua Região"}
                    </span>
                    {selectedBairro && selectedBairro !== "ALL_BAIRROS" && (
                      <>
                        <span>•</span>
                        <span className="text-[#F37021] bg-orange-50 px-2 py-0.5 rounded-md font-bold">
                          {selectedBairro}
                        </span>
                      </>
                    )}
                  </p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-1 space-y-3 max-h-[320px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {foundStores.map((store, idx) => (
                  <div key={store.id || idx} className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_25px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col gap-3 group cursor-default">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-[#F37021] rounded-l-2xl"></div>
                    {isSearchByLocation && idx === 0 && (
                      <div className="absolute top-0 right-0 bg-orange-100 text-orange-800 text-[9px] font-black tracking-widest uppercase px-3 py-1 rounded-bl-xl border-b border-l border-orange-200 z-10 flex items-center gap-1">
                        <MapPin className="w-2.5 h-2.5" /> MAIS PRÓXIMA
                      </div>
                    )}
                    <div className="pt-1">
                      <div className="flex items-center gap-3 mb-2">
                        {(() => {
                          const isParceiro = store.categoriaAssociado === 'Parceiro' || store.isPleno === false;
                          const effectiveFavicon = store.faviconUrl || (!isParceiro ? globalFavicon : null);
                          const effectiveLogo = store.logoUrl || (!isParceiro ? globalLogo : null);
                          const rawSrc = effectiveFavicon || effectiveLogo || (!isParceiro ? '/favicon.png' : null);
                          const displaySrc = getSafeMediaUrl(rawSrc);
                          
                          if (displaySrc) {
                            return (
                              <div className="relative h-7 w-7 shrink-0">
                                <img 
                                  src={displaySrc} 
                                  alt={store.nome || "Logo da loja"} 
                                  className="h-7 w-7 object-contain rounded" 
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                    const fb = e.currentTarget.parentElement?.querySelector('.store-badge-fallback') as HTMLElement;
                                    if (fb) fb.classList.remove('hidden');
                                  }}
                                />
                                <div className="store-badge-fallback hidden h-7 w-7 bg-orange-50 border border-orange-200 rounded flex items-center justify-center text-[8px] font-extrabold text-orange-600 text-center leading-tight">
                                  {store.nome ? store.nome.substring(0, 2).toUpperCase() : 'FA'}
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div className="h-7 w-7 bg-slate-50 border border-slate-200 rounded flex items-center justify-center text-[7px] font-bold text-slate-500 text-center leading-tight shrink-0 overflow-hidden">
                              {store.nome ? store.nome.substring(0, 2).toUpperCase() : 'Loja'}
                            </div>
                          );
                        })()}
                        <h3 className="font-extrabold text-slate-800 text-base group-hover:text-[#F37021] transition-colors leading-tight truncate">{store.nome}</h3>
                      </div>
                      
                      <div className="space-y-1.5 text-xs text-slate-600 font-medium">
                        <p className="flex items-start gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5 text-[#F37021]" />
                          <span className="line-clamp-2 leading-snug">
                            {store.bairro ? `${store.bairro}, ${store.cidade} - ${store.uf || 'RS'}` : `${store.cidade} - ${store.uf || 'RS'}`}
                            {store.endereco ? ` (${store.endereco})` : ''}
                          </span>
                        </p>
                        
                        {store.distanceKm !== undefined && (
                          <p className="text-[11px] text-[#F37021] flex items-center gap-1 font-bold bg-orange-50 w-fit px-2 py-0.5 rounded border border-orange-100">
                            <Navigation className="h-3 w-3" />
                            {store.distanceKm < 1 ? "Menos de 1 km de distância" : `${store.distanceKm.toFixed(1)} km de distância`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full h-11 font-bold rounded-xl bg-[#F37021] hover:bg-[#d95d14] text-white shadow-sm hover:shadow-md transition-all text-xs"
                      onClick={() => goToStore(store)}
                    >
                      Acessar Loja
                      <ArrowRight className="h-3.5 w-3.5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-2 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full h-11 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors text-xs"
                  onClick={resetSelection}
                >
                  Voltar e alterar localização
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
