import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { FilterOptions } from "@/services/catalog";
import { useState, useEffect } from "react";
import type { Produto } from "@/types";
import { useAdminFiltros } from "@/stores/filtros";

interface ProductFilterSidebarProps {
  unfilteredProducts: Produto[];
  currentFilters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  className?: string;
  isCategory?: boolean;
}

export function ProductFilterSidebar({
  unfilteredProducts,
  currentFilters,
  onFilterChange,
  className = "",
  isCategory = false
}: ProductFilterSidebarProps) {
  const { filtros } = useAdminFiltros();
  const showPrice = filtros.find(f => f.id === 'price')?.buscavel ?? true;
  const showBrand = filtros.find(f => f.id === 'brand')?.buscavel ?? true;
  const filtrosDinamicos = filtros.filter(f => f.buscavel && !['price', 'brand'].includes(f.id));

  const [localPrice, setLocalPrice] = useState<{ min?: string, max?: string }>({
    min: currentFilters.minPrice?.toString() || "",
    max: currentFilters.maxPrice?.toString() || ""
  });

  useEffect(() => {
    setLocalPrice({
      min: currentFilters.minPrice?.toString() || "",
      max: currentFilters.maxPrice?.toString() || ""
    });
  }, [currentFilters.minPrice, currentFilters.maxPrice]);

  // Derive available options from unfiltered products
  const availableBrands = Array.from(new Set(
    unfilteredProducts.map(p => String(p.marca || p.marca || "").trim()).filter(Boolean)
  )).sort();

  const hasMedicines = unfilteredProducts.some(p => p.tarja || p.generico !== undefined || p.retemReceita !== undefined);

  const handleCheckboxArray = (key: 'marcas' | 'tarjas', value: string, checked: boolean) => {
    const current = currentFilters[key] || [];
    const updated = checked 
      ? [...current, value]
      : current.filter(v => v !== value);
    
    onFilterChange({ ...currentFilters, [key]: updated.length > 0 ? updated : undefined });
  };

  const handleRadio = (key: 'generico' | 'receita', value: string, checked: boolean) => {
    onFilterChange({ ...currentFilters, [key]: checked ? value : undefined });
  };

  const applyPriceFilter = () => {
    const min = localPrice.min ? parseFloat(localPrice.min) : undefined;
    const max = localPrice.max ? parseFloat(localPrice.max) : undefined;
    onFilterChange({ ...currentFilters, minPrice: min, maxPrice: max });
  };

  const clearFilters = () => {
    onFilterChange({});
  };

  const dynamicCount = Object.values(currentFilters.dinamicos || {}).reduce((acc, curr) => acc + (curr?.length || 0), 0);

  const activeFiltersCount = 
    (currentFilters.marcas?.length || 0) + 
    (currentFilters.minPrice !== undefined || currentFilters.maxPrice !== undefined ? 1 : 0) +
    dynamicCount;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-bold text-slate-800">Filtros</h2>
          {activeFiltersCount > 0 && (
            <button 
              onClick={clearFilters}
              className="text-xs text-primary hover:underline font-medium"
            >
              Limpar todos
            </button>
          )}
        </div>
        {activeFiltersCount > 0 && (
          <div className="text-xs text-slate-500 mb-2">
            {activeFiltersCount} filtro{activeFiltersCount > 1 ? 's' : ''} selecionado{activeFiltersCount > 1 ? 's' : ''}
          </div>
        )}
      </div>

      <Accordion type="multiple" defaultValue={["price", "brand", "generic", "prescription", "tarja"]} className="w-full">
        {/* Preço */}
        {showPrice && (
          <AccordionItem value="price" className="border-b-0 mb-2 bg-white border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 font-bold text-sm text-slate-700">
            Faixa de Preço
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="flex items-center gap-2 mb-3">
              <Input 
                type="number" 
                placeholder="R$ Min" 
                className="h-8 text-xs" 
                value={localPrice.min}
                onChange={e => setLocalPrice({ ...localPrice, min: e.target.value })}
              />
              <span className="text-slate-400">-</span>
              <Input 
                type="number" 
                placeholder="R$ Max" 
                className="h-8 text-xs" 
                value={localPrice.max}
                onChange={e => setLocalPrice({ ...localPrice, max: e.target.value })}
              />
              <Button size="sm" className="h-8 px-2" onClick={applyPriceFilter}>Ok</Button>
            </div>
            <div className="space-y-2">
              {[
                { label: "Até R$ 49,99", min: undefined, max: 49.99 },
                { label: "R$ 50,00 a R$ 99,99", min: 50, max: 99.99 },
                { label: "R$ 100,00 a R$ 149,99", min: 100, max: 149.99 },
                { label: "Acima de R$ 150,00", min: 150, max: undefined }
              ].map((range, i) => {
                const isActive = currentFilters.minPrice === range.min && currentFilters.maxPrice === range.max;
                return (
                  <div key={i} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`price-${i}`} 
                      checked={isActive}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onFilterChange({ ...currentFilters, minPrice: range.min, maxPrice: range.max });
                        } else {
                          onFilterChange({ ...currentFilters, minPrice: undefined, maxPrice: undefined });
                        }
                      }}
                    />
                    <Label htmlFor={`price-${i}`} className="text-sm cursor-pointer">{range.label}</Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
        )}



        {/* Marca */}
        {showBrand && availableBrands.length > 0 && (
          <AccordionItem value="brand" className="border-b-0 mb-2 bg-white border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 font-bold text-sm text-slate-700">
              Marca
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {availableBrands.map((b) => (
                  <div key={b} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`brand-${b}`} 
                      checked={(currentFilters.marcas || []).includes(b)}
                      onCheckedChange={(c) => handleCheckboxArray('marcas', b, c as boolean)}
                    />
                    <Label htmlFor={`brand-${b}`} className="text-sm cursor-pointer truncate" title={b}>{b}</Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Dynamic Filters */}
        {filtrosDinamicos.map(filtro => (
          <AccordionItem key={filtro.id} value={`dyn-${filtro.id}`} className="border-b-0 mb-2 bg-white border rounded-xl overflow-hidden shadow-sm">
            <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 font-bold text-sm text-slate-700">
              {filtro.nome}
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                {filtro.opcoes.map(opcao => (
                  <div key={opcao.id} className="flex items-center space-x-2">
                    <Checkbox 
                      id={`dyn-${filtro.id}-${opcao.id}`} 
                      checked={(currentFilters.dinamicos?.[filtro.id] || []).includes(opcao.id)}
                      onCheckedChange={(c) => {
                        const current = currentFilters.dinamicos?.[filtro.id] || [];
                        const updated = c 
                          ? [...current, opcao.id]
                          : current.filter(id => id !== opcao.id);
                        
                        onFilterChange({
                          ...currentFilters,
                          dinamicos: {
                            ...currentFilters.dinamicos,
                            [filtro.id]: updated
                          }
                        });
                      }}
                    />
                    <Label htmlFor={`dyn-${filtro.id}-${opcao.id}`} className="text-sm cursor-pointer flex items-center gap-2">
                      {opcao.cor && opcao.cor !== "#000000" && (
                        <div className="w-3 h-3 rounded-full border border-slate-200" style={{ backgroundColor: opcao.cor }} />
                      )}
                      {opcao.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  );
}

