import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share } from "lucide-react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) return;
    if ((navigator as any).standalone) return;

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIos(isIOSDevice);

    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!localStorage.getItem('pwa_dismissed')) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    // If it's iOS and we haven't dismissed it, show the iOS prompt
    // For iOS, there is no beforeinstallprompt, so we just show it if not installed
    if (isIOSDevice && !localStorage.getItem('pwa_dismissed')) {
      // Delay prompt slightly so it's not aggressive
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[200] md:left-auto md:right-6 md:bottom-6 md:w-80 bg-primary text-primary-foreground p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col gap-3 border border-primary-dark animate-in slide-in-from-bottom-5 duration-500 fade-in">
      <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-primary-foreground/70 hover:text-white transition-colors rounded-full hover:bg-black/10">
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-center gap-3">
        <div className="bg-white rounded-lg p-2 shrink-0 shadow-sm">
          <img src="/favicon.png" alt="Icon" className="w-8 h-8 rounded object-contain" />
        </div>
        <div className="pr-4">
          <p className="font-bold text-[13px] leading-tight mb-1">App Farmácias Associadas</p>
          <p className="text-[11px] text-primary-foreground/90 leading-tight">Instale nosso app para acesso mais rápido e ofertas exclusivas!</p>
        </div>
      </div>
      
      {isIos ? (
        <div className="bg-black/10 rounded-lg px-3 py-2 text-[11px] flex items-center justify-center gap-2 mt-1">
          <span>Toque em</span>
          <Share className="h-4 w-4 shrink-0" />
          <span>e depois <strong>Adicionar à Tela de Início</strong></span>
        </div>
      ) : (
        <Button onClick={handleInstall} variant="secondary" className="w-full h-9 font-bold text-xs bg-white text-primary hover:bg-slate-50 mt-1 shadow-sm">
          <Download className="h-4 w-4 mr-2" />
          Instalar Aplicativo
        </Button>
      )}
    </div>
  );
}
