import { create } from "zustand";
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from "@supabase/supabase-js";

interface CIDADES_TYPE {
  uf: string;
  nome: string;
  x: number;
  y: number;
}

const CIDADES = [
  { uf: "RS", nome: "Porto Alegre", x: 52, y: 88 },
  { uf: "RS", nome: "Caxias do Sul", x: 53, y: 86 },
  { uf: "RS", nome: "Pelotas", x: 51, y: 92 },
  { uf: "RS", nome: "Santa Maria", x: 47, y: 87 },
  { uf: "RS", nome: "Canoas", x: 52, y: 87.5 },
  { uf: "SP", nome: "São Paulo", x: 63, y: 70 },
  { uf: "RJ", nome: "Rio de Janeiro", x: 69, y: 68 },
  { uf: "MG", nome: "Belo Horizonte", x: 68, y: 58 },
  { uf: "PR", nome: "Curitiba", x: 57, y: 76 },
  { uf: "SC", nome: "Florianópolis", x: 58, y: 81 },
  { uf: "DF", nome: "Brasília", x: 59, y: 48 },
  { uf: "BA", nome: "Salvador", x: 83, y: 38 },
  { uf: "PE", nome: "Recife", x: 93, y: 27 },
  { uf: "CE", nome: "Fortaleza", x: 83, y: 15 },
  { uf: "AM", nome: "Manaus", x: 32, y: 25 },
  { uf: "PA", nome: "Belém", x: 60, y: 18 },
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
          await channel!.track({
            sessionId,
            lojaId,
            cidade: getCityByIPMock(),
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
