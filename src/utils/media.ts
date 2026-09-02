/**
 * Normaliza URLs de mídia e storage do Supabase para evitar bloqueios de Mixed Content (HTTP em páginas HTTPS).
 * Quando a página está em HTTPS e a URL do Supabase aponta para HTTP direto (ex: http://20.7.19.49:3006/storage/...),
 * converte para a rota de proxy segura /api/supabase/storage/...
 */
export function getSafeMediaUrl(url?: string | null): string {
  if (!url) return '';
  const trimmed = url.trim();
  if (!trimmed) return '';

  // Se já for data URL ou URL relativa ou blob, retorna diretamente
  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('/')) {
    return trimmed;
  }

  // Verifica se a URL aponta para a instância do Supabase sem SSL (http://20.7.19.49:3006 ou localhost/ip)
  const supabaseHostPattern = /^http:\/\/(20\.7\.19\.49:3006|localhost:3006|127\.0\.0\.1:3006)/i;
  if (supabaseHostPattern.test(trimmed)) {
    return trimmed.replace(supabaseHostPattern, '/api/supabase');
  }

  return trimmed;
}
