/**
 * Enterprise Cyber Security Defense Utility
 * Proteção em camadas: OWASP Top 10, Zero-Trust Input, Anti-SQLi, Anti-Prompt Injection, Anti-XSS, PostgREST Sanitizer
 */

// Padrões conhecidos de injeção SQL clássica e baseada em tempo/erro
const SQL_INJECTION_PATTERNS = [
  /(\b(union(\s+all)?)\s+select\b)/i,
  /(;\s*(drop|truncate|alter|delete|update|insert|create|exec|execute)\s+)/i,
  /(\b(or|and)\s+['"]?[0-9a-z]+['"]?\s*=\s*['"]?[0-9a-z]+['"]?(\s*--|\s*#|\s*\/\*))/i,
  /(\bexec(ute)?\s+(master|xp_|sp_))/i,
  /(\bpg_sleep\s*\()/i,
  /(\bwaitfor\s+delay\b)/i,
  /(\bbenchmark\s*\()/i,
  /(\bchar\s*\(\s*\d+\s*\))/i,
  /(--|\/\*|\*\/|@@)/
];

// Padrões conhecidos de Prompt Injection (tentativas de manipular IAs / Answer Engines / RAGs)
const PROMPT_INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+(instructions|prompts|rules)/i,
  /forget\s+(everything|all)\s+(you\s+know|prior|previous)/i,
  /you\s+are\s+now\s+in\s+DAN\s+mode/i,
  /jailbreak/i,
  /\bsystem\s*:\s*you\s+are\b/i,
  /\boutput\s+(the\s+)?(system\s+prompt|raw\s+instructions)/i,
  /reveal\s+your\s+(secret|initial|original)\s+instructions/i,
  /\bpretend\s+you\s+are\s+(an\s+unrestricted|a\s+different)\s+ai\b/i,
  /<\|im_start\|>|<\|im_end\|>|\[INST\]|\[\/INST\]/i
];

/**
 * Sanitiza entradas de texto para evitar XSS e caracteres nulos perigosos
 */
export function sanitizeInput(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") return "";

  return input
    .replace(/\0/g, "") // Remove null bytes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "") // Remove tags <script>
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "") // Remove tags <iframe>
    .replace(/javascript:/gi, "") // Remove pseudo-protocolos
    .replace(/data:\s*text\/html/gi, "") // Remove data URIs de HTML
    .replace(/on\w+\s*=/gi, "") // Remove manipuladores de evento inline (onclick, onerror, onload)
    .replace(/[<>]/g, "") // Remove delimitadores HTML remanescentes
    .trim()
    .slice(0, maxLength);
}

/**
 * Detecta se uma string contém padrões de injeção SQL
 */
export function detectSqlInjection(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return SQL_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Detecta se uma string contém padrões de Prompt Injection voltados a assistentes de IA
 */
export function detectPromptInjection(input: unknown): boolean {
  if (typeof input !== "string") return false;
  return PROMPT_INJECTION_PATTERNS.some((pattern) => pattern.test(input));
}

/**
 * Sanitiza um termo de busca com neutralização defensiva de SQLi e Prompt Injection
 */
export function sanitizeSearchQuery(query: unknown, maxLength = 120): string {
  if (typeof query !== "string") return "";

  let cleaned = query
    .replace(/\0/g, "")
    .replace(/[<>{}[\]\\]/g, " ")
    .replace(/[,()]/g, " ") // PostgREST quebra em vírgulas e parênteses não escapados
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);

  // Se detectar tentativa clara de Prompt Injection ou SQL Injection, neutraliza tokens maliciosos
  if (detectPromptInjection(cleaned) || detectSqlInjection(cleaned)) {
    cleaned = cleaned
      .replace(/(ignore|disregard|forget|previous|instructions|system|union|select|drop|truncate|alter|delete|update|exec)/gi, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  return cleaned;
}

/**
 * Sanitiza identificadores alfanuméricos estritos (IDs, slugs, EANs, códigos)
 * Utilizado para montar filtros PostgREST seguros (ex: .in('id', ids))
 */
export function sanitizePostgrestToken(token: unknown, maxLength = 64): string {
  if (typeof token !== "string" && typeof token !== "number") return "";
  const str = String(token).trim();
  // Permite apenas caracteres seguros: letras, números, hífen e underscore
  return str.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, maxLength);
}

/**
 * Sanitiza listas de IDs para injeção segura em cláusulas de arrays do PostgREST
 */
export function sanitizePostgrestIdList(tokens: unknown[]): string[] {
  if (!Array.isArray(tokens)) return [];
  return tokens
    .map((t) => sanitizePostgrestToken(t))
    .filter((t) => t.length > 0);
}

/**
 * Garante limites seguros de linhas retornadas por consultas (Row Limit Security / Anti-DoS)
 */
export function sanitizeRowLimit(limit: unknown, defaultLimit = 20, maxLimit = 100): number {
  if (typeof limit === "number" && !isNaN(limit) && limit > 0) {
    return Math.min(Math.floor(limit), maxLimit);
  }
  if (typeof limit === "string") {
    const parsed = parseInt(limit, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return Math.min(parsed, maxLimit);
    }
  }
  return defaultLimit;
}
