import { useEffect, useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Camera, AlertCircle, RefreshCw, Upload, Flashlight, SwitchCamera, Loader2, FlipHorizontal } from "lucide-react";
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

export function BarcodeScannerModal({
  open,
  onOpenChange,
  onScan,
  scanError,
  onClearError,
}: BarcodeScannerModalProps) {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isPermissionBlocked, setIsPermissionBlocked] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isLoadingCamera, setIsLoadingCamera] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isMirrored, setIsMirrored] = useState(false);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const html5QrCodeRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isStoppingRef = useRef(false);

  const latestOnScan = useRef(onScan);
  useEffect(() => {
    latestOnScan.current = onScan;
  }, [onScan]);

  const stopCamera = useCallback(async () => {
    if (isStoppingRef.current) return;
    isStoppingRef.current = true;

    // Stop animation frame loop
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Stop native stream tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }

    // Stop HTML5 QR Code if active
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        await html5QrCodeRef.current.clear();
      } catch (e) {
      } finally {
        html5QrCodeRef.current = null;
      }
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setTorchOn(false);
    setHasTorch(false);
    isStoppingRef.current = false;
  }, []);

  const handleScanSuccess = useCallback((decodedText: string) => {
    const clean = decodedText.trim();
    if (!clean) return;

    // Haptic feedback & beep
    try {
      if (navigator.vibrate) navigator.vibrate(60);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(900, ctx.currentTime);
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
          ctx.close();
        } catch (e) {}
      }, 100);
    } catch (e) {}

    stopCamera();
    latestOnScan.current(clean);
  }, [stopCamera]);

  const startCamera = useCallback(async (mode: "environment" | "user" = "environment") => {
    setIsLoadingCamera(true);
    setErrorMsg(null);
    setIsPermissionBlocked(false);

    await stopCamera();

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setErrorMsg("O seu navegador não suporta acesso direto à câmera. Tente digitar o código EAN abaixo ou enviar uma foto.");
      setIsLoadingCamera(false);
      return;
    }

    // List of progressive video constraints from best to most permissive
    const constraintCandidates: MediaStreamConstraints[] = [
      {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      },
      {
        video: {
          facingMode: mode,
        },
      },
      {
        video: {
          facingMode: mode === "environment" ? "user" : "environment",
        },
      },
      {
        video: true,
      },
    ];

    let activeStream: MediaStream | null = null;
    let lastError: any = null;

    for (const constraints of constraintCandidates) {
      try {
        activeStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (activeStream) break;
      } catch (err: any) {
        lastError = err;
        // If user explicitly denied, don't keep hammering
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          break;
        }
      }
    }

    if (!activeStream) {
      console.error("Camera access failed:", lastError);
      setIsLoadingCamera(false);
      const isDenied =
        lastError?.name === "NotAllowedError" ||
        lastError?.name === "PermissionDeniedError" ||
        String(lastError).includes("Permission denied");

      if (isDenied) {
        setIsPermissionBlocked(true);
        setErrorMsg(
          "A permissão da câmera foi bloqueada no navegador. Clique no ícone de cadeado/configurações na barra de endereços para permitir a câmera."
        );
      } else if (lastError?.name === "NotFoundError" || lastError?.name === "DevicesNotFoundError") {
        setErrorMsg("Nenhuma câmera foi encontrada neste dispositivo.");
      } else if (lastError?.name === "NotReadableError" || lastError?.name === "TrackStartError") {
        setErrorMsg("A câmera já está em uso por outro aplicativo.");
      } else {
        setErrorMsg("Não foi possível iniciar a câmera. Tente digitar o código EAN abaixo ou carregar uma foto.");
      }
      return;
    }

    streamRef.current = activeStream;

    // Check torch and facing mode capability
    const track = activeStream.getVideoTracks()[0];
    if (track) {
      try {
        const capabilities: any = track.getCapabilities ? track.getCapabilities() : {};
        setHasTorch(!!capabilities.torch);
        const settings: any = track.getSettings ? track.getSettings() : {};
        const detectedFacing = settings.facingMode || mode;
        if (detectedFacing === "user") {
          setIsMirrored(true);
        } else if (detectedFacing === "environment") {
          setIsMirrored(false);
        }
      } catch (e) {}
    }

    // Attach stream to video element
    if (videoRef.current) {
      videoRef.current.srcObject = activeStream;
      try {
        await videoRef.current.play();
      } catch (e) {
        console.warn("Video play error:", e);
      }
    }

    setIsLoadingCamera(false);

    // Engine 1: Native BarcodeDetector (Supported natively in Chromium/Chrome/Edge/Android)
    if ("BarcodeDetector" in window) {
      try {
        const detector = new (window as any).BarcodeDetector({
          formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code", "itf"],
        });

        let isRunning = true;
        const scanFrame = async () => {
          if (!isRunning || !videoRef.current) return;

          if (videoRef.current.readyState >= 2) {
            try {
              const barcodes = await detector.detect(videoRef.current);
              if (barcodes && barcodes.length > 0) {
                const code = barcodes[0].rawValue?.trim();
                if (code) {
                  isRunning = false;
                  handleScanSuccess(code);
                  return;
                }
              }
            } catch (e) {}
          }

          if (isRunning) {
            animationFrameRef.current = requestAnimationFrame(scanFrame);
          }
        };

        animationFrameRef.current = requestAnimationFrame(scanFrame);
        return;
      } catch (e) {
        console.warn("Native BarcodeDetector initialization fallback:", e);
      }
    }

    // Engine 2: Fallback with Html5Qrcode script loader if BarcodeDetector is not present (Safari/Firefox)
    try {
      if (!window.Html5Qrcode) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Falha ao carregar motor de leitura"));
          document.body.appendChild(script);
        });
      }

      if (window.Html5Qrcode && document.getElementById("fallback-reader")) {
        const html5Qr = new window.Html5Qrcode("fallback-reader");
        html5QrCodeRef.current = html5Qr;
        await html5Qr.start(
          { facingMode: { ideal: mode } },
          {
            fps: 15,
            qrbox: (w: number, h: number) => ({
              width: Math.floor(Math.min(w * 0.85, 280)),
              height: Math.floor(Math.min(h * 0.65, 180)),
            }),
          },
          (decodedText: string) => {
            handleScanSuccess(decodedText);
          },
          () => {}
        );
      }
    } catch (e) {
      console.warn("Html5Qrcode engine fallback error:", e);
    }
  }, [stopCamera, handleScanSuccess]);

  // Start on modal open
  useEffect(() => {
    if (open) {
      setManualCode("");
      setErrorMsg(null);
      setIsPermissionBlocked(false);
      // Small timeout to allow dialog animation to complete and video container to be laid out
      const timer = setTimeout(() => {
        startCamera(facingMode);
      }, 150);
      return () => {
        clearTimeout(timer);
        stopCamera();
      };
    } else {
      stopCamera();
    }
  }, [open, startCamera, stopCamera, facingMode]);

  const toggleTorch = async () => {
    if (!streamRef.current) return;
    const track = streamRef.current.getVideoTracks()[0];
    if (track && track.applyConstraints) {
      try {
        const nextState = !torchOn;
        await track.applyConstraints({
          advanced: [{ torch: nextState } as any],
        });
        setTorchOn(nextState);
      } catch (e) {
        console.warn("Erro ao alternar lanterna:", e);
      }
    }
  };

  const switchCamera = () => {
    const nextMode = facingMode === "environment" ? "user" : "environment";
    setFacingMode(nextMode);
    setIsMirrored(nextMode === "user");
    startCamera(nextMode);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast.info("Processando imagem...");

      // 1. Try Native BarcodeDetector on image bitmap
      if ("BarcodeDetector" in window && "createImageBitmap" in window) {
        try {
          const detector = new (window as any).BarcodeDetector({
            formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code", "itf"],
          });
          const bitmap = await createImageBitmap(file);
          const barcodes = await detector.detect(bitmap);
          if (barcodes && barcodes.length > 0) {
            const raw = barcodes[0].rawValue?.trim();
            if (raw) {
              handleScanSuccess(raw);
              return;
            }
          }
        } catch (e) {}
      }

      // 2. Fallback to Html5Qrcode scanFile
      if (!window.Html5Qrcode) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js";
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Falha ao carregar leitor"));
          document.body.appendChild(script);
        });
      }

      if (window.Html5Qrcode) {
        const tempReader = new window.Html5Qrcode("fallback-reader");
        const result = await tempReader.scanFile(file, true);
        if (result) {
          handleScanSuccess(result);
          return;
        }
      }

      toast.error("Não foi possível identificar um código de barras legível nesta foto.");
    } catch (err) {
      toast.error("Não foi possível identificar um código de barras nesta foto.");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md w-[95vw] rounded-2xl p-0 overflow-hidden border-slate-200 shadow-2xl bg-white">
        <DialogHeader className="p-4 pb-3 bg-slate-50 border-b border-slate-100 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2 text-primary font-bold text-base">
            <Camera className="h-5 w-5" />
            Escanear Código de Barras
          </DialogTitle>
        </DialogHeader>

        {/* Viewfinder Area */}
        <div className="relative w-full bg-slate-950 flex items-center justify-center min-h-[320px] max-h-[380px] overflow-hidden">
          {/* Native Video Stream */}
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`w-full h-full object-cover min-h-[320px] transition-transform duration-300 ${
              isMirrored ? "-scale-x-100" : ""
            }`}
            style={{ display: errorMsg ? "none" : "block" }}
          />

          {/* Hidden Fallback Html5Qrcode element */}
          <div id="fallback-reader" className="hidden" />

          {/* Scanner Guide Overlay when camera is active */}
          {!errorMsg && !isLoadingCamera && (
            <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
              {/* Darkened mask with transparent cutout */}
              <div className="relative w-[260px] h-[170px] border-2 border-emerald-400/80 rounded-xl shadow-[0_0_0_9999px_rgba(0,0,0,0.55)]">
                {/* Laser Scanning Line */}
                <div className="absolute inset-x-2 top-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#34d399] animate-[scannerLaser_2s_ease-in-out_infinite]" />

                {/* Corner Markers */}
                <div className="absolute -top-1 -left-1 w-5 h-5 border-t-4 border-l-4 border-emerald-500 rounded-tl-sm" />
                <div className="absolute -top-1 -right-1 w-5 h-5 border-t-4 border-r-4 border-emerald-500 rounded-tr-sm" />
                <div className="absolute -bottom-1 -left-1 w-5 h-5 border-b-4 border-l-4 border-emerald-500 rounded-bl-sm" />
                <div className="absolute -bottom-1 -right-1 w-5 h-5 border-b-4 border-r-4 border-emerald-500 rounded-br-sm" />
              </div>
              <p className="text-white/90 text-xs font-semibold mt-4 drop-shadow bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
                Posicione o código de barras no centro
              </p>
            </div>
          )}

          {/* Controls Overlay (Torch, Flip Mirror & Switch Camera) */}
          {!errorMsg && !isLoadingCamera && (
            <div className="absolute top-3 right-3 flex items-center gap-2 z-10">
              {hasTorch && (
                <button
                  type="button"
                  onClick={toggleTorch}
                  className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
                    torchOn ? "bg-amber-400 text-slate-900" : "bg-black/50 text-white hover:bg-black/70"
                  }`}
                  title={torchOn ? "Desligar Lanterna" : "Ligar Lanterna"}
                >
                  <Flashlight className="h-4 w-4" />
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsMirrored(prev => !prev)}
                className={`p-2.5 rounded-full backdrop-blur-md transition-all shadow-lg ${
                  isMirrored ? "bg-emerald-500 text-white" : "bg-black/50 text-white hover:bg-black/70"
                }`}
                title={isMirrored ? "Desativar Espelhamento" : "Espelhar Câmera"}
              >
                <FlipHorizontal className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={switchCamera}
                className="p-2.5 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-md transition-all shadow-lg"
                title="Alternar Câmera"
              >
                <SwitchCamera className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Loading Indicator */}
          {isLoadingCamera && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-slate-950 text-white gap-3 p-6">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm font-medium text-slate-300">Iniciando câmera...</span>
            </div>
          )}

          {/* Product Scan Error Overlay */}
          {scanError && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/92 p-6 text-center animate-in fade-in duration-200">
              <AlertCircle className="h-14 w-14 text-red-500 mb-3" />
              <p className="text-lg font-bold text-white mb-1">Produto não encontrado</p>
              <p className="text-sm text-slate-300 mb-5 max-w-xs">{scanError}</p>
              <Button
                className="bg-primary hover:bg-primary/90 text-white font-bold py-2.5 px-6 rounded-xl"
                onClick={() => {
                  onClearError?.();
                  startCamera(facingMode);
                }}
              >
                Escanear Outro Produto
              </Button>
            </div>
          )}

          {/* Camera Permission / Device Error Screen */}
          {errorMsg && !scanError && (
            <div className="text-center p-6 flex flex-col items-center max-w-xs z-10 bg-slate-900/95 rounded-2xl m-4 border border-slate-800 text-white shadow-xl">
              <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-200 leading-relaxed mb-4">{errorMsg}</p>

              <div className="flex flex-col gap-2.5 w-full">
                <Button
                  onClick={() => startCamera(facingMode)}
                  disabled={isLoadingCamera}
                  className="w-full font-bold flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-white rounded-xl"
                >
                  <RefreshCw className={`h-4 w-4 ${isLoadingCamera ? "animate-spin" : ""}`} />
                  {isLoadingCamera ? "Iniciando..." : "Permitir Câmera e Tentar Novamente"}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 text-xs border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-200 rounded-xl"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Carregar Foto do Código
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>

              {isPermissionBlocked && (
                <div className="mt-3.5 p-2.5 bg-amber-950/60 border border-amber-800/60 rounded-xl text-left text-[11px] text-amber-200 leading-relaxed">
                  <strong>Dica:</strong> Clique no ícone de configurações ou cadeado ao lado do endereço do site (URL), ative a permissão de <strong>Câmera</strong> e recarregue a página.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Manual Input Footer & Photo Upload */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-600 font-medium">
              Ou digite o código de barras (EAN):
            </p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-xs font-semibold text-primary hover:underline flex items-center gap-1"
            >
              <Upload className="h-3 w-3" />
              Enviar Foto
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
            />
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (manualCode.trim()) {
                handleScanSuccess(manualCode.trim());
              }
            }}
            className="flex gap-2"
          >
            <Input
              type="text"
              inputMode="numeric"
              placeholder="Ex: 7891234567890"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="flex-1 rounded-xl border-slate-200 bg-white shadow-sm font-mono text-sm"
            />
            <Button type="submit" className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-white px-5">
              Buscar
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}

declare global {
  interface Window {
    Html5Qrcode: any;
    BarcodeDetector: any;
  }
}

