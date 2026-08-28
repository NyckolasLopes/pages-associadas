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
    title: "Cores Principais (Marca)",
    description: "As cores de destaque que definem a identidade da sua marca.",
    items: [
      { id: "--primary", label: "Cor Primária", description: "Usada em botões e destaques.", default: "#00b5ad" },
      { id: "--secondary", label: "Cor Secundária", description: "Usada em botões secundários e ofertas.", default: "#f37021" },
    ]
  },
  {
    title: "Cores Base (Layout)",
    description: "Cores de fundo e textos gerais.",
    items: [
      { id: "--background", label: "Fundo Geral", description: "Cor de fundo principal do site.", default: "#ffffff" },
      { id: "--foreground", label: "Texto Base", description: "Cor principal para os textos.", default: "#1e293b" },
      { id: "--muted", label: "Fundo Secundário (Muted)", description: "Fundo de áreas de destaque leve.", default: "#f1f5f9" },
      { id: "--border", label: "Bordas", description: "Cor das linhas divisórias.", default: "#e2e8f0" },
    ]
  },
  {
    title: "Cabeçalho e Barras",
    description: "Configuração específica do topo do site.",
    items: [
      { id: "--topbar-bg", label: "Fundo da Faixa Superior", description: "Barra de anúncios no topo.", default: "#f37021" },
      { id: "--topbar-text", label: "Texto da Faixa Superior", description: "Texto da barra de anúncios.", default: "#ffffff" },
      { id: "--info-bar-bg", label: "Fundo da Faixa de Infos", description: "Barra de telefones e links.", default: "#00b5ad" },
      { id: "--info-bar-text", label: "Texto da Faixa de Infos", description: "Texto da barra de telefones.", default: "#ffffff" },
      { id: "--header-bg", label: "Fundo do Cabeçalho", description: "Área da logo e busca.", default: "#ffffff" },
      { id: "--header-icons", label: "Ícones do Cabeçalho", description: "Cor da cesta e usuário.", default: "#00b5ad" },
    ]
  },
  {
    title: "Navegação e Rodapé",
    description: "Configuração de menus e da área inferior.",
    items: [
      { id: "--menu-bg", label: "Fundo do Menu", description: "Fundo da barra de navegação.", default: "#ffffff" },
      { id: "--menu-text", label: "Texto do Menu", description: "Textos da barra de navegação.", default: "#1e293b" },
      { id: "--footer-bg", label: "Fundo do Rodapé", description: "Fundo principal do rodapé.", default: "#00b5ad" },
      { id: "--footer-text", label: "Texto do Rodapé", description: "Cor dos textos no rodapé.", default: "#ffffff" },
    ]
  },
  {
    title: "Feedback",
    description: "Status do sistema.",
    items: [
      { id: "--success", label: "Sucesso", description: "Botões de confirmação.", default: "#22c55e" },
      { id: "--destructive", label: "Erro", description: "Mensagens de erro.", default: "#ef4444" },
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

      <div className="bg-white rounded-xl border shadow-sm w-full max-w-6xl overflow-hidden">
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

        <div className="flex flex-col lg:flex-row">
          {/* Configuração (Esquerda) */}
          <div className="flex-1 p-6 space-y-10 lg:border-r max-h-[800px] overflow-y-auto">
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

          {/* Demonstração (Direita) */}
          <div className="w-full lg:w-[420px] xl:w-[480px] bg-slate-50 p-6 flex flex-col items-center border-t lg:border-t-0">
            <div className="mb-6 w-full text-sm font-bold text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="20" x="5" y="2" rx="2" ry="2"/><path d="M12 18h.01"/></svg>
                Demonstração na loja
              </span>
            </div>

            {/* Mockup do Celular */}
            <div 
              className="w-[320px] h-[620px] bg-white rounded-[2rem] border-8 border-slate-800 shadow-xl overflow-hidden flex flex-col relative"
              style={{
                backgroundColor: colors['--background'] || '#ffffff',
                color: colors['--foreground'] || '#1e293b'
              }}
            >
              {/* Topbar Mockup */}
              <div 
                className="text-center text-[8px] py-1 font-bold tracking-tight"
                style={{ 
                  backgroundColor: colors['--topbar-bg'] || colors['--secondary'] || '#f37021', 
                  color: colors['--topbar-text'] || '#ffffff'
                }}
              >
                Cupom de primeira compra: 10OFF
              </div>

              {/* Info Bar Mockup */}
              <div 
                className="flex items-center justify-between px-4 py-1 text-[8px]"
                style={{ 
                  backgroundColor: colors['--info-bar-bg'] || colors['--primary'] || '#00b5ad', 
                  color: colors['--info-bar-text'] || '#ffffff'
                }}
              >
                <span>Aqui você tem amigos.</span>
                <span className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                  Atendimento
                </span>
              </div>

              {/* Header Mockup */}
              <div 
                className="pt-3 pb-3 px-4 flex flex-col gap-3 border-b"
                style={{ 
                  backgroundColor: colors['--header-bg'] || colors['--background'] || '#ffffff', 
                  color: colors['--foreground'] || '#1e293b',
                  borderColor: colors['--border'] || '#e2e8f0'
                }}
              >
                <div className="flex justify-between items-center">
                  <div className="font-bold text-sm tracking-tight flex items-center gap-1">
                    <div className="w-5 h-5 rounded-full" style={{ backgroundColor: colors['--primary'] || '#00b5ad' }}></div>
                    Minha Loja
                  </div>
                  <div className="flex gap-3" style={{ color: colors['--header-icons'] || colors['--primary'] || '#00b5ad' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>
                  </div>
                </div>
              </div>

              {/* Menu Superior Mockup */}
              <div 
                className="flex items-center gap-4 px-4 py-2 border-b text-[10px] font-bold shadow-sm"
                style={{ 
                  backgroundColor: colors['--menu-bg'] || colors['--background'] || '#ffffff', 
                  color: colors['--menu-text'] || colors['--foreground'] || '#1e293b',
                  borderColor: colors['--border'] || '#e2e8f0'
                }}
              >
                <span>Medicamentos</span>
                <span>Beleza</span>
                <span>Dermocosméticos</span>
              </div>

              {/* Banner Area */}
              <div 
                className="h-24 flex flex-col items-center justify-center p-4 text-center mt-2 mx-2 rounded-lg"
                style={{ backgroundColor: colors['--muted'] || '#f1f5f9' }}
              >
                <div className="text-[10px] font-bold px-2 py-1 bg-black text-white rounded mb-1">OFERTAS ESPECIAIS</div>
                <div className="font-bold text-lg leading-tight">CUIDADO DIÁRIO</div>
                <div className="text-[10px] text-slate-500 mt-1">Até 50% de desconto</div>
              </div>

              {/* Produtos Area */}
              <div className="flex-1 p-4">
                <div className="flex justify-between items-center mb-3">
                  <div className="font-bold text-sm">Mais Pedidos</div>
                  <div className="text-[10px] font-bold" style={{ color: colors['--primary'] || '#00b5ad' }}>VER TODOS</div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  {/* Produto 1 */}
                  <div className="border rounded-lg p-2 bg-white shadow-sm flex flex-col" style={{ borderColor: colors['--border'] || '#e2e8f0' }}>
                    <div className="bg-slate-100 aspect-square rounded mb-2 flex items-center justify-center text-slate-300 text-[10px]">Produto</div>
                    <div className="w-16 h-2 bg-slate-200 rounded-full mb-1 mt-auto"></div>
                    <div className="text-[10px] text-slate-400 line-through">R$ 29,90</div>
                    <div className="font-bold text-sm" style={{ color: colors['--primary'] || '#00b5ad' }}>R$ 19,90</div>
                    <div 
                      className="mt-2 w-full py-1.5 rounded text-[10px] font-bold text-center text-white"
                      style={{ backgroundColor: colors['--primary'] || '#00b5ad' }}
                    >
                      COMPRAR
                    </div>
                  </div>
                  
                  {/* Produto 2 */}
                  <div className="border rounded-lg p-2 bg-white shadow-sm flex flex-col" style={{ borderColor: colors['--border'] || '#e2e8f0' }}>
                    <div className="bg-slate-100 aspect-square rounded mb-2 flex items-center justify-center text-slate-300 text-[10px]">Produto</div>
                    <div className="w-16 h-2 bg-slate-200 rounded-full mb-1 mt-auto"></div>
                    <div className="text-[10px] text-slate-400 line-through">R$ 29,90</div>
                    <div className="font-bold text-sm" style={{ color: colors['--primary'] || '#00b5ad' }}>R$ 19,90</div>
                    <div 
                      className="mt-2 w-full py-1.5 rounded text-[10px] font-bold text-center text-white"
                      style={{ backgroundColor: colors['--primary'] || '#00b5ad' }}
                    >
                      COMPRAR
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Area */}
              <div 
                className="mt-auto p-4 flex flex-col items-center justify-center text-center gap-3"
                style={{ 
                  backgroundColor: colors['--footer-bg'] || colors['--primary'] || '#00b5ad',
                  color: colors['--footer-text'] || '#ffffff'
                }}
              >
                <div className="font-bold text-sm">Farmácias Associadas</div>
                <div className="text-[8px] opacity-80 leading-tight px-4">
                  Farmácias Associadas, muito mais que farmácia, aqui você tem amigos.
                </div>
                <div className="flex w-full justify-around mt-2">
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, currentColor 20%, transparent)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                    </div>
                    <div className="text-[7px]">Atendimento Humanizado</div>
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: 'color-mix(in srgb, currentColor 20%, transparent)' }}>
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg>
                    </div>
                    <div className="text-[7px]">Entrega Rápida</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
