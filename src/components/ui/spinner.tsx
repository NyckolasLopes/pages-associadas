import { cn } from "@/lib/utils";
import React from "react";

export interface SpinnerProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 32, style, ...props }: SpinnerProps) {
  return (
    <img
      src="/loading-icon.png"
      alt="Carregando..."
      style={{ width: size, height: size, ...style }}
      className={cn("animate-spin object-contain", className)}
      {...props}
    />
  );
}
