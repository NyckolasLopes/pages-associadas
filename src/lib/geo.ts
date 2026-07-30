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
  // Race BigDataCloud, AwesomeAPI reverse, and Nominatim simultaneously
  // Return the first valid CEP found
  
  const bdcPromise = fetchWithTimeout(
    `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=pt`,
    2500
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const awesomePromise = fetchWithTimeout(
    `https://cep.awesomeapi.com.br/json/lat/${lat}/lng/${lng}`,
    2500
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  const nomPromise = fetchWithTimeout(
    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
    3000
  ).then(r => r.ok ? r.json() : null).catch(() => null);

  // Wait for all three in parallel
  const [bdcData, awesomeData, nomData] = await Promise.all([bdcPromise, awesomePromise, nomPromise]);

  // Check BigDataCloud postcode
  const bdcCep = extractCep(bdcData?.postcode);
  if (bdcCep) return bdcCep;

  // Check Nominatim postcode
  const nomCep = extractCep(nomData?.address?.postcode);
  if (nomCep) return nomCep;

  // Check AwesomeAPI (returns object or array)
  const awesomeItem = Array.isArray(awesomeData) ? awesomeData[0] : awesomeData;
  const awesomeCep = extractCep(awesomeItem?.cep);
  if (awesomeCep) return awesomeCep;

  // Collect city/state info for ViaCEP fallback
  detectedCity = nomData?.address?.city || nomData?.address?.town || bdcData?.locality || bdcData?.city || null;
  detectedState = nomData?.address?.state || bdcData?.principalSubdivision || null;
  detectedRoad = nomData?.address?.road || null;

  // ── PHASE 2: ViaCEP street search fallback ──
  if (detectedState && detectedCity) {
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
    const uf = ufMap[detectedState] || detectedState;

    if (uf.length === 2) {
      const roadStr = detectedRoad ? detectedRoad.split(" - ")[0].split(",")[0] : null;

      // Try street + Centro in parallel
      const searches: Promise<string | null>[] = [];
      
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

      const viaCepResults = await Promise.all(searches);
      for (const result of viaCepResults) {
        if (result) return result;
      }
    }
  }

  // ── PHASE 3: Hardcoded city fallback ──
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
