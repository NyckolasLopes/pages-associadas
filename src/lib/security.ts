import DOMPurify from 'isomorphic-dompurify';

/**
 * Sanitiza HTML para evitar ataques XSS (Cross-Site Scripting).
 * Deve ser usado sempre que receber HTML do banco de dados (ex: descrições, páginas personalizadas).
 * @param dirtyHtml HTML bruto
 * @returns HTML limpo e seguro
 */
export function sanitizeHtml(dirtyHtml: string | undefined | null): string {
  if (!dirtyHtml) return "";
  
  // DOMPurify já remove tags `<script>`, `eval()`, iframes maliciosos e URLs `javascript:`
  return DOMPurify.sanitize(dirtyHtml, {
    ALLOWED_TAGS: [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'p', 'a', 'ul', 'ol',
      'nl', 'li', 'b', 'i', 'strong', 'em', 'strike', 'code', 'hr', 'br', 'div',
      'table', 'thead', 'caption', 'tbody', 'tr', 'th', 'td', 'pre', 'span', 'img'
    ],
    ALLOWED_ATTR: ['href', 'name', 'target', 'src', 'alt', 'class', 'style'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'form', 'object', 'embed'],
    FORBID_ATTR: ['onerror', 'onload', 'onmouseover', 'onclick'] // Bloquear event handlers (XSS em inline attrs)
  });
}

/**
 * Sanitiza inputs de texto para mitigar tentativas superficiais de SQL Injection e anomalias.
 * (Nota: Supabase/PostgREST já usa queries parametrizadas o que impede 99% das injeções tradicionais, 
 * mas esta função serve como defesa em profundidade e para limpar inputs sujos de crawlers e bots).
 * @param input String bruta do formulário/URL
 * @returns String segura
 */
export function sanitizeInput(input: string | undefined | null): string {
  if (!input) return "";
  
  // Remove caracteres comuns em payloads de injeção e ataques básicos (--, ;, ', /*, <script>)
  return input
    .replace(/<[^>]*>?/gm, '') // Remove tags HTML acidentais/maliciosas em inputs não-ricos
    .replace(/;/g, '') // Remove terminador de comando SQL
    .replace(/--/g, '') // Remove comentários SQL
    .replace(/\/\*/g, '') // Remove comentários C-style
    .trim();
}
