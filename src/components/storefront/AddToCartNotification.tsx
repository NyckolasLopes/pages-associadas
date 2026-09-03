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
        top: "env(safe-area-inset-top, 1rem)",
        right: "1rem",
        padding: "0.5rem 0",
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "flex-start",
      }}
    >
      <div
        className="pointer-events-auto w-full max-w-[340px] sm:max-w-md"
        style={{
          transform: visible ? "translateY(0) scale(1)" : "translateY(-40px) scale(0.95)",
          opacity: visible ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.25s ease",
        }}
      >
        <div
          className="relative rounded-2xl border shadow-2xl overflow-hidden"
          style={{ 
            backgroundColor: '#00f050', 
            borderColor: 'rgba(0, 160, 50, 0.3)', 
            boxShadow: '0 12px 36px -4px rgba(0, 240, 80, 0.4), 0 4px 16px rgba(0, 0, 0, 0.12)' 
          }}
        >
          {/* Conteúdo */}
          <div className="flex items-center gap-3 p-3 pr-9">
            {/* Foto principal do produto */}
            {notification.productImage ? (
              <div className="w-12 h-12 rounded-xl bg-white p-1 shrink-0 border border-emerald-950/15 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={notification.productImage}
                  alt={notification.productName || "Produto"}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <div className="w-11 h-11 rounded-xl bg-white/70 flex items-center justify-center shrink-0 border border-emerald-950/15 shadow-xs">
                <CheckCircle2 className="w-6 h-6 text-emerald-950" />
              </div>
            )}

            {/* Textos com alto contraste sobre #00f050 */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-950 shrink-0" />
                <p className="text-[11px] font-black text-emerald-950 uppercase tracking-wider leading-none">
                  Adicionado ao carrinho!
                </p>
              </div>
              {notification.productName && (
                <p className="text-xs font-bold text-emerald-950 mt-1 truncate max-w-[210px] sm:max-w-[270px] leading-tight" title={notification.productName}>
                  {notification.productName}
                </p>
              )}
            </div>

            {/* Ícone sutil de cesta */}
            <ShoppingBasket className="w-4 h-4 text-emerald-950/40 shrink-0 hidden sm:block" />
          </div>

          {/* Botão fechar */}
          <button
            type="button"
            onClick={hide}
            aria-label="Fechar notificação"
            className="absolute top-2.5 right-2.5 p-1 rounded-full text-emerald-950/70 hover:text-emerald-950 hover:bg-black/10 transition active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Barra de progresso */}
          <div className="w-full bg-emerald-950/20 h-1">
            <div
              className="h-full bg-emerald-950 rounded-full transition-none"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
