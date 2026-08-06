/**
 * Security & Input Validation Toolkit
 * Validação estrita de entradas, sanitização contra XSS, injeção de fórmulas e proteção de dados.
 */

/**
 * Sanitiza texto contra injeção de HTML e scripts maliciosos (XSS)
 */
export function sanitizeText(input: unknown, maxLength = 500): string {
  if (typeof input !== "string") {
    return input ? String(input).slice(0, maxLength) : "";
  }

  return input
    .slice(0, maxLength)
    .replace(/[<>]/g, "") // Remove < e >
    .replace(/javascript:/gi, "") // Remove esquemas javascript
    .replace(/data:/gi, "") // Remove data uris maliciosos
    .replace(/on\w+=/gi, "") // Remove manipuladores de evento on*
    .trim();
}

/**
 * Previne Formula Injection em planilhas Excel/CSV (valores que começam com =, +, -, @)
 */
export function sanitizeSpreadsheetValue(value: unknown): string {
  if (value === null || value === undefined) return "";
  const str = String(value).trim();
  if (/^[=+\-@]/.test(str)) {
    return `'${str}`; // Prefix com apóstrofo para neutralizar execução de fórmulas no Excel
  }
  return str;
}

/**
 * Validação matemática oficial de CPF brasileiro (Algoritmo Módulo 11)
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  const clean = cpf.replace(/\D/g, "");

  if (clean.length !== 11) return false;
  // Rejeita sequências de dígitos iguais (ex: 111.111.111-11)
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(10), 10)) return false;

  return true;
}

/**
 * Validação de Telefone / WhatsApp Brasileiro
 */
export function validatePhone(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/\D/g, "");
  // Aceita 10 dígitos (fixo/móvel antigo) ou 11 dígitos (móvel com 9)
  if (clean.length !== 10 && clean.length !== 11) return false;
  const ddd = parseInt(clean.substring(0, 2), 10);
  // DDDs válidos no Brasil variam de 11 a 99
  if (ddd < 11 || ddd > 99) return false;
  return true;
}

/**
 * Validação de CEP Brasileiro
 */
export function validateCEP(cep: string): boolean {
  if (!cep) return false;
  const clean = cep.replace(/\D/g, "");
  return clean.length === 8 && !/^0{8}$/.test(clean);
}

/**
 * Validação de E-mail seguro
 */
export function validateEmail(email: string): boolean {
  if (!email || email.length > 254) return false;
  const regex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return regex.test(email);
}

/**
 * Validação de Preço / Valor Monetário
 */
export function validatePrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const num = typeof value === "number" ? value : parseFloat(String(value).replace(/[^\d.,]/g, "").replace(",", "."));
  if (isNaN(num) || !isFinite(num) || num < 0 || num > 1000000) {
    return null;
  }
  return Math.round(num * 100) / 100;
}

/**
 * Sanitiza código de cupom (apenas letras e números, max 20 caracteres)
 */
export function sanitizeCouponCode(code: string): string {
  if (!code) return "";
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9_\-]/g, "")
    .slice(0, 20);
}
