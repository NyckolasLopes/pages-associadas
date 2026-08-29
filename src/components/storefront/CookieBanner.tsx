import { useEffect, useState } from "react";
import { Cookie, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { useActivePharmacy, safeSlugify } from "@/hooks/useActivePharmacy";

const COOKIE_CONSENT_KEY = "fa-cookie-consent-v2";

export function CookieBanner() {
  const [show, setShow] = useState(false);
  const activePharmacy = useActivePharmacy();

  useEffect(() => {
    try {
      const consent = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!consent) {
        const timer = setTimeout(() => setShow(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const accept = () => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, "accepted");
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  const storeSlug = activePharmacy?.slug ? safeSlugify(activePharmacy.slug) : "loja-padrao";

  return (
    <aside 
      aria-label="Aviso de Privacidade e Cookies"
      className="fixed bottom-2 inset-x-2 sm:bottom-3 sm:inset-x-4 md:bottom-4 md:inset-x-6 z-50 flex justify-center pointer-events-none animate-in fade-in slide-in-from-bottom-4 duration-400"
    >
      <div 
        className="pointer-events-auto w-full max-w-5xl bg-card/95 text-card-foreground backdrop-blur-md border border-border/80 rounded-2xl p-3 sm:p-4 shadow-elevated flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-6"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Cookie className="h-5 w-5" />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground leading-snug">
            Utilizamos cookies para personalizar conteúdos e melhorar a sua experiência. Ao continuar navegando, você concorda com a nossa{" "}
            <Link 
              to="/$storeSlug/politica-de-privacidade" 
              params={{ storeSlug }}
              className="font-bold text-foreground hover:text-primary underline underline-offset-2"
            >
              Política de Privacidade
            </Link>.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
          <Button
            type="button"
            onClick={accept}
            className="w-full sm:w-auto text-xs sm:text-sm font-bold h-10 px-6 rounded-xl shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            Aceitar e continuar
          </Button>
          <button
            type="button"
            onClick={accept}
            className="hidden sm:flex p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition"
            title="Fechar aviso de cookies"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
