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
  const pharmaciesLoaded = useAdmin((s) => s.pharmaciesLoaded);

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
    if (!pharmacies || pharmacies.length === 0) {
      return null;
    }

    // 1. Slug da URL ou Redirect
    const slugToSearch = (potentialSlug && !SYSTEM_PAGES.has(potentialSlug)) ? potentialSlug : redirectSlug;
    
    if (slugToSearch) {
      const normalizedSearch = safeSlugify(slugToSearch);
      const lowerRaw = slugToSearch.toLowerCase();

      const bySlug = pharmacies.find((p) => {
        const slugFormatted = p.slug ? safeSlugify(p.slug) : "";
        const nameFormatted = p.nome ? safeSlugify(p.nome) : "";
        const idStr = String(p.id);
        const rawSlugLower = (p.slug || "").toLowerCase();

        return (
          slugFormatted === normalizedSearch ||
          rawSlugLower === lowerRaw ||
          nameFormatted === normalizedSearch ||
          idStr === slugToSearch
        );
      });
      if (bySlug) return bySlug;

      // Se a lista ainda não foi carregada do Supabase e não achou no cache, aguarda
      if (!pharmaciesLoaded) return null;
    }

    // 2. Última loja visitada
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) {
        const normalizedLast = safeSlugify(lastSlug);
        const lowerLast = lastSlug.toLowerCase();
        const byLastSlug = pharmacies.find((p) => {
          const slugFormatted = p.slug ? safeSlugify(p.slug) : "";
          const nameFormatted = p.nome ? safeSlugify(p.nome) : "";
          const idStr = String(p.id);
          const rawSlugLower = (p.slug || "").toLowerCase();

          return (
            slugFormatted === normalizedLast ||
            rawSlugLower === lowerLast ||
            nameFormatted === normalizedLast ||
            idStr === lastSlug
          );
        });
        if (byLastSlug) return byLastSlug;
      }
    } catch { /* ignore */ }

    // 3. Farmácia selecionada no carrinho
    if (selectedPharmacyId) {
      const byCart = pharmacies.find((p) => String(p.id) === String(selectedPharmacyId));
      if (byCart) return byCart;
    }

    // 4. Fallback padrão seguro (garante que nunca trave em tela branca/spinner infinito)
    return (
      pharmacies.find((p) => (p.slug || "").toLowerCase() === "loja-padrao") ||
      pharmacies.find((p) => p.ativo !== false) ||
      pharmacies[0] ||
      null
    );
  }, [selectedPharmacyId, pharmacies, potentialSlug, redirectSlug, pharmaciesLoaded]);

  return activePharmacy;
}

