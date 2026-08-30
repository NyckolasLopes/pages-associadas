import type { Produto } from "@/types";

// Clean and normalize text: lowercase, remove accents, symbols to spaces
export function normalizeSearchTerm(str: string | null | undefined): string {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/[^a-z0-9\s]/g, " ")   // remove special chars
    .replace(/\s+/g, " ")           // collapse spaces
    .trim();
}

// Levenshtein distance for typo tolerance
export function calcLevenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const v0 = new Array(b.length + 1);
  const v1 = new Array(b.length + 1);

  for (let i = 0; i <= b.length; i++) v0[i] = i;

  for (let i = 0; i < a.length; i++) {
    v1[0] = i + 1;
    for (let j = 0; j < b.length; j++) {
      const cost = a[i] === b[j] ? 0 : 1;
      v1[j + 1] = Math.min(v1[j] + 1, v0[j + 1] + 1, v0[j] + cost);
    }
    for (let j = 0; j <= b.length; j++) v0[j] = v1[j];
  }

  return v0[b.length];
}

// Fuzzy word matcher: handles typos like "acicolvir" -> "aciclovir", "dipirna" -> "dipirona"
export function isFuzzyWordMatch(queryWord: string, targetWord: string): boolean {
  if (!queryWord || !targetWord) return false;
  const q = normalizeSearchTerm(queryWord);
  const t = normalizeSearchTerm(targetWord);
  
  if (t === q || t.includes(q) || q.includes(t)) return true;

  const maxLen = Math.max(q.length, t.length);
  if (maxLen < 3) return q === t;

  const dist = calcLevenshteinDistance(q, t);
  if (maxLen <= 4) return dist <= 1;
  if (maxLen <= 7) return dist <= 2;
  return dist <= 3;
}

// Stopwords in Portuguese
const STOPWORDS = new Set([
  "de", "do", "da", "dos", "das", "para", "com", "em", "um", "uma", "uns", "umas",
  "o", "a", "os", "as", "por", "no", "na", "nos", "nas", "ao", "aos", "ou", "e", "se", "que"
]);

