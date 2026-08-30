import { cn } from "@/lib/utils";
import React from "react";
import { useActivePharmacy, safeSlugify, SYSTEM_PAGES } from "@/hooks/useActivePharmacy";
import { useAdmin, getInitialCachedPharmacies } from "@/stores/admin";
import { useLocation } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
  forceGeneric?: boolean;
}

export function Spinner({ className, size = 32, style, forceGeneric, ...props }: SpinnerProps) {
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const location = useLocation();

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : location.pathname;
  const pathParts = currentPath.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";
  const isCustomStoreSlug = potentialSlug && !SYSTEM_PAGES.has(potentialSlug) && potentialSlug !== 'loja-padrao';

  let currentPharmacy = activePharmacy;
  const allPharmaciesList = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

  if (!currentPharmacy && allPharmaciesList.length > 0 && potentialSlug) {
    const normalizedSlug = safeSlugify(potentialSlug);
    currentPharmacy = allPharmaciesList.find((p) => {
      const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
      return slug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase();
    }) || null;
  }

  const isParceiro = currentPharmacy 
    ? (currentPharmacy.categoriaAssociado === 'Parceiro' || currentPharmacy.categoriaAssociado === 'Associado' || currentPharmacy.isPleno === false)
    : false;

  // Lojas Parceiro/Associado usam o redondo comum carregando
  if (forceGeneric || isParceiro) {
    return <Loader2 size={size} className={cn("animate-spin text-slate-800", className)} style={style} />;
  }

  // Lojas Pleno usam o spin da Associadas 100% do tempo
  return (
    <img
      src="/icone-associadas.png"
      alt="Carregando..."
      style={{ width: size, height: size, ...style }}
      className={cn("animate-spin object-contain", className)}
      {...props}
    />
  );
}
