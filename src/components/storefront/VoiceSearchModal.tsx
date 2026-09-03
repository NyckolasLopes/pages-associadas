import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, X, Search, AlertCircle, Volume2 } from "lucide-react";
import { toast } from "sonner";

interface VoiceSearchModalProps {
  open: boolean;
  onClose: () => void;
  onResult: (transcript: string) => void;
}

export function VoiceSearchModal({ open, onClose, onResult }: VoiceSearchModalProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [needsPermission, setNeedsPermission] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isClosingRef = useRef(false);

  const stopRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const handleClose = useCallback(() => {
    isClosingRef.current = true;
    stopRecognition();
    setIsListening(false);
    setTranscript("");
    setInterimText("");
    setNeedsPermission(false);
    onClose();
  }, [stopRecognition, onClose]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setUnsupported(true);
      return;
    }

    stopRecognition();
    isClosingRef.current = false;
    setTranscript("");
    setInterimText("");
    setNeedsPermission(false);
    setUnsupported(false);

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "pt-BR";
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;
      recognition.continuous = false;
      recognitionRef.current = recognition;

      recognition.onstart = () => {
        if (!isClosingRef.current) {
          setIsListening(true);
          setNeedsPermission(false);
        }
      };

      recognition.onresult = (event: any) => {
        if (isClosingRef.current) return;
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const text = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            final += text;
          } else {
            interim += text;
          }
        }

        if (interim) setInterimText(interim);

        if (final) {
          const cleanText = final.trim();
          setTranscript(cleanText);
          setInterimText("");
          setIsListening(false);

          // Aguarda breve confirmação visual e aciona busca
          setTimeout(() => {
            if (!isClosingRef.current) {
              onResult(cleanText);
              handleClose();
            }
          }, 450);
        }
      };

      recognition.onerror = (event: any) => {
        if (isClosingRef.current) return;
        const err = event.error;

        if (err === "not-allowed" || err === "service-not-allowed") {
          setIsListening(false);
          setNeedsPermission(true);
        } else if (err === "no-speech") {
          setIsListening(false);
        } else if (err === "network") {
          setIsListening(false);
          toast.error("Sem conexão com o serviço de reconhecimento de voz.");
        } else if (err !== "aborted") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (!isClosingRef.current) {
          setIsListening(false);
        }
      };

      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Erro ao iniciar SpeechRecognition:", e);
      setIsListening(false);
    }
  }, [stopRecognition, onResult, handleClose]);

  // Função disparada no clique direto do usuário para solicitar permissão nativa
  const handleRequestPermissionClick = async () => {
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setNeedsPermission(false);
        startListening();
      } else {
        startListening();
      }
    } catch (err: any) {
      console.warn("Permissão negada:", err);
      setNeedsPermission(true);
      toast.error("Para usar a pesquisa por voz, permita o acesso ao microfone no navegador.");
    }
  };

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      startListening();
    } else {
      stopRecognition();
    }
    return () => {
      stopRecognition();
    };
  }, [open, startListening, stopRecognition]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full text-zinc-400 hover:text-zinc-700 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95 z-10"
          aria-label="Fechar"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center px-6 py-8 text-center">
          {/* Header */}
          <div className="mb-6">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Pesquisa por Voz
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              Fale o produto que você deseja encontrar
            </p>
          </div>

          {/* Microfone Central com Animação */}
          <div className="relative my-4 flex items-center justify-center">
            {isListening && (
              <>
                <span
                  className="absolute w-28 h-28 rounded-full animate-ping opacity-35"
                  style={{ backgroundColor: "#008000" }}
                />
                <span
                  className="absolute w-36 h-36 rounded-full animate-pulse opacity-20"
                  style={{ backgroundColor: "#008000" }}
                />
              </>
            )}

            <button
              type="button"
              onClick={isListening ? stopRecognition : (needsPermission ? handleRequestPermissionClick : startListening)}
              className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: isListening ? "#008000" : (needsPermission ? "#e11d48" : "#008000"),
                boxShadow: isListening ? "0 0 25px rgba(0,128,0,0.45)" : undefined,
              }}
              title={isListening ? "Ouvindo... Clique para pausar" : "Clique para falar"}
            >
              <Mic className={`w-8 h-8 ${isListening ? "animate-pulse" : ""}`} />
            </button>
          </div>

          {/* Equalizador de Ondas Sonoras quando Ouvindo */}
          {isListening && (
            <div className="flex items-center gap-1 my-3 h-6">
              {[0.4, 0.8, 1.2, 0.6, 1.0, 0.5, 0.9].map((delay, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full animate-pulse"
                  style={{
                    backgroundColor: "#008000",
                    height: `${12 + (idx % 3) * 6}px`,
                    animationDuration: `${0.6 + delay * 0.4}s`,
                    animationDelay: `${delay * 0.15}s`,
                  }}
                />
              ))}
            </div>
          )}

          {/* Textos de Feedback */}
          <div className="min-h-[56px] flex flex-col items-center justify-center mt-2 px-2 max-w-full">
            {transcript ? (
              <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base animate-in fade-in">
                <Search className="w-4 h-4 shrink-0" />
                <span className="truncate">"{transcript}"</span>
              </div>
            ) : interimText ? (
              <p className="text-zinc-800 dark:text-zinc-200 text-sm font-medium italic animate-in fade-in">
                "{interimText}"
              </p>
            ) : isListening ? (
              <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold animate-pulse">
                Ouvindo... Pode falar agora
              </p>
            ) : needsPermission ? (
              <div className="text-center">
                <p className="text-rose-600 dark:text-rose-400 text-xs font-semibold">
                  Acesso ao microfone necessário
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  Toque no botão abaixo para permitir
                </p>
              </div>
            ) : unsupported ? (
              <p className="text-rose-600 text-xs font-medium">
                Seu navegador não suporta pesquisa por voz. Tente usar Chrome ou Edge.
              </p>
            ) : (
              <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                Toque no microfone acima para falar novamente
              </p>
            )}
          </div>

          {/* Ação para Permitir Microfone quando Necessário */}
          {needsPermission && (
            <button
              type="button"
              onClick={handleRequestPermissionClick}
              className="mt-3 w-full py-2.5 px-4 rounded-xl text-white font-bold text-xs shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              style={{ backgroundColor: "#008000" }}
            >
              <Volume2 className="w-4 h-4" />
              Permitir Microfone
            </button>
          )}

          {/* Exemplos de busca */}
          {!needsPermission && !transcript && (
            <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
              <span>Exemplos:</span>
              <button
                type="button"
                onClick={() => {
                  onResult("Dipirona");
                  handleClose();
                }}
                className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Dipirona
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  onResult("Protetor solar");
                  handleClose();
                }}
                className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
              >
                Protetor solar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
