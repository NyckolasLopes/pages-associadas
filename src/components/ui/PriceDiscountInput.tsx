import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Percent, DollarSign } from "lucide-react";

interface PriceDiscountInputProps {
  basePrice: number;
  initialPromoPrice?: number;
  onChange: (promoPrice: number) => void;
  className?: string;
  disabled?: boolean;
  hideDiscounts?: boolean;
}

export function PriceDiscountInput({
  basePrice,
  initialPromoPrice,
  onChange,
  className = "",
  disabled = false,
  hideDiscounts = false
}: PriceDiscountInputProps) {
  const [promoPriceStr, setPromoPriceStr] = useState("");
  const [discountValueStr, setDiscountValueStr] = useState("");
  const [discountPercentStr, setDiscountPercentStr] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (isFocused) return;
    if (initialPromoPrice !== undefined && initialPromoPrice > 0) {
      updateFromPromo(initialPromoPrice, false);
    } else {
      setPromoPriceStr("");
      setDiscountValueStr("");
      setDiscountPercentStr("");
    }
  }, [initialPromoPrice, basePrice, isFocused]);

  const parseNum = (str: string) => {
    const clean = str.replace(/[^\d,.-]/g, "").replace(",", ".");
    return parseFloat(clean) || 0;
  };

  const updateFromPromo = (promo: number, triggerChange = true) => {
    let finalPromo = promo;
    if (finalPromo < 0) finalPromo = 0;
    
    const discVal = basePrice > 0 ? basePrice - finalPromo : 0;
    const discPct = basePrice > 0 ? (discVal / basePrice) * 100 : 0;

    setPromoPriceStr(finalPromo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setDiscountValueStr(discVal > 0 ? discVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    setDiscountPercentStr(discPct > 0 ? discPct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    
    if (triggerChange) {
      onChange(finalPromo);
    }
  };

  const handlePromoChange = (val: string) => {
    setPromoPriceStr(val);
    const num = parseNum(val);
    
    const discVal = basePrice > 0 ? basePrice - num : 0;
    const discPct = basePrice > 0 ? (discVal / basePrice) * 100 : 0;
    
    setDiscountValueStr(discVal > 0 ? discVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    setDiscountPercentStr(discPct > 0 ? discPct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    
    onChange(num);
  };

  const handleDiscountValueChange = (val: string) => {
    setDiscountValueStr(val);
    const discVal = parseNum(val);
    
    const promo = basePrice > 0 ? basePrice - discVal : 0;
    const discPct = basePrice > 0 ? (discVal / basePrice) * 100 : 0;
    
    setPromoPriceStr(promo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setDiscountPercentStr(discPct > 0 ? discPct.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    
    onChange(promo);
  };

  const handleDiscountPercentChange = (val: string) => {
    setDiscountPercentStr(val);
    const discPct = parseNum(val);
    
    const discVal = basePrice > 0 ? (basePrice * (discPct / 100)) : 0;
    const promo = basePrice > 0 ? basePrice - discVal : 0;
    
    setPromoPriceStr(promo.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    setDiscountValueStr(discVal > 0 ? discVal.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "");
    
    onChange(promo);
  };

  const isInvalid = !hideDiscounts && parseNum(promoPriceStr) >= basePrice && basePrice > 0;

  return (
    <div className={`grid ${hideDiscounts ? 'grid-cols-1' : 'grid-cols-3'} gap-2 ${className}`}>
      <div className="space-y-1">
        <label className="text-xs font-semibold text-slate-500">Preço Final (R$)</label>
        <div className="relative">
          <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <Input 
            value={promoPriceStr} 
            onChange={e => handlePromoChange(e.target.value)} 
            onFocus={() => setIsFocused(true)}
            onBlur={() => { setIsFocused(false); updateFromPromo(parseNum(promoPriceStr), false); }}
            disabled={disabled}
            className={`pl-7 h-9 text-sm ${isInvalid ? 'border-red-300 focus-visible:ring-red-400 bg-red-50' : ''}`}
            placeholder="0,00"
          />
        </div>
      </div>
      {!hideDiscounts && (
        <>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Desconto (R$)</label>
            <div className="relative">
              <DollarSign className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                value={discountValueStr} 
                onChange={e => handleDiscountValueChange(e.target.value)} 
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); }}
                disabled={disabled}
                className="pl-7 h-9 text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500">Desconto (%)</label>
            <div className="relative">
              <Percent className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <Input 
                value={discountPercentStr} 
                onChange={e => handleDiscountPercentChange(e.target.value)} 
                onFocus={() => setIsFocused(true)}
                onBlur={() => { setIsFocused(false); }}
                disabled={disabled}
                className="pl-7 h-9 text-sm"
                placeholder="0,00"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
