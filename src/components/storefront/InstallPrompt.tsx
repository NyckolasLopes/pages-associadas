import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Download, Share, Info } from "lucide-react";
import { toast } from "sonner";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [manualPromptOpen, setManualPromptOpen] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const activePharmacy = useActivePharmacy();

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

    // Se o evento disparou antes do React montar, pegamos da window global
    if ((window as any).deferredPWAInstallPrompt) {
      handler((window as any).deferredPWAInstallPrompt);
      (window as any).deferredPWAInstallPrompt = null;
    }

    if (isIOSDevice && !localStorage.getItem('pwa_dismissed')) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => {
        clearTimeout(timer);
        window.removeEventListener('beforeinstallprompt', handler);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  useEffect(() => {
    const customTriggerHandler = async () => {
      if (deferredPrompt) {
        try {
          deferredPrompt.prompt();
          const { outcome } = await deferredPrompt.userChoice;
          if (outcome === 'accepted') {
            setShowPrompt(false);
          }
          setDeferredPrompt(null);
        } catch (err) {
          console.error("Install prompt error", err);
          setManualPromptOpen(true);
          setShowPrompt(false);
          setDeferredPrompt(null);
        }
      } else {
        // Se for iOS ou Desktop sem prompt, mostra o Dialog com instruções
        setManualPromptOpen(true);
        setShowPrompt(false);
      }
    };

    window.addEventListener('trigger-pwa-install', customTriggerHandler);
    return () => window.removeEventListener('trigger-pwa-install', customTriggerHandler);
  }, [deferredPrompt]);

  const handleInstall = async () => {
    if (deferredPrompt) {
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
          setShowPrompt(false);
        }
        setDeferredPrompt(null);
      } catch (err) {
        console.error("Install prompt error", err);
        setManualPromptOpen(true);
        setShowPrompt(false);
        setDeferredPrompt(null);
      }
    } else {
      setManualPromptOpen(true);
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_dismissed', 'true');
  };

  const cat = activePharmacy?.categoriaAssociado?.toString().toLowerCase() || '';
  const isParceiroOrAssociado = cat === 'parceiro' || cat === 'associado' || activePharmacy?.nome?.toLowerCase().includes('parceiro');
  const appName = isParceiroOrAssociado && activePharmacy?.nome ? `App ${activePharmacy.nome}` : (activePharmacy?.nome ? `App ${activePharmacy.nome}` : "App Farmácias Associadas");
  // @ts-ignore
  const iconUrl = activePharmacy?.faviconUrl || activePharmacy?.logoUrl || (isParceiroOrAssociado ? "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z'%3E%3C/path%3E%3Cpolyline points='9 22 9 12 15 12 15 22'%3E%3C/polyline%3E%3C/svg%3E" : "/favicon.png");

  return (
    <>
      {showPrompt && (
        <div className="fixed bottom-24 left-4 right-4 z-[200] md:left-auto md:right-6 md:bottom-6 md:w-80 bg-primary text-primary-foreground p-4 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex flex-col gap-3 border border-primary-dark animate-in slide-in-from-bottom-5 duration-500 fade-in">
          <button onClick={handleDismiss} className="absolute top-2 right-2 p-1 text-primary-foreground/70 hover:text-white transition-colors rounded-full hover:bg-black/10">
            <X className="h-4 w-4" />
          </button>
          
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2 shrink-0 shadow-sm">
              <img src={iconUrl} alt="Icon" className="w-8 h-8 rounded object-contain" />
            </div>
            <div className="pr-4">
              <p className="font-bold text-[13px] leading-tight mb-1">{appName}</p>
              <p className="text-[11px] text-primary-foreground/90 leading-tight">Instale nosso app para acesso mais rápido e ofertas exclusivas!</p>
            </div>
          </div>
          
          <Button onClick={handleInstall} variant="secondary" className="w-full h-9 font-bold text-xs bg-white text-primary hover:bg-slate-50 mt-1 shadow-sm">
            <Download className="h-4 w-4 mr-2" />
            Instalar Aplicativo
          </Button>
        </div>
      )}

      <Dialog open={manualPromptOpen} onOpenChange={setManualPromptOpen}>
        <DialogContent className="max-w-sm rounded-2xl p-6 text-center">
          <DialogHeader>
            <DialogTitle className="text-center text-xl font-bold">Instalar Aplicativo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-6 py-4">
            <div className="h-20 w-20 bg-slate-100 rounded-2xl flex items-center justify-center shadow-inner border">
              <img src={iconUrl} alt="App Icon" className="h-12 w-12 object-contain rounded-lg" />
            </div>
            <h3 className="font-bold text-lg">{appName}</h3>
            
            <div className="bg-slate-50 rounded-xl p-4 border w-full space-y-4 max-h-[300px] overflow-y-auto">
              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-800">No iPhone ou iPad (Safari):</p>
                <ol className="text-sm text-slate-600 text-left space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</span>
                    <span>Toque no botão Compartilhar <Share className="inline h-4 w-4 mx-1" /> na barra inferior.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</span>
                    <span>Role para baixo e toque em <strong>"Adicionar à Tela de Início"</strong>.</span>
                  </li>
                </ol>
              </div>

              <div className="h-px bg-slate-200 w-full my-2"></div>

              <div className="space-y-4">
                <p className="text-sm font-medium text-slate-800">No Android ou Computador:</p>
                <ol className="text-sm text-slate-600 text-left space-y-3">
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</span>
                    <span>Abra o menu do seu navegador (geralmente três pontinhos ⋮ no canto superior direito).</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="bg-primary/10 text-primary w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</span>
                    <span>Selecione a opção <strong>"Instalar Aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.</span>
                  </li>
                </ol>
              </div>
            </div>
            
            <Button onClick={() => setManualPromptOpen(false)} className="w-full font-bold h-12 rounded-xl">
              Entendi
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
