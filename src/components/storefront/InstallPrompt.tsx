import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { 
  X, 
  Download, 
  Share, 
  Smartphone, 
  Apple, 
  Monitor, 
  CheckCircle2, 
  Star, 
  Sparkles, 
  Zap, 
  ShieldCheck, 
  Tag, 
  QrCode,
  ArrowUpRight
} from "lucide-react";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { useAppInstallStore } from "@/stores/appInstall";
import { getSafeMediaUrl } from "@/utils/media";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const { isOpen, open, close, deferredPrompt, setDeferredPrompt, triggerInstall } = useAppInstallStore();
  const [showFloatingBanner, setShowFloatingBanner] = useState(false);
  const [activeTab, setActiveTab] = useState<"android" | "ios" | "desktop">("android");
  const [isIosDevice, setIsIosDevice] = useState(false);
  const [isAndroidDevice, setIsAndroidDevice] = useState(false);
  const activePharmacy = useActivePharmacy();

  useEffect(() => {
    // Detect environment
    if (typeof window === "undefined") return;

    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIos = /iphone|ipad|ipod/.test(userAgent);
    const isAndroid = /android/.test(userAgent);
    setIsIosDevice(isIos);
    setIsAndroidDevice(isAndroid);

    if (isIos) {
      setActiveTab("ios");
    } else if (isAndroid) {
      setActiveTab("android");
    } else {
      setActiveTab("desktop");
    }

    // Check if already installed as standalone PWA
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (navigator as any).standalone;
    if (isStandalone) return;

    // Capture beforeinstallprompt event
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      (window as any).deferredPWAInstallPrompt = e;
      if (!localStorage.getItem('pwa_banner_dismissed')) {
        setShowFloatingBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If caught before React mount
    if ((window as any).deferredPWAInstallPrompt) {
      setDeferredPrompt((window as any).deferredPWAInstallPrompt);
      if (!localStorage.getItem('pwa_banner_dismissed')) {
        setShowFloatingBanner(true);
      }
    }

    // Custom global event listener
    const handleTriggerPwa = () => {
      open();
    };

    window.addEventListener('trigger-pwa-install', handleTriggerPwa);

    // Show floating banner on iOS after 3s if not dismissed
    if (isIos && !localStorage.getItem('pwa_banner_dismissed')) {
      const timer = setTimeout(() => setShowFloatingBanner(true), 3500);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
        window.removeEventListener('trigger-pwa-install', handleTriggerPwa);
      };
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('trigger-pwa-install', handleTriggerPwa);
    };
  }, [open, setDeferredPrompt]);

  const handleDismissBanner = () => {
    setShowFloatingBanner(false);
    localStorage.setItem('pwa_banner_dismissed', 'true');
  };

  const handleNativeInstall = async () => {
    const success = await triggerInstall();
    if (success) {
      setShowFloatingBanner(false);
    }
  };

  const cat = activePharmacy?.categoriaAssociado?.toString().toLowerCase() || '';
  const isParceiroOrAssociado = cat === 'parceiro' || cat === 'associado' || activePharmacy?.nome?.toLowerCase().includes('parceiro');
  const appTitle = isParceiroOrAssociado && activePharmacy?.nome ? activePharmacy.nome : (activePharmacy?.nome ? activePharmacy.nome : "Farmácias Associadas");
  const iconUrl = getSafeMediaUrl(activePharmacy?.faviconUrl || activePharmacy?.logoUrl) || "/favicon.png";

  const pathname = typeof window !== "undefined" ? window.location.pathname : "";
  const isRootHomePage = pathname === "" || pathname === "/";
  // O balão de instalar app não deve aparecer na página inicial sem loja (/) e deve ser individual por loja
  const isStoreContext = !!activePharmacy?.id && !isRootHomePage;

  // Cores dinâmicas configuradas na aba 'Minhas Cores' da loja
  const theme = activePharmacy?.themeColors || {};

  const bannerBg = theme["--pwa-banner-bg"] || 
                   theme["pwaBannerBg"] || 
                   theme["--header-bg"] || 
                   theme["headerBg"] || 
                   theme["--primary"] || 
                   theme["primary"] || 
                   activePharmacy?.headerBgColor || 
                   activePharmacy?.topBarBgColor || 
                   "var(--header-bg, var(--primary, #00b5ad))";

  const bannerTextColor = theme["--pwa-banner-text"] || 
                          theme["pwaBannerText"] || 
                          theme["--header-text"] || 
                          theme["headerText"] || 
                          "#ffffff";

  const btnBg = theme["--pwa-banner-btn-bg"] || 
                theme["pwaBannerBtnBg"] || 
                theme["--cart-btn-bg"] || 
                theme["cartBtnBg"] || 
                "#ffffff";

  const btnTextColor = theme["--pwa-banner-btn-text"] || 
                       theme["pwaBannerBtnText"] || 
                       theme["--primary"] || 
                       theme["primary"] || 
                       bannerBg;

  return (
    <>
      {/* Floating Mini Banner (Apenas para lojas individuais) */}
      {showFloatingBanner && !isOpen && isStoreContext && (
        <div 
          style={{ backgroundColor: bannerBg, color: bannerTextColor }}
          className="fixed bottom-20 left-4 right-4 z-[99] md:left-auto md:right-6 md:bottom-6 md:w-96 p-4 rounded-2xl shadow-2xl flex flex-col gap-3 border border-white/20 animate-in slide-in-from-bottom-5 duration-300"
        >
          <button 
            onClick={handleDismissBanner} 
            className="absolute top-2.5 right-2.5 p-1 text-white/80 hover:text-white transition-colors rounded-full hover:bg-black/20"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3 pr-6">
            <div className="bg-white rounded-xl p-2 shrink-0 shadow-md flex items-center justify-center h-12 w-12 overflow-hidden">
              <img src={iconUrl} alt="Logo App" className="w-9 h-9 object-contain" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm leading-tight truncate">{appTitle}</p>
              <p className="text-[11px] opacity-90 leading-tight mt-0.5">Instale o app para ofertas exclusivas e entrega rápida!</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-1">
            <Button 
              onClick={() => {
                setShowFloatingBanner(false);
                if (deferredPrompt) {
                  handleNativeInstall();
                } else {
                  open();
                }
              }} 
              style={{ backgroundColor: btnBg, color: btnTextColor }}
              className="flex-1 h-9 font-bold text-xs shadow-sm hover:opacity-95 transition-all"
            >
              <Download className="h-4 w-4 mr-1.5" />
              {deferredPrompt ? "Instalar com 1 Clique" : "Baixar Aplicativo"}
            </Button>
            <Button
              onClick={() => {
                setShowFloatingBanner(false);
                open();
              }}
              variant="outline"
              className="h-9 px-3 text-xs font-semibold bg-transparent text-white border-white/40 hover:bg-white/10"
            >
              Como Instalar
            </Button>
          </div>
        </div>
      )}

      {/* Complete Interactive Install Modal */}
      <Dialog open={isOpen} onOpenChange={(openState) => { if (!openState) close(); }}>
        <DialogContent className="max-w-md md:max-w-lg rounded-3xl p-0 overflow-hidden border bg-background shadow-2xl z-[200]">
          {/* Header Banner */}
          <div 
            style={{ backgroundColor: bannerBg, color: bannerTextColor }}
            className="p-6 relative"
          >
            <div className="flex items-start gap-4">
              <div className="bg-white rounded-2xl p-2.5 shrink-0 shadow-lg flex items-center justify-center h-16 w-16 overflow-hidden border-2 border-white/20">
                <img src={iconUrl} alt="App Icon" className="w-12 h-12 object-contain" />
              </div>
              <div className="flex-1 min-w-0 pr-6">
                <DialogTitle className="text-xl font-bold leading-tight" style={{ color: bannerTextColor }}>{appTitle}</DialogTitle>
                <p className="text-xs opacity-90 mt-1" style={{ color: bannerTextColor }}>Tenha a farmácia na palma da sua mão com benefícios exclusivos</p>
              </div>
            </div>

            {/* Direct 1-Click Install Button if supported */}
            {deferredPrompt && (
              <div className="mt-5">
                <Button 
                  onClick={handleNativeInstall} 
                  style={{ backgroundColor: btnBg, color: btnTextColor }}
                  className="w-full h-11 rounded-xl font-bold shadow-md text-sm transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Instalar Aplicativo com 1 Clique
                </Button>
              </div>
            )}
          </div>

          <div className="p-6 space-y-6">
            {/* Value Props Grid */}
            <div className="grid grid-cols-2 gap-2.5">
              <div className="bg-muted/50 p-2.5 rounded-xl border flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${theme['--primary'] || bannerBg}18`, color: theme['--primary'] || bannerBg }}>
                  <Zap className="h-4 w-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">100% Gratuito</p>
                  <p className="text-[10px] text-muted-foreground truncate">Não ocupa memória</p>
                </div>
              </div>
              <div className="bg-muted/50 p-2.5 rounded-xl border flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${theme['--primary'] || bannerBg}18`, color: theme['--primary'] || bannerBg }}>
                  <Tag className="h-4 w-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Ofertas Exclusivas</p>
                  <p className="text-[10px] text-muted-foreground truncate">Cupons e descontos</p>
                </div>
              </div>
              <div className="bg-muted/50 p-2.5 rounded-xl border flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${theme['--primary'] || bannerBg}18`, color: theme['--primary'] || bannerBg }}>
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Compra Segura</p>
                  <p className="text-[10px] text-muted-foreground truncate">Rastreio em tempo real</p>
                </div>
              </div>
              <div className="bg-muted/50 p-2.5 rounded-xl border flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${theme['--primary'] || bannerBg}18`, color: theme['--primary'] || bannerBg }}>
                  <CheckCircle2 className="h-4 w-4" />
                </div>
                <div className="text-left min-w-0">
                  <p className="text-xs font-bold text-foreground truncate">Acesso Rápido</p>
                  <p className="text-[10px] text-muted-foreground truncate">1 toque na tela</p>
                </div>
              </div>
            </div>

            {/* Platform Instructions Selector */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Como instalar no seu dispositivo:</p>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab("android")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "android" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" />
                  Android
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("ios")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "ios" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Apple className="h-3.5 w-3.5" />
                  iPhone (iOS)
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("desktop")}
                  className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "desktop" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" />
                  Computador
                </button>
              </div>

              {/* Tab Content: Android */}
              {activeTab === "android" && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>1</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Toque nos <strong>três pontinhos ⋮</strong> no canto superior direito do seu navegador Chrome.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>2</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Toque na opção <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>3</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Confirme em <strong>"Instalar"</strong>. O ícone aparecerá instantaneamente nos seus aplicativos!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content: iOS Safari */}
              {activeTab === "ios" && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>1</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      No navegador Safari, toque no botão <strong>Compartilhar</strong> <Share className="inline h-3.5 w-3.5 mx-1 align-baseline" style={{ color: bannerBg }} /> na barra inferior.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>2</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Role a lista para baixo e selecione <strong>"Adicionar à Tela de Início"</strong>.
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>3</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Toque em <strong>"Adicionar"</strong> no canto superior direito. Pronto!
                    </p>
                  </div>
                </div>
              )}

              {/* Tab Content: Desktop */}
              {activeTab === "desktop" && (
                <div className="bg-slate-50 dark:bg-slate-900/50 rounded-2xl p-4 border space-y-3 animate-in fade-in duration-200">
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>1</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      No Google Chrome ou Edge, clique no ícone de <strong>instalar (computador com seta ⬇️)</strong> na barra de endereços (ao lado da estrela de favoritos).
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5" style={{ backgroundColor: bannerBg }}>2</span>
                    <p className="text-xs text-foreground leading-relaxed">
                      Clique em <strong>"Instalar"</strong> para abrir a loja em uma janela dedicada e rápida!
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Close / Action Button */}
            <div className="pt-1">
              <Button 
                onClick={close} 
                style={{ backgroundColor: bannerBg, color: bannerTextColor }}
                className="w-full h-11 font-bold rounded-xl text-sm shadow-md hover:opacity-90 transition-opacity"
              >
                Entendi, fechar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
