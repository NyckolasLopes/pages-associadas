/**
 * distanceApis.ts
 * 
 * Fornece cálculo de distância real por estrada com cadeia de fallback:
 *   1. OpenRouteService (driving-car route)
 *   2. Haversine (linha reta - fallback offline)
 * 
 * Para resolução de CEP -> coordenadas:
 *   1. awesomeapi.com.br (já tem coordenadas)
 *   2. ViaCEP + Nominatim geocoding
 *   3. Nominatim direto por CEP
 */

// Helpers internos

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const toRad = (v: number) => (v * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

async function fetchWithTimeout(url: string, options: RequestInit = {}, timeoutMs = 5000): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

// Cache de distancias por par de coordenadas
const _roadDistCache: Record<string, number> = {};

function cacheKey(lat1: number, lng1: number, lat2: number, lng2: number): string {
  return `${lat1.toFixed(4)},${lng1.toFixed(4)}-${lat2.toFixed(4)},${lng2.toFixed(4)}`;
}

// API 1: OpenRouteService (driving-car)
async function orsRoadDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): Promise<number | null> {
  const key = import.meta.env.VITE_ORS_API_KEY;
  if (!key) return null;

  try {
    // ORS espera [lng, lat]
    const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${key}&start=${lng1},${lat1}&end=${lng2},${lat2}`;
    const res = await fetchWithTimeout(url, {
      headers: { Accept: 'application/json' }
    }, 6000);

    if (!res.ok) return null;

    const data = await res.json();
    const distanceMeters = data?.features?.[0]?.properties?.segments?.[0]?.distance;
    if (typeof distanceMeters === 'number') {
      return distanceMeters / 1000; // converte m -> km
    }
  } catch (_) { /* timeout ou network error */ }

  return null;
}

/**
 * Retorna a distancia real por estrada em km entre dois pontos.
 * Tenta OpenRouteService, depois cai no Haversine.
 */
export async function getRoadDistanceKm(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): Promise<number> {
  if (isNaN(lat1) || isNaN(lng1) || isNaN(lat2) || isNaN(lng2)) {
    return NaN;
  }

  const key = cacheKey(lat1, lng1, lat2, lng2);
  if (_roadDistCache[key] !== undefined) return _roadDistCache[key];

  // 1a tentativa: OpenRouteService
  const ors = await orsRoadDistanceKm(lat1, lng1, lat2, lng2);
  if (ors !== null && !isNaN(ors)) {
    _roadDistCache[key] = ors;
    return ors;
  }

  // Fallback: Haversine
  console.warn('[distanceApis] ORS falhou, usando Haversine como fallback.');
  const hav = haversineKm(lat1, lng1, lat2, lng2);
  _roadDistCache[key] = hav;
  return hav;
}

// CEP -> Coordenadas com ViaCEP + Nominatim fallback
const _cepCoordsExtCache: Record<string, { lat: number; lng: number } | null> = {};

/**
 * Resolve um CEP para coordenadas geograficas.
 * Cadeia: awesomeapi -> ViaCEP+Nominatim -> Nominatim direto
 */
export async function getCepCoordsWithFallback(
  cep: string
): Promise<{ lat: number; lng: number } | null> {
  const clean = cep.replace(/\D/g, '');
  if (clean.length !== 8) return null;
  if (clean in _cepCoordsExtCache) return _cepCoordsExtCache[clean];

  // 1. awesomeapi (retorna lat/lng diretamente)
  try {
    const res = await fetchWithTimeout(`https://cep.awesomeapi.com.br/json/${clean}`, {}, 3000);
    if (res.ok) {
      const d = await res.json();
      if (d?.lat && d?.lng) {
        const coords = { lat: parseFloat(d.lat), lng: parseFloat(d.lng) };
        _cepCoordsExtCache[clean] = coords;
        return coords;
      }
    }
  } catch (_) { /* ignora */ }

  // 2. ViaCEP -> endereco -> Nominatim geocoding
  try {
    const viaRes = await fetchWithTimeout(`https://viacep.com.br/ws/${clean}/json/`, {}, 3000);
    if (viaRes.ok) {
      const addr = await viaRes.json();
      if (addr && !addr.erro) {
        const query = encodeURIComponent(
          `${addr.logradouro || ''}, ${addr.localidade}, ${addr.uf}, Brasil`
        );
        const nomRes = await fetchWithTimeout(
          `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
          { headers: { 'User-Agent': 'pages-associadas/1.0' } },
          4000
        );
        if (nomRes.ok) {
          const nom = await nomRes.json();
          if (nom?.[0]?.lat && nom?.[0]?.lon) {
            const coords = { lat: parseFloat(nom[0].lat), lng: parseFloat(nom[0].lon) };
            _cepCoordsExtCache[clean] = coords;
            return coords;
          }
        }
      }
    }
  } catch (_) { /* ignora */ }

  // 3. Nominatim direto por CEP
  try {
    const res = await fetchWithTimeout(
      `https://nominatim.openstreetmap.org/search?postalcode=${clean}&country=Brazil&format=json&limit=1`,
      { headers: { 'User-Agent': 'pages-associadas/1.0' } },
      4000
    );
    if (res.ok) {
      const data = await res.json();
      if (data?.[0]?.lat && data?.[0]?.lon) {
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        _cepCoordsExtCache[clean] = coords;
        return coords;
      }
    }
  } catch (_) { /* ignora */ }

  _cepCoordsExtCache[clean] = null;
  return null;
}
