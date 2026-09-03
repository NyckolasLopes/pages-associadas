import { useEffect, useState, useRef } from "react";
import { CheckCircle2, X, ShoppingBasket } from "lucide-react";
import { useCart } from "@/stores/cart";

export function AddToCartNotification() {
  const notification = useCart((s) => s.addedNotification);
  const hide = useCart((s) => s.hideAddedNotification);
  const [progress, setProgress] = useState(100);
  const [visible, setVisible] = useState(false);
  const animRef = useRef<number | null>(null);

  useEffect(() => {
    if (!notification?.open) {
      setProgress(100);
      setVisible(false);
      if (animRef.current) cancelAnimationFrame(animRef.current);
      return;
    }

    // Pequeno delay para acionar animação de entrada
    requestAnimationFrame(() => setVisible(true));

    const duration = 3500;
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
      role="alert"
      aria-live="polite"
      className="fixed z-[9999] pointer-events-none"
      style={{
        bottom: "env(safe-area-inset-bottom, 1rem)",
        right: 0,
        left: 0,
        padding: "0 1rem 1rem",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-end",
      }}
    >
      <div
        className="pointer-events-auto w-full sm:w-auto sm:min-w-[300px] sm:max-w-sm"
        style={{
          transform: visible ? "translateY(0)" : "translateY(120%)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1), opacity 0.25s ease",
        }}
      >
        <div
          className="relative text-white rounded-2xl shadow-2xl border overflow-hidden"
          style={{ backgroundColor: '#008000', borderColor: 'rgba(0,128,0,0.35)', boxShadow: '0 8px 32px rgba(0,128,0,0.35), 0 2px 8px rgba(0,0,0,0.18)' }}
        >
          {/* Conteúdo */}
          <div className="flex items-center gap-3 px-4 py-3 pr-10">
            {/* Ícone */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border shadow-inner" style={{ backgroundColor: 'rgba(255,255,255,0.2)', borderColor: 'rgba(255,255,255,0.25)' }}>
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>

            {/* Textos */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold leading-tight whitespace-nowrap">
                Adicionado ao carrinho!
              </p>
              {notification.productName && (
                <p className="text-xs mt-0.5 truncate opacity-90 max-w-[200px] sm:max-w-[240px]" style={{ color: '#b3ffb3' }}>
                  {notification.productName}
                </p>
              )}
            </div>

            {/* Ícone carrinho decorativo */}
            <ShoppingBasket className="w-4 h-4 text-white/60 shrink-0 hidden sm:block" />
          </div>

          {/* Botão fechar */}
          <button
            type="button"
            onClick={hide}
            aria-label="Fechar notificação"
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-white/70 hover:text-white hover:bg-white/20 transition active:scale-90 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          {/* Barra de progresso */}
          <div className="w-full bg-black/20 h-1">
            <div
              className="h-full bg-white/80 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
