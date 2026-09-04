import { cn } from "@/lib/utils";
import React from "react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin, getInitialCachedPharmacies } from "@/stores/admin";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
  forceGeneric?: boolean;
}

export function Spinner({ className, size = 32, style, forceGeneric, ...props }: SpinnerProps) {
  const activePharmacy = useActivePharmacy();
  const pharmacies = useAdmin((s) => s.pharmacies);

  const currentPath = typeof window !== 'undefined' ? window.location.pathname : "";
  const pathParts = currentPath.split('/').filter(Boolean);
  const potentialSlug = pathParts[0] ?? "";
  const isAdminArea = currentPath.startsWith('/admin') || potentialSlug === 'admin';

  let currentPharmacy = !isAdminArea ? activePharmacy : null;
  const allPharmaciesList = (pharmacies && pharmacies.length > 0) ? pharmacies : getInitialCachedPharmacies();

  if (!isAdminArea && !currentPharmacy && allPharmaciesList.length > 0 && potentialSlug) {
    const normalizedSlug = safeSlugify(potentialSlug);
    currentPharmacy = allPharmaciesList.find((p) => {
      const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
      const tcSlug = (p as any).themeColors?.slug ? safeSlugify((p as any).themeColors.slug) : "";
      return slug === normalizedSlug || tcSlug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase() || String(p.id) === potentialSlug;
    }) || null;
  }

  let storeCategoria = currentPharmacy?.categoriaAssociado;
  if (!isAdminArea && typeof window !== 'undefined' && potentialSlug && !storeCategoria) {
    try {
      storeCategoria = (sessionStorage.getItem(`fa-store-categoria-${potentialSlug}`) || sessionStorage.getItem('fa-last-store-categoria') || "") as any;
    } catch {}
  }

  const cat = (storeCategoria || currentPharmacy?.categoriaAssociado || "").toString().toLowerCase();
  const isParceiro = !isAdminArea && (cat === 'parceiro' || currentPharmacy?.isPleno === false);

  // 1. Loja Parceiro: LOAD PADRÃO (círculo giratório padrão)
  if (!isAdminArea && (forceGeneric || isParceiro)) {
    return <Loader2 size={size} className={cn("animate-spin text-slate-800", className)} style={style} />;
  }

  // 2. Loja Pleno / Associadas: CARREGAMENTO DA ASSOCIADAS (ícone oficial da cruz girando)
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
