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

  // 1. URL slug tem prioridade absoluta (ex: /zona-sul/produto/... → logo da zona-sul)
  const pharmacyBySlug = storeSlug
    ? pharmacies.find(p => {
        const slug = p.slug
          ? p.slug.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "")
          : (p.nome || p.id).normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
        return slug === storeSlug;
      })
    : null;

  // 2. Fallback: farmácia selecionada no carrinho
  const activePharmacy = pharmacyBySlug || pharmacies.find(p => p.id === selectedPharmacyId) || null;
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
  const displayLogo = activePharmacy?.logoUrl || (!isParceiro ? (globalLogoUrl || logoUrlDefault) : "");

  return (
    <Link to={storeSlug ? "/$storeSlug" : "/"} params={storeSlug ? { storeSlug } : {}} className="inline-flex items-center" aria-label={activePharmacy?.nome || "Incio"}>
      {mounted && !displayLogo && isParceiro ? (
        <span className="font-bold text-lg text-primary">{activePharmacy.nome}</span>
      ) : (
        <img
          src={mounted && displayLogo ? displayLogo : logoUrlDefault}
          alt={activePharmacy?.nome || "Logo"}
          className={`${className} w-auto object-contain`}
          loading="eager"
          decoding="async"
        />
      )}
    </Link>
  );
}