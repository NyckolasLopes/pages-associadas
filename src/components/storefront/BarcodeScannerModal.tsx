import { useEffect, useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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
  const [manualCode, setManualCode] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const latestOnScan = useRef(onScan);
  const latestOnOpenChange = useRef(onOpenChange);

  useEffect(() => {
    latestOnScan.current = onScan;
    latestOnOpenChange.current = onOpenChange;
  }, [onScan, onOpenChange]);

  useEffect(() => {
    if (!open) {
      setManualCode("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setErrorMsg(null);
      return;
    }

    if (!window.Html5Qrcode) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => setIsScriptLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsScriptLoaded(true);
    }
  }, [open]);

  useEffect(() => {
    if (!open || !isScriptLoaded) return;

    let isUnmounted = false;
    let lastScanTime = 0;

    const startScanner = async () => {
      try {
        // Verifica se o navegador suporta mediaDevices (exige HTTPS ou localhost)
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error("SECURE_CONTEXT_REQUIRED");
        }

        const cameras = await window.Html5Qrcode.getCameras();
        if (isUnmounted) return;

        if (cameras && cameras.length > 0) {
          const html5QrCode = new window.Html5Qrcode("reader");
          scannerRef.current = html5QrCode;
          
          // Tenta usar a câmera especificada (geralmente a última é a traseira em celulares)
          // Mas se falhar, o html5QrCode fará fallback usando apenas { facingMode: "environment" }
          
          await html5QrCode.start(
            { facingMode: "environment" },
            {
              fps: 10,
              qrbox: 250,
            },
            (decodedText: string) => {
              if (isUnmounted) return;
              if (scannerRef.current) {
                try {
                  if (scannerRef.current.getState() === 2) { // 2 = SCANNING
                     scannerRef.current.pause();
                  }
                } catch(e) {}
              }
              latestOnScan.current(decodedText);
            },
            (errorMessage: string) => {
              // Ignore scan failures
            }
          ).catch(async (err: any) => {
            // Fallback se "environment" falhar (ex: desktop sem câmera traseira)
            if (isUnmounted) return;
            await html5QrCode.start(
              cameras[0].id,
              {
                fps: 10,
                qrbox: 250,
              },
              (decodedText: string) => {
                if (isUnmounted) return;
                if (scannerRef.current && scannerRef.current.getState() === 2) {
                   scannerRef.current.pause();
                }
                latestOnScan.current(decodedText);
              },
              () => {}
            );
          });
        } else {
          throw new Error("NO_CAMERAS");
        }
      } catch (err: any) {
        console.error("Scanner init error:", err);
        if (!isUnmounted) {
          if (err.message === "SECURE_CONTEXT_REQUIRED") {
             setErrorMsg("O uso da câmera requer uma conexão segura (HTTPS). Se estiver testando no celular via IP local, digite o código manualmente.");
          } else if (err.message === "NO_CAMERAS") {
             setErrorMsg("Nenhuma câmera encontrada neste dispositivo.");
          } else {
             const detailedMsg = err?.message || typeof err === 'string' ? err : 'Erro desconhecido';
             setErrorMsg(`Não foi possível iniciar a câmera. Por favor, permita o acesso e verifique se ela não está em uso por outro aplicativo. (${detailedMsg})`);
          }
        }
      }
    };

    if (document.getElementById("reader")) {
      startScanner();
    }

    return () => {
      isUnmounted = true;
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            scannerRef.current.stop().then(() => {
              scannerRef.current.clear();
              scannerRef.current = null;
            }).catch(() => {});
          } else {
            scannerRef.current.clear();
            scannerRef.current = null;
          }
        } catch (e) {
          // ignore
        }
      }
    };
  }, [open, isScriptLoaded, retryCount]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-xl p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-2 bg-slate-50 border-b">
          <DialogTitle className="flex items-center gap-2 text-primary">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 bg-black/5 flex flex-col items-center justify-center min-h-[300px] relative">
          {scanError ? (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 p-6 text-center">
              <AlertCircle className="h-16 w-16 text-destructive mb-4" />
              <p className="text-xl font-bold text-white mb-2">Ops!</p>
              <p className="text-sm text-white mb-6">{scanError}</p>
              <button
                className="bg-primary text-white font-bold py-3 px-8 rounded-full"
                onClick={() => {
                  onClearError?.();
                  if (scannerRef.current) {
                    try {
                      if (scannerRef.current.getState() === 3) { // 3 = PAUSED
                        scannerRef.current.resume();
                      }
                    } catch (e) {}
                  }
                }}
              >
                Escanear Novamente
              </button>
            </div>
          ) : errorMsg ? (
            <div className="text-center p-4 flex flex-col items-center">
              <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
              <p className="text-sm font-bold text-destructive mb-4">{errorMsg}</p>
              <Button 
                onClick={() => {
                  setErrorMsg(null);
                  // We emit a custom event that our useEffect will catch, or we can just 
                  // toggle a state to force a retry. Since we don't have startScanner in scope here,
                  // we can use a retry counter state.
                  setRetryCount(c => c + 1);
                }}
              >
                Permitir Câmera e Tentar Novamente
              </Button>
            </div>
          ) : !isScriptLoaded ? (
            <div className="text-muted-foreground text-sm font-bold animate-pulse">Carregando câmera...</div>
          ) : null}
          <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-lg bg-black" style={{ display: isScriptLoaded && !errorMsg ? "block" : "none" }}></div>
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
                    if (scannerRef.current.getState() === 2) {
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
