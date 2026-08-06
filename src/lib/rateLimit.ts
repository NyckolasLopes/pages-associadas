/**
 * Enterprise Client & API Rate Limiting & Throttling
 * Protege contra abusos, ataques de força bruta, flooding de requisições e scraping desordenado.
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RateLimitRecord {
  timestamps: number[];
}

class MemoryRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private cleanupInterval: any;

  constructor() {
    // Limpeza automática periódica para evitar vazamento de memória
    if (typeof window !== "undefined") {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
    }
  }

  /**
   * Verifica e consome uma requisição para a chave e configuração especificadas
   */
  public check(key: string, config: RateLimitConfig = { maxRequests: 30, windowMs: 60000 }): {
    allowed: boolean;
    remaining: number;
    resetInMs: number;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    const windowStart = now - config.windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filtrar apenas requisições dentro da janela de tempo atual
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= config.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetInMs = Math.max(0, oldestInWindow + config.windowMs - now);
      return {
        allowed: false,
        remaining: 0,
        resetInMs,
        retryAfterSeconds: Math.ceil(resetInMs / 1000),
      };
    }

    // Adiciona timestamp da requisição atual
    record.timestamps.push(now);
    const remaining = config.maxRequests - record.timestamps.length;
    const resetInMs = config.windowMs;

    return {
      allowed: true,
      remaining,
      resetInMs,
      retryAfterSeconds: 0,
    };
  }

  /**
   * Limpa registros expirados
   */
  public cleanup() {
    const now = Date.now();
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > now - 120000);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  /**
   * Reseta uma chave específica (ex: após login bem-sucedido)
   */
  public reset(key: string) {
    this.records.delete(key);
  }
}

export const rateLimiter = new MemoryRateLimiter();

// Configurações padrão por tipo de operação
export const RATE_LIMIT_PRESETS = {
  AUTH_LOGIN: { maxRequests: 5, windowMs: 60000 }, // 5 tentativas de login por minuto
  ORDER_SUBMIT: { maxRequests: 10, windowMs: 60000 }, // 10 envios de pedidos por minuto
  COUPON_APPLY: { maxRequests: 15, windowMs: 60000 }, // 15 tentativas de cupom por minuto
  CEP_LOOKUP: { maxRequests: 30, windowMs: 60000 }, // 30 buscas de CEP por minuto
  SPREADSHEET_IMPORT: { maxRequests: 5, windowMs: 60000 }, // 5 importações por minuto
  SEARCH_QUERY: { maxRequests: 60, windowMs: 60000 }, // 60 buscas por minuto
};

/**
 * Helper para validar rate limit com lançamento de erro ou retorno amigável
 */
export function checkRateLimitOrThrow(actionKey: string, preset: RateLimitConfig = RATE_LIMIT_PRESETS.ORDER_SUBMIT) {
  const result = rateLimiter.check(actionKey, preset);
  if (!result.allowed) {
    const errorMsg = `Muitas requisições em pouco tempo. Por segurança, aguarde ${result.retryAfterSeconds} segundos antes de tentar novamente.`;
    throw new Error(errorMsg);
  }
  return result;
}
