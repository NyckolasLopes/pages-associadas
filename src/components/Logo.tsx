import { Link, useParams } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { useEffect, useState } from "react";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl: globalLogoUrl, pharmacies } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const params = useParams({ strict: false });
  const storeSlug = params && (params as any).storeSlug;

  useEffect(() => {
    setMounted(true);
  }, []);

  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro' || activePharmacy?.isPleno === false;
  
  // If we have a storeSlug, assume it might be a partner until proven otherwise during SSR
  const isPotentiallyParceiro = isParceiro || (!mounted && storeSlug);
  
  const displayLogo = activePharmacy?.logoUrl || (!isPotentiallyParceiro ? (globalLogoUrl || logoUrlDefault) : "");

  return (
    <Link to={storeSlug ? "/$storeSlug" : "/"} params={storeSlug ? { storeSlug } : {}} className="inline-flex items-center" aria-label={activePharmacy?.nome || "Início"}>
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