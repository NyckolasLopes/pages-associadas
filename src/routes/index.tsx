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
  const [nearestStore, setNearestStore] = useState<any | null>(null);
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
    const cityStores = activeStores.filter(p => p.cidade?.trim() === cidade);
    if (cityStores.length > 0) {
      setNearestStore(cityStores[0]); // Pick first one as nearest visually
      setDistanceKm(null);
    }
  };

  const findNearestStore = (lat: number, lng: number) => {
    let closest: any = null;
    let minDist = Infinity;

    for (const store of activeStores) {
      const sLat = store.latitude || store.lat;
      const sLng = (store as any).longitude || (store as any).lng; 
        
      if (sLat && sLng) {
        const dist = haversineKm(lat, lng, Number(sLat), Number(sLng));
          if (dist < minDist) {
            minDist = dist;
            closest = store;
          }
        }
      }
    }

    if (closest) {
      setNearestStore(closest);
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
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40">
        <div className="absolute -top-1/4 -right-1/4 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden relative z-10 flex flex-col">
        {/* Header */}
        <div className="bg-primary p-8 text-center text-white relative">
          <img 
            src={AssociadasLogo} 
            alt="Farmácias Associadas" 
            className="h-14 w-auto mx-auto mb-4 brightness-0 invert" 
          />
          <h1 className="text-2xl font-black tracking-tight">Bem-vindo(a)!</h1>
          <p className="text-primary-foreground/90 text-sm mt-2">
            Encontre a loja mais próxima de você
          </p>
        </div>

        <div className="p-6 space-y-6 flex-1 flex flex-col min-h-[360px]">
          {/* Location Gateway */}
          {!nearestStore ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex-1">
              <div className="space-y-3">
                <label className="text-sm font-bold text-slate-700">De qual cidade você está acessando?</label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => setCep(formatCep(e.target.value))}
                    className="h-12 text-lg font-medium tracking-widest text-center shadow-sm"
                    maxLength={9}
                    onKeyDown={(e) => e.key === "Enter" && handleCepSearch()}
                  />
                  <Button 
                    className="h-12 px-6 shadow-sm" 
                    onClick={handleCepSearch}
                    disabled={loadingLoc || cep.length < 9}
                  >
                    {loadingLoc ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">ou</span>
                </div>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-12 border-primary/20 text-primary hover:bg-primary/5 font-bold shadow-sm"
                onClick={handleGeoLocation}
                disabled={loadingLoc}
              >
                {loadingLoc ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <Navigation className="h-5 w-5 mr-2" />
                )}
                Utilizar minha localização
              </Button>

              <div className="relative mt-2">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-slate-400 font-bold tracking-wider">ou selecione a cidade</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <Select value={selectedCity} onValueChange={handleCityChange}>
                  <SelectTrigger className="w-full h-12 bg-slate-50 border-slate-200">
                    <SelectValue placeholder="Escolher uma cidade..." />
                  </SelectTrigger>
                  <SelectContent>
                    {cities.map(city => (
                      <SelectItem key={city} value={city}>{city}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : (
            /* Nearest Store Result */
            <div className="space-y-6 animate-in zoom-in-95 duration-300 flex-1 flex flex-col justify-center">
              <div className="text-center space-y-2">
                <div className="mx-auto h-20 w-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-6 shadow-inner">
                  <Store className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 tracking-tight">Loja Encontrada</h2>
                {distanceKm !== null ? (
                  <p className="text-sm text-slate-500">
                    Aproximadamente <strong className="text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md mx-1">{distanceKm < 1 ? "< 1" : distanceKm.toFixed(1)} km</strong> de distância
                  </p>
                ) : (
                  <p className="text-sm text-slate-500">Loja selecionada na cidade de <strong className="text-slate-700">{selectedCity}</strong></p>
                )}
              </div>

              <div className="bg-slate-50/50 border border-slate-100 rounded-xl p-5 mt-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500"></div>
                <h3 className="font-bold text-slate-800 text-lg mb-1">{nearestStore.nome}</h3>
                <p className="text-sm text-slate-500 flex items-start gap-1.5 mt-2">
                  <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-slate-400" />
                  <span className="line-clamp-2 leading-tight">
                    {nearestStore.cidade} - {nearestStore.uf}
                  </span>
                </p>
              </div>

              <div className="pt-6 flex gap-3 mt-auto">
                <Button 
                  variant="outline" 
                  className="flex-1 h-12 font-bold"
                  onClick={() => setNearestStore(null)}
                >
                  Voltar
                </Button>
                <Button 
                  className="flex-1 h-12 font-bold"
                  onClick={() => goToStore(nearestStore)}
                >
                  Acessar Loja
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
