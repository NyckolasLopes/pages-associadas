import { useEffect, useState } from "react";
import { Cookie, ShieldCheck, X } from "lucide-react";
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
        // Delay slightly for smooth page entry
        const timer = setTimeout(() => setShow(true), 600);
        return () => clearTimeout(timer);
      }
    } catch {}
  }, []);

  const accept = (level: "all" | "essential") => {
    try {
      localStorage.setItem(COOKIE_CONSENT_KEY, level);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  const isPartner = activePharmacy?.categoriaAssociado === "Parceiro" || activePharmacy?.categoriaAssociado === "Associado";
  const storeSlug = activePharmacy?.slug ? safeSlugify(activePharmacy.slug) : "loja-padrao";
  const storeName = activePharmacy?.nome || (isPartner ? "nossa loja" : "Farmácias Associadas");

  // Dynamic colors based on store type
  const partnerPrimaryColor = 
    activePharmacy?.themeColors?.["--primary"] || 
    activePharmacy?.themeColors?.primary || 
    activePharmacy?.topBarBgColor || 
    "#1e293b";

  const partnerTextColor = 
    activePharmacy?.themeColors?.["--primary-foreground"] || 
    activePharmacy?.topBarTextColor || 
    "#ffffff";

  return (
    <aside 
      aria-label="Aviso de Privacidade e Cookies"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-lg z-50 animate-in fade-in slide-in-from-bottom-6 duration-500"
    >
      <div className={`rounded-2xl p-5 shadow-2xl border backdrop-blur-md transition-all duration-300 ${
        isPartner 
          ? "bg-white/95 text-slate-800 border-slate-200/80 shadow-slate-900/10" 
          : "bg-slate-900/95 text-white border-slate-700/60 shadow-emerald-950/20"
      }`}>
        {/* Header with Icon and Close Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div 
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isPartner ? "" : "bg-emerald-500/20 text-emerald-400"
              }`}
              style={isPartner ? { backgroundColor: `${partnerPrimaryColor}15`, color: partnerPrimaryColor } : undefined}
            >
              <Cookie className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm leading-tight flex items-center gap-1.5">
                Privacidade & Cookies
                <ShieldCheck className={`h-4 w-4 ${isPartner ? "text-slate-400" : "text-emerald-400"}`} />
              </h3>
              <span className={`text-[11px] font-medium ${isPartner ? "text-slate-400" : "text-slate-400"}`}>
                {storeName}
              </span>
            </div>
          </div>

          <button 
            onClick={() => accept("essential")}
            className={`p-1.5 rounded-lg transition-colors ${
              isPartner 
                ? "text-slate-400 hover:text-slate-600 hover:bg-slate-100" 
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
            title="Fechar aviso de cookies"
            aria-label="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Text */}
        <p className={`text-xs leading-relaxed mb-4 ${isPartner ? "text-slate-600" : "text-slate-300"}`}>
          Utilizamos cookies para aprimorar sua experiência de navegação, oferecer recomendações personalizadas de saúde e analisar o desempenho da loja. Saiba mais em nossa{" "}
          <Link 
            to="/$storeSlug/politica-de-privacidade" 
            params={{ storeSlug }}
            className={`font-semibold underline underline-offset-2 transition-colors ${
              isPartner 
                ? "hover:opacity-80" 
                : "text-emerald-400 hover:text-emerald-300"
            }`}
            style={isPartner ? { color: partnerPrimaryColor } : undefined}
          >
            Política de Privacidade
          </Link>.
        </p>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 pt-1">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => accept("essential")}
            className={`flex-1 text-xs font-semibold h-9 rounded-xl transition-colors ${
              isPartner 
                ? "border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900" 
                : "border-slate-700 bg-slate-800/80 text-slate-200 hover:bg-slate-700 hover:text-white"
            }`}
          >
            Apenas essenciais
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={() => accept("all")}
            className={`flex-1 text-xs font-bold h-9 rounded-xl shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isPartner 
                ? "hover:opacity-95" 
                : "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-600/30"
            }`}
            style={
              isPartner 
                ? { backgroundColor: partnerPrimaryColor, color: partnerTextColor } 
                : undefined
            }
          >
            Aceitar todos
          </Button>
        </div>
      </div>
    </aside>
  );
}
