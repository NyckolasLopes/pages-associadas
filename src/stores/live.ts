import { create } from "zustand";
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from "@supabase/supabase-js";

export interface CIDADES_TYPE {
  uf: string;
  nome: string;
  x: number;
  y: number;
  lat?: number;
  lng?: number;
}

export const CIDADES: CIDADES_TYPE[] = [
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
  pagina?: string;
  path?: string;
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
  isPolling: boolean;
  initPresence: (sessionId: string, lojaId?: string) => void;
  updateMyCity: () => Promise<void>;
  recordLojaAccess: (lojaId: string) => void;
  fetchRealAcessos: () => Promise<void>;
  fetchActiveVisitors: () => Promise<void>;
  startPollingVisitors: () => () => void;
  stopPollingVisitors: () => void;
  cleanup: () => void;
}

let heartbeatTimer: any = null;
let pollTimer: any = null;
let statsPollTimer: any = null;

function getPageInfo() {
  if (typeof window === 'undefined') return { pagina: "Início", path: "/" };
  const p = window.location.pathname;
  if (p.includes('/carrinho') || p.includes('/cart')) return { pagina: "Carrinho", path: p };
  if (p.includes('/checkout')) return { pagina: "Checkout", path: p };
  if (p.includes('/produto/') || p.includes('/p/')) return { pagina: "Página de Produto", path: p };
  if (p.includes('/c/')) return { pagina: "Categoria", path: p };
  if (p.includes('/v/')) return { pagina: "Vitrine", path: p };
  if (p.includes('/busca') || p.includes('/search')) return { pagina: "Busca", path: p };
  if (p.includes('/painel') || p.includes('/admin')) return { pagina: "Painel Admin", path: p };
  return { pagina: "Início / Loja", path: p };
}

