import { cn } from "@/lib/utils";
import React from "react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { useAdmin } from "@/stores/admin";
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

  let currentPharmacy = activePharmacy;
  if (!currentPharmacy && pharmacies && pharmacies.length > 0) {
    const pathParts = location.pathname.split('/').filter(Boolean);
    const potentialSlug = pathParts[0] ?? "";
    if (potentialSlug) {
      const normalizedSlug = safeSlugify(potentialSlug);
      currentPharmacy = pharmacies.find((p) => {
        const slug = p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id);
        return slug === normalizedSlug || (p.slug || "").toLowerCase() === potentialSlug.toLowerCase();
      }) || null;
    }
  }

  const isParceiro = currentPharmacy?.categoriaAssociado === 'Parceiro' || 
                     currentPharmacy?.categoriaAssociado === 'Associado' || 
                     currentPharmacy?.isPleno === false;

  // Lojas Parceiro/Associado usam o redondo comum carregando
  if (forceGeneric || isParceiro) {
    return <Loader2 size={size} className={cn("animate-spin text-primary", className)} style={style} />;
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
