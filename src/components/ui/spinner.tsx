import { cn } from "@/lib/utils";
import React from "react";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { Loader2 } from "lucide-react";

export interface SpinnerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
  forceGeneric?: boolean;
}

export function Spinner({ className, size = 32, style, forceGeneric, ...props }: SpinnerProps) {
  const activePharmacy = useActivePharmacy();
  const isAdmin = typeof window !== "undefined" && window.location.pathname.startsWith('/admin');
  const isParceiroOrAssociado = activePharmacy?.categoriaAssociado === 'Parceiro' || activePharmacy?.categoriaAssociado === 'Associado';

  const isGlobalIndex = typeof window !== "undefined" && window.location.pathname === '/';

  if (forceGeneric) {
    return <Loader2 size={size} className={cn("animate-spin text-primary", className)} style={style} />;
  }

  let spinIcon = "/favicon.png";

  if (!isAdmin && !isGlobalIndex) {
    if (!activePharmacy) {
      return <Loader2 size={size} className={cn("animate-spin text-primary", className)} style={style} />;
    }
    if (isParceiroOrAssociado) {
      return <Loader2 size={size} className={cn("animate-spin text-primary", className)} style={style} />;
    }
    if (activePharmacy.faviconUrl) {
      spinIcon = activePharmacy.faviconUrl;
    }
  }

  return (
    <img
      src={spinIcon}
      alt="Carregando..."
      style={{ width: size, height: size, ...style }}
      className={cn("animate-spin object-contain", className)}
      {...props}
    />
  );
}