async function resolveVisitorLocation(): Promise<CIDADES_TYPE> {
  // ── Fase 1: GPS direto ──
  if (typeof window !== 'undefined' && navigator.geolocation) {
    try {
      let gpsPermission: PermissionState = 'prompt';
      try {
        const perm = await navigator.permissions.query({ name: 'geolocation' });
        gpsPermission = perm.state;
      } catch {}

      if (gpsPermission !== 'denied') {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: gpsPermission === 'granted' ? 12000 : 5000,
            maximumAge: 0
          });
        });
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const [nomRes, bdcRes] = await Promise.all([
          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
            { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } }
          ).then(r => r.ok ? r.json() : null).catch(() => null),
          fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
          ).then(r => r.ok ? r.json() : null).catch(() => null),
        ]);

        let cityName: string | null = null;
        let uf = "";

        if (nomRes?.address) {
          const addr = nomRes.address;
          cityName = addr.city || addr.town || addr.municipality || addr.village || addr.hamlet || addr.district || addr.city_district || addr.suburb || null;
          uf = addr.state_code || addr.state || "";
        }
        if (!cityName && bdcRes) {
          cityName = bdcRes.city || bdcRes.locality
            || bdcRes.localityInfo?.administrative?.find((a: any) => a.adminLevel === 8 || a.description?.toLowerCase()?.includes('município'))?.name
            || null;
          uf = uf || bdcRes.principalSubdivisionCode?.replace('BR-', '') || bdcRes.principalSubdivision || "";
        }

        if (cityName) {
          return { nome: cityName, uf, x: 50, y: 50, lat, lng };
        }
      }
    } catch {}
  }

  // ── Fase 2: GeoIP ──
  try {
    const [ipapiData, ipwhoisData, geojsData] = await Promise.all([
      fetch(`https://ipapi.co/json/?_t=${Date.now()}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://ipwhois.app/json/?lang=pt&_t=${Date.now()}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
      fetch(`https://get.geojs.io/v1/ip/geo.json?_t=${Date.now()}`)
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);

    if (ipapiData?.city && ipapiData?.latitude) {
      return {
        nome: ipapiData.city,
        uf: ipapiData.region_code || ipapiData.region || "",
        x: 50, y: 50,
        lat: parseFloat(ipapiData.latitude),
        lng: parseFloat(ipapiData.longitude),
      };
    } else if (ipwhoisData?.city && ipwhoisData?.latitude) {
      return {
        nome: ipwhoisData.city,
        uf: ipwhoisData.region_code || ipwhoisData.region || "",
        x: 50, y: 50,
        lat: parseFloat(ipwhoisData.latitude),
        lng: parseFloat(ipwhoisData.longitude),
      };
    } else if (geojsData?.city && geojsData?.latitude) {
      return {
        nome: geojsData.city,
        uf: geojsData.region || "",
        x: 50, y: 50,
        lat: parseFloat(geojsData.latitude),
        lng: parseFloat(geojsData.longitude),
      };
    }
  } catch {}

  // ── Fase 3: Fallback padrão ──
  return CIDADES[0];
}

export const useLive = create<LiveStore>((set, get) => ({
  visitors: [],
  totalAcessos: 0,
  stats: {},
  lojasAcessos: {},
  channel: null,
  myCidade: null,
  mySessionId: null,
  isPolling: false,

  fetchRealAcessos: async () => {
    try {
      // 1. Obter a contagem total exata de acessos de forma ultrarrápida via HEAD (sem transferir linhas)
      const { count: exactTotal } = await supabase
        .from('site_acessos')
        .select('id', { count: 'exact', head: true });

      // 2. Buscar apenas colunas necessárias dos últimos 30 dias com limite seguro (economiza 90%+ de tráfego)
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await supabase
        .from('site_acessos')
        .select('created_at, loja_id')
        .gte('created_at', thirtyDaysAgo)
        .order('created_at', { ascending: false })
        .limit(5000);

      if (error) {
        console.warn("Aviso ao buscar histórico de acessos:", error.message);
        return;
      }

      const now = new Date();
      const isHoje = (d: Date) => d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      const isMes = (d: Date) => d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();

      const stats: Record<string, LojaAcessoStat> = {};
      let calculatedTotal = 0;

      (data || []).forEach(acesso => {
        const date = new Date(acesso.created_at);
        const lojaId = acesso.loja_id || 'global';
        
        if (!stats[lojaId]) stats[lojaId] = { total: 0, mes: 0, hoje: 0, lastAccess: 0 };
        
        stats[lojaId].total += 1;
        if (isMes(date)) stats[lojaId].mes += 1;
        if (isHoje(date)) stats[lojaId].hoje += 1;
        
        stats[lojaId].lastAccess = Math.max(stats[lojaId].lastAccess, date.getTime());
        calculatedTotal += 1;
      });

      set({ lojasAcessos: stats, totalAcessos: exactTotal !== null && exactTotal !== undefined ? exactTotal : calculatedTotal });
    } catch (e) {
      console.warn("Exceção ao buscar acessos:", e);
    }
  },

  fetchActiveVisitors: async () => {
    try {
      // Considera visitantes com heartbeat nos últimos 75 segundos como ativos e online
      const since = new Date(Date.now() - 75000).toISOString();
      const { data, error } = await supabase
        .from('site_acessos')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(300);

      if (error) {
        return;
      }

      const activeVisitors: VisitorInfo[] = [];
      const seenSessions = new Set<string>();

      (data || []).forEach((row) => {
        let sid = row.session_id;
        let cidade: CIDADES_TYPE = CIDADES[0];
        let pagina = "Início / Loja";
        let path = "/";

        if (typeof row.session_id === 'string' && row.session_id.startsWith('{')) {
          try {
            const parsed = JSON.parse(row.session_id);
            sid = parsed.s || row.session_id;
            if (parsed.c) {
              cidade = {
                nome: parsed.c,
                uf: parsed.u || "",
                x: 50,
                y: 50,
                lat: parsed.lat || -30.0346,
                lng: parsed.lng || -51.2177,
              };
            }
            pagina = parsed.p || pagina;
            path = parsed.path || path;
          } catch {}
        }

        if (!seenSessions.has(sid)) {
          seenSessions.add(sid);
          activeVisitors.push({
            id: typeof row.id === 'string' ? Math.abs(hashCode(row.id)) : Math.floor(Math.random() * 1000000),
            sessionId: sid,
            cidade,
            expiresAt: new Date(row.created_at).getTime() + 45000,
            lojaId: row.loja_id || undefined,
            pagina,
            path,
          });
        }
      });

      set({ visitors: activeVisitors });
    } catch (e) {
      console.warn("Falha ao buscar visitantes ao vivo:", e);
    }
  },

  startPollingVisitors: () => {
    const { fetchActiveVisitors, fetchRealAcessos } = get();
    set({ isPolling: true });

    // Busca inicial imediata
    fetchActiveVisitors();
    fetchRealAcessos();

    if (pollTimer) clearInterval(pollTimer);
    if (statsPollTimer) clearInterval(statsPollTimer);

    // Polling contínuo de visitantes ativos a cada 8 segundos no admin
    pollTimer = setInterval(() => {
      fetchActiveVisitors();
    }, 8000);

    // Atualização de totais a cada 60 segundos
    statsPollTimer = setInterval(() => {
      fetchRealAcessos();
    }, 60000);

    return () => {
      get().stopPollingVisitors();
    };
  },

  stopPollingVisitors: () => {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (statsPollTimer) {
      clearInterval(statsPollTimer);
      statsPollTimer = null;
    }
    set({ isPolling: false });
  },

  recordLojaAccess: async (lojaId: string) => {
    if (!lojaId) return;

    const trackedKey = `fa-tracked-store-${lojaId}`;
    if (typeof window !== 'undefined' && !sessionStorage.getItem(trackedKey)) {
      const sessionId = sessionStorage.getItem("fa-visitor-session") || Math.random().toString(36).substring(2);
      if (!sessionStorage.getItem("fa-visitor-session")) {
        sessionStorage.setItem("fa-visitor-session", sessionId);
      }

      const city = get().myCidade || CIDADES[0];
      const pInfo = getPageInfo();
      const payload = JSON.stringify({
        s: sessionId,
        c: city.nome,
        u: city.uf,
        lat: city.lat,
        lng: city.lng,
        p: pInfo.pagina,
        path: pInfo.path,
      });

      try {
        await supabase.from("site_acessos").insert({
          session_id: payload,
          loja_id: lojaId,
          created_at: new Date().toISOString()
        });
        sessionStorage.setItem(trackedKey, "true");
      } catch (e) {
        console.warn("Aviso ao registrar acesso na loja:", e);
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

  initPresence: (sessionId: string, lojaId?: string) => {
    set({ mySessionId: sessionId });

    let lastHeartbeatTime = 0;

    const emitHeartbeat = async (force = false) => {
      // Se a aba estiver minimizada ou em segundo plano, não gasta requisição nem banco
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && !force) {
        return;
      }

      const now = Date.now();
      // Throttling: impede disparos seguidos em menos de 30 segundos
      if (!force && (now - lastHeartbeatTime < 30000)) {
        return;
      }

      lastHeartbeatTime = now;

      try {
        const city = get().myCidade || CIDADES[0];
        const pInfo = getPageInfo();
        const payload = JSON.stringify({
          s: sessionId,
          c: city.nome,
          u: city.uf,
          lat: city.lat,
          lng: city.lng,
          p: pInfo.pagina,
          path: pInfo.path,
        });

        await supabase.from('site_acessos').insert({
          session_id: payload,
          loja_id: lojaId || null,
          created_at: new Date().toISOString()
        });
      } catch (err) {
        // Silently catch heartbeat errors
      }
    };

    // 1. Resolve localização e dispara primeiro heartbeat com a cidade real
    resolveVisitorLocation().then((resolvedCity) => {
      set({ myCidade: resolvedCity });
      emitHeartbeat(true);
    });

    // 2. Heartbeat contínuo a cada 60 segundos enquanto a aba estiver aberta e ativa
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    heartbeatTimer = setInterval(() => {
      emitHeartbeat();
    }, 60000);

    // 3. Heartbeat em mudanças de foco ou visibilidade da aba (com throttle inteligente de 30s)
    if (typeof window !== 'undefined') {
      const throttledFocus = () => emitHeartbeat(false);
      window.addEventListener('focus', throttledFocus);
      document.addEventListener('visibilitychange', throttledFocus);
    }
  },

  updateMyCity: async () => {
    const { mySessionId } = get();
    if (!mySessionId) return;

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true, timeout: 15000, maximumAge: 0
        });
      });
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const [nomRes, bdcRes] = await Promise.all([
        fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=pt-BR`,
          { headers: { 'Accept-Language': 'pt-BR,pt;q=0.9' } }
        ).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch(
          `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`
        ).then(r => r.ok ? r.json() : null).catch(() => null),
      ]);

      let cityName: string | null = null;
      let uf = "";
      if (nomRes?.address) {
        const addr = nomRes.address;
        cityName = addr.city || addr.town || addr.municipality || addr.village || addr.hamlet || addr.district || addr.city_district || addr.suburb || null;
        uf = addr.state_code || addr.state || "";
      }
      if (!cityName && bdcRes) {
        cityName = bdcRes.city || bdcRes.locality
          || bdcRes.localityInfo?.administrative?.find((a: any) => a.adminLevel === 8 || a.description?.toLowerCase()?.includes('município'))?.name
          || null;
        uf = uf || bdcRes.principalSubdivisionCode?.replace('BR-', '') || "";
      }

      if (cityName) {
        const updatedCity: CIDADES_TYPE = { nome: cityName, uf, x: 50, y: 50, lat, lng };
        set({ myCidade: updatedCity });

        // Envia heartbeat imediato com a nova localização
        const pInfo = getPageInfo();
        const payload = JSON.stringify({
          s: mySessionId,
          c: cityName,
          u: uf,
          lat,
          lng,
          p: pInfo.pagina,
          path: pInfo.path,
        });

        await supabase.from('site_acessos').insert({
          session_id: payload,
          loja_id: undefined,
          created_at: new Date().toISOString()
        });
      }
    } catch (e) {
      console.warn("GPS não disponível para corrigir localização:", e);
      throw e;
    }
  },

  cleanup: () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
    get().stopPollingVisitors();
  }
}));

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}
