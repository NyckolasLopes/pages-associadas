import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LojaConfiguracoesTab } from "@/components/admin/LojaConfiguracoesTab";
import { LojaSeoTab } from "@/components/admin/LojaSeoTab";

export const Route = createFileRoute("/admin/configuracoes/loja")({
  component: ConfiguracoesLojaPage,
});

function ConfiguracoesLojaPage() {
  const { currentUser, activeStoreId } = useAdmin();
  
  // Como essa tela é apenas para os donos de loja (ou admins visualizando o escopo da loja),
  // o id será o activeStoreId, ou a primeira loja vinculada.
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  let storeId = activeStoreId;
  
  if (!isGlobalAdmin && !storeId && currentUser?.lojasVinculadas?.length) {
    storeId = currentUser.lojasVinculadas[0];
  }

  if (isGlobalAdmin && !storeId) {
    return (
      <div className="p-8 text-center text-slate-500 bg-white rounded-lg shadow-sm border">
        Selecione uma loja específica no topo para visualizar suas configurações.
      </div>
    );
  }

  if (!storeId) {
    return <div className="p-8">Nenhuma loja vinculada encontrada.</div>;
  }

  return (
    <div className="max-w-4xl space-y-6 pb-16">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          Personalizar Minha Loja
        </h2>
        <p className="text-slate-500 text-sm mt-1">
          Ajuste as informações da sua loja, regras de frete e configurações de SEO.
        </p>
      </div>

      <Tabs defaultValue="config" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Informações e Textos</TabsTrigger>
          <TabsTrigger value="seo">SEO e Buscas (Google)</TabsTrigger>
        </TabsList>
        <TabsContent value="config" className="pt-4">
          <LojaConfiguracoesTab lojaId={storeId} />
        </TabsContent>
        <TabsContent value="seo" className="pt-4">
          <LojaSeoTab lojaId={storeId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
