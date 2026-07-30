import { createFileRoute } from "@tanstack/react-router";
import { useAdmin } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/integracoes")({
  component: AdminIntegrations,
});

function AdminIntegrations() {
  const { integrations, setIntegrations } = useAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Integrações</h2>
        <p className="text-muted-foreground">Configure Webhooks e APIs para notificação de eventos locais.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm max-w-2xl space-y-4">
        <h3 className="font-bold text-lg border-b pb-2">Webhook de Pedidos</h3>
        <p className="text-sm text-muted-foreground">
          Simule o envio de um Webhook quando um pedido for finalizado no checkout. 
        </p>
        
        <div className="space-y-2">
          <label className="text-sm font-bold">URL do Webhook</label>
          <Input 
            placeholder="https://sua-api.com/webhook" 
            value={integrations.webhookUrl} 
            onChange={(e) => setIntegrations({ ...integrations, webhookUrl: e.target.value })}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-bold">Chave de Autenticação (Opcional)</label>
          <Input 
            placeholder="Bearer token..." 
            value={integrations.apiKey} 
            onChange={(e) => setIntegrations({ ...integrations, apiKey: e.target.value })}
          />
        </div>

        <div className="pt-4 border-t">
          <Button variant="outline" className="font-bold" onClick={() => {
            if(!integrations.webhookUrl) {
              toast.error("Preencha a URL primeiro!");
              return;
            }
            toast.success(`Webhook de teste simulado para: ${integrations.webhookUrl}`);
          }}>
            Testar Conexão
          </Button>
        </div>
      </div>
    </div>
  );
}
