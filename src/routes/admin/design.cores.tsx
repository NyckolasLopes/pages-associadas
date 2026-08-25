import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useAdmin } from "@/stores/admin";
import { useState, useEffect } from "react";
import { Paintbrush, RotateCcw } from "lucide-react";
import { StoreSelector } from "@/components/admin/StoreSelector";

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
  
  // Encontra a farmácia selecionada no momento
  const activePharmacy = admin.pharmacies.find(p => p.id === admin.activeStoreId);
  
  const [colors, setColors] = useState<Record<string, string>>(activePharmacy?.themeColors || {});

  // Atualiza o estado local quando a farmácia selecionada mudar
  useEffect(() => {
    setColors(activePharmacy?.themeColors || {});
  }, [activePharmacy]);

  const handleColorChange = (id: string, value: string) => {
    setColors(prev => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!admin.activeStoreId) {
      toast.error("Selecione uma loja primeiro.");
      return;
    }
    
    // Atualiza a loja no banco
    try {
      await admin.updatePharmacy(admin.activeStoreId, {
        themeColors: { ...activePharmacy?.themeColors, ...colors }
      } as any);
      toast.success("Cores atualizadas com sucesso!");
    } catch (e) {
      toast.error("Erro ao salvar cores.");
    }
  };

  const handleReset = async () => {
    setColors({});
    if (admin.activeStoreId) {
      try {
        await admin.updatePharmacy(admin.activeStoreId, {
          themeColors: {}
        } as any);
        toast.success("Cores restauradas para o padrão.");
      } catch (e) {
        toast.error("Erro ao resetar cores.");
      }
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Cores Personalizadas</h2>
        <p className="text-muted-foreground">Personalize as cores de diversos elementos para deixar a loja com a sua cara.</p>
      </div>

      <div className="bg-white rounded-xl border shadow-sm max-w-4xl overflow-hidden">
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center p-6 border-b">
        <div>
          <h2 className="text-[22px] font-bold text-[#1a1a1a] flex items-center gap-2">
            <Paintbrush className="w-6 h-6 text-emerald-600" />
            Cores da Loja
          </h2>
          <p className="text-slate-500 text-sm mt-1">
            Personalize a paleta de cores da sua vitrine.
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <StoreSelector className="mb-0" />
          <Button onClick={handleReset} variant="outline" className="text-slate-600 hover:text-slate-900">
            <RotateCcw className="w-4 h-4 mr-2" />
            Restaurar Padrão
          </Button>
          <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 w-full sm:w-auto">
            Salvar Alterações
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
