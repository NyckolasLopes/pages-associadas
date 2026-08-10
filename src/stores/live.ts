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
  cleanup: () => void;
}

const getCityByIPMock = () => {
  return CIDADES[Math.floor(Math.random() * CIDADES.length)];
};

export const useLive = create<LiveStore>((set, get) => ({
  visitors: [],
  totalAcessos: 0,
  stats: {},
  lojasAcessos: {
    "1": { total: 1530, mes: 1530, hoje: 112, lastAccess: Date.now() },
    "2": { total: 940, mes: 940, hoje: 65, lastAccess: Date.now() },
    "3": { total: 420, mes: 420, hoje: 28, lastAccess: Date.now() },
  },
  channel: null,

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

  recordLojaAccess: (lojaId: string) => {
    if (!lojaId) return;
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
