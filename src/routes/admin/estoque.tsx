// @ts-nocheck
import { createFileRoute } from "@tanstack/react-router";
import { EstoqueLojaTab } from "@/components/admin/EstoqueLojaTab";
import { useAdmin } from "@/stores/admin";

import { Spinner } from "@/components/ui/spinner";

function EstoquePendingComponent() {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-slate-50">
      <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
        <Spinner size={40} className="text-emerald-600" />
        <span className="text-sm font-bold text-slate-500 uppercase tracking-widest">Carregando Estoque...</span>
      </div>
    </div>
  );
}

export const Route = createFileRoute("/admin/estoque")({
  component: EstoqueLoja,
  pendingComponent: EstoquePendingComponent,
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
      <EstoqueLojaTab loja={store} />
    </div>
  );
}