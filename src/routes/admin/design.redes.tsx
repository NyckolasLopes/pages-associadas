import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Share2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useAdmin } from "@/stores/admin";
import { useState } from "react";

export const Route = createFileRoute("/admin/design/redes")({
  component: AdminDesignRedes,
});

function AdminDesignRedes() {
  const { socialNetworks, setSocialNetworks, currentUser, activeStoreId, pharmacies, updatePharmacy } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;
  const activePharmacy = pharmacies.find(p => p.id === activeStoreId);
  
  const initialNetworks = !isGlobalAdmin && activePharmacy?.customSocialNetworks 
    ? activePharmacy.customSocialNetworks 
    : socialNetworks;

  const [networks, setNetworks] = useState([...initialNetworks]);

  const handleSave = () => {
    if (isGlobalAdmin) {
      setSocialNetworks(networks);
      toast.success("Configurações de redes sociais salvas globalmente!");
    } else if (activePharmacy) {
      updatePharmacy({ ...activePharmacy, customSocialNetworks: networks });
      toast.success("Redes sociais da sua loja foram salvas!");
    }
  };

  const handleAdd = () => {
    setNetworks([
      ...networks,
      { id: Date.now().toString(), label: "Nova Rede", href: "https://", iconUrl: "" }
    ]);
  };

  const handleRemove = (id: string) => {
    setNetworks(networks.filter(n => n.id !== id));
  };

  const updateNetwork = (id: string, field: "label" | "href" | "iconName" | "iconUrl", value: string) => {
    setNetworks(networks.map(n => n.id === id ? { ...n, [field]: value } : n));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      updateNetwork(id, "iconUrl", result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 pb-20">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Redes Sociais</h2>
        <p className="text-muted-foreground">Gerencie as redes sociais exibidas no rodapé da loja.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm max-w-4xl">
        <div className="flex items-center justify-between mb-6 pb-4 border-b">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
              <Share2 className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Redes Sociais</h3>
              <p className="text-sm text-muted-foreground">Adicione quantas redes quiser e configure seus ícones e links.</p>
            </div>
          </div>
          <Button onClick={handleAdd} variant="outline" size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Adicionar Rede
          </Button>
        </div>

        <div className="space-y-4">
          {networks.map((net) => (
            <div key={net.id} className="flex flex-col sm:flex-row gap-4 p-4 border rounded-lg bg-slate-50 relative items-start sm:items-end">
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">Nome da Rede</label>
                <Input 
                  value={net.label} 
                  onChange={(e) => updateNetwork(net.id, "label", e.target.value)}
                  placeholder="Ex: Instagram" 
                  className="bg-white"
                />
              </div>
              <div className="flex-[2] space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700">Link de Direcionamento</label>
                <Input 
                  value={net.href} 
                  onChange={(e) => updateNetwork(net.id, "href", e.target.value)}
                  placeholder="https://..." 
                  className="bg-white"
                />
              </div>
              <div className="flex-1 space-y-2 w-full">
                <label className="text-xs font-bold text-slate-700 text-nowrap">Ícone (Imagem)</label>
                <div className="flex items-center gap-3">
                  {net.iconUrl || net.iconName ? (
                    <div className="h-10 w-10 border rounded-md overflow-hidden bg-white flex items-center justify-center shrink-0">
                      {net.iconUrl ? (
                        <img src={net.iconUrl} alt="Icon" className="h-full w-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-muted-foreground">{net.iconName}</span>
                      )}
                    </div>
                  ) : null}
                  <Input 
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, net.id)}
                    className="bg-white flex-1"
                  />
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                onClick={() => handleRemove(net.id)}
              >
                <Trash2 className="h-5 w-5" />
              </Button>
            </div>
          ))}

          {networks.length === 0 && (
            <div className="text-center p-8 text-muted-foreground border-2 border-dashed rounded-lg">
              Nenhuma rede social configurada. Clique em "Adicionar Rede" acima.
            </div>
          )}

          <div className="pt-4 border-t flex justify-end">
            <Button onClick={handleSave}>
              Salvar Configurações
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