// Medical & Pharmaceutical Synonyms, Indications & Common Misspellings Map
export const PHARMA_SYNONYMS_AND_INDICATIONS: Record<string, string[]> = {
  "aciclovir": ["herpes", "antiviral", "zovirax", "labial", "pomada herpes", "pomada labial", "acicolvir", "aciclovr", "aciklovir"],
  "herpes": ["aciclovir", "antiviral", "zovirax", "labial", "pomada labial"],
  "assadura": ["pomada para assadura", "nistatina", "oxido de zinco", "hipoglos", "bepantol", "desitin", "dermodex", "dermatite de fralda", "creme preventivo", "assaduras", "assada"],
  "pomada": ["creme", "pomada dermatologica", "nistatina", "hipoglos", "bepantol", "nebacetin", "aciclovir", "mupirocina", "trok", "trok-n"],
  "dor de cabeca": ["dipirona", "paracetamol", "dorflex", "neosaldina", "ibuprofeno", "aspirina", "enxaqueca", "analgesico", "neosa", "dordecabeca"],
  "enxaqueca": ["dipirona", "paracetamol", "dorflex", "neosaldina", "ibuprofeno", "enxak", "cefalium", "sumatriptana"],
  "febre": ["dipirona", "paracetamol", "ibuprofeno", "novalgina", "tylenol", "alivium", "antipiretico"],
  "dipirona": ["febre", "dor de cabeca", "novalgina", "analgesico", "dipirna", "dypirona", "depirona", "dipirona sodica", "dipirona monoidratada"],
  "paracetamol": ["tylenol", "febre", "dor de cabeca", "analgesico", "paracetmol", "parasetamol", "paractamol"],
  "ibuprofeno": ["alivium", "advil", "anti-inflamatorio", "febre", "dor", "ibuprofno", "ibupofeno"],
  "dorflex": ["dor muscular", "relaxante muscular", "dor nas costas", "orfenadrina", "dorflex comp", "dorflex uno", "dorflex gotas"],
  "gripe": ["resfriado", "cimegripe", "benegrip", "resfenol", "descongestionante", "vitamina c", "apirex", "coriza", "multigrip", "gripen"],
  "resfriado": ["gripe", "coriza", "cimegripe", "benegrip", "resfenol", "vitamina c", "descongestionante nasal"],
  "tosse": ["xarope", "expectorante", "acebrofilina", "ambroxol", "bromexina", "dropropizina", "vick", "bisolvon", "antitusigeno", "tosse seca", "tosse com catarro"],
  "xarope": ["tosse", "expectorante", "acebrofilina", "ambroxol", "bromexina", "dropropizina", "vick", "bisolvon"],
  "dor muscular": ["dorflex", "mioflex", "torsilax", "relaxante muscular", "salompas", "gel massageador", "diclofenaco", "tandrilax"],
  "estomago": ["azia", "queimacao", "refluxo", "omeprazol", "pantoprazol", "sal de frutas", "eno", "antiacido", "epocler", "estomazil"],
  "azia": ["omeprazol", "pantoprazol", "sal de frutas", "eno", "antiacido", "estomazil", "hidroxido de aluminio", "mylanta", "gastrite"],
  "omeprazol": ["estomago", "azia", "refluxo", "gastrite", "omeprasol", "omeprazol 20mg"],
  "figado": ["epocler", "xantinon", "boldo", "ressaca", "digestao", "figatil", "engov"],
  "ressaca": ["epocler", "engov", "xantinon", "hidramais", "glicose", "antiacido", "dor de cabeca"],
  "alergia": ["antialergico", "loratadina", "desloratadina", "cetirizina", "allegra", "histamin", "dexclorfeniramina", "polaramine", "ebastina", "coceira"],
  "loratadina": ["alergia", "antialergico", "claritin", "histamin", "loratadina 10mg", "desloratadina"],
  "colica": ["buscopan", "butilbrometo", "escopolamina", "colica menstrual", "atroveran", "lufta", "simeticona", "tropinal", "colica intestinal"],
  "buscopan": ["colica", "butilbrometo", "escopolamina", "dor na barriga", "buscopan composto", "buscoduo"],
  "gases": ["simeticona", "luftal", "flatus", "estufamento", "dimeticona", "gases intestinais"],
  "simeticona": ["gases", "luftal", "estufamento", "simeticona gotas", "simeticona 40mg", "simeticona 125mg"],
  "nariz": ["nariz entupido", "descongestionante", "neosoro", "naridrin", "soro fisiologico", "sorine", "maris", "lavagem nasal", "rinite"],
  "neosoro": ["nariz entupido", "descongestionante nasal", "cloreto de sodio", "nafazolina", "neosoro gotas"],
  "rinite": ["neosoro", "naridrin", "budecort", "budesonida", "avamys", "flaconit", "loratadina", "desloratadina", "antialergico"],
  "asma": ["aerolin", "salbutamol", "bombinha", "falta de ar", "bronquite", "clenil", "alenia", "formoterol"],
  "aerolin": ["bombinha", "salbutamol", "asma", "falta de ar", "bronquite", "spray nasal"],
  "emagrecimento": ["mounjaro", "ozempic", "saxenda", "wegovy", "caneta emagrecedora", "tirzepatida", "semaglutida", "liraglutida", "remedio para emagrecer", "emagrecer"],
  "ozempic": ["semaglutida", "caneta emagrecedora", "emagrecer", "diabetes", "ozempic 1mg", "ozempic 0.5mg"],
  "mounjaro": ["tirzepatida", "caneta emagrecedora", "emagrecer", "diabetes", "mounjaro 2.5mg", "mounjaro 5mg", "mounjaro 10mg"],
  "diarreia": ["floratil", "florasig", "imosec", "loperamida", "probiotico", "soro de reidratacao", "reidratante", "flora intestinal"],
  "floratil": ["diarreia", "probiotico", "saccharomyces boulardii", "flora intestinal", "floratil 200mg"],
  "cicatrizacao": ["cicatrizante", "nebacetin", "neomicina", "bacitracina", "bepantol", "dexpantenol", "queimadura", "trok-n", "ferimento"],
  "nebacetin": ["neomicina", "bacitracina", "pomada cicatrizante", "ferimento", "queimadura", "infeccao na pele"],
  "olhos": ["colirio", "lubrificante ocular", "moura brasil", "lacrifilm", "systane", "olho seco", "conjuntivite", "optive", "visao"],
  "colirio": ["olho seco", "lubrificante ocular", "lacrifilm", "systane", "moura brasil", "conjuntivite"],
  "acne": ["espinha", "cravo", "sabonete antiacne", "acido salicilico", "peroxido de benzoila", "acnase", "effaclar", "actine", "pele oleosa"],
  "pressao": ["losartana", "atenolol", "hidroclorotiazida", "enalapril", "captopril", "anlodipino", "anti-hipertensivo", "pressao alta"],
  "losartana": ["pressao alta", "anti-hipertensivo", "losartana potassica", "losartana 50mg"],
  "diabetes": ["metformina", "glibenclamida", "insulina", "glicosimetro", "fitas glicemia", "accu-chek", "acucar no sangue"],
  "hidratante": ["creme hidratante", "locao corporal", "cerave", "cetaphil", "nivea", "pele seca", "ureia", "hidratacao"],
  "protetor": ["protetor solar", "filtro solar", "fps", "anthelios", "minesol", "sundown", "cenoura e bronze", "episol", "la roche", "protetor solr"],
  "protetor solar": ["filtro solar", "fps 30", "fps 50", "fps 60", "fps 70", "anthelios", "minesol", "sundown", "episol"],
  "fralda": ["fralda descartavel", "pampers", "huggies", "babysec", "mamyypoko", "toalhinha umedecida", "lenco umedecido", "fraldas"],
  "pampers": ["fralda pampers", "pampers confort sec", "pampers premium care", "pampers pants", "fralda descartavel"],
  "huggies": ["fralda huggies", "huggies supreme care", "huggies natural care", "lenco huggies"],
  "dente": ["creme dental", "pasta de dente", "escova dental", "fio dental", "enxaguante bucal", "colgate", "sensodyne", "oral-b"],
  "cabelo": ["shampoo", "condicionador", "mascara capilar", "anticaspa", "queda de cabelo", "clear", "head shoulders", "darrow", "pantene"],
  "vitamina": ["vitamina c", "vitamina d", "suplemento", "complexo b", "zinco", "lavitan", "centrum", "targifor", "multivitaminico"],
  "calmante": ["passiflora", "maracuja", "calman", "melatonina", "ansiedade", "insonia", "dormir", "valeriana", "sono"]
};

