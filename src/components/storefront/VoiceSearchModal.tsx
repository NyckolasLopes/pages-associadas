import { useEffect, useRef, useState } from "react";
import { Mic, MicOff, X, Search } from "lucide-react";

interface VoiceSearchModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (transcript: string) => void;
}

type VoiceState = "requesting" | "listening" | "result" | "error" | "blocked";

const MIC_SETTINGS_URL = (() => {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes("edg/")) return "edge://settings/content/microphone";
  if (ua.includes("firefox")) return "about:preferences#privacy";
  return "chrome://settings/content/microphone";
})();

export function VoiceSearchModal({ open, onClose, onResult }: VoiceSearchModalProps) {
  const [state, setState] = useState<VoiceState>("requesting");
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<any>(null);
  const animFrameRef = useRef<number | null>(null);

  const stopRecognition = () => {
    try { recognitionRef.current?.abort(); } catch {}
    recognitionRef.current = null;
  };

  const handleClose = () => {
    stopRecognition();
    if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    setState("requesting");
    setTranscript("");
    setInterimText("");
    onClose();
  };

  useEffect(() => {
    if (!open) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setState("error");
      return;
    }

    setState("requesting");
    setTranscript("");
    setInterimText("");

    let cancelled = false;

    const startRecognition = () => {
      if (cancelled) return;

      const r = new SpeechRecognition();
      r.lang = "pt-BR";
      r.interimResults = true;
      r.maxAlternatives = 1;
      r.continuous = false;
      recognitionRef.current = r;

      r.onstart = () => {
        if (!cancelled) setState("listening");
      };

      r.onresult = (event: any) => {
        if (cancelled) return;
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const t = event.results[i][0].transcript;
          if (event.results[i].isFinal) final += t;
          else interim += t;
        }
        setInterimText(interim);
        if (final) {
          setTranscript(final);
          setInterimText("");
          setState("result");
          // Fecha o modal e dispara a busca após pequeno delay visual
          setTimeout(() => {
            if (!cancelled) {
              onResult(final);
              handleClose();
            }
          }, 600);
        }
      };

      r.onerror = (event: any) => {
        if (cancelled) return;
        const code = event?.error || "";
        if (code === "not-allowed" || code === "service-not-allowed") {
          setState("blocked");
        } else if (code === "no-speech") {
          // Sem fala detectada — volta para listening se ainda aberto
          setState("listening");
          try { r.start(); } catch {}
        } else if (code !== "aborted") {
          setState("error");
        }
      };

      r.onend = () => {
        if (cancelled || state === "result") return;
      };

      try {
        r.start();
      } catch {
        setState("error");
      }
    };

    // Solicita permissão explicitamente para disparar o popup nativo
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        stream.getTracks().forEach((t) => t.stop());
        if (!cancelled) startRecognition();
      })
      .catch((err: any) => {
        if (cancelled) return;
        const name = err?.name || "";
        if (name === "NotAllowedError" || name === "PermissionDeniedError" || name === "SecurityError") {
          setState("blocked");
        } else {
          setState("error");
        }
      });

    return () => {
      cancelled = true;
      stopRecognition();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden"
        style={{
          animation: "voiceModalIn 0.3s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 transition text-zinc-500 z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center px-6 py-10 gap-6">
          {/* Estado: solicitando permissão */}
          {state === "requesting" && (
            <>
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Mic className="w-9 h-9 text-primary animate-pulse" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Aguardando permissão...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Permita o uso do microfone quando o browser solicitar
                </p>
              </div>
            </>
          )}

          {/* Estado: ouvindo */}
          {state === "listening" && (
            <>
              <div className="relative w-24 h-24 flex items-center justify-center">
                {/* Ondas animadas */}
                <span className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                <span className="absolute inset-2 rounded-full bg-primary/15 animate-ping" style={{ animationDelay: "0.15s" }} />
                <div className="relative w-20 h-20 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/40">
                  <Mic className="w-9 h-9 text-white" />
                </div>
              </div>
              <div className="text-center min-h-[48px]">
                <p className="font-bold text-lg text-primary">Ouvindo...</p>
                {interimText ? (
                  <p className="text-sm text-muted-foreground mt-1 italic">{interimText}</p>
                ) : (
                  <p className="text-sm text-muted-foreground mt-1">Fale o nome do produto</p>
                )}
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="text-xs text-muted-foreground underline underline-offset-2"
              >
                Cancelar
              </button>
            </>
          )}

          {/* Estado: resultado capturado */}
          {state === "result" && (
            <>
              <div className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Search className="w-9 h-9 text-emerald-600" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg text-emerald-600">Buscando...</p>
                <p className="text-base font-semibold mt-1">{transcript}</p>
              </div>
            </>
          )}

          {/* Estado: microfone bloqueado */}
          {state === "blocked" && (
            <>
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
                <MicOff className="w-9 h-9 text-amber-500" />
              </div>
              <div className="text-center space-y-2">
                <p className="font-bold text-lg">Microfone bloqueado</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Seu navegador bloqueou o acesso ao microfone. Clique no ícone{" "}
                  <strong>🔒</strong> na barra de endereços, ative o{" "}
                  <strong>Microfone</strong> para este site e recarregue a página.
                </p>
              </div>
              <div className="flex flex-col gap-2 w-full">
                <a
                  href={MIC_SETTINGS_URL}
                  className="text-xs text-center text-primary underline underline-offset-2"
                  onClick={(e) => {
                    // Links chrome:// e edge:// não funcionam via <a> — copia para clipboard
                    e.preventDefault();
                    navigator.clipboard?.writeText(MIC_SETTINGS_URL).catch(() => {});
                    toast?.info?.("Cole o endereço copiado na barra de endereços do seu navegador para acessar as configurações de microfone.");
                  }}
                >
                  Abrir configurações de microfone →
                </a>
                <button
                  type="button"
                  onClick={handleClose}
                  className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition"
                >
                  Entendido
                </button>
              </div>
            </>
          )}

          {/* Estado: erro genérico */}
          {state === "error" && (
            <>
              <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <MicOff className="w-9 h-9 text-red-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-lg">Voz não disponível</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Seu navegador não suporta pesquisa por voz. Use Chrome ou Edge.
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:opacity-90 transition"
              >
                Fechar
              </button>
            </>
          )}
        </div>

        <style>{`
          @keyframes voiceModalIn {
            from { transform: translateY(40px) scale(0.95); opacity: 0; }
            to { transform: translateY(0) scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    </div>
  );
}
