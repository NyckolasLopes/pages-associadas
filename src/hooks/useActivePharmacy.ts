import { useMemo } from "react";
import { useLocation } from "@tanstack/react-router";
import { useAdmin, getInitialCachedPharmacies } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export const SYSTEM_PAGES = new Set([
  'login', 'cadastro', 'perfil', 'pedidos', 'checkout',
  'sucesso', 'compartilhado', 'faq', 'ajuda', 'mapa-site',
  'politica-de-privacidade', 'pagina', 'admin', 'cupons',
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

const virtualStoresCache = new Map<string, any>();

export function useActivePharmacy() {
  const location = useLocation();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const pharmaciesLoaded = useAdmin((s) => s.pharmaciesLoaded);

  const search = location.search as any;
  const currentPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";
  
  let redirectSlug = "";
  if (search?.redirect) {
    const redirectParts = decodeURIComponent(search.redirect).split('/').filter(Boolean);
    if (redirectParts[0] && !SYSTEM_PAGES.has(redirectParts[0])) {
      redirectSlug = redirectParts[0];
    }
  }

  const activePharmacy = useMemo(() => {
    const isAdminArea = currentPath.startsWith('/admin') || potentialSlug === 'admin' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));
    if (isAdminArea) {
      return null;
    }

    const allPharmacies = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

    // 1. Slug da URL ou Redirect
    const slugToSearch = (potentialSlug && !SYSTEM_PAGES.has(potentialSlug)) ? potentialSlug : redirectSlug;
    
    if (slugToSearch) {
      const normalizedSearch = safeSlugify(slugToSearch);
      const lowerRaw = slugToSearch.toLowerCase();

      if (allPharmacies && allPharmacies.length > 0) {
        const bySlug = allPharmacies.find((p) => {
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
      }

      // Se a URL aponta para uma loja específica (ex: /zona-sul), NUNCA fazer fallback para loja-padrao
      // Retorna imediatamente o design individual da loja (com cache estável)
      if (normalizedSearch !== "loja-padrao") {
        if (!virtualStoresCache.has(slugToSearch)) {
          const formattedName = slugToSearch
            .split('-')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ');

          virtualStoresCache.set(slugToSearch, {
            id: slugToSearch,
            slug: slugToSearch,
            nome: formattedName,
            categoriaAssociado: 'Parceiro',
            isPleno: false,
            ativo: true,
            virtualStoreStatus: 'Ativa',
          });
        }
        return virtualStoresCache.get(slugToSearch);
      }
    }

    if (!allPharmacies || allPharmacies.length === 0) {
      return null;
    }

    // 2. Última loja visitada
    try {
      const lastSlug = sessionStorage.getItem('fa-last-store-slug');
      if (lastSlug) {
        const normalizedLast = safeSlugify(lastSlug);
        const lowerLast = lastSlug.toLowerCase();
        const byLastSlug = allPharmacies.find((p) => {
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
      const byCart = allPharmacies.find((p) => String(p.id) === String(selectedPharmacyId));
      if (byCart) return byCart;
    }

    // 4. Fallback padrão seguro apenas para raiz da rede ou rota padrão
    return (
      allPharmacies.find((p) => (p.slug || "").toLowerCase() === "loja-padrao") ||
      allPharmacies.find((p) => p.ativo !== false) ||
      allPharmacies[0] ||
      null
    );
  }, [selectedPharmacyId, pharmacies, potentialSlug, redirectSlug, pharmaciesLoaded]);

  return activePharmacy;
}

