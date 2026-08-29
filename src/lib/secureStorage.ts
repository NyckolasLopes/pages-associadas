/**
 * Secure Storage & Session Management
 * 
 * Regras de Conformidade & Segurança (LGPD / OWASP):
 * 1. LocalStorage NÃO contém tokens de autenticação nem dados pessoais sensíveis (CPF, Email, Telefone, Senha).
 * 2. SessionStorage é limpo automaticamente quando a aba é fechada ou sessão finalizada.
 * 3. Cookies com tokens utilizam flags de segurança (Secure, SameSite=Strict, Path=/).
 */

const SENSITIVE_KEYS = ["auth_token", "user_token", "cpf", "email", "phone", "password", "celular"];

// Funções de gerenciamento seguro de sessão


export const secureSession = {
  /**
   * Armazena valor temporário no sessionStorage
   */
  set: (key: string, value: string) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn("[SecureSession] Falha ao gravar no sessionStorage:", e);
    }
  },

  /**
   * Obtém valor temporário do sessionStorage
   */
  get: (key: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },

  /**
   * Remove item do sessionStorage
   */
  remove: (key: string) => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.removeItem(key);
    } catch {}
  },

  /**
   * Limpa todo o sessionStorage
   */
  clear: () => {
    if (typeof window === "undefined") return;
    try {
      sessionStorage.clear();
    } catch {}
  },
};

export const secureCookies = {
  /**
   * Define um cookie seguro com SameSite=Strict e Secure
   */
  set: (name: string, value: string, days = 7) => {
    if (typeof document === "undefined") return;
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `; expires=${date.toUTCString()}`;
    // Em produção sempre usa Secure. Em localhost permite sem https.
    const isSecure = typeof window !== "undefined" && window.location.protocol === "https:";
    const secureFlag = isSecure ? "; Secure" : "";
    document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}${expires}; path=/; SameSite=Strict${secureFlag}`;
  },

  /**
   * Obtém valor de um cookie
   */
  get: (name: string): string | null => {
    if (typeof document === "undefined") return null;
    const nameEQ = `${encodeURIComponent(name)}=`;
    const ca = document.cookie.split(";");
    for (let i = 0; i < ca.length; i++) {
      let c = ca[i];
      while (c.charAt(0) === " ") c = c.substring(1, c.length);
      if (c.indexOf(nameEQ) === 0) {
        return decodeURIComponent(c.substring(nameEQ.length, c.length));
      }
    }
    return null;
  },

  /**
   * Remove um cookie
   */
  remove: (name: string) => {
    if (typeof document === "undefined") return;
    document.cookie = `${encodeURIComponent(name)}=; Max-Age=-99999999; path=/; SameSite=Strict; Secure`;
  },
};

/**
 * Sanitiza objetos antes de persistir, removendo campos de dados sensíveis e tokens
 */
export function sanitizeForPersistence<T extends Record<string, any>>(obj: T): Partial<T> {
  if (!obj || typeof obj !== "object") return obj;
  const copy = { ...obj };
  
  for (const key of Object.keys(copy)) {
    const lower = key.toLowerCase();
    if (SENSITIVE_KEYS.some((s) => lower.includes(s))) {
      delete copy[key];
    }
  }
  
  return copy;
}
