import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/")({
  component: Index,
});

function slugify(text: string): string {
  if (!text) return "";
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

function Index() {
  const navigate = useNavigate();
  const pharmacies = useAdmin((s) => s.pharmacies);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  
  useEffect(() => {
    if (pharmacies && pharmacies.length > 0) {
      let store = pharmacies.find((p) => p.id === selectedPharmacyId);
      if (!store) store = pharmacies[0];
      
      const slug = store.slug ? slugify(store.slug) : slugify(store.nome || store.id);
      navigate({ to: "/$storeSlug", params: { storeSlug: slug } as any, replace: true });
    }
  }, [pharmacies, selectedPharmacyId, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <Spinner className="h-16 w-16" />
    </div>
  );
}
