import { createFileRoute } from "@tanstack/react-router";
import { LojaLeadsTab } from "@/components/admin/LojaLeadsTab";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/marketing/leads")({
  component: MarketingLeadsRoute,
});

function MarketingLeadsRoute() {
  const { currentUser } = useAdmin();
  
  const isGlobalAdmin = currentUser?.cargo === "Admin";
  const lojaId = isGlobalAdmin ? undefined : currentUser?.lojaId;

  if (!isGlobalAdmin && !lojaId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <h2 className="text-xl font-bold text-slate-800">Acesso Negado</h2>
        <p className="text-slate-500 mt-2">Você precisa estar vinculado a uma loja para ver seus leads.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <LojaLeadsTab lojaId={lojaId} />
    </div>
  );
}
