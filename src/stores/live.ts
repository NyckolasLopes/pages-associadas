import { create } from "zustand";
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from "@supabase/supabase-js";

interface CIDADES_TYPE {
  uf: string;
  nome: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export const CIDADES = [
  { uf: "RS", nome: "Porto Alegre", x: 52, y: 88, lat: -30.0346, lng: -51.2177 },
  { uf: "RS", nome: "Caxias do Sul", x: 53, y: 86, lat: -29.1681, lng: -51.1794 },
  { uf: "RS", nome: "Pelotas", x: 51, y: 92, lat: -31.7654, lng: -52.3376 },
  { uf: "RS", nome: "Santa Maria", x: 47, y: 87, lat: -29.6842, lng: -53.8069 },
  { uf: "RS", nome: "Canoas", x: 52, y: 87.5, lat: -29.9192, lng: -51.1833 },
  { uf: "SP", nome: "São Paulo", x: 63, y: 70, lat: -23.5505, lng: -46.6333 },
  { uf: "RJ", nome: "Rio de Janeiro", x: 69, y: 68, lat: -22.9068, lng: -43.1729 },
  { uf: "MG", nome: "Belo Horizonte", x: 68, y: 58, lat: -19.9208, lng: -43.9378 },
  { uf: "PR", nome: "Curitiba", x: 57, y: 76, lat: -25.4290, lng: -49.2671 },
  { uf: "SC", nome: "Florianópolis", x: 58, y: 81, lat: -27.5954, lng: -48.5480 },
  { uf: "DF", nome: "Brasília", x: 59, y: 48, lat: -15.7938, lng: -47.8828 },
  { uf: "BA", nome: "Salvador", x: 83, y: 38, lat: -12.9714, lng: -38.5014 },
  { uf: "PE", nome: "Recife", x: 93, y: 27, lat: -8.0476, lng: -34.8770 },
  { uf: "CE", nome: "Fortaleza", x: 83, y: 15, lat: -3.7172, lng: -38.5433 },
  { uf: "AM", nome: "Manaus", x: 32, y: 25, lat: -3.1190, lng: -60.0217 },
  { uf: "PA", nome: "Belém", x: 60, y: 18, lat: -1.4550, lng: -48.5024 },
];

export interface VisitorInfo {
  id: number;
  sessionId: string;
  cidade: CIDADES_TYPE;
  expiresAt: number;
  lojaId?: string;
}

export interface LojaAcessoStat {
  total: number;
  mes: number;
  hoje: number;
  lastAccess: number;
}

interface LiveStore {
  visitors: VisitorInfo[];
  totalAcessos: number;
  stats: Record<string, number>;
  lojasAcessos: Record<string, LojaAcessoStat>;
  channel: RealtimeChannel | null;
  myCidade: CIDADES_TYPE | null;
  mySessionId: string | null;
  initPresence: (sessionId: string, lojaId?: string) => void;
  recordLojaAccess: (lojaId: string) => void;
  fetchRealAcessos: () => Promise<void>;
  cleanup: () => void;
}


export const useLive = create<LiveStore>((set, get) => ({
  visitors: [],
  totalAcessos: 0,
  stats: {},
  lojasAcessos: {},
  channel: null,
  myCidade: null,
  mySessionId: null,

  fetchRealAcessos: async () => {
    try {
      // Puxar do banco real e calcular total, mes, hoje por loja e global.
      const { data, error } = await supabase.from('site_acessos').select('*');
      if (error) {
        console.error("ERRO AO BUSCAR ACESSOS (Possível bloqueio de RLS):", error);
        return;
      }
      console.log("Acessos obtidos do DB:", data?.length);

      const now = new Date();
      const isHoje = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const isMes = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

      const stats: Record<string, LojaAcessoStat> = {};
      let globTotal = 0;

      data.forEach(acesso => {
        const date = new Date(acesso.created_at);
        const lojaId = acesso.loja_id || 'global';
        
        if (!stats[lojaId]) stats[lojaId] = { total: 0, mes: 0, hoje: 0, lastAccess: 0 };
        
        stats[lojaId].total += 1;
        if (isMes(date)) stats[lojaId].mes += 1;
        if (isHoje(date)) stats[lojaId].hoje += 1;
        
        stats[lojaId].lastAccess = Math.max(stats[lojaId].lastAccess, date.getTime());
        globTotal += 1;
      });

      set({ lojasAcessos: stats, totalAcessos: globTotal });
    } catch (e) {
      console.error("Exceção ao buscar acessos:", e);
    }
  },

  initPresence: (sessionId: string, lojaId?: string) => {
    let channel = get().channel;
    
    if (channel) {
      // Se já temos um canal e a cidade, apenas atualizamos o status de presence
      const { myCidade } = get();
      if (myCidade) {
        channel.track({
          sessionId,
          lojaId,
          cidade: myCidade,
          onlineAt: new Date().toISOString()
        }).catch(console.error);
      }
      return;
    }

    if (!channel) {
      channel = supabase.channel('online-visitors');
      
      channel.on('presence', { event: 'sync' }, () => {
        const newState = channel!.presenceState();
        const activeVisitors: VisitorInfo[] = [];
        
        Object.keys(newState).forEach(key => {
          (newState[key] as any[]).forEach((pres: any) => {
            activeVisitors.push({
              id: Math.floor(Math.random() * 1000000), // Random ID
              sessionId: pres.sessionId,
              cidade: pres.cidade,
              expiresAt: Date.now() + 60000,
              lojaId: pres.lojaId
            });
          });
        });
        
        set({ visitors: activeVisitors });
      });

      channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Detecta cidade real por múltiplas APIs GeoIP — sem precisar de GPS
          let realCity: CIDADES_TYPE | null = null;

          // ── Fase 1: Múltiplas APIs GeoIP em paralelo ──
          // Cada API retorna cidade + lat/lng exatos baseados no IP do usuário
          const [ipapiData, ipwhoisData, geojsData] = await Promise.all([
            // ipapi.co — muito preciso para cidades brasileiras
            fetch(`https://ipapi.co/json/?_t=${Date.now()}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            // ipwhois.app — bom fallback
            fetch(`https://ipwhois.app/json/?lang=pt&_t=${Date.now()}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
            // geojs.io — confiável
            fetch(`https://get.geojs.io/v1/ip/geo.json?_t=${Date.now()}`)
              .then(r => r.ok ? r.json() : null)
              .catch(() => null),
          ]);

          // Tenta cada fonte na ordem de confiança
          if (ipapiData?.city && ipapiData?.latitude && ipapiData?.longitude) {
            // ipapi retorna nome em português para BR
            realCity = {
              nome: ipapiData.city,
              uf: ipapiData.region_code || ipapiData.region || "",
              x: 50, y: 50,
              lat: parseFloat(ipapiData.latitude),
              lng: parseFloat(ipapiData.longitude),
            };
          } else if (ipwhoisData?.city && ipwhoisData?.latitude && ipwhoisData?.longitude) {
            realCity = {
              nome: ipwhoisData.city,
              uf: ipwhoisData.region_code || ipwhoisData.region || "",
              x: 50, y: 50,
              lat: parseFloat(ipwhoisData.latitude),
              lng: parseFloat(ipwhoisData.longitude),
            };
          } else if (geojsData?.city && geojsData?.latitude && geojsData?.longitude) {
            realCity = {
              nome: geojsData.city,
              uf: geojsData.region || "",
              x: 50, y: 50,
              lat: parseFloat(geojsData.latitude),
              lng: parseFloat(geojsData.longitude),
            };
          }

          // ── Fase 2: GPS (opcional, melhora precisão se permitido) ──
          // Tenta enriquecer com nome local via Nominatim se o GPS for concedido
          if (typeof window !== 'undefined' && navigator.geolocation) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, {
                  enableHighAccuracy: true, timeout: 5000, maximumAge: 60000
                });
              });
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              // Refina o nome da cidade com Nominatim (mais preciso que IP para localização exata)
              const nomRes = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`,
                { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } }
              ).then(r => r.ok ? r.json() : null).catch(() => null);

              if (nomRes?.address) {
                const addr = nomRes.address;
                const cityName = addr.city || addr.town || addr.municipality || addr.village || addr.county || addr.region || (realCity?.nome ?? "Desconhecida");
                const uf = addr.state_code || addr.state || realCity?.uf || "";
                realCity = { nome: cityName, uf, x: 50, y: 50, lat, lng };
              } else if (realCity) {
                // GPS deu posição mas Nominatim falhou — usa coordenada GPS com nome do IP
                realCity = { ...realCity, lat, lng };
              }
            } catch {
              // GPS negado ou timeout — continua com dados de IP (já temos realCity)
            }
          }

          // ── Fase 3: Último fallback — cidade aleatória da lista somente se TUDO falhou ──
          if (!realCity) {
            realCity = CIDADES[Math.floor(Math.random() * CIDADES.length)];
          }

          // Salvar cidade para possibilitar atualizações futuras de track (quando a lojaId mudar)
          set({ myCidade: realCity, mySessionId: sessionId });

          await channel!.track({
            sessionId,
            lojaId,
            cidade: realCity,
            onlineAt: new Date().toISOString()
          });
        }
      });

      set({ channel });
    }
  },

  recordLojaAccess: async (lojaId: string) => {
    if (!lojaId) return;

    // Persist to database only once per session
    const trackedKey = `fa-tracked-store-${lojaId}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(trackedKey)) {
      let sessionId = sessionStorage.getItem("fa-visitor-session") || Math.random().toString(36).substring(2);
      if (!sessionStorage.getItem("fa-visitor-session")) {
        sessionStorage.setItem("fa-visitor-session", sessionId);
      }

      try {
        const { error } = await supabase.from("site_acessos").insert({
          session_id: sessionId,
          loja_id: lojaId,
        });
        if (error) {
          console.error("Supabase insert error for site_acessos:", error);
        } else {
          sessionStorage.setItem(trackedKey, "true");
        }
      } catch (e) {
        console.error("Failed to track store access:", e);
      }
    }

    const now = Date.now();
    set((state) => {
      const current = state.lojasAcessos[lojaId] || { total: 0, mes: 0, hoje: 0, lastAccess: now };
      return {
        totalAcessos: state.totalAcessos + 1,
        lojasAcessos: {
          ...state.lojasAcessos,
          [lojaId]: {
            total: current.total + 1,
            mes: current.mes + 1,
            hoje: current.hoje + 1,
            lastAccess: now,
          },
        },
      };
    });
  },
  
  cleanup: () => {
    const channel = get().channel;
    if (channel) {
      channel.untrack();
    }
  }
}));
