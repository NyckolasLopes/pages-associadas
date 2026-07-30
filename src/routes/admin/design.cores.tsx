import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";
import { Paintbrush, RotateCcw } from "lucide-react";

export const Route = createFileRoute("/admin/design/cores")({
  component: AdminDesignCores,
});

const COLOR_GROUPS = [
  {
    title: "Cores Principais",
    description: "As cores de destaque que definem a identidade da sua marca.",
    items: [
      { id: "--primary", label: "Cor Primária", description: "Usada em botões principais e cabeçalho.", default: "#00b5ad" },
      { id: "--secondary", label: "Cor Secundária", description: "Usada em botões secundários e detalhes.", default: "#f37021" },
    ]
  },
  {
    title: "Cores Base",
    description: "Cores de fundo e textos.",
    items: [
      { id: "--background", label: "Fundo Geral (Background)", description: "Cor de fundo principal do site.", default: "#ffffff" },
      { id: "--foreground", label: "Texto Base", description: "Cor principal para os textos.", default: "#1e293b" },
      { id: "--muted", label: "Fundo Secundário (Muted)", description: "Fundo de áreas de destaque leve, como menus secundários.", default: "#f1f5f9" },
      { id: "--border", label: "Bordas", description: "Cor das linhas divisórias e bordas.", default: "#e2e8f0" },
    ]
  },
  {
    title: "Feedback e Status",
    description: "Cores para alertas e mensagens ao usuário.",
    items: [
      { id: "--success", label: "Sucesso", description: "Usada em mensagens e botões de sucesso.", default: "#22c55e" },
      { id: "--destructive", label: "Alerta / Erro", description: "Usada em mensagens de erro ou ações destrutivas.", default: "#ef4444" },
    ]
  }
];

function AdminDesignCores() {
  const admin = useAdmin();
  const [colors, setColors] = useState<Record<string, string>>(admin.themeColors || {});

  const handleColorChange = (id: string, value: string) => {
    setColors(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = () => {
    admin.setThemeColors(colors);
    toast.success("Cores atualizadas com sucesso!");
  };

  const handleReset = () => {
    setColors({});
    admin.setThemeColors({});
    toast.success("Cores restauradas para o padrão.");
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cores Personalizadas</h2>
        <p className="text-muted-foreground">Personalize as cores de diversos elementos para deixar a loja com a sua cara.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm max-w-4xl overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2 font-bold text-sm">
            <Paintbrush className="w-4 h-4 text-primary" />
            Paleta de Cores
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleReset}>
              <RotateCcw className="w-3.5 h-3.5 mr-2" /> Restaurar Padrões
            </Button>
            <Button size="sm" onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </div>

        <div className="p-6 space-y-10">
          {COLOR_GROUPS.map((group, i) => (
            <div key={i} className="space-y-4">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{group.title}</h3>
                <p className="text-sm text-muted-foreground">{group.description}</p>
              </div>
              
              <div className="grid gap-6 sm:grid-cols-2">
                {group.items.map(item => {
                  const currentValue = colors[item.id] || item.default;
                  
                  return (
                    <div key={item.id} className="space-y-2 p-4 border rounded-lg bg-slate-50/50">
                      <label className="text-sm font-bold text-slate-700">{item.label}</label>
                      <div className="flex items-center gap-3">
                        <div className="relative w-12 h-12 rounded-lg border shadow-sm overflow-hidden shrink-0">
                          <input 
                            type="color" 
                            value={currentValue}
                            onChange={(e) => handleColorChange(item.id, e.target.value)}
                            className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer" 
                          />
                        </div>
                        <Input 
                          value={currentValue}
                          onChange={(e) => handleColorChange(item.id, e.target.value)}
                          className="font-mono text-sm uppercase bg-white" 
                        />
                      </div>
                      <p className="text-xs text-muted-foreground pt-1">{item.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
