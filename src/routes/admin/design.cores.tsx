import { createFileRoute } from "@tanstack/react-router";
import { StoreColorManager } from "@/components/admin/StoreColorManager";

export const Route = createFileRoute("/admin/design/cores")({
  component: AdminDesignCores,
});

function AdminDesignCores() {
  return (
    <div className="space-y-6 pb-20">
      <StoreColorManager
        showStoreSelector={true}
        title="Minhas Cores"
        description="Personalize a paleta de cores, botões, cabeçalho e rodapé da sua vitrine."
      />
    </div>
  );
}
