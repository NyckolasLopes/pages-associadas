import { Link } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useEffect, useState } from "react";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl } = useAdmin();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link to="/" className="inline-flex items-center" aria-label="Farmácias Associadas — Início">
      <img
        src={mounted && logoUrl ? logoUrl : logoUrlDefault}
        alt="Farmácias Associadas"
        className={`${className} w-auto object-contain`}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}