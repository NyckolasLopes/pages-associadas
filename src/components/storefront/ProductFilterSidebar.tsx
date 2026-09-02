import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { FilterOptions } from "@/services/catalog";
import { useState, useEffect } from "react";
import type { Produto } from "@/types";
import { useAdminFiltros } from "@/stores/filtros";
import { SlidersHorizontal } from "lucide-react";

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
  const [mobileOpen, setMobileOpen] = useState(false);
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

  const handleCheckboxArray = (key: 'marcas' | 'tarjas', value: string, checked: boolean) => {
    const current = currentFilters[key] || [];
    const updated = checked 
      ? [...current, value]
      : current.filter(v => v !== value);
    
    onFilterChange({ ...currentFilters, [key]: updated.length > 0 ? updated : undefined });
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

  const renderFilterAccordion = (idPrefix: string) => (
    <Accordion type="multiple" defaultValue={["price", "brand", "generic", "prescription", "tarja"]} className="w-full">
      {/* Preço */}
      {showPrice && (
        <AccordionItem value="price" className="border-b-0 mb-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
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
              <Button size="sm" className="h-8 px-2.5 font-bold" onClick={applyPriceFilter}>Ok</Button>
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
                      id={`${idPrefix}-price-${i}`} 
                      checked={isActive}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onFilterChange({ ...currentFilters, minPrice: range.min, maxPrice: range.max });
                        } else {
                          onFilterChange({ ...currentFilters, minPrice: undefined, maxPrice: undefined });
                        }
                      }}
                    />
                    <Label htmlFor={`${idPrefix}-price-${i}`} className="text-sm cursor-pointer">{range.label}</Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Marca */}
      {showBrand && availableBrands.length > 0 && (
        <AccordionItem value="brand" className="border-b-0 mb-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 font-bold text-sm text-slate-700">
            Marca
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {availableBrands.map((b) => (
                <div key={b} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${idPrefix}-brand-${b}`} 
                    checked={(currentFilters.marcas || []).includes(b)}
                    onCheckedChange={(c) => handleCheckboxArray('marcas', b, c as boolean)}
                  />
                  <Label htmlFor={`${idPrefix}-brand-${b}`} className="text-sm cursor-pointer truncate" title={b}>{b}</Label>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      )}

      {/* Dynamic Filters */}
      {filtrosDinamicos.map(filtro => (
        <AccordionItem key={filtro.id} value={`dyn-${filtro.id}`} className="border-b-0 mb-2 bg-white border border-slate-200/80 rounded-xl overflow-hidden shadow-xs">
          <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-slate-50 font-bold text-sm text-slate-700">
            {filtro.nome}
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-2 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
              {filtro.opcoes.map(opcao => (
                <div key={opcao.id} className="flex items-center space-x-2">
                  <Checkbox 
                    id={`${idPrefix}-dyn-${filtro.id}-${opcao.id}`} 
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
                  <Label htmlFor={`${idPrefix}-dyn-${filtro.id}-${opcao.id}`} className="text-sm cursor-pointer flex items-center gap-2">
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
  );

  return (
    <>
      {/* Mobile Trigger Button and Modal */}
      <div className="md:hidden w-full">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="w-full bg-white hover:bg-slate-50 active:bg-slate-100 border border-slate-200 rounded-xl px-4 py-3 flex items-center justify-between shadow-xs transition-colors text-left"
        >
          <div className="flex items-center gap-3">
            <SlidersHorizontal className="w-5 h-5 text-[#f37021]" />
            <span className="font-semibold text-slate-800 text-base">Filtro</span>
          </div>
          {activeFiltersCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
              {activeFiltersCount} {activeFiltersCount === 1 ? 'ativo' : 'ativos'}
            </span>
          )}
        </button>

        <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
          <DialogContent className="max-w-md w-[92vw] max-h-[85vh] p-0 flex flex-col overflow-hidden rounded-2xl sm:rounded-2xl border-slate-200 shadow-xl">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <SlidersHorizontal className="w-5 h-5 text-[#f37021]" />
                <DialogTitle className="text-lg font-bold text-slate-800">Filtros</DialogTitle>
                {activeFiltersCount > 0 && (
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              {activeFiltersCount > 0 && (
                <button 
                  type="button"
                  onClick={clearFilters}
                  className="text-xs text-primary hover:underline font-bold mr-6"
                >
                  Limpar todos
                </button>
              )}
            </div>

            {/* Scrollable Filter Options */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[calc(85vh-140px)] custom-scrollbar">
              {renderFilterAccordion("mobile")}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 bg-white flex items-center gap-3">
              {activeFiltersCount > 0 && (
                <Button 
                  type="button"
                  variant="outline"
                  onClick={clearFilters}
                  className="font-bold border-slate-200 text-slate-700 hover:bg-slate-50"
                >
                  Limpar
                </Button>
              )}
              <Button 
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold py-2.5 rounded-xl shadow-sm transition"
              >
                Aplicar Filtros
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Desktop Sidebar */}
      <div className={`hidden md:block space-y-4 ${className}`}>
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

        {renderFilterAccordion("desktop")}
      </div>
    </>
  );
}
