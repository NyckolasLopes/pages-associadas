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
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [selectedCity, setSelectedCity] = useState<string>("");

  useEffect(() => {
    if (!pharmaciesLoaded) {
      loadPharmacies();
    }
  }, [pharmaciesLoaded, loadPharmacies]);

  const activeStores = useMemo(() => {
    return pharmacies.filter(p => p.ativo !== false && p.virtualStoreStatus !== 'Inativa');
  }, [pharmacies]);

  const cities = useMemo(() => {
    const citySet = new Set<string>();
    activeStores.forEach(store => {
      if (store.cidade) {
        citySet.add(store.cidade.trim());
      }
    });
    return Array.from(citySet).sort();
  }, [activeStores]);

  const handleCityChange = (cidade: string) => {
    setSelectedCity(cidade);
    const cityStores = activeStores.filter(p => p.cidade?.trim().toLowerCase() === cidade.toLowerCase());
    if (cityStores.length > 0) {
      setFoundStores(cityStores);
      setDistanceKm(null);
    }
  };

  const findNearestStore = (lat: number, lng: number) => {
    let closest: any = null;
    let minDist = Infinity;

    for (const store of activeStores) {
      const sLat = (store as any).latitude || store.lat;
      const sLng = (store as any).longitude || (store as any).lng; 
        
      if (sLat && sLng) {
        const dist = haversineKm(lat, lng, Number(sLat), Number(sLng));
        if (dist < minDist) {
          minDist = dist;
          closest = store;
        }
      }
    }

    if (closest) {
      setFoundStores([closest]);
      setDistanceKm(minDist);
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background decoration - Light Premium Mesh Gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] right-[-10%] w-[800px] h-[800px] bg-emerald-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[800px] h-[800px] bg-teal-100/50 rounded-full blur-[120px] opacity-80 mix-blend-multiply"></div>
        <div className="absolute top-[20%] left-[20%] w-[500px] h-[500px] bg-blue-50/50 rounded-full blur-[100px] opacity-60 mix-blend-multiply"></div>
      </div>

      <div className="w-full max-w-md bg-white/70 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white overflow-hidden relative z-10 flex flex-col transition-all duration-500">
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
                  <span className="bg-transparent px-3 text-slate-400 font-bold tracking-widest backdrop-blur-md">selecione a cidade</span>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full h-14 bg-white/80 border-slate-200 rounded-xl font-medium text-slate-700 shadow-sm focus:ring-emerald-500/30">
                    <SelectValue placeholder="Escolher uma cidade..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                    {cities.map(city => (
                      <SelectItem key={city} value={city} className="cursor-pointer py-3">{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Search Results */
            <div className="space-y-6 animate-in zoom-in-95 duration-500 flex-1 flex flex-col">
              <div className="text-center space-y-2 mb-2">
                <div className="mx-auto h-16 w-16 bg-gradient-to-tr from-emerald-100 to-teal-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-emerald-100/50 transform rotate-3">
                  <Store className="h-8 w-8 -rotate-3" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                  {foundStores.length > 1 ? "Lojas Encontradas" : "Loja Encontrada"}
                </h2>
                {distanceKm !== null ? (
                  <p className="text-sm text-slate-500 font-medium">
                    Aproximadamente <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mx-1 font-bold">{distanceKm < 1 ? "< 1" : distanceKm.toFixed(1)} km</span> de distância
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 font-medium">Lojas na cidade de <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mx-1 font-bold">{selectedCity}</span></p>
                )}
              </div>

              <div className="flex-1 overflow-y-auto pr-2 space-y-3 max-h-[300px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                {foundStores.map((store, idx) => (
                  <div key={store.id || idx} className="bg-white border border-slate-100 rounded-2xl p-5 shadow-[0_2px_10px_rgb(0,0,0,0.02)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-300 relative overflow-hidden flex flex-col gap-4 group cursor-default">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-emerald-500 rounded-l-2xl"></div>
                    <div>
                      <h3 className="font-extrabold text-slate-800 text-lg group-hover:text-emerald-700 transition-colors">{store.nome}</h3>
                      <p className="text-sm text-slate-500 flex items-start gap-2 mt-2 font-medium">
                        <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                        <span className="line-clamp-2 leading-snug">
                          {store.cidade} - {store.uf}
                        </span>
                      </p>
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
