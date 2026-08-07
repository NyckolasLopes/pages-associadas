import { Link, useParams } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useEffect, useState } from "react";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl } = useAdmin();
  const [mounted, setMounted] = useState(false);
  const params = useParams({ strict: false });
  const storeSlug = params && (params as any).storeSlug;

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <Link to={storeSlug ? "/_store/$storeSlug" : "/"} params={storeSlug ? { storeSlug } : {}} className="inline-flex items-center" aria-label="Farmácias Associadas – Início">
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