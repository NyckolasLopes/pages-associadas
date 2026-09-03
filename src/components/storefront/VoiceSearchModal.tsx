import { useEffect, useRef, useState, useCallback } from "react";
import { Mic, X, Search, RefreshCw, Lock } from "lucide-react";
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
  const [permissionBlocked, setPermissionBlocked] = useState(false);
  const [noDeviceFound, setNoDeviceFound] = useState(false);
  const [unsupported, setUnsupported] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const recognitionRef = useRef<any>(null);
  const isClosingRef = useRef(false);
  const latestTranscriptRef = useRef("");
  const hasDispatchedRef = useRef(false);
  const retryCountRef = useRef(0);

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
    latestTranscriptRef.current = "";
    hasDispatchedRef.current = false;
    setPermissionBlocked(false);
    setNoDeviceFound(false);
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
    latestTranscriptRef.current = "";
    hasDispatchedRef.current = false;
    setTranscript("");
    setInterimText("");
    setPermissionBlocked(false);
    setNoDeviceFound(false);
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
          setPermissionBlocked(false);
        }
      };

      recognition.onresult = (event: any) => {
        if (isClosingRef.current || hasDispatchedRef.current) return;
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

        const candidate = (final || interim || "").trim();
        if (candidate) {
          latestTranscriptRef.current = candidate;
        }

        if (interim) setInterimText(interim);

        if (final) {
          const cleanText = final.trim();
          latestTranscriptRef.current = cleanText;
          setTranscript(cleanText);
          setInterimText("");
          setIsListening(false);
          hasDispatchedRef.current = true;

          // Aguarda breve confirmação visual e aciona busca
          setTimeout(() => {
            if (!isClosingRef.current) {
              onResult(cleanText);
              handleClose();
            }
          }, 400);
        }
      };

      recognition.onerror = (event: any) => {
        if (isClosingRef.current) return;
        const err = event.error;

        // Se o usuário já falou algo e houve encerramento/erro, despacha o que foi falado
        const recognized = latestTranscriptRef.current.trim();
        if (recognized && !hasDispatchedRef.current) {
          hasDispatchedRef.current = true;
          setTranscript(recognized);
          setInterimText("");
          setIsListening(false);
          setTimeout(() => {
            if (!isClosingRef.current) {
              onResult(recognized);
              handleClose();
            }
          }, 400);
          return;
        }

        if (err === "not-allowed" || err === "service-not-allowed") {
          setIsListening(false);
          setPermissionBlocked(true);
        } else if (err === "no-speech") {
          setIsListening(false);
          // No mobile, se o microfone fechar rapidamente por silêncio no início, tenta reiniciar 1x suavemente
          if (!latestTranscriptRef.current && !hasDispatchedRef.current && !isClosingRef.current && retryCountRef.current < 2) {
            retryCountRef.current += 1;
            setTimeout(() => {
              if (!isClosingRef.current) {
                startListening();
              }
            }, 250);
          }
        } else if (err === "audio-capture") {
          setIsListening(false);
          // Em mobile, se o hardware de áudio estava momentaneamente ocupado, tenta mais 1 vez
          if (retryCountRef.current < 2 && !isClosingRef.current) {
            retryCountRef.current += 1;
            setTimeout(() => {
              if (!isClosingRef.current) {
                startListening();
              }
            }, 350);
          } else {
            setNoDeviceFound(true);
          }
        } else if (err === "network") {
          setIsListening(false);
          toast.error("Sem conexão com o serviço de reconhecimento de voz.");
        } else if (err !== "aborted") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        if (isClosingRef.current) return;
        setIsListening(false);

        // No mobile (Android Chrome), é frequente emitir todo o texto como interim e encerrar via onend sem isFinal=true.
        // Se temos texto gravado no buffer que ainda não foi despachado, conclui a busca com sucesso!
        const recognized = latestTranscriptRef.current.trim();
        if (recognized && !hasDispatchedRef.current) {
          hasDispatchedRef.current = true;
          setTranscript(recognized);
          setInterimText("");
          setTimeout(() => {
            if (!isClosingRef.current) {
              onResult(recognized);
              handleClose();
            }
          }, 400);
        }
      };

      recognition.start();
      setIsListening(true);
    } catch (e) {
      console.warn("Erro ao iniciar SpeechRecognition:", e);
      setIsListening(false);
    }
  }, [stopRecognition, onResult, handleClose]);

  // Função para solicitar permissão nativa explicitamente via clique direto
  const handleRequestPermissionClick = async () => {
    setIsLoading(true);
    try {
      // 1. Verificar se há microfones conectados
      if (navigator.mediaDevices?.enumerateDevices) {
        try {
          const devices = await navigator.mediaDevices.enumerateDevices();
          const mics = devices.filter((d) => d.kind === "audioinput");
          if (mics.length === 0 && devices.length > 0) {
            setNoDeviceFound(true);
            setIsLoading(false);
            return;
          }
        } catch {}
      }

      // 2. Tentar disparar o prompt nativo do navegador
      if (navigator.mediaDevices?.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        stream.getTracks().forEach((track) => track.stop());
        setPermissionBlocked(false);
        setNoDeviceFound(false);
        setIsLoading(false);
        // Pequena pausa para o sistema operacional liberar a interface de áudio
        setTimeout(() => {
          startListening();
        }, 250);
        return;
      }

      startListening();
    } catch (err: any) {
      console.warn("Permissão de áudio não obtida:", err);
      setIsLoading(false);
      const errName = err?.name || "";
      if (errName === "NotFoundError" || errName === "DevicesNotFoundError") {
        setNoDeviceFound(true);
      } else {
        setPermissionBlocked(true);
      }
    }
  };

  useEffect(() => {
    if (open) {
      isClosingRef.current = false;
      retryCountRef.current = 0;
      latestTranscriptRef.current = "";
      hasDispatchedRef.current = false;
      // Delay suave de 120ms para sincronizar com a montagem da janela no mobile
      const timer = setTimeout(() => {
        startListening();
      }, 120);
      return () => clearTimeout(timer);
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

        <div className="flex flex-col items-center px-6 py-7 text-center">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
              Pesquisa por Voz
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              {permissionBlocked
                ? "Permissão bloqueada no navegador"
                : noDeviceFound
                ? "Microfone não encontrado"
                : "Fale o produto que você deseja encontrar"}
            </p>
          </div>

          {/* Microfone Central com Animação */}
          <div className="relative my-3 flex items-center justify-center">
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
              onClick={
                isListening
                  ? stopRecognition
                  : permissionBlocked || noDeviceFound
                  ? handleRequestPermissionClick
                  : startListening
              }
              className="relative w-20 h-20 rounded-full flex items-center justify-center text-white shadow-xl transition-all duration-300 active:scale-95 cursor-pointer"
              style={{
                backgroundColor: isListening
                  ? "#008000"
                  : permissionBlocked
                  ? "#dc2626"
                  : noDeviceFound
                  ? "#f59e0b"
                  : "#008000",
                boxShadow: isListening ? "0 0 25px rgba(0,128,0,0.45)" : undefined,
              }}
              title={isListening ? "Ouvindo... Clique para pausar" : "Clique para falar"}
            >
              <Mic className={`w-8 h-8 ${isListening ? "animate-pulse" : ""}`} />
            </button>
          </div>

          {/* Equalizador de Ondas Sonoras quando Ouvindo */}
          {isListening && (
            <div className="flex items-center gap-1 my-2 h-6">
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

          {/* Estado: Sem microfone físico detectado */}
          {noDeviceFound && (
            <div className="my-3 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-left text-xs space-y-1.5 w-full">
              <p className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5">
                Nenhum microfone detectado
              </p>
              <p className="text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed">
                Conecte um fone de ouvido com microfone ou um microfone USB ao computador e tente novamente.
              </p>
              <button
                type="button"
                onClick={handleRequestPermissionClick}
                className="w-full mt-2 py-2 rounded-xl text-white font-bold text-xs transition"
                style={{ backgroundColor: "#008000" }}
              >
                Verificar novamente
              </button>
            </div>
          )}

          {/* Estado: Bloqueado nas configurações do navegador */}
          {permissionBlocked && (
            <div className="my-3 p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-left text-xs space-y-2 w-full">
              <div className="flex items-center gap-2 font-bold text-red-900 dark:text-red-200">
                <Lock className="w-4 h-4 text-red-600 shrink-0" />
                <span>O navegador bloqueou o microfone</span>
              </div>
              <p className="text-zinc-600 dark:text-zinc-300 text-[11px] leading-relaxed">
                Como liberar em 2 passos rápidos no Edge/Chrome:
              </p>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-zinc-700 dark:text-zinc-300">
                <li>
                  Clique no ícone de <strong>cadeado 🔒</strong> na barra de endereços (topo esquerdo).
                </li>
                <li>
                  Clique no botão <strong>"Redefinir permissões"</strong>.
                </li>
              </ol>
              <div className="pt-1 flex gap-2">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="flex-1 py-2 px-3 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Recarregar Página
                </button>
                <button
                  type="button"
                  onClick={handleRequestPermissionClick}
                  disabled={isLoading}
                  className="py-2 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 font-semibold text-xs hover:bg-zinc-100 dark:hover:bg-zinc-800 transition active:scale-95"
                >
                  {isLoading ? "Testando..." : "Testar"}
                </button>
              </div>
            </div>
          )}

          {/* Textos de Transcrição e Feedback quando não bloqueado */}
          {!permissionBlocked && !noDeviceFound && (
            <div className="min-h-[50px] flex flex-col items-center justify-center mt-1 px-2 max-w-full">
              {transcript ? (
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-base animate-in fade-in">
                  <Search className="w-4 h-4 shrink-0" />
                  <span className="truncate">"{transcript}"</span>
                </div>
              ) : interimText ? (
                <button
                  type="button"
                  onClick={() => {
                    const clean = interimText.trim();
                    if (clean) {
                      onResult(clean);
                      handleClose();
                    }
                  }}
                  className="text-zinc-800 dark:text-zinc-200 text-sm font-medium italic animate-in fade-in hover:underline cursor-pointer flex items-center gap-1.5"
                  title="Clique para buscar agora"
                >
                  <span>"{interimText}"</span>
                  <Search className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                </button>
              ) : isListening ? (
                <p className="text-emerald-700 dark:text-emerald-400 text-sm font-semibold animate-pulse">
                  Ouvindo... Pode falar agora
                </p>
              ) : unsupported ? (
                <p className="text-rose-600 text-xs font-medium">
                  Seu navegador não suporta pesquisa por voz. Tente usar Chrome ou Edge.
                </p>
              ) : (
                <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium">
                  Toque no microfone acima para falar
                </p>
              )}
            </div>
          )}

          {/* Exemplos de busca quando ouvindo normalmente */}
          {!permissionBlocked && !noDeviceFound && !transcript && (
            <div className="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 w-full flex items-center justify-center gap-1.5 text-[11px] text-zinc-400">
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
