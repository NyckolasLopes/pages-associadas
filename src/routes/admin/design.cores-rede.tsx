import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { StoreColorManager } from "@/components/admin/StoreColorManager";
import { useEffect } from "react";

export const Route = createFileRoute("/admin/design/cores-rede")({
  component: AdminCoresRede,
});

function AdminCoresRede() {
  const { currentUser, grupos } = useAdmin();
  const navigate = useNavigate();

  const isGlobalAdmin = !!(
    currentUser?.proprietario ||
    grupos?.find((g) => g.id === currentUser?.grupoId)?.permissao_total
  );

  // Restrict to global admin only
  useEffect(() => {
    if (currentUser && !isGlobalAdmin) {
      navigate({ to: "/admin/design/cores" });
    }
  }, [currentUser, isGlobalAdmin, navigate]);

  if (!isGlobalAdmin) return null;

  return (
    <div className="space-y-6 pb-20">
      <StoreColorManager
        storeId={undefined}
        showStoreSelector={false}
        isNetworkPage={true}
        title="Cores Padrão da Rede"
        description="Configure a paleta de cores oficial da rede Farmácias Associadas. Novas lojas Pleno herdam essas cores automaticamente."
      />
    </div>
  );
}
