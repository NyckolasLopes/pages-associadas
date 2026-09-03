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
  const isAdminArea = currentPath.startsWith('/admin') || potentialSlug === 'admin' || (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin'));

  let currentPharmacy = !isAdminArea ? activePharmacy : null;
  const allPharmaciesList = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

  if (!isAdminArea && !currentPharmacy && allPharmaciesList.length > 0 && potentialSlug) {
    const normalizedSlug = safeSlugify(potentialSlug);
    currentPharmacy = allPharmaciesList.find((p) => {
      const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
      const tcSlug = (p as any).themeColors?.slug ? safeSlugify((p as any).themeColors.slug) : "";
      const city = p.cidade ? safeSlugify(p.cidade) : "";
      const apelido = p.apelido ? safeSlugify(p.apelido) : "";
      return slug === normalizedSlug || tcSlug === normalizedSlug || city === normalizedSlug || apelido === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase() || String(p.id) === potentialSlug;
    }) || null;
  }

  let storeFavicon = currentPharmacy?.faviconUrl || currentPharmacy?.loadingLogoUrl || "";
  let storeCategoria = currentPharmacy?.categoriaAssociado;
  let storeIsPleno = currentPharmacy?.isPleno;

  if (!isAdminArea && typeof window !== 'undefined' && potentialSlug) {
    if (!storeFavicon) {
      try {
        storeFavicon = sessionStorage.getItem(`fa-store-favicon-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-favicon') || "";
      } catch {}
    }
    if (!storeCategoria) {
      try {
        storeCategoria = (sessionStorage.getItem(`fa-store-categoria-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-categoria') || "") as any;
      } catch {}
    }
  }

  // 1. Loja Parceiro: SOMENTE o círculo rodando se for explicitamente parceiro e não Pleno
  const isParceiro = !isAdminArea && 
    (storeCategoria === 'Parceiro' || currentPharmacy?.categoriaAssociado === 'Parceiro') && 
    currentPharmacy?.categoriaAssociado !== 'Pleno' && 
    currentPharmacy?.isPleno !== true &&
    potentialSlug.toLowerCase() !== 'pelotas';

  if (!isAdminArea && (forceGeneric || isParceiro)) {
    return <Loader2 size={size} className={cn("animate-spin text-slate-800", className)} style={style} />;
  }

  // 2. Loja Pleno: spin com o favicon do Pleno 100% dos carregamentos
  const isPleno = !isAdminArea && (
    storeCategoria === 'Pleno' || 
    currentPharmacy?.categoriaAssociado === 'Pleno' || 
    storeIsPleno === true || 
    currentPharmacy?.isPleno === true ||
    Boolean(storeFavicon && potentialSlug && potentialSlug !== 'loja-padrao' && !SYSTEM_PAGES.has(potentialSlug))
  );

  if (isPleno) {
    const plenoSpinImg = storeFavicon || currentPharmacy?.faviconUrl || currentPharmacy?.loadingLogoUrl || currentPharmacy?.logoUrl || "/icone-associadas.png";
    return (
      <img
        src={plenoSpinImg}
        alt="Carregando..."
        style={{ width: size, height: size, ...style }}
        className={cn("animate-spin object-contain", className)}
        {...props}
      />
    );
  }

  // 3. Loja do Associado / Rede Associadas: spin oficial da cruz das Farmácias Associadas
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
