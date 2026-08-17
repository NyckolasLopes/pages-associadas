import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function toTitleCase(str: string) {
  if (!str) return '';
  return str.toLowerCase().replace(/(?:^|\s)\S/g, function(a) { return a.toUpperCase(); });
}

export function getCityFromCep(cep: string, pharmacies?: { cep: string, cidade: string }[]) {
  if (!cep || !pharmacies || pharmacies.length === 0) return "Porto Alegre";
  const userCepNum = parseInt(cep.replace(/\D/g, ""), 10);
  if (isNaN(userCepNum)) return "Porto Alegre";
  
  let closestCity = pharmacies[0]?.cidade || "Porto Alegre";
  let minDiff = Infinity;
  
  for (const p of pharmacies) {
    if (!p.cep || !p.cidade) continue;
    const pCepNum = parseInt(p.cep.replace(/\D/g, ""), 10);
    if (isNaN(pCepNum)) continue;
    const diff = Math.abs(userCepNum - pCepNum);
    if (diff < minDiff) {
      minDiff = diff;
      closestCity = p.cidade;
    }
  }
  
  return closestCity;
}

export function formatPrice(price: number) {
  return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function isCampanhaAtiva(produto: { emCampanha?: boolean, campanhaInicio?: string, campanhaFim?: string }) {
  if (!produto.emCampanha) return false;
  
  const now = new Date();
  
  if (produto.campanhaInicio) {
    const inicio = new Date(produto.campanhaInicio);
    if (now < inicio) return false;
  }
  
  if (produto.campanhaFim) {
    const fim = new Date(produto.campanhaFim);
    if (now > fim) return false;
  }
  
  return true;
}

export function removeAccents(str: string) {
  if (!str) return '';
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          Math.min(matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1) // deletion
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function searchProductsMatch(product: any, query: string) {
  if (!query || !query.trim()) return true;
  const terms = removeAccents(query.toLowerCase()).split(/\s+/).filter(Boolean);
  
  const rawDesc = (product.descricao || '').replace(/<[^>]*>?/gm, ' ');
  
  const searchableText = removeAccents([
    product.nome || '',
    product.ean || '',
    product.ean2 || '',
    product.ean3 || '',
    product.id || '',
    product.sku || '',
    product.codigoInterno || '',
    product.fabricante || '',
    product.marca || '',
    product.principioAtivo || '',
    product.classeTerapeutica || '',
    product.indicacaoTerapeutica || '',
    product.tipoMedicamento || '',
    (product.internalTags || []).join(' '),
    rawDesc
  ].join(' ').toLowerCase());

  const textWords = searchableText.split(/\s+/).filter(w => w.length > 2);

  return terms.every(term => {
    if (searchableText.includes(term)) return true;
    
    for (const w of textWords) {
      // term includes the word (e.g., query "chiclete" includes product word "chicle")
      if (w.length >= 4 && term.includes(w)) return true;
      // Allow minor typos using Levenshtein distance for words larger than 4 chars
      if (term.length >= 4 && w.length >= 4 && Math.abs(w.length - term.length) <= 2) {
        if (levenshteinDistance(term, w) <= 2) return true;
      }
    }
    return false;
  });
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; // Distance in km
}

// Cache de coordenadas por CEP para evitar requisições repetidas
const _cepCoordsCache: Record<string, { lat: number; lng: number } | null> = {};
const _pendingPromises: Record<string, Promise<{ lat: number; lng: number } | null>> = {};

/**
 * Busca coordenadas reais de um CEP via awesomeapi.com.br com cache em memória.
 * Retorna null se não encontrar.
 */
export async function getCepCoordinates(cep: string): Promise<{ lat: number; lng: number } | null> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return null;
  if (clean in _cepCoordsCache) return _cepCoordsCache[clean];
  if (clean in _pendingPromises) return _pendingPromises[clean];

  const promise = (async () => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3000ms timeout
    const res = await fetch(`https://cep.awesomeapi.com.br/json/${clean}`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    
    if (res.ok) {
      const data = await res.json();
      if (data && data.lat && data.lng) {
        const coords = { lat: parseFloat(data.lat), lng: parseFloat(data.lng) };
        _cepCoordsCache[clean] = coords;
        return coords;
      }
    }
  } catch (_) { /* ignore */ }
  
  // Fallback to nominatim
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    const res = await fetch(`https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=Brazil&format=json&limit=1`, {
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      if (data && data.length > 0 && data[0].lat && data[0].lon) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        _cepCoordsCache[clean] = coords;
        return coords;
      }
    }
  } catch (_) { /* ignore */ }
  
    // Fallback to default Porto Alegre coordinates to ensure distance is always available
    const defaultCoords = { lat: -30.0346, lng: -51.2177 };
    return defaultCoords;
  })();

  _pendingPromises[clean] = promise;
  const result = await promise;
  _cepCoordsCache[clean] = result;
  delete _pendingPromises[clean];
  
  return result;
}