// Known pharmaceutical dictionary for spell-checking & "Did you mean?" suggestions
export const PHARMA_VOCABULARY: string[] = [
  "aciclovir", "dipirona", "paracetamol", "ibuprofeno", "dorflex", "neosoro", "naridrin",
  "aerolin", "salbutamol", "omeprazol", "pantoprazol", "epocler", "xantinon", "engov",
  "loratadina", "desloratadina", "allegra", "buscopan", "simeticona", "luftal", "floratil",
  "imosec", "nebacetin", "bepantol", "hipoglos", "dermodex", "desitin", "losartana",
  "metformina", "mounjaro", "ozempic", "saxenda", "wegovy", "cimegripe", "benegrip",
  "resfenol", "vitamina c", "vitamina d", "protetor solar", "shampoo", "condicionador",
  "fralda", "pampers", "huggies", "creme dental", "colgate", "sensodyne", "anthelios",
  "effaclar", "cerave", "cetaphil", "nivea", "lavitan", "centrum", "targifor", "novalgina",
  "tylenol", "alivium", "advil", "neosaldina", "melatonina", "passiflora", "colirio"
];

export interface SearchQueryProfile {
  rawQuery: string;
  cleanQuery: string;
  tokens: string[];
  expandedTerms: string[];
  didYouMean?: string;
  isNumeric: boolean;
}

// Expands search query with typo correction, tokenization, and medical synonym enrichment
export function analyzeSearchQuery(rawQuery: string): SearchQueryProfile {
  const cleanQuery = normalizeSearchTerm(rawQuery);
  const isNumeric = /^\d+$/.test(cleanQuery);

  if (!cleanQuery) {
    return {
      rawQuery,
      cleanQuery: "",
      tokens: [],
      expandedTerms: [],
      isNumeric: false,
    };
  }

  // Tokenize
  const rawTokens = cleanQuery.split(" ").filter((t) => t.length > 0);
  const tokens = rawTokens.filter((t) => !STOPWORDS.has(t) && t.length > 1);

  // If all tokens were stopwords, keep rawTokens
  const effectiveTokens = tokens.length > 0 ? tokens : rawTokens;

  // Typo check & "Did you mean" determination
  let didYouMean: string | undefined = undefined;
  const correctedTokens: string[] = [];

  for (const token of effectiveTokens) {
    if (token.length >= 4) {
      let bestMatch = token;
      let minDistance = Infinity;

      for (const vocab of PHARMA_VOCABULARY) {
        const dist = calcLevenshteinDistance(token, vocab);
        if (dist > 0 && dist <= 2 && dist < minDistance) {
          minDistance = dist;
          bestMatch = vocab;
        }
      }

      if (bestMatch !== token && minDistance <= 2) {
        correctedTokens.push(bestMatch);
      } else {
        correctedTokens.push(token);
      }
    } else {
      correctedTokens.push(token);
    }
  }

  const correctedPhrase = correctedTokens.join(" ");
  if (correctedPhrase !== cleanQuery && correctedPhrase.length >= 4) {
    didYouMean = correctedPhrase;
  }

  // Synonym & Indication Expansion
  const expandedSet = new Set<string>();
  expandedSet.add(cleanQuery);
  if (didYouMean) expandedSet.add(didYouMean);

  // Check full query in synonym map
  if (PHARMA_SYNONYMS_AND_INDICATIONS[cleanQuery]) {
    PHARMA_SYNONYMS_AND_INDICATIONS[cleanQuery].forEach((term) => expandedSet.add(term));
  }

  // Check each token and corrected token in synonym map
  for (const t of [...effectiveTokens, ...correctedTokens]) {
    if (PHARMA_SYNONYMS_AND_INDICATIONS[t]) {
      PHARMA_SYNONYMS_AND_INDICATIONS[t].forEach((term) => expandedSet.add(term));
    }
  }

  return {
    rawQuery,
    cleanQuery,
    tokens: effectiveTokens,
    expandedTerms: Array.from(expandedSet),
    didYouMean,
    isNumeric,
  };
}

// Extracts clean normalized strings for all fields of a product
export function extractProductSearchFields(p: Produto) {
  const nameClean = normalizeSearchTerm(p.nome);
  const brandClean = normalizeSearchTerm(p.marca);
  
  const activeIngArray = Array.isArray(p.principiosAtivos)
    ? p.principiosAtivos
    : typeof p.principiosAtivos === "string"
    ? [p.principiosAtivos]
    : [];
  const activeIngClean = normalizeSearchTerm(activeIngArray.join(" "));

  const indicationClean = normalizeSearchTerm(
    p.indicacaoTerapeutica || (p as any).metadata?.indicacao_terapeutica || ""
  );
  const classClean = normalizeSearchTerm(
    p.classeTerapeutica || (p as any).metadata?.classe_terapeutica || ""
  );
  const termsClean = normalizeSearchTerm(p.termosPesquisa);
  
  const descClean = normalizeSearchTerm(
    (p.descricao || "") + " " + ((p as any).descricaoHtml || "") + " " + (p.resumoDescricao || "") + " " + ((p as any).metadata?.resumo_descricao || "")
  );

  const tagsClean = normalizeSearchTerm(
    (Array.isArray(p.internalTags) ? p.internalTags.join(" ") : "") +
    " " +
    (Array.isArray(p.caracteristicas) ? p.caracteristicas.join(" ") : "")
  );

  const eanClean = normalizeSearchTerm(
    (p.ean || "") + " " + (p.sku || "") + " " + (p.codigoInterno || "") + " " + (Array.isArray(p.eansSecundarios) ? p.eansSecundarios.join(" ") : "")
  );

  // Full unified text for global phrase scanning
  const fullText = [
    nameClean,
    brandClean,
    activeIngClean,
    indicationClean,
    classClean,
    termsClean,
    descClean,
    tagsClean,
    eanClean
  ].join(" ");

  // Collect individual words into a set for fast lookup
  const wordsSet = new Set<string>(fullText.split(" ").filter((w) => w.length > 0));

  return {
    nameClean,
    brandClean,
    activeIngClean,
    indicationClean,
    classClean,
    termsClean,
    descClean,
    tagsClean,
    eanClean,
    fullText,
    wordsSet,
  };
}

