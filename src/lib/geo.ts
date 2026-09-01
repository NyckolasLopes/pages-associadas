import { useAdmin } from "@/stores/admin";

export const fetchWithTimeout = async (url: string, timeout = 3000) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
};

// Fallback CEPs by city for when all APIs fail
const CITY_CEP_FALLBACK: Record<string, string> = {
  "Porto Alegre": "90010000",
  "Canoas": "92010000",
  "Gravataí": "94010000",
  "Cachoeirinha": "94910000",
  "São Leopoldo": "93010000",
  "Novo Hamburgo": "93310000",
  "Viamão": "94410000",
  "Alvorada": "94810000",
  "Esteio": "93260000",
  "Sapucaia do Sul": "93210000",
  "Guaíba": "92500000",
  "Eldorado do Sul": "92990000",
  "Caxias do Sul": "95010000",
  "Pelotas": "96010000",
  "Santa Maria": "97010000",
  "Passo Fundo": "99010000",
  "Rio Grande": "96200000",
  "Bento Gonçalves": "95700000",
  "Uruguaiana": "97500000",
  "Bagé": "96400000",
  "Santa Cruz do Sul": "96810000",
  "Erechim": "99700000",
  "Lajeado": "95900000",
  "Ijuí": "98700000",
  "Farroupilha": "95180000",
  "São Paulo": "01001000",
  "Rio de Janeiro": "20010000",
  "Curitiba": "80010000",
  "Florianópolis": "88010000",
  "Belo Horizonte": "30110000",
  "Brasília": "70040000",
  "Salvador": "40010000",
  "Recife": "50010000",
  "Fortaleza": "60010000",
};

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Raio da terra em km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/** Extract a valid 8-digit CEP from raw postcode string */
function extractCep(raw: string | undefined | null): string | null {
  if (!raw) return null;
  const clean = raw.replace(/\D/g, "").substring(0, 8);
  return clean.length === 8 ? clean : null;
}

