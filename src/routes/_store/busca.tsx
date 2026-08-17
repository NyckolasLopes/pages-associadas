import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { catalog, FilterOptions } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Produto } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { Button } from "@/components/ui/button";
import { useSearchHistory } from "@/stores/searchHistory";
import { useCart } from "@/stores/cart";

export const Route = createFileRoute("/_store/busca")({
  validateSearch: zodValidator(
    z.object({
      q: z.string().optional().default(""),
      marcas: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      dinamicos: z.record(z.array(z.string())).optional(),
    })
  ),
  component: SearchPage,
});

function SearchPage() {
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const { q, ...filters } = searchParams;
  
  const [unfilteredResults, setUnfilteredResults] = useState<Produto[]>([]);
  const [filteredResults, setFilteredResults] = useState<Produto[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | undefined>(undefined);
  const [visibleCount, setVisibleCount] = useState(24);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const logSearch = useSearchHistory((s) => s.logSearch);

  // Reset pagination when search params change
  useEffect(() => {
    setVisibleCount(24);
  }, [searchParams]);

  useEffect(() => {
    // Fetch unfiltered for sidebar options
    const fetchUnfiltered = async () => {
      const res = q ? await catalog.search(q) : await catalog.listProducts();
      setUnfilteredResults(res);
    };
    fetchUnfiltered();
    
    if (q && selectedPharmacyId) {
      logSearch(selectedPharmacyId, q);
    }
  }, [q, selectedPharmacyId, logSearch]);

  useEffect(() => {
    // Fetch filtered for display
    const fetchFiltered = async () => {
      if (q) {
        const { results, didYouMean: dym } = await catalog.searchWithSuggestions(q, filters);
        setFilteredResults(results);
        setDidYouMean(dym);
      } else {
        const results = await catalog.listProducts(filters);
        setFilteredResults(results);
        setDidYouMean(undefined);
      }
    };
    fetchFiltered();
  }, [q, filters]);

  const handleFilterChange = (newFilters: FilterOptions) => {
    navigate({
      search: { q, ...newFilters } as any,
      replace: true
    });
  };

  const displayedProducts = filteredResults.slice(0, visibleCount);
  const hasMore = visibleCount < filteredResults.length;

  return (
    <div className="container-fa py-8">
      <h1 className="text-3xl font-bold">{q ? `Resultados para "${q}"` : "Todos os Produtos"}</h1>
      
      <div className="mt-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-[280px] shrink-0">
          <ProductFilterSidebar 
            unfilteredProducts={unfilteredResults} 
            currentFilters={filters}
            onFilterChange={handleFilterChange}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <h2 className="text-xl font-bold">Produtos</h2>
          </div>
          
          {didYouMean && (
            <div className="mb-6 p-4 bg-primary/10 rounded-lg border border-primary/20 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground">Você quis dizer</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-bold text-primary text-base"
                onClick={() => navigate({ search: { q: didYouMean } as any, replace: true })}
              >
                {didYouMean}?
              </Button>
            </div>
          )}

          <div className="text-sm text-muted-foreground mb-4">
            {filteredResults.length} produto{filteredResults.length === 1 ? "" : "s"} encontrado{filteredResults.length === 1 ? "" : "s"}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedProducts.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 flex justify-center pb-8">
              <Button 
                onClick={() => setVisibleCount(v => v + 24)} 
                variant="outline" 
                className="w-full md:w-auto font-bold px-8 text-primary border-primary hover:bg-primary hover:text-white"
              >
                Carregar mais produtos
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
