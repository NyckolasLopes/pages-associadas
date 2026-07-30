import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useConfig } from "@/stores/config";
import { useState } from "react";
import { Code, Save } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/design/scripts")({
  component: AdminDesignScripts,
});

function AdminDesignScripts() {
  const config = useConfig();
  const [scripts, setScripts] = useState({
    head: config.scripts?.head || "",
    body: config.scripts?.body || "",
  });

  const handleSave = () => {
    config.setScripts(scripts);
    toast.success("Scripts salvos com sucesso!");
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Meta Tags e Scripts</h2>
        <p className="text-muted-foreground">Adicione códigos personalizados, como Google Analytics, Pixel do Facebook, scripts de chat e outras ferramentas de rastreamento.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm max-w-4xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Code className="w-4 h-4 text-primary" />
            Editor de Scripts
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" /> Salvar Configurações
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-800">Cabeçalho (Header)</label>
              <p className="text-xs text-muted-foreground mb-2">Scripts que devem ser carregados antes do site, como Meta Tags, Google Tag Manager, etc. (Inseridos dentro da tag &lt;head&gt;)</p>
            </div>
            <Textarea
              className="font-mono text-xs min-h-[200px]"
              placeholder="<!-- Cole seus scripts do Header aqui -->"
              value={scripts.head}
              onChange={(e) => setScripts({ ...scripts, head: e.target.value })}
            />
          </div>

          <div className="space-y-3">
            <div>
              <label className="font-bold text-slate-800">Corpo (Body)</label>
              <p className="text-xs text-muted-foreground mb-2">Scripts que devem ser carregados no final da página, como widgets de chat ou códigos que não devem bloquear o carregamento visual.</p>
            </div>
            <Textarea
              className="font-mono text-xs min-h-[200px]"
              placeholder="<!-- Cole seus scripts do Body aqui -->"
              value={scripts.body}
              onChange={(e) => setScripts({ ...scripts, body: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