export async function reverseGeocodeLatLon(lat: number, lng: number): Promise<string | null> {
  let detectedCity: string | null = null;
  let detectedState: string | null = null;
  let detectedRoad: string | null = null;

  // ── PHASE 1: Run fast APIs in parallel ──
  const bdcPromise = fetchWithTimeout(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
    3500
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const awesomePromise = fetchWithTimeout(
    `https://cep.awesomeapi.com.br/json/lat/${lat}/lng/${lng}`,
    3000
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const nomPromise = fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1&accept-language=pt-BR`,
    4000
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  // Wait for all three in parallel
  const [bdcData, awesomeData, nomData] = await Promise.all([bdcPromise, awesomePromise, nomPromise]);

  // Check Nominatim postcode first (very accurate for Brazilian cities)
  const nomCep = extractCep(nomData?.address?.postcode);
  if (nomCep) return nomCep;

  // Check BigDataCloud postcode
  const bdcCep = extractCep(bdcData?.postcode);
  if (bdcCep) return bdcCep;

  // Check AwesomeAPI (returns object or array)
  const awesomeItem = Array.isArray(awesomeData) ? awesomeData[0] : awesomeData;
  const awesomeCep = extractCep(awesomeItem?.cep);
  if (awesomeCep) return awesomeCep;

  // Extract detected municipality / city cleanly
  // Prioritize city > town > municipality > village > hamlet > district
  // DO NOT prioritize county (county in Brazil is often the judicial comarca or microrregião)
  detectedCity = nomData?.address?.city || 
                 nomData?.address?.town || 
                 nomData?.address?.municipality || 
                 nomData?.address?.village || 
                 nomData?.address?.hamlet || 
                 nomData?.address?.district || 
                 bdcData?.city || 
                 bdcData?.locality || 
                 bdcData?.localityInfo?.administrative?.find((a: any) => a.adminLevel === 8 || a.description?.toLowerCase()?.includes('município'))?.name ||
                 nomData?.address?.city_district || 
                 nomData?.address?.suburb || 
                 null;

  detectedState = nomData?.address?.state || bdcData?.principalSubdivision || null;
  detectedRoad = nomData?.address?.road || null;

  // ── PHASE 2: Lookup CEP by detected City and State via ViaCEP & Nominatim Search ──
  if (detectedCity) {
    const ufMap: Record<string, string> = {
      Acre: "AC", Alagoas: "AL", "Amapá": "AP", Amazonas: "AM", Bahia: "BA",
      "Ceará": "CE", "Distrito Federal": "DF", "Espírito Santo": "ES", "Goiás": "GO",
      "Maranhão": "MA", "Mato Grosso": "MT", "Mato Grosso do Sul": "MS",
      "Minas Gerais": "MG", "Pará": "PA", "Paraíba": "PB", "Paraná": "PR",
      Pernambuco: "PE", "Piauí": "PI", "Rio de Janeiro": "RJ",
      "Rio Grande do Norte": "RN", "Rio Grande do Sul": "RS", "Rondônia": "RO",
      Roraima: "RR", "Santa Catarina": "SC", "São Paulo": "SP", Sergipe: "SE",
      Tocantins: "TO",
    };
    const uf = (detectedState ? (ufMap[detectedState] || detectedState) : "").substring(0, 2).toUpperCase();

    const searches: Promise<string | null>[] = [];

    // 1. Nominatim City Search for postcode
    searches.push(
      fetchWithTimeout(
        `https://nominatim.openstreetmap.org/search?city=${encodeURIComponent(detectedCity)}&country=Brazil&format=json&addressdetails=1&accept-language=pt-BR`,
        3000
      )
        .then(r => r.ok ? r.json() : null)
        .then(data => {
          if (Array.isArray(data) && data.length > 0) {
            for (const item of data) {
              const cep = extractCep(item.address?.postcode);
              if (cep) return cep;
            }
          }
          return null;
        })
        .catch(() => null)
    );

    if (uf.length === 2) {
      const roadStr = detectedRoad ? detectedRoad.split(" - ")[0].split(",")[0] : null;

      if (roadStr) {
        searches.push(
          fetchWithTimeout(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(detectedCity)}/${encodeURIComponent(roadStr)}/json/`, 2500)
            .then(r => r.ok ? r.json() : null)
            .then(data => Array.isArray(data) && data.length > 0 && data[0].cep ? extractCep(data[0].cep) : null)
            .catch(() => null)
        );
      }

      searches.push(
        fetchWithTimeout(`https://viacep.com.br/ws/${uf}/${encodeURIComponent(detectedCity)}/Centro/json/`, 2500)
          .then(r => r.ok ? r.json() : null)
          .then(data => Array.isArray(data) && data.length > 0 && data[0].cep ? extractCep(data[0].cep) : null)
          .catch(() => null)
      );
    }

    const citySearchResults = await Promise.all(searches);
    for (const res of citySearchResults) {
      if (res) return res;
    }
  }

  // ── PHASE 3: Match from registered pharmacies in the SAME city ──
  try {
    const pharmacies = useAdmin.getState().pharmacies || [];
    if (pharmacies.length > 0 && detectedCity) {
      const normDet = detectedCity.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const matchPharm = pharmacies.find(p => {
        if (!p.cidade) return false;
        const normP = p.cidade.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        return normDet.includes(normP) || normP.includes(normDet);
      });
      if (matchPharm?.cep) {
        const cepClean = extractCep(matchPharm.cep);
        if (cepClean) return cepClean;
      }
    }
  } catch (e) {
    console.warn("Pharmacy match error:", e);
  }

  // ── PHASE 4: Hardcoded city fallback ──
  if (detectedCity) {
    const normalizedCity = detectedCity.trim();
    const fallback = CITY_CEP_FALLBACK[normalizedCity];
    if (fallback) return fallback;
    
    // Partial match
    for (const [city, cep] of Object.entries(CITY_CEP_FALLBACK)) {
      if (normalizedCity.includes(city) || city.includes(normalizedCity)) {
        return cep;
      }
    }
  }

  return null;
}
