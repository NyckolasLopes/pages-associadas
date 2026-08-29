import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";
import { GlobalLoading } from "@/components/ui/global-loading";

export const Route = createFileRoute("/sucesso")({
  validateSearch: (search: Record<string, unknown>) => ({
    id: (search.id as string) || "",
  }),
  component: SucessoRedirect,
});

function SucessoRedirect() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const activePharmacy = useActivePharmacy();

  useEffect(() => {
    let slug = "loja-padrao";
    try {
      const lastSlug = sessionStorage.getItem("fa-last-store-slug");
      if (lastSlug) {
        slug = lastSlug;
      } else if (activePharmacy?.slug) {
        slug = safeSlugify(activePharmacy.slug);
      }
    } catch {
      if (activePharmacy?.slug) {
        slug = safeSlugify(activePharmacy.slug);
      }
    }

    navigate({
      to: "/$storeSlug/sucesso",
      params: { storeSlug: slug },
      search: { id: search.id },
      replace: true,
    });
  }, [search.id, activePharmacy, navigate]);

  return <GlobalLoading />;
}
