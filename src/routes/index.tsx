import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Navigation, Search, Store, ArrowRight, Loader2 } from "lucide-react";
import { getCepCoordsWithFallback, haversineKm } from "@/lib/distanceApis";
import { toast } from "sonner";
import AssociadasLogo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
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

function formatCep(value: string) {
  const v = value.replace(/\D/g, "");
  return v.replace(/^(\d{5})(\d)/, "$1-$2").slice(0, 9);
}

function IndexGateway() {
  const navigate = useNavigate();
  const { pharmacies, pharmaciesLoaded, loadPharmacies } = useAdmin();
  const setSelectedPharmacyId = useCart((s) => s.setSelectedPharmacyId);

  const [cep, setCep] = useState("");
  const [loadingLoc, setLoadingLoc] = useState(false);
  const [foundStores, setFoundStores] = useState<any[]>([]);
  const [isSearchByLocation, setIsSearchByLocation] = useState(false);
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    if (!pharmaciesLoaded) {
      loadPharmacies();
    }
  }, [pharmaciesLoaded, loadPharmacies]);

  const activeStores = useMemo(() => {
    return pharmacies.filter(p => p.ativo !== false && p.virtualStoreStatus !== 'Inativa');
  }, [pharmacies]);

  const bairros = useMemo(() => {
    const bairroSet = new Set<string>();
    activeStores.forEach(store => {
      const b = store.bairro || store.cidade;
      if (b) {
        bairroSet.add(b.trim());
      }
    });
    return Array.from(bairroSet).sort();
  }, [activeStores]);

  const handleCityChange = (cidade: string) => {
    setSelectedCity(cidade);
    setIsSearchByLocation(false);
    const cityStores = activeStores.filter(p => {
      const b = p.bairro || p.cidade;
      return b?.trim().toLowerCase() === cidade.toLowerCase();
    });
    if (cityStores.length > 0) {
      setFoundStores(cityStores);
      setIsSearchByLocation(false);
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

  return (
    <div className="min-h-screen bg-emerald-700 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans group transition-all">
      {/* Animated Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center transition-transform duration-[7000ms] ease-out group-hover:scale-110" 
        style={{ backgroundImage: "url('/bg-home.jpg')" }}
      ></div>
      {/* Overlay Escuro para destacar o modal principal */}
      <div className="absolute inset-0 bg-emerald-950/20 mix-blend-multiply pointer-events-none transition-opacity duration-1000 group-hover:opacity-60"></div>

      {/* Background decoration - Light Premium Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative z-10 flex flex-col transition-all duration-500">
        {/* Header */}
        <div className="pt-10 pb-6 px-8 text-center relative">
          <img 
            src={AssociadasLogo} 
            alt="Farmácias Associadas" 
            className="h-14 w-auto mx-auto mb-6" 
          />
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800">
            Bem-vindo(a)!
          </h1>
          <p className="text-slate-500 font-medium text-sm mt-2">
            Encontre a loja mais próxima de você
          </p>
        </div>

        <div className="p-8 pt-2 space-y-6 flex-1 flex flex-col min-h-[360px]">
          {/* Location Gateway */}
          {foundStores.length === 0 ? (
            <div className="space-y-7 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700 tracking-wide">BUSCAR POR CEP</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="h-14 text-lg font-bold tracking-widest text-center shadow-sm border-slate-200 focus-visible:ring-emerald-500/30 rounded-xl"
                    maxLength={9}
                    onKeyDown={(e) => e.key === "Enter" && handleCepSearch()}
                  />
                  <Button 
                    className="h-14 px-6 rounded-xl shadow-sm hover:scale-105 transition-transform active:scale-95 bg-emerald-600 hover:bg-emerald-700 text-white" 
                    onClick={handleCepSearch}
                    disabled={loadingLoc || cep.length < 9}
                  >
                    {loadingLoc ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-transparent px-3 text-slate-400 font-bold tracking-widest backdrop-blur-md">ou</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 border-emerald-600/20 text-emerald-700 bg-emerald-50/50 hover:bg-emerald-100/50 hover:border-emerald-600/30 font-bold rounded-xl transition-all shadow-sm group"
                onClick={handleGeoLocation}
                disabled={loadingLoc}
              >
                {loadingLoc ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin text-emerald-600" />
                ) : (
                  <Navigation className="h-5 w-5 mr-2 text-emerald-600 group-hover:scale-110 transition-transform" />
                )}
                Utilizar minha localização
              </Button>

              <div className="relative py-2 mt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200/60" />
                </div>
                <div className="relative flex justify-center text-[11px] uppercase">
                  <span className="bg-transparent px-3 text-slate-400 font-bold tracking-widest backdrop-blur-md">selecione o bairro ou cidade</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full h-14 bg-white/80 border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:ring-emerald-500/30">
                    <SelectValue placeholder="Escolher..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl max-h-[300px]">
                    {bairros.map(b => (
                      <SelectItem key={b} value={b} className="cursor-pointer py-3">{b}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-6 animate-in zoom-in-95 duration-500 flex-1 flex flex-col">
              <div className="text-center space-y-2 mb-2">
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  Lojas Encontradas
                </h2>
                {isSearchByLocation ? (
                  <p className="text-sm text-slate-500 font-medium">Lojas mais próximas de você</p>
                ) : (
                  <p className="text-sm text-slate-500 font-medium">Lojas em <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mx-1 font-bold">{selectedCity}</span></p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {foundStores.map((store, idx) => (
                  <div key={store.id || idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col gap-4 group cursor-default">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
                    <div>
                      <div className="flex items-center gap-3 mb-3">
                        {store.faviconUrl ? (
                          <img 
                            src={store.faviconUrl} 
                            alt="Logo da loja" 
                            className="h-8 w-8 object-contain shrink-0" 
                          />
                        ) : (
                          <div className="h-8 w-8 bg-slate-50 border border-slate-200 rounded-md flex items-center justify-center text-[7px] font-bold text-slate-400 text-center leading-tight shrink-0 overflow-hidden shadow-inner">
                            Sem<br/>Logo
                          </div>
                        )}
                        <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors leading-tight">{store.nome}</h3>
                      </div>
                      
                      <div className="space-y-2">
                        <p className="text-sm text-slate-500 flex items-start gap-2 font-medium">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                          <span className="line-clamp-2 leading-snug">
                            {store.bairro ? `${store.bairro}, ${store.cidade} - ${store.uf}` : `${store.cidade} - ${store.uf}`}
                          </span>
                        </p>
                        
                        {store.distanceKm !== undefined && (
                          <p className="text-sm text-emerald-700 flex items-center gap-2 font-bold bg-emerald-50 w-fit px-2.5 py-1 rounded-md border border-emerald-100">
                            <Navigation className="h-3.5 w-3.5" />
                            {store.distanceKm < 1 ? "Menos de 1 km de distância" : `${store.distanceKm.toFixed(1)} km de distância`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button 
                      className="w-full h-12 font-bold rounded-xl bg-slate-900 hover:bg-slate-800 text-white shadow-md hover:shadow-lg transition-all"
                      onClick={() => goToStore(store)}
                    >
                      Acessar Loja
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="pt-4 mt-auto">
                <Button 
                  variant="ghost" 
                  className="w-full h-12 font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
                  onClick={() => setFoundStores([])}
                >
                  Voltar e buscar novamente
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
