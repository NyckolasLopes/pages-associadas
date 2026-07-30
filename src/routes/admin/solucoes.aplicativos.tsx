import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Settings, Info, Search, Code, PieChart, Activity, MessageCircle, Link2, Key, ShieldCheck, Mail, ShoppingCart, Shield, CreditCard, UserCircle2, MessageSquareText, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useApps } from "@/stores/apps";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/admin/solucoes/aplicativos")({
  component: AdminAplicativos,
});

const APP_LIST = [
  {
    id: "gsc",
    name: "Google Search Console",
    description: "Verifique a propriedade do seu site no Google Search Console e tenha insights valiosos sobre como sua loja online aparece nos resultados de busca. Acompanhe o desempenho, identifique problemas de indexação e otimize sua presença nos resultados de pesquisa.",
    icon: <Search className="w-16 h-16 text-[#4285F4] mb-2" />
  },
  {
    id: "merchant",
    name: "Google Merchant Center",
    description: "Integração para canal de vendas. Ao configurar, gera a vitrine de produtos no Google Shopping.",
    icon: <ShoppingCart className="w-16 h-16 text-[#34A853] mb-2" />,
    isMerchant: true
  },
  {
    id: "ga",
    name: "Google Analytics",
    description: "Tenha informações precisas sobre sua loja online. O Google Analytics permite acompanhar o desempenho de suas campanhas de marketing, tráfego do site, taxas de conversão e muito mais. Tome decisões com base em dados reais e otimize suas estratégias de negócio.",
    icon: <PieChart className="w-16 h-16 text-[#F9AB00] mb-2" />
  },
  {
    id: "ga4",
    name: "Google Analytics 4 (GA4)",
    description: "Explore a próxima geração do Google Analytics. O Google Analytics 4 (GA4) é a versão mais recente da plataforma de análise do Google. Obtenha insights aprofundados sobre o desempenho do seu site ou aplicativo, descubra tendências e tome decisões estratégicas para impulsionar seu negócio.",
    icon: <PieChart className="w-16 h-16 text-[#F9AB00] mb-2" />
  },
  {
    id: "gtm",
    name: "Google Tag Manager",
    description: "Gerencie tags de marketing e rastreamento sem precisar editar o código.",
    icon: <Activity className="w-16 h-16 text-[#4285F4] mb-2" />
  },
  {
    id: "fb_pixel",
    name: "Pixel do Facebook",
    description: "Rastreie conversões de anúncios e crie públicos segmentados para campanhas.",
    icon: <Code className="w-16 h-16 text-[#1877F2] mb-2" />
  },
  {
    id: "google_avalia",
    name: "Google Avaliações",
    description: "Exiba a classificação da sua loja no Google para aumentar a credibilidade.",
    icon: <MessageSquareText className="w-16 h-16 text-[#EA4335] mb-2" />
  },
  {
    id: "frenet",
    name: "Frenet",
    description: "Integração avançada para cálculo e gestão de fretes personalizados.",
    icon: <TruckIcon />
  },
  {
    id: "whatsapp",
    name: "Botão flutuante WhatsApp",
    description: "Adicione um botão de WhatsApp na sua loja para atendimento rápido.",
    icon: <MessageCircle className="w-16 h-16 text-[#25D366] mb-2" />,
    isWhatsapp: true
  },
  {
    id: "fb_dpa",
    name: "Facebook Anúncios Dinâmicos",
    description: "Sincronize seu catálogo para anúncios de remarketing automáticos.",
    icon: <Link2 className="w-16 h-16 text-[#1877F2] mb-2" />
  },
  {
    id: "fb_domain",
    name: "Facebook Verificação de Domínio",
    description: "Confirme a propriedade do seu domínio no Gerenciador de Negócios.",
    icon: <ShieldCheck className="w-16 h-16 text-[#1877F2] mb-2" />
  },
  {
    id: "google_ads",
    name: "Google AdWords",
    description: "Promova seu negócio no Google! Com o Google AdWords, você pode criar anúncios atraentes que são exibidos quando potenciais clientes pesquisam palavras-chave relacionadas ao seu negócio. Alcance o público certo no momento certo e aumente suas vendas.",
    icon: <Search className="w-16 h-16 text-[#4285F4] mb-2" />
  },
  {
    id: "google_wallet",
    name: "Google Wallet",
    description: "Integração para pagamento rápido no checkout (GPay).",
    icon: <CreditCard className="w-16 h-16 text-[#4285F4] mb-2" />
  },
  {
    id: "google_login",
    name: "Login Social (Google)",
    description: "Permita que seus clientes entrem usando suas contas Google.",
    icon: <UserCircle2 className="w-16 h-16 text-[#DB4437] mb-2" />
  },
  {
    id: "recaptcha",
    name: "reCAPTCHA",
    description: "Proteja seus formulários contra spam e abusos automáticos.",
    icon: <Shield className="w-16 h-16 text-[#4285F4] mb-2" />
  },
  {
    id: "google_customer_reviews",
    name: "Avaliações do Consumidor Google",
    description: "Coleta feedback pós-compra certificado pelo Google.",
    icon: <MessageSquareText className="w-16 h-16 text-[#F9AB00] mb-2" />
  }
];

function TruckIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-800 mb-2"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.83L19 9h-5v8h2"/><path d="M14 9h5.51a2 2 0 0 1 1.42.59l1.41 1.41"/><circle cx="8.5" cy="17.5" r="1.5"/><circle cx="15.5" cy="17.5" r="1.5"/></svg>
  );
}

function AdminAplicativos() {
  const [activeApp, setActiveApp] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  
  // Real integration state
  const { installedApps, installApp, uninstallApp } = useApps();
  
  // Local form state for the modal
  const [waNumber, setWaNumber] = useState("");
  const [merchantId, setMerchantId] = useState("");
  const [token, setToken] = useState("");

  const handleConfig = (id: string) => {
    setActiveApp(id);
    const existing = installedApps[id];
    setWaNumber(existing?.waNumber || "");
    setMerchantId(existing?.merchantId || "");
    setToken(existing?.token || "");
    setModalOpen(true);
  };

  const handleSaveConfig = () => {
    if (activeApp) {
      installApp(activeApp, { waNumber, merchantId, token });
      toast.success("Integração salva com sucesso!");
    }
    setModalOpen(false);
  };

  const handleToggle = (id: string) => {
    uninstallApp(id);
    toast.success("Integração removida.");
  };

  const selectedApp = APP_LIST.find((p) => p.id === activeApp);

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-8 pb-16 pt-4">
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a]">Aplicativos e Integrações</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Configure as integrações com os principais serviços para gerenciar sua loja de ponta a ponta.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {APP_LIST.map((app) => {
          const isInstalled = !!installedApps[app.id]?.installed;

          return (
            <div key={app.id} className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative overflow-hidden transition-shadow hover:shadow-md h-full">
              {isInstalled && (
                <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Instalado
                </div>
              )}
              
              <div className="px-6 pt-6 flex-none">
                <div className="h-14 flex items-center justify-start">
                  {/* We render the icon left-aligned to match the clean look */}
                  <div className="flex items-center justify-center">
                    {app.icon}
                  </div>
                </div>
              </div>
              
              <div className="px-6 pb-6 pt-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-lg text-slate-800 leading-tight pr-4">{app.name}</h3>
                </div>
                
                <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-4" title={app.description}>
                  {app.description}
                </p>

                <div className="flex items-center gap-3 mt-auto pt-2">
                  <Button 
                    className="flex-1 font-bold shadow-sm"
                    onClick={() => handleConfig(app.id)}
                    variant={isInstalled ? "outline" : "default"}
                  >
                    {isInstalled ? "Configurar" : "Instalar"}
                  </Button>
                  
                  <Button variant="outline" size="icon" className="shrink-0 rounded shadow-sm w-10 h-10 border-slate-200">
                    <ExternalLink className="w-4 h-4 text-slate-500" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Configurar {selectedApp?.name}</DialogTitle>
            <DialogDescription>
              Ajuste os parâmetros para conectar o {selectedApp?.name} à sua loja.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6 py-4">
            {selectedApp?.isWhatsapp ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="font-bold">Número do WhatsApp</Label>
                  <Input 
                    placeholder="(00) 00000-0000" 
                    value={waNumber}
                    onChange={(e) => setWaNumber(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">O número que receberá as mensagens dos clientes.</p>
                </div>
              </div>
            ) : selectedApp?.isMerchant ? (
              <div className="space-y-4">
                <div className="bg-sky-50 border border-sky-100 p-4 rounded-lg flex gap-3 text-sm text-sky-800 mb-2">
                  <Info className="w-5 h-5 shrink-0 text-sky-600 mt-0.5" />
                  <div>
                    <strong>Integração de Canal de Venda:</strong> Preencher esta credencial gera automaticamente a vitrine de produtos e vincula seu catálogo no Google Shopping.
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold">ID do Merchant Center</Label>
                  <Input placeholder="Ex: 123456789" value={merchantId} onChange={(e) => setMerchantId(e.target.value)} />
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <Label className="font-bold">Código / Chave de Integração (API Key/Token)</Label>
                  <Input placeholder="Insira a chave/código aqui..." className="font-mono text-sm" value={token} onChange={(e) => setToken(e.target.value)} />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-between items-center pt-4 border-t mt-2">
            <div>
              {installedApps[activeApp || ""]?.installed ? (
                <Button variant="outline" className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700" onClick={() => { handleToggle(activeApp!); setModalOpen(false); }}>
                  Desinstalar App
                </Button>
              ) : null}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
              <Button onClick={handleSaveConfig} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
                {installedApps[activeApp || ""]?.installed ? "Salvar Alterações" : "Instalar App"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
