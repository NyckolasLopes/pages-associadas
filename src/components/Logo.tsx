import { Link, useParams } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useEffect, useState, useMemo } from "react";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl: globalLogoUrl, pharmacies } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const params = useParams({ strict: false });
  const rawStoreSlug = params && (params as any).storeSlug;

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro' || activePharmacy?.isPleno === false;

  // Resolve target store slug safely
  const targetStoreSlug = useMemo(() => {
    // 1. If active pharmacy is a valid store with slug
    if (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao") {
      return safeSlugify(activePharmacy.slug);
    }
    // 2. If URL has a valid non-default storeSlug
    if (rawStoreSlug && rawStoreSlug !== "loja-padrao" && !SYSTEM_PAGES.has(rawStoreSlug)) {
      const found = (pharmacies || []).find(p => safeSlugify(p.slug || p.nome || "") === safeSlugify(rawStoreSlug));
      if (found?.slug) return safeSlugify(found.slug);
      if (found?.nome) return safeSlugify(found.nome);
    }
    // 3. If partner pharmacy with name
    if (isParceiro && activePharmacy?.nome) {
      return safeSlugify(activePharmacy.nome);
    }
    // 4. Default: return null to link directly to "/"
    return null;
  }, [activePharmacy, rawStoreSlug, pharmacies, isParceiro]);

  // If we have a storeSlug, assume it might be a partner until proven otherwise during SSR
  const isPotentiallyParceiro = isParceiro || (!mounted && rawStoreSlug && rawStoreSlug !== "loja-padrao");
  const displayLogo = activePharmacy?.logoUrl || (!isPotentiallyParceiro ? (globalLogoUrl || logoUrlDefault) : "");

  return (
    <Link 
      to={targetStoreSlug ? "/$storeSlug" : "/"} 
      params={targetStoreSlug ? { storeSlug: targetStoreSlug } : undefined} 
      className="inline-flex items-center" 
      aria-label={activePharmacy?.nome || "Início"}
    >
      {(!displayLogo && isPotentiallyParceiro) ? (
        <span className="font-bold text-lg text-primary">{activePharmacy?.nome || ""}</span>
      ) : (
        <img
          src={displayLogo ? displayLogo : logoUrlDefault}
          alt={activePharmacy?.nome || "Logo"}
          className={`${className} w-auto object-contain`}
          loading="eager"
          decoding="async"
        />
      )}
    </Link>
  );
}