import { Link, useParams } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useMemo } from "react";
import { useActivePharmacy, SYSTEM_PAGES, safeSlugify } from "@/hooks/useActivePharmacy";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl: globalLogoUrl, pharmacies } = useAdmin();
  const params = useParams({ strict: false });
  const rawStoreSlug = params && (params as any).storeSlug;

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
  const pathParts = currentPath.split('/').filter(Boolean);
  const pathSlug = pathParts[0] ?? "";
  const effectiveSlug = rawStoreSlug || (pathSlug && !SYSTEM_PAGES.has(pathSlug) ? pathSlug : "");

  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro' || 
                     activePharmacy?.categoriaAssociado === 'Associado' || 
                     activePharmacy?.isPleno === false;

  // Resolve target store slug safely
  const targetStoreSlug = useMemo(() => {
    if (activePharmacy?.slug && activePharmacy.slug !== "loja-padrao") {
      return safeSlugify(activePharmacy.slug);
    }
    if (effectiveSlug && effectiveSlug !== "loja-padrao") {
      return safeSlugify(effectiveSlug);
    }
    return null;
  }, [activePharmacy, effectiveSlug]);

  const partnerLogo = activePharmacy?.logoUrl || activePharmacy?.footerLogoUrl;
  const storeDisplayName = activePharmacy?.nome || (effectiveSlug ? effectiveSlug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : "");

  return (
    <Link 
      to={targetStoreSlug ? "/$storeSlug" : "/"} 
      params={targetStoreSlug ? { storeSlug: targetStoreSlug } : undefined} 
      className="inline-flex items-center" 
      aria-label={storeDisplayName || "Início"}
    >
      {isParceiro ? (
        partnerLogo ? (
          <img
            src={partnerLogo}
            alt={storeDisplayName || "Logo"}
            className={`${className} w-auto object-contain`}
            loading="eager"
            decoding="async"
          />
        ) : (
          <span className="font-extrabold text-xl tracking-tight text-slate-800 truncate max-w-[190px] sm:max-w-[260px]">
            {storeDisplayName || "Loja Parceira"}
          </span>
        )
      ) : (
        <img
          src={activePharmacy?.logoUrl || globalLogoUrl || logoUrlDefault}
          alt={storeDisplayName || "Farmácias Associadas"}
          className={`${className} w-auto object-contain`}
          loading="eager"
          decoding="async"
        />
      )}
    </Link>
  );
}