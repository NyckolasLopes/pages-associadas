import type { Produto } from "@/types";

// Strip HTML tags from strings
export function stripHtml(html?: string | null): string {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, " ");
}

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

// Extract only digits
export function extractDigits(str: string | null | undefined): string {
  if (!str) return "";
  return String(str).replace(/\D/g, "");
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
  digitsOnly: string;
  tokens: string[];
  expandedTerms: string[];
  didYouMean?: string;
  isNumeric: boolean;
  isCodeLike: boolean;
}

// Expands search query with typo correction, tokenization, and medical synonym enrichment
export function analyzeSearchQuery(rawQuery: string): SearchQueryProfile {
  const cleanQuery = normalizeSearchTerm(rawQuery);
  const digitsOnly = extractDigits(rawQuery);
  const isNumeric = /^\d+$/.test(cleanQuery);
  const isCodeLike = isNumeric || (digitsOnly.length >= 6 && /\d/.test(rawQuery));

  if (!cleanQuery) {
    return {
      rawQuery,
      cleanQuery: "",
      digitsOnly: "",
      tokens: [],
      expandedTerms: [],
      isNumeric: false,
      isCodeLike: false,
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
    digitsOnly,
    tokens: effectiveTokens,
    expandedTerms: Array.from(expandedSet),
    didYouMean,
    isNumeric,
    isCodeLike,
  };
}

// Extracts clean normalized strings for all fields of a product
export function extractProductSearchFields(p: Produto) {
  const nameClean = normalizeSearchTerm(p.nome);
  const brandClean = normalizeSearchTerm(p.marca);
  
  // 1. Princípios Ativos (Active Ingredients)
  let activeIngList: string[] = [];
  let dosageList: string[] = [];

  if (Array.isArray(p.principiosAtivos)) {
    p.principiosAtivos.forEach((pa: any) => {
      if (typeof pa === "string") {
        activeIngList.push(pa);
      } else if (pa && typeof pa === "object") {
        if (pa.nome) activeIngList.push(pa.nome);
        if (pa.concentracao) dosageList.push(pa.concentracao);
        if (pa.unidadeMedida) dosageList.push(pa.unidadeMedida);
        if (pa.dosagem) dosageList.push(pa.dosagem);
      }
    });
  } else if (typeof p.principiosAtivos === "string") {
    activeIngList.push(p.principiosAtivos);
  }

  if (Array.isArray(p.principiosAtivosDetalhes)) {
    p.principiosAtivosDetalhes.forEach((pad) => {
      if (pad.nome) activeIngList.push(pad.nome);
      if (pad.concentracao) dosageList.push(pad.concentracao);
      if (pad.unidadeMedida) dosageList.push(pad.unidadeMedida);
    });
  }

  const activeIngClean = normalizeSearchTerm(activeIngList.join(" "));

  // 2. Dosagem / Concentração
  // Extract dosage patterns (e.g. 500mg, 1000mg, 1g, 20mg/ml, 100ml, 50mcg, 40mg, etc.) from name & description
  const dosageMatches = (p.nome + " " + (p.descricao || "")).match(/\b\d+(\.\d+)?\s*(mg|g|mcg|ml|l|ui|%|mg\/ml|g\/ml)\b/gi) || [];
  dosageMatches.forEach((dm) => dosageList.push(dm));
  const dosageClean = normalizeSearchTerm(dosageList.join(" "));

  // 3. EANs, Códigos de barras e Código interno
  const eanParts: string[] = [
    p.ean || "",
    p.ean2 || "",
    p.ean3 || "",
    p.sku || "",
    p.codigoInterno || "",
    p.id || "",
  ];
  if (Array.isArray(p.eansSecundarios)) {
    p.eansSecundarios.forEach((e) => eanParts.push(String(e)));
  }
  const eanClean = normalizeSearchTerm(eanParts.join(" "));
  const eanDigits = eanParts.map((e) => extractDigits(e)).filter(Boolean).join(" ");

  // 4. Registro MS (ANVISA)
  const anvisaRaw = p.registroAnvisa || (p as any).registro_anvisa || (p as any).registroMs || "";
  const anvisaClean = normalizeSearchTerm(anvisaRaw);
  const anvisaDigits = extractDigits(anvisaRaw);

  // 5. Tarja
  let tarjaTerms: string[] = [];
  if (p.tarja) {
    tarjaTerms.push(p.tarja);
    const tLow = String(p.tarja).toLowerCase();
    if (tLow.includes("preta")) tarjaTerms.push("tarja preta", "preta");
    if (tLow.includes("vermelha")) tarjaTerms.push("tarja vermelha", "vermelha");
    if (tLow.includes("amarela")) tarjaTerms.push("tarja amarela", "amarela");
    if (tLow.includes("sem tarja") || tLow === "n") tarjaTerms.push("sem tarja", "livre");
    if (p.retemReceita || tLow.includes("ret")) tarjaTerms.push("retem receita", "retencao de receita");
  }
  const tarjaClean = normalizeSearchTerm(tarjaTerms.join(" "));

  // 6. Características
  let charList: string[] = [];
  if (Array.isArray(p.caracteristicas)) {
    p.caracteristicas.forEach((c: any) => {
      if (typeof c === "string") charList.push(c);
      else if (c && typeof c === "object") {
        if (c.titulo) charList.push(c.titulo);
        if (c.descricao) charList.push(c.descricao);
      }
    });
  }
  const caracteristicasClean = normalizeSearchTerm(charList.join(" "));

  // 7. Descrição e Resumo do Produto
  const rawDesc = stripHtml(p.descricao || "") + " " + (p.resumoDescricao || "") + " " + stripHtml((p as any).descricaoHtml || "");
  const descClean = normalizeSearchTerm(rawDesc);

  // 8. Indicações e Classes
  const indicationClean = normalizeSearchTerm(
    p.indicacaoTerapeutica || (p as any).metadata?.indicacao_terapeutica || ""
  );
  const classClean = normalizeSearchTerm(
    p.classeTerapeutica || (p as any).metadata?.classe_terapeutica || ""
  );
  const termsClean = normalizeSearchTerm(p.termosPesquisa);
  const tagsClean = normalizeSearchTerm(
    Array.isArray(p.internalTags) ? p.internalTags.join(" ") : ""
  );

  // Full unified text for global phrase scanning
  const fullText = [
    nameClean,
    brandClean,
    activeIngClean,
    dosageClean,
    eanClean,
    anvisaClean,
    tarjaClean,
    caracteristicasClean,
    indicationClean,
    classClean,
    termsClean,
    tagsClean,
    descClean,
  ].join(" ");

  // Collect individual words into a set for fast lookup
  const wordsSet = new Set<string>(fullText.split(" ").filter((w) => w.length > 0));

  return {
    nameClean,
    brandClean,
    activeIngClean,
    dosageClean,
    eanClean,
    eanDigits,
    anvisaClean,
    anvisaDigits,
    tarjaClean,
    caracteristicasClean,
    descClean,
    indicationClean,
    classClean,
    termsClean,
    tagsClean,
    fullText,
    wordsSet,
  };
}

// Calculates a high-precision relevance score for a product given search profile
export function scoreProductRelevance(p: Produto, profile: SearchQueryProfile): number {
  if (!p) return 0;
  const fields = extractProductSearchFields(p);
  const { cleanQuery, digitsOnly, tokens, expandedTerms, didYouMean, isNumeric, isCodeLike } = profile;

  // Exact / Partial match on EAN / Barcode / ANVISA (Highest priority)
  if (isCodeLike && digitsOnly.length >= 4) {
    if (fields.eanDigits.includes(digitsOnly)) return 2600;
    if (fields.anvisaDigits && fields.anvisaDigits.includes(digitsOnly)) return 2500;
    if (fields.eanClean.includes(cleanQuery)) return 2400;
    if (String(p.id) === cleanQuery) return 2300;
  }

  let score = 0;

  // 1. EXACT & PREFIX NAME MATCHES (Highest Priority for text)
  if (fields.nameClean === cleanQuery) {
    score += 1500;
  } else if (fields.nameClean.startsWith(cleanQuery)) {
    score += 1000;
  } else if (fields.nameClean.includes(cleanQuery)) {
    score += 600;
  }

  // 2. ACTIVE INGREDIENT MATCHES (Princípios Ativos)
  if (fields.activeIngClean.includes(cleanQuery)) {
    score += 700;
  }

  // 3. DOSAGE MATCHES (Dosagem / Concentração)
  if (fields.dosageClean.includes(cleanQuery)) {
    score += 600;
  }

  // 4. BRAND MATCHES (Marca)
  if (fields.brandClean.includes(cleanQuery)) {
    score += 550;
  }

  // 5. TARJA MATCHES
  if (fields.tarjaClean.includes(cleanQuery)) {
    score += 500;
  }

  // 6. ANVISA / REGISTRO MS MATCHES
  if (fields.anvisaClean && fields.anvisaClean.includes(cleanQuery)) {
    score += 700;
  }

  // 7. CARACTERÍSTICAS MATCHES
  if (fields.caracteristicasClean.includes(cleanQuery)) {
    score += 450;
  }

  // 8. SEARCH TERMS & SYNONYMS MATCHES
  if (fields.termsClean.includes(cleanQuery)) {
    score += 450;
  }

  // 9. THERAPEUTIC INDICATION & CLASS MATCHES
  if (fields.indicationClean.includes(cleanQuery)) {
    score += 400;
  }
  if (fields.classClean.includes(cleanQuery)) {
    score += 350;
  }

  // 10. DESCRIPTION & FULL TEXT PHRASE MATCHES
  if (fields.descClean.includes(cleanQuery)) {
    score += 300;
  }

  // 11. TOKEN-LEVEL MATCHING (Multi-word queries like "paracetamol 750mg cimed")
  let matchedTokensCount = 0;
  for (const token of tokens) {
    let tokenMatched = false;

    if (fields.nameClean.includes(token)) {
      score += 150;
      tokenMatched = true;
    }
    if (fields.activeIngClean.includes(token)) {
      score += 130;
      tokenMatched = true;
    }
    if (fields.dosageClean.includes(token)) {
      score += 120;
      tokenMatched = true;
    }
    if (fields.brandClean.includes(token)) {
      score += 110;
      tokenMatched = true;
    }
    if (fields.tarjaClean.includes(token)) {
      score += 100;
      tokenMatched = true;
    }
    if (fields.caracteristicasClean.includes(token)) {
      score += 90;
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
    if (fields.descClean.includes(token)) {
      score += 60;
      tokenMatched = true;
    }

    // Fuzzy matching on individual words if not exact
    if (!tokenMatched) {
      for (const word of fields.wordsSet) {
        if (word.length >= 3 && isFuzzyWordMatch(token, word)) {
          score += 75;
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
    score += coverageRatio * 350;
    if (matchedTokensCount === tokens.length && tokens.length > 1) {
      score += 300; // Bonus for 100% token coverage
    }
  }

  // 12. EXPANDED SYNONYMS & INDICATION MAPPINGS
  for (const exp of expandedTerms) {
    if (exp !== cleanQuery && exp !== didYouMean) {
      if (fields.nameClean.includes(exp)) score += 200;
      if (fields.activeIngClean.includes(exp)) score += 180;
      if (fields.indicationClean.includes(exp)) score += 160;
      if (fields.descClean.includes(exp)) score += 130;
      if (fields.termsClean.includes(exp)) score += 120;
    }
  }

  // 13. DID YOU MEAN MATCHES
  if (didYouMean) {
    if (fields.nameClean.includes(didYouMean)) score += 280;
    if (fields.activeIngClean.includes(didYouMean)) score += 220;
    if (fields.descClean.includes(didYouMean)) score += 160;
  }

  // 14. STOCK PRIORITY BONUS
  if ((p.estoque || 0) > 0) {
    score += 100;
  }

  // 15. CATALOG RELEVANCE PRIORITY
  score += (p.nivelRelevancia || 0) * 5;

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
    if (score > 35) {
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
