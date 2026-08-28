import React, { useState, useEffect } from "react";
import { Clock, Flame, Zap, Gift, Star, ShoppingBag, ShoppingBasket, Percent, Tag, CheckCircle2 } from "lucide-react";
import { Promocao } from "@/stores/marketing";
import { brl } from "@/lib/format";
import { calculatePromoTimeRemaining } from "@/lib/utils";

export const PROMO_ICONS: Record<string, React.ComponentType<{ className?: string; style?: React.CSSProperties }>> = {
  flame: Flame,
  zap: Zap,
  gift: Gift,
  star: Star,
  "shopping-bag": ShoppingBag,
  percent: Percent,
  tag: Tag,
  clock: Clock,
};

export function getPromoIcon(iconName?: string) {
  if (!iconName) return Flame;
  return PROMO_ICONS[iconName] || Flame;
}

export function usePromoTimer(dataFim?: string, horaFim?: string) {
  const [time, setTime] = useState(() => calculatePromoTimeRemaining(dataFim, horaFim));

  useEffect(() => {
    if (!dataFim) return;

    // Initial update
    setTime(calculatePromoTimeRemaining(dataFim, horaFim));

    const interval = setInterval(() => {
      const nextTime = calculatePromoTimeRemaining(dataFim, horaFim);
      setTime(nextTime);
      if (nextTime.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [dataFim, horaFim]);

  return time;
}

/**
 * Compact countdown / badge for the Product Card (Vitrine)
 */
export function PromoCardBadge({
  promo,
  precoOriginal,
}: {
  promo: Promocao;
  precoOriginal?: number;
}) {
  const time = usePromoTimer(promo.dataFim, promo.horaFim);
  const IconComponent = getPromoIcon(promo.icone);
  const themeColor = promo.corBotao || promo.corSelo || "#dc2626";
  const timerColor = promo.corTimer || "rgba(0,0,0,0.3)";

  if (promo.tipoCampanha === "leve_pague") {
    const qtd = promo.levePague_quantidade || 2;
    const precoItem = promo.levePague_precoPorItem || 0;
    return (
      <div 
        className="w-full text-white text-[11px] font-extrabold px-2.5 py-1 rounded-md shadow-sm flex items-center justify-between gap-1 transition-all"
        style={{ backgroundColor: themeColor }}
      >
        <span className="flex items-center gap-1 truncate">
          <IconComponent className="w-3.5 h-3.5 shrink-0 animate-bounce" />
          <span className="truncate uppercase tracking-tight">Leve {qtd} por {brl(precoItem)} un</span>
        </span>
        <span className="bg-black/20 px-1.5 py-0.5 rounded text-[10px] font-black shrink-0">
          COMBO
        </span>
      </div>
    );
  }

  // Standard promo with timer
  if (time.hasTimer && !time.isExpired) {
    return (
      <div 
        className="w-full text-white text-[11px] font-bold px-2 py-1 rounded-md shadow-sm flex items-center justify-between gap-1 transition-all animate-pulse"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center gap-1 truncate">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate text-[10px] uppercase font-black">
            {promo.titulo ? promo.titulo.slice(0, 18) : "OFERTA"}
          </span>
        </div>
        <div 
          className="font-mono backdrop-blur-sm px-1.5 py-0.5 rounded text-[10px] font-black tracking-wider text-white shrink-0"
          style={{ backgroundColor: timerColor === "rgba(0,0,0,0.3)" ? timerColor : timerColor }}
        >
          {time.formatted}
        </div>
      </div>
    );
  }

  // Standard promo without explicit end timer
  return (
    <div 
      className="w-max text-white text-[10px] font-extrabold px-2 py-0.5 rounded shadow-sm flex items-center gap-1"
      style={{ backgroundColor: themeColor }}
    >
      <IconComponent className="w-3 h-3 shrink-0" />
      <span className="uppercase">{promo.titulo || "OFERTA ESPECIAL"}</span>
    </div>
  );
}

/**
 * Large, expanded promotional banner for the Product Page (_store/$storeSlug/produto/$slug.tsx)
 */
export function PromoProductPageBanner({
  promo,
  precoOriginal,
  precoPromocional,
}: {
  promo: Promocao;
  precoOriginal?: number;
  precoPromocional?: number;
}) {
  const time = usePromoTimer(promo.dataFim, promo.horaFim);
  const IconComponent = getPromoIcon(promo.icone);
  const themeColor = promo.corBotao || promo.corSelo || "#dc2626";
  const iconColor = promo.corIcone || "#ffffff";
  const timerColor = promo.corTimer || "#0f172a";

  if (promo.tipoCampanha === "leve_pague") {
    return null; // Handled by PromoLevePagueOfferBox
  }

  const pad = (n: number) => String(n).padStart(2, "0");
  const economia = (precoOriginal && precoPromocional && precoOriginal > precoPromocional)
    ? precoOriginal - precoPromocional
    : 0;

  return (
    <div 
      className="rounded-2xl border-2 overflow-hidden shadow-lg mb-6 transition-all"
      style={{ borderColor: themeColor }}
    >
      {/* Top Title Bar */}
      <div 
        className="px-4 py-3 text-white flex flex-wrap items-center justify-between gap-2"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center gap-2.5">
          <div 
            className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center shrink-0 shadow-inner"
            style={{ color: iconColor }}
          >
            <IconComponent className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-white/20 text-white font-black text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full">
                OFERTA POR TEMPO LIMITADO
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight leading-snug">
              {promo.titulo || "Mega Promoção Relâmpago"}
            </h2>
          </div>
        </div>

        {economia > 0 && (
          <div className="bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow-sm">
            <Tag className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>Economize {brl(economia)}</span>
          </div>
        )}
      </div>

      {/* Countdown Timer Body */}
      {time.hasTimer && !time.isExpired && (
        <div className="bg-gradient-to-b from-slate-50 to-slate-100/70 p-4 sm:p-5 border-t border-slate-200/60">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-slate-700 font-bold text-xs sm:text-sm">
              <Clock className="w-4 h-4 text-red-600 animate-spin" style={{ animationDuration: "6s" }} />
              <span>Esta oferta encerra em:</span>
            </div>

            {/* Digital Clock Flip Display */}
            <div className="flex items-center gap-1.5 sm:gap-2 text-center">
              {time.days > 0 && (
                <>
                  <div className="flex flex-col items-center">
                    <div 
                      className="min-w-[42px] sm:min-w-[48px] h-11 sm:h-12 text-white rounded-lg flex items-center justify-center font-mono text-lg sm:text-xl font-black shadow-md border border-slate-700"
                      style={{ backgroundColor: timerColor }}
                    >
                      {pad(time.days)}
                    </div>
                    <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Dias</span>
                  </div>
                  <span className="text-slate-900 font-black text-lg pb-4">:</span>
                </>
              )}

              <div className="flex flex-col items-center">
                <div 
                  className="min-w-[42px] sm:min-w-[48px] h-11 sm:h-12 text-white rounded-lg flex items-center justify-center font-mono text-lg sm:text-xl font-black shadow-md border border-slate-700"
                  style={{ backgroundColor: timerColor }}
                >
                  {pad(time.hours)}
                </div>
                <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Horas</span>
              </div>
              <span className="text-slate-900 font-black text-lg pb-4">:</span>

              <div className="flex flex-col items-center">
                <div 
                  className="min-w-[42px] sm:min-w-[48px] h-11 sm:h-12 text-white rounded-lg flex items-center justify-center font-mono text-lg sm:text-xl font-black shadow-md border border-slate-700"
                  style={{ backgroundColor: timerColor }}
                >
                  {pad(time.minutes)}
                </div>
                <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Min</span>
              </div>
              <span className="text-slate-900 font-black text-lg pb-4">:</span>

              <div className="flex flex-col items-center">
                <div 
                  className="min-w-[42px] sm:min-w-[48px] h-11 sm:h-12 text-white rounded-lg flex items-center justify-center font-mono text-lg sm:text-xl font-black shadow-md border border-slate-700"
                  style={{ backgroundColor: timerColor }}
                >
                  {pad(time.seconds)}
                </div>
                <span className="text-[9px] uppercase font-bold text-slate-500 mt-1">Seg</span>
              </div>
            </div>
          </div>

          {/* Urgency Progress Bar */}
          <div className="mt-3 pt-3 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-600">
            <span className="flex items-center gap-1 font-semibold text-red-600">
              <Zap className="w-3.5 h-3.5 fill-red-600" /> Alta procura neste item!
            </span>
            <span className="font-medium text-slate-500">
              Preço exclusivo do canal online
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Expanded Leve + Pague Menos offer section on Product Page
 */
export function PromoLevePagueOfferBox({
  promo,
  precoUnitarioOriginal,
  onAddToCart,
}: {
  promo: Promocao;
  precoUnitarioOriginal: number;
  onAddToCart?: (quantidade: number) => void;
}) {
  const qtd = promo.levePague_quantidade || 2;
  const precoItemPromo = promo.levePague_precoPorItem || precoUnitarioOriginal;
  const totalPromo = qtd * precoItemPromo;
  const totalOriginal = qtd * precoUnitarioOriginal;
  const economia = Math.max(0, totalOriginal - totalPromo);
  const themeColor = promo.corBotao || promo.corSelo || "#ea580c";
  const textColor = promo.corTextoBotao || "#ffffff";
  const btnText = promo.textoBotao || `COMPRAR COMBO COM ${qtd} UNIDADES`;

  return (
    <div 
      className="rounded-2xl border-2 overflow-hidden shadow-lg mb-6 bg-white"
      style={{ borderColor: themeColor }}
    >
      <div 
        className="px-4 py-3 text-white flex items-center justify-between gap-2"
        style={{ backgroundColor: themeColor }}
      >
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 animate-bounce" />
          <span className="font-black text-sm uppercase tracking-wide">
            {promo.titulo || `Leve ${qtd} e Pague Menos`}
          </span>
        </div>
        {economia > 0 && (
          <span className="bg-white text-slate-900 font-extrabold text-xs px-2.5 py-1 rounded-full shadow-sm">
            Economize {brl(economia)}
          </span>
        )}
      </div>

      <div className="p-4 sm:p-5 bg-orange-50/40 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-orange-200/80 shadow-sm">
          <div>
            <div className="text-xs text-slate-500 font-semibold uppercase">
              Comprando {qtd} unidades ou mais:
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900">
                {brl(precoItemPromo)}
              </span>
              <span className="text-xs font-bold text-slate-500 uppercase">
                / cada unidade
              </span>
            </div>
            <div className="text-xs text-slate-500 line-through mt-0.5">
              Preço normal: {brl(precoUnitarioOriginal)} cada
            </div>
          </div>

          <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-4">
            <div className="text-xs font-bold text-slate-600">Total do Pacote:</div>
            <div className="text-xl sm:text-2xl font-black text-green-700">
              {brl(totalPromo)}
            </div>
            <div className="text-[11px] text-green-600 font-semibold flex items-center sm:justify-end gap-1 mt-0.5">
              <CheckCircle2 className="w-3.5 h-3.5" /> Você poupa {brl(economia)}
            </div>
          </div>
        </div>

        {onAddToCart && (
          <button
            type="button"
            onClick={() => onAddToCart(qtd)}
            className="w-full h-12 rounded-xl font-black text-sm tracking-wide shadow-md hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-center gap-2 uppercase"
            style={{ backgroundColor: themeColor, color: textColor }}
          >
            <ShoppingBasket className="w-5 h-5" />
            {btnText}
          </button>
        )}
      </div>
    </div>
  );
}
