import { useEffect, useState, useRef } from "react";
import { CheckCircle2, X } from "lucide-react";
import { useCart } from "@/stores/cart";

export function AddToCartNotification() {
  const notification = useCart((s) => s.addedNotification);
  const hide = useCart((s) => s.hideAddedNotification);
  const [progress, setProgress] = useState(100);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notification?.open) {
      setProgress(100);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    const duration = 3000; // 3 segundos
    const startTime = performance.now();

    const update = (now: number) => {
      const elapsed = now - startTime;
      const remainingPct = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remainingPct);

      if (elapsed < duration) {
        animRef.current = requestAnimationFrame(update);
      } else {
        hide();
      }
    };

    animRef.current = requestAnimationFrame(update);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") hide();
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [notification?.open, hide]);

  if (!notification?.open) return null;

  return (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={hide}
    >
      <div
        className="relative w-full max-w-sm bg-emerald-600 text-white rounded-2xl shadow-2xl p-5 border border-emerald-400/40 animate-in zoom-in-95 duration-200 pointer-events-auto"
        onClick={(e) => e.stopPropagation()}
        role="alert"
        aria-live="polite"
      >
        {/* Botão X para fechar o aviso */}
        <button
          type="button"
          onClick={hide}
          aria-label="Fechar notificação"
          className="absolute top-3 right-3 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition active:scale-95 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3.5 pr-6">
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
            <CheckCircle2 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="text-base font-bold leading-tight">
              Produto adicionado ao carrinho com sucesso
            </h4>
            {notification.productName && (
              <p className="text-xs text-emerald-100 mt-1 line-clamp-1 opacity-90 font-medium">
                {notification.productName}
              </p>
            )}
          </div>
        </div>

        {/* Barrinha de carregamento rápido (cerca de 3 segundos) */}
        <div className="w-full bg-black/20 h-1.5 rounded-full overflow-hidden mt-4">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
