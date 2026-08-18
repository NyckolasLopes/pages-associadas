// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { EstoqueLojaTab } from "@/components/admin/EstoqueLojaTab";
import { useAdmin } from "@/stores/admin";

export const Route = createFileRoute("/admin/estoque")({
  component: EstoqueLoja,
});

function EstoqueLoja() {
  const { pharmacies, activeStoreId, currentUser } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario;
  
  if (isGlobalAdmin) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Acesso Negado</h1>
        <p>A aba de estoque é exclusiva para a visão do lojista.</p>
      </div>
    );
  }

  const store = pharmacies.find(p => p.id === activeStoreId);

  if (!store) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Loja não encontrada</h1>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      // @ts-ignore
      <EstoqueLojaTab loja={store} />
    </div>
  );
}