import { createFileRoute } from "@tanstack/react-router";
import { StoreColorManager } from "@/components/admin/StoreColorManager";
import { useAdmin } from "@/stores/admin";
import { Info } from "lucide-react";

export const Route = createFileRoute("/admin/design/cores")({
  component: AdminDesignCores,
});

function AdminDesignCores() {
  const { currentUser, grupos, activeStoreId, pharmacies } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);
  const currentPharmacy = pharmacies.find(p => p.id === activeStoreId);

  const cat = currentPharmacy?.categoriaAssociado?.toString().toLowerCase() || '';
  const isStorePleno = !isGlobalAdmin && (cat === 'pleno' || cat === 'padrão' || cat === 'padrao' || currentPharmacy?.isPleno === true);

  if (isStorePleno) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4">
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <Info className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">Cores Oficiais da Rede</h2>
          <p className="text-slate-600 leading-relaxed max-w-lg mx-auto">
            Como <strong>Loja Associada Plena</strong>, sua loja utiliza automaticamente a identidade visual e as cores oficiais da rede <strong>Farmácias Associadas</strong>. A personalização de cores customizadas no painel é restrita para farmácias da modalidade Parceiro.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-20">
      <StoreColorManager
        showStoreSelector={isGlobalAdmin}
        title={isGlobalAdmin && !activeStoreId ? "Cores da Rede (Padrão Global)" : "Minhas Cores"}
        description={isGlobalAdmin && !activeStoreId ? "Configure as cores padrão oficiais da rede Farmácias Associadas." : "Personalize a paleta de cores da sua vitrine."}
      />
    </div>
  );
}
