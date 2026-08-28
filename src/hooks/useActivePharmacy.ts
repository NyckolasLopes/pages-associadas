import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export const SYSTEM_PAGES = new Set([
  'login', 'cadastro', 'perfil', 'pedidos', 'checkout',
  'sucesso', 'compartilhado', 'faq', 'ajuda', 'mapa-site',
  'politica-de-privacidade', 'pagina', 'admin',
]);

export function safeSlugify(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function useActivePharmacy() {
  const location = useLocation();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const pharmaciesFresh = useAdmin((s) => s.pharmaciesFresh);

  const search = location.search as any;
  const pathParts = location.pathname.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";
  
  let redirectSlug = "";
  if (search?.redirect) {
    const redirectParts = decodeURIComponent(search.redirect).split('/').filter(Boolean);
    if (redirectParts[0] && !SYSTEM_PAGES.has(redirectParts[0])) {
      redirectSlug = redirectParts[0];
    }
  }

  const activePharmacy = useMemo(() => {
    // 1. Slug da URL ou Redirect
    const slugToSearch = (potentialSlug && !SYSTEM_PAGES.has(potentialSlug)) ? potentialSlug : redirectSlug;
    
    if (slugToSearch) {
      const bySlug = pharmacies.find((p) => {
        const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
        return slug === slugToSearch;
      });
      if (bySlug) return bySlug;

      // Se não encontrou pelo slug, mas a lista de lojas ainda não foi atualizada do servidor,
      // retorna null para aguardar o carregamento (mostra spinner) e evitar piscar a loja fallback (Porto Alegre).
      if (!pharmaciesFresh) return null;
    }

    // 2. Última loja visitada
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) {
        const byLastSlug = pharmacies.find((p) => {
          const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
          return slug === lastSlug;
        });
        if (byLastSlug) return byLastSlug;
      }
    } catch { /* ignore */ }

    // 3. Farmácia selecionada no carrinho
    if (selectedPharmacyId) {
      const byCart = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (byCart) return byCart;
    }

    // 4. Fallback
    // Avoid returning the first pharmacy automatically for the global network
    return null;
  }, [selectedPharmacyId, pharmacies, potentialSlug, redirectSlug, pharmaciesFresh]);

  return activePharmacy;
}
