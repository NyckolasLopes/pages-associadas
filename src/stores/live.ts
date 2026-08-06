import { create } from "zustand";
import { persist } from "zustand/middleware";

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
  pingSession: (sessionId: string, lojaId?: string) => void;
  recordLojaAccess: (lojaId: string) => void;
  removeSession: (sessionId: string) => void;
  cleanup: () => void;
}

export const useLive = create<LiveStore>()(
  persist(
    (set, get) => ({
      visitors: [],
      totalAcessos: 0,
      stats: {},
      lojasAcessos: {
        "farmacia-matriz": { total: 342, mes: 342, hoje: 28, lastAccess: Date.now() },
        "filial-centro": { total: 215, mes: 215, hoje: 17, lastAccess: Date.now() },
        "filial-norte": { total: 184, mes: 184, hoje: 14, lastAccess: Date.now() },
        "filial-sul": { total: 129, mes: 129, hoje: 9, lastAccess: Date.now() },
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
      pingSession: (sessionId: string, lojaId?: string) => {
        const now = Date.now();
        const visitors = [...get().visitors];
        const existingIdx = visitors.findIndex((v) => v.sessionId === sessionId);

        if (existingIdx >= 0) {
          visitors[existingIdx].expiresAt = now + 120000;
          if (lojaId) visitors[existingIdx].lojaId = lojaId;
          set({ visitors });
        } else {
          // novo visitante real
          let userCity = { nome: "Localizando...", uf: "", x: 50, y: 50 };
          let isResolved = false;
          
          try {
            // Tenta pegar do CEP se estiver preenchido
            const cepStr = localStorage.getItem("fa-geo-cep");
            if (cepStr) {
              const parsed = JSON.parse(cepStr);
              if (parsed?.state?.city) {
                const cityName = parsed.state.city;
                const ufName = parsed.state.uf || "";
                
                const foundExact = CIDADES.find(c => c.nome.toLowerCase() === cityName.toLowerCase());
                if (foundExact) {
                  userCity = foundExact;
                  isResolved = true;
                } else {
                  const stateCapital = CIDADES.find(c => c.uf.toLowerCase() === ufName.toLowerCase()) || CIDADES[0];
                  userCity = {
                    nome: cityName,
                    uf: ufName.toUpperCase() || stateCapital.uf,
                    x: stateCapital.x + (Math.random() * 2 - 1),
                    y: stateCapital.y + (Math.random() * 2 - 1)
                  };
                  isResolved = true;
                }
              }
            }
          } catch (e) {}

          if (!isResolved) {
             const cachedLoc = localStorage.getItem("fa-ip-loc-v2");
             if (cachedLoc) {
                try {
                   userCity = JSON.parse(cachedLoc);
                   isResolved = true;
                } catch(e) {}
             }
          }

          const newVisitor: VisitorInfo = {
            id: now,
            sessionId,
            cidade: userCity,
            expiresAt: now + 120000,
            lojaId,
          };

          set((state) => {
            const currentLojaStat = lojaId ? (state.lojasAcessos[lojaId] || { total: 0, mes: 0, hoje: 0, lastAccess: now }) : null;
            return {
              visitors: [...state.visitors, newVisitor],
              totalAcessos: state.totalAcessos + 1,
              stats: {
                ...state.stats,
                [userCity.nome]: (state.stats[userCity.nome] || 0) + 1,
              },
              lojasAcessos: lojaId ? {
                ...state.lojasAcessos,
                [lojaId]: {
                  total: currentLojaStat!.total + 1,
                  mes: currentLojaStat!.mes + 1,
                  hoje: currentLojaStat!.hoje + 1,
                  lastAccess: now,
                },
              } : state.lojasAcessos,
            };
          });

          if (!isResolved) {
            fetch("https://ipwho.is/")
              .then(res => res.json())
              .then(data => {
                if (data && data.success && data.city) {
                  const lat = parseFloat(data.latitude);
                  const lon = parseFloat(data.longitude);
                  const x = 93 + (lon + 34.87) * 2.42;
                  const y = 88 - (lat + 30.03) * 2.34;
                  
                  const resolvedCity = {
                    nome: data.city,
                    uf: data.region_code || "",
                    x: Math.min(Math.max(x, 5), 95),
                    y: Math.min(Math.max(y, 5), 95)
                  };
                  
                  localStorage.setItem("fa-ip-loc-v2", JSON.stringify(resolvedCity));

                  set(s => {
                    const v = [...s.visitors];
                    const idx = v.findIndex(vi => vi.sessionId === sessionId);
                    if (idx >= 0 && v[idx].cidade.nome === "Localizando...") {
                      v[idx].cidade = resolvedCity;
                      
                      const newStats = { ...s.stats };
                      if (newStats["Localizando..."]) {
                        newStats["Localizando..."]--;
                        if (newStats["Localizando..."] <= 0) delete newStats["Localizando..."];
                      }
                      newStats[resolvedCity.nome] = (newStats[resolvedCity.nome] || 0) + 1;
                      
                      return { visitors: v, stats: newStats };
                    }
                    return s;
                  });
                }
              })
              .catch(() => {});
          }
        }
      },
      removeSession: (sessionId: string) => {
        set((state) => ({
          visitors: state.visitors.filter((v) => v.sessionId !== sessionId),
        }));
      },
      cleanup: () => {
        const now = Date.now();
        const state = get();
        const newVisitors = state.visitors.filter((v) => v.expiresAt > now);
        if (newVisitors.length !== state.visitors.length) {
          set({ visitors: newVisitors });
        }
      },
    }),
    {
      name: "live-visitors-storage",
    }
  )
);

if (typeof window !== "undefined") {
  setInterval(() => {
    const state = useLive.getState();
    if (state.visitors.length > 0) {
      state.cleanup();
    }
  }, 30000);

  window.addEventListener("storage", (e) => {
    if (e.key === "live-visitors-storage") {
      useLive.persist.rehydrate();
    }
  });
}

export { CIDADES };
