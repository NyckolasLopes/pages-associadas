import { Link, useParams } from "@tanstack/react-router";
import logoUrlDefault from "@/assets/logo.png";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { useEffect, useState } from "react";

export function Logo({ className = "h-10" }: { className?: string }) {
  const { logoUrl: globalLogoUrl, pharmacies } = useAdmin();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const [mounted, setMounted] = useState(false);
  const params = useParams({ strict: false });
  const storeSlug = params && (params as any).storeSlug;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Use the specific store's logo if selected, otherwise fallback to global, then default
  const activePharmacy = pharmacies.find(p => p.id === selectedPharmacyId);
  const displayLogo = activePharmacy?.logoUrl || globalLogoUrl || logoUrlDefault;

  return (
    <Link to={storeSlug ? "/_store/$storeSlug" : "/"} params={storeSlug ? { storeSlug } : {}} className="inline-flex items-center" aria-label="Farmácias Associadas – Início">
      <img
        src={mounted ? displayLogo : logoUrlDefault}
        alt="Farmácias Associadas"
        className={`${className} w-auto object-contain`}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
}