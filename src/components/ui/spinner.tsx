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
  const isPleno = activePharmacy?.categoriaAssociado === 'Pleno' || activePharmacy?.isPleno === true;

  // Lojas Parceiro/Associado ou estados neutros NUNCA exibem o favicon da Associadas girando
  if (forceGeneric || !isPleno) {
    return <Loader2 size={size} className={cn("animate-spin text-primary", className)} style={style} />;
  }

  const spinIcon = activePharmacy?.faviconUrl || "/favicon.png";

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
