import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, AlertCircle, RefreshCw, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface BarcodeScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (decodedText: string) => void;
  scanError?: string | null;
  onClearError?: () => void;
}

export function BarcodeScannerModal({ open, onOpenChange, onScan, scanError, onClearError }: BarcodeScannerModalProps) {
  const [isScriptLoaded, setIsScriptLoaded] = useState(false);
  const scannerRef = useRef<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [retryCount, setRetryCount] = useState(0);
  const [isRequestingCamera, setIsRequestingCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const latestOnScan = useRef(onScan);
  const latestOnOpenChange = useRef(onOpenChange);

  useEffect(() => {
    latestOnScan.current = onScan;
    latestOnOpenChange.current = onOpenChange;
  }, [onScan, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setManualCode("");
      setErrorMsg(null);
      setIsPermissionBlocked(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    if (!window.Html5Qrcode) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      script.onerror = () => setErrorMsg("Não foi possível carregar a biblioteca do leitor.");
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }
  }, [open]);

  const stopAndClearScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
      } catch (e) {
        // ignore
      } finally {
        scannerRef.current = null;
      }
    }
  };

  const handleScanSuccess = (decodedText: string) => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.getState && scannerRef.current.getState() === 2) {
          scannerRef.current.pause();
        }
      } catch(e) {}
    }
    latestOnScan.current(decodedText.trim());
  };

  const initScanner = async () => {
    if (!window.Html5Qrcode) return;

    try {
      await stopAndClearScanner();

      // Check secure context
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }

      const readerElem = document.getElementById("reader");
      if (!readerElem) return;

      const html5QrCode = new window.Html5Qrcode("reader");
      scannerRef.current = html5QrCode;

      // Start scanning directly with environment camera
      await html5QrCode.start(
        { facingMode: { ideal: "environment" } },
        {
          fps: 10,
          qrbox: { width: 250, height: 180 },
          aspectRatio: 1.333333,
        },
        (decodedText: string) => {
          handleScanSuccess(decodedText);
        },
        () => {}
      ).catch(async () => {
        // Fallback: try default camera if environment failed
        const cameras = await window.Html5Qrcode.getCameras().catch(() => []);
        if (cameras && cameras.length > 0) {
          await html5QrCode.start(
            cameras[0].id,
            {
              fps: 10,
              qrbox: { width: 250, height: 180 },
              aspectRatio: 1.333333,
            },
            (decodedText: string) => {
              handleScanSuccess(decodedText);
            },
            () => {}
          );
        } else {
          throw new Error("NO_CAMERAS");
        }
      });

      setErrorMsg(null);
      setIsPermissionBlocked(false);
    } catch (err: any) {
      console.error("Scanner init error:", err);
      const isDenied = err.name === "NotAllowedError" || 
                       err.name === "PermissionDeniedError" || 
                       String(err).includes("Permission denied") || 
                       String(err).includes("NotAllowedError");

      if (isDenied) {
        setIsPermissionBlocked(true);
        setErrorMsg("A permissão da câmera foi negada no navegador. Clique no ícone de configurações/cadeado na barra de endereço para permitir o acesso e tente novamente.");
      } else if (err.message === "SECURE_CONTEXT_REQUIRED") {
        setErrorMsg("O uso da câmera requer uma conexão segura (HTTPS).");
      } else if (err.message === "NO_CAMERAS" || err.name === "NotFoundError") {
        setErrorMsg("Nenhuma câmera encontrada neste dispositivo.");
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        setErrorMsg("A câmera já está em uso por outro aplicativo.");
      } else {
        setErrorMsg("Não foi possível iniciar a câmera. Tente digitar o código EAN abaixo ou enviar uma foto.");
      }
    }
  };

  useEffect(() => {
    if (!open || !isScriptLoaded) return;

    let isCancelled = false;
    const timeout = setTimeout(() => {
      if (!isCancelled) {
        initScanner();
      }
    }, 150);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      stopAndClearScanner();
    };
  }, [open, isScriptLoaded, retryCount]);

  const handleRequestPermissionClick = async () => {
    setIsRequestingCamera(true);
    setErrorMsg(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("SECURE_CONTEXT_REQUIRED");
      }

      // Explicit user gesture triggers the browser's permission prompt
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } }
      });
      
      // Stop stream tracks immediately so Html5Qrcode can bind
      stream.getTracks().forEach(track => track.stop());

      setIsPermissionBlocked(false);
      setRetryCount(c => c + 1);
    } catch (err: any) {
      console.error("Manual permission request error:", err);
      const isDenied = err.name === "NotAllowedError" || 
                       err.name === "PermissionDeniedError" || 
                       String(err).includes("Permission denied");
      if (isDenied) {
        setIsPermissionBlocked(true);
        setErrorMsg("O acesso à câmera está bloqueado nas configurações do navegador. Clique no ícone de cadeado/configurações (na barra de endereço do seu navegador), altere a Câmera para 'Permitir' e clique em Tentar Novamente.");
      } else {
        setErrorMsg(`Não foi possível acessar a câmera: ${err.message || 'Erro de permissão'}`);
      }
    } finally {
      setIsRequestingCamera(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (!window.Html5Qrcode) {
        toast.error("Leitor não carregado.");
        return;
      }
      const html5QrCode = scannerRef.current || new window.Html5Qrcode("reader");
      scannerRef.current = html5QrCode;
      
      toast.info("Lendo imagem...");
      const result = await html5QrCode.scanFile(file, true);
      if (result) {
        handleScanSuccess(result);
      }
    } catch (err) {
      toast.error("Não foi possível identificar um código de barras legível nesta imagem.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 bg-slate-50 border-b">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        
        <div className="p-4 bg-slate-900/5 flex flex-col items-center justify-center min-h-[300px] relative">
          {scanError ? (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-xl font-bold text-white mb-2">Ops!</p>
              <p className="text-sm text-white mb-6">{scanError}</p>
              <Button
                className="bg-primary text-white font-bold py-3 px-8 rounded-full"
                onClick={() => {
                  onClearError?.();
                  if (scannerRef.current) {
                    try {
                      if (scannerRef.current.getState && scannerRef.current.getState() === 3) {
                        scannerRef.current.resume();
                      }
                    } catch (e) {}
                  }
                }}
              >
                Escanear Novamente
              </Button>
            </div>
          ) : errorMsg ? (
            <div className="text-center p-4 flex flex-col items-center max-w-xs z-10">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-700 leading-relaxed mb-4">{errorMsg}</p>
              
              <div className="flex flex-col gap-2 w-full">
                <Button 
                  onClick={handleRequestPermissionClick}
                  disabled={isRequestingCamera}
                  className="w-full font-bold flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${isRequestingCamera ? "animate-spin" : ""}`} />
                  {isRequestingCamera ? "Solicitando..." : "Permitir Câmera e Tentar Novamente"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 text-xs"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Carregar Foto do Código
                </Button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept="image/*" 
                  capture="environment" 
                  onChange={handleFileUpload} 
                  className="hidden" 
                />
              </div>

              {isPermissionBlocked && (
                <div className="mt-3 p-2.5 bg-amber-50 border border-amber-200 rounded text-left text-[11px] text-amber-800">
                  <strong>Dica:</strong> Se você clicou em "Bloquear" anteriormente, o navegador não exibirá a caixa de diálogo novamente até que você altere nas configurações do site (ícone de cadeado).
                </div>
              )}
            </div>
          ) : !isScriptLoaded ? (
            <div className="text-muted-foreground text-sm font-bold animate-pulse">Carregando câmera...</div>
          ) : null}

          {/* Container da Câmera */}
          <div 
            id="reader" 
            className="w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black min-h-[220px]" 
            style={{ display: isScriptLoaded && !errorMsg ? "block" : "none" }}
          />
        </div>

        <div className="p-4 bg-slate-50 border-t">
          <p className="text-center text-xs text-muted-foreground mb-3">
            Aponte a câmera para o código de barras ou digite abaixo:
          </p>
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                if (scannerRef.current) {
                  try {
                    if (scannerRef.current.getState && scannerRef.current.getState() === 2) {
                      scannerRef.current.pause();
                    }
                  } catch(e) {}
                }
                latestOnScan.current(manualCode.trim());
              }
            }}
            className="flex gap-2"
          >
            <Input 
              type="text" 
              inputMode="numeric"
              placeholder="Digite o código EAN" 
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1"
            />
            <Button type="submit">Buscar</Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

declare global {
  interface Window {
    Html5Qrcode: any;
  }
}

