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
  initPresence: (sessionId: string, lojaId?: string) => void;
  recordLojaAccess: (lojaId: string) => void;
  fetchRealAcessos: () => Promise<void>;
  cleanup: () => void;
}

const getCityByIPMock = () => {
  return CIDADES[Math.floor(Math.random() * CIDADES.length)];
};

export const useLive = create<LiveStore>((set, get) => ({
  visitors: [],
  totalAcessos: 0,
  stats: {},
  lojasAcessos: {},
  channel: null,

  fetchRealAcessos: async () => {
    try {
      // Puxar do banco real e calcular total, mes, hoje por loja e global.
      const { data, error } = await supabase.from('site_acessos').select('*');
      if (error) return;

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
      console.error(e);
    }
  },

  initPresence: (sessionId: string, lojaId?: string) => {
    let channel = get().channel;
    
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
          let realCity = getCityByIPMock();
          let gotGps = false;

          // Tentativa de usar GPS Exato
          if (typeof window !== 'undefined' && navigator.geolocation) {
            try {
              const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
              });
              
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              
              const nomRes = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
              if (nomRes.ok) {
                const nomData = await nomRes.json();
                const addr = nomData.address || {};
                const city = addr.city || addr.town || addr.village || addr.municipality || "Desconhecida";
                const uf = addr.state || "";
                
                realCity = {
                  nome: city,
                  uf: uf,
                  x: 50,
                  y: 50,
                  lat,
                  lng
                };
                gotGps = true;
              }
            } catch (e) {
              console.warn("GPS ignorado ou falhou, caindo para IP:", e);
            }
          }

          // Se GPS falhou ou foi negado, usa IP
          if (!gotGps) {
            try {
              const res = await fetch(`https://get.geojs.io/v1/ip/geo.json?_t=${Date.now()}`);
              if (res.ok) {
                const data = await res.json();
                if (data.city && data.region) {
                  let x = 50;
                  let y = 50;
                  let lat = parseFloat(data.latitude);
                  let lng = parseFloat(data.longitude);
                  
                  const found = CIDADES.find(c => c.nome.toLowerCase() === data.city.toLowerCase());
                  if (found) {
                    x = found.x;
                    y = found.y;
                    lat = found.lat;
                    lng = found.lng;
                  } else if (data.longitude && data.latitude) {
                     x = ((data.longitude + 74) / 40) * 100;
                     y = ((5.2 - data.latitude) / 38.9) * 100;
                  }
                  
                  realCity = {
                    nome: data.city,
                    uf: data.region,
                    x,
                    y,
                    lat,
                    lng
                  };
                }
              }
            } catch (e) {
              console.error("GeoIP Fetch Error:", e);
            }
          }

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