// Calculates a high-precision relevance score for a product given search profile
export function scoreProductRelevance(p: Produto, profile: SearchQueryProfile): number {
  if (!p) return 0;
  const fields = extractProductSearchFields(p);
  const { cleanQuery, tokens, expandedTerms, didYouMean, isNumeric } = profile;

  // Numeric search (EAN / SKU / Code)
  if (isNumeric) {
    if (fields.eanClean.includes(cleanQuery)) return 2000;
    if (String(p.id) === cleanQuery) return 2000;
  }

  let score = 0;

  // 1. EXACT & PREFIX NAME MATCHES (Highest Priority)
  if (fields.nameClean === cleanQuery) {
    score += 1200;
  } else if (fields.nameClean.startsWith(cleanQuery)) {
    score += 800;
  } else if (fields.nameClean.includes(cleanQuery)) {
    score += 500;
  }

  // 2. ACTIVE INGREDIENT MATCHES (e.g. "aciclovir", "dipirona")
  if (fields.activeIngClean.includes(cleanQuery)) {
    score += 450;
  }

  // 3. SEARCH TERMS & SYNONYMS MATCHES
  if (fields.termsClean.includes(cleanQuery)) {
    score += 400;
  }

  // 4. THERAPEUTIC INDICATION MATCHES (e.g. "pomada para assadura", "assadura")
  if (fields.indicationClean.includes(cleanQuery)) {
    score += 380;
  }

  // 5. BRAND & THERAPEUTIC CLASS MATCHES
  if (fields.brandClean.includes(cleanQuery)) {
    score += 350;
  }
  if (fields.classClean.includes(cleanQuery)) {
    score += 300;
  }

  // 6. DESCRIPTION & FULL TEXT PHRASE MATCHES
  if (fields.descClean.includes(cleanQuery)) {
    score += 260;
  }

  // 7. TOKEN-LEVEL MATCHING (Multi-word queries like "pomada assadura")
  let matchedTokensCount = 0;
  for (const token of tokens) {
    let tokenMatched = false;

    if (fields.nameClean.includes(token)) {
      score += 120;
      tokenMatched = true;
    }
    if (fields.activeIngClean.includes(token)) {
      score += 100;
      tokenMatched = true;
    }
    if (fields.indicationClean.includes(token)) {
      score += 90;
      tokenMatched = true;
    }
    if (fields.termsClean.includes(token)) {
      score += 80;
      tokenMatched = true;
    }
    if (fields.brandClean.includes(token)) {
      score += 70;
      tokenMatched = true;
    }
    if (fields.descClean.includes(token)) {
      score += 50;
      tokenMatched = true;
    }

    // Fuzzy matching on individual words if not exact
    if (!tokenMatched) {
      for (const word of fields.wordsSet) {
        if (word.length >= 3 && isFuzzyWordMatch(token, word)) {
          score += 65;
          tokenMatched = true;
          break;
        }
      }
    }

    if (tokenMatched) matchedTokensCount++;
  }

  // Token coverage bonus (reward products having ALL tokens anywhere across fields)
  if (tokens.length > 0) {
    const coverageRatio = matchedTokensCount / tokens.length;
    score += coverageRatio * 300;
    if (matchedTokensCount === tokens.length && tokens.length > 1) {
      score += 250; // Bonus for 100% token coverage
    }
  }

  // 8. EXPANDED SYNONYMS & INDICATION MAPPINGS
  for (const exp of expandedTerms) {
    if (exp !== cleanQuery && exp !== didYouMean) {
      if (fields.nameClean.includes(exp)) score += 180;
      if (fields.activeIngClean.includes(exp)) score += 160;
      if (fields.indicationClean.includes(exp)) score += 150;
      if (fields.descClean.includes(exp)) score += 120;
      if (fields.termsClean.includes(exp)) score += 110;
    }
  }

  // 9. DID YOU MEAN MATCHES
  if (didYouMean) {
    if (fields.nameClean.includes(didYouMean)) score += 250;
    if (fields.activeIngClean.includes(didYouMean)) score += 200;
    if (fields.descClean.includes(didYouMean)) score += 150;
  }

  // 10. STOCK PRIORITY BONUS
  if ((p.estoque || 0) > 0) {
    score += 80;
  }

  // 11. CATALOG RELEVANCE PRIORITY
  score += (p.nivelRelevancia || 0) * 3;

  return score;
}

// Filters and sorts products by relevance score
export function rankProductsBySearch(products: Produto[], rawQuery: string): { ranked: Produto[], didYouMean?: string } {
  if (!rawQuery || !rawQuery.trim()) {
    return { ranked: products };
  }

  const profile = analyzeSearchQuery(rawQuery);
  const scoredProducts: { product: Produto; score: number }[] = [];

  for (const p of products) {
    const score = scoreProductRelevance(p, profile);
    if (score > 40) {
      scoredProducts.push({ product: p, score });
    }
  }

  // Sort descending by score
  scoredProducts.sort((a, b) => b.score - a.score);

  return {
    ranked: scoredProducts.map((sp) => sp.product),
    didYouMean: profile.didYouMean,
  };
}