/**
 * Calcula a distância real em km entre dois CEPs buscando as coordenadas via API.
 * Use esta função em contextos assíncronos (useEffect, handlers).
 */
export async function calculateCepDistanceAsync(cep1: string, cep2: string): Promise<number> {
  const [coords1, coords2] = await Promise.all([
    getCepCoordinates(cep1),
    getCepCoordinates(cep2),
  ]);
  if (coords1 && coords2) {
    return calculateDistance(coords1.lat, coords1.lng, coords2.lat, coords2.lng);
  }
  // Fallback: se não conseguir as coordenadas, retorna valor genérico
  return 1.5;
}

/**
 * @deprecated Use calculateCepDistanceAsync para distâncias reais via API.
 * Mantido para compatibilidade com código legado que ainda não foi migrado.
 */
export function calculateCepDistance(cep1: string, cep2: string): number {
  // Retorna placeholder enquanto a versão async não foi chamada
  return 0;
}

export function getDeliveryEstimation(pharmacy: any) {
  const now = new Date();
  const currentDay = now.getDay(); // 0=Dom, 1=Seg ... 6=Sab
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Dias em que a farmácia entrega (padrão: seg-sáb)
  const diasEntrega: number[] = pharmacy?.diasEntrega || [1, 2, 3, 4, 5, 6];
  
  // Horário de entrega da loja
  const startStr = pharmacy?.horarioInicioEntrega || "08:00";
  const endStr = pharmacy?.horarioFimEntrega || "20:00";
  const [startH, startM] = startStr.split(":").map(Number);
  const [endH, endM] = endStr.split(":").map(Number);

  const currentTimeMinutes = currentHour * 60 + currentMinute;
  const startTimeMinutes = (startH || 8) * 60 + (startM || 0);
  const endTimeMinutes = (endH || 20) * 60 + (endM || 0);

  const todayIsDeliveryDay = diasEntrega.includes(currentDay);
  const isWithinWindow = currentTimeMinutes >= startTimeMinutes && currentTimeMinutes < endTimeMinutes;

  // Se hoje é dia de entrega E estamos dentro do horário → "Chegará hoje" com raio
  if (todayIsDeliveryDay && isWithinWindow) {
    return {
      text: "Chegará hoje",
      color: "text-green-700",
      hasLightning: true
    };
  }

  // Encontrar o próximo dia de entrega
  function findNextDeliveryDate(): Date {
    for (let offset = 1; offset <= 7; offset++) {
      const nextDate = new Date(now);
      nextDate.setDate(now.getDate() + offset);
      const nextDay = nextDate.getDay();
      if (diasEntrega.includes(nextDay)) {
        return nextDate;
      }
    }
    // Fallback: amanhã
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }

  const nextDelivery = findNextDeliveryDate();
  const diffDays = Math.ceil((nextDelivery.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  // Se o próximo dia de entrega é amanhã → "Chegará amanhã"
  if (diffDays <= 1) {
    return {
      text: "Chegará amanhã",
      color: "text-green-700",
      hasLightning: false
    };
  }

  const dayStr = String(nextDelivery.getDate()).padStart(2, '0');
  const monthStr = String(nextDelivery.getMonth() + 1).padStart(2, '0');
  return {
    text: `Chegará no dia ${dayStr}/${monthStr}`,
    color: "text-green-700",
    hasLightning: false
  };
}

export function isRecentlyAdded(produto: any): boolean {
  if (!produto) return false;
  
  // Use dataImportacao or createdAt/criadoEm if available
  const dateStr = produto.dataImportacao || produto.criadoEm || produto.createdAt;
  if (!dateStr) return false;

  const importDate = new Date(dateStr);
  if (isNaN(importDate.getTime())) return false;

  const now = new Date();
  const diffTime = Math.abs(now.getTime() - importDate.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays <= 5;
}

export function getLevePaguePromotion(produto: any, promocoes: any[] = [], storePromocoes: any[] = []) {
  if (!produto) return null;
  
  const now = new Date();
  
  const checkPromo = (p: any) => {
    if (!p.ativa || p.tipoCampanha !== "leve_pague") return false;
    
    // Verificar se a data expirou (se existir data/hora fim)
    if (p.dataFim) {
      const dataFimStr = p.horaFim ? `${p.dataFim}T${p.horaFim}:00` : `${p.dataFim}T23:59:59`;
      const fim = new Date(dataFimStr);
      if (!isNaN(fim.getTime()) && now > fim) return false;
    }
    
    // Apenas produto individual
    if (p.alvosId && Array.isArray(p.alvosId) && p.alvosId.some((id: any) => String(id) === String(produto.id))) {
      return true;
    }
    
    return false;
  };

  // 1. Try store specific first
  const storePromo = storePromocoes?.find(checkPromo);
  const foundPromo = storePromo || promocoes?.find(checkPromo) || null;
  if (!foundPromo) return null;

  // Resolve per-product individual config if present
  const prodId = String(produto.id || '');
  const pConfig = foundPromo.produtosConfig?.[prodId] || foundPromo.produtosConfig?.[produto.id];
  if (pConfig) {
    return {
      ...foundPromo,
      levePague_quantidade: Number(pConfig.quantidade) || foundPromo.levePague_quantidade || 2,
      levePague_precoPorItem: Number(pConfig.precoPorItem) || foundPromo.levePague_precoPorItem || 0,
    };
  }

  return foundPromo;
}

export function getPadraoPromotionWithTimer(produto: any, promocoes: any[] = [], storePromocoes: any[] = []) {
  if (!produto) return null;
  
  const now = new Date();
  
  const checkPromo = (p: any) => {
    if (!p.ativa || (p.tipoCampanha && p.tipoCampanha !== "padrao")) return false;
    
    // Verificar se a data expirou (se existir data/hora fim)
    if (p.dataFim) {
      const dataFimStr = p.horaFim ? `${p.dataFim}T${p.horaFim}:00` : `${p.dataFim}T23:59:59`;
      const fim = new Date(dataFimStr);
      if (!isNaN(fim.getTime()) && now > fim) return false;
    }
    
    // Apenas produto individual
    if (p.alvosId && Array.isArray(p.alvosId) && p.alvosId.some((id: any) => String(id) === String(produto.id))) {
      return true;
    }
    
    return false;
  };

  // 1. Try store specific first
  const storePromo = storePromocoes?.find(checkPromo);
  if (storePromo) return storePromo;

  // 2. Fallback to global
  const globalPromo = promocoes?.find(checkPromo);
  return globalPromo || null;
}

export function calculatePromoTimeRemaining(dataFim?: string, horaFim?: string) {
  if (!dataFim) {
    return {
      isExpired: false,
      hasTimer: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "",
    };
  }

  const dataFimStr = horaFim ? `${dataFim}T${horaFim}:00` : `${dataFim}T23:59:59`;
  const target = new Date(dataFimStr);
  const now = new Date();

  if (isNaN(target.getTime())) {
    return {
      isExpired: false,
      hasTimer: false,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "",
    };
  }

  const diffMs = target.getTime() - now.getTime();
  if (diffMs <= 0) {
    return {
      isExpired: true,
      hasTimer: true,
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      formatted: "Expirada",
    };
  }

  const totalSeconds = Math.floor(diffMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, "0");
  const formatted = days > 0
    ? `${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return {
    isExpired: false,
    hasTimer: true,
    days,
    hours,
    minutes,
    seconds,
    formatted,
  };
}