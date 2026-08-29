import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { catalog, FilterOptions } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Produto } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { useSearchHistory } from "@/stores/searchHistory";
import { useCart } from "@/stores/cart";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";

export const Route = createFileRoute("/_store/$storeSlug/busca")({
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
  const [productsList, setProductsList] = useState<Produto[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | undefined>(undefined);
  
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const { activePharmacy } = useActivePharmacy();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId) || activePharmacy?.id;
  const logSearch = useSearchHistory((s) => s.logSearch);

  useEffect(() => {
    // Fetch unfiltered for sidebar options (limited subset just for filters logic)
    const fetchUnfiltered = async () => {
      const res = q ? await catalog.search(q, { pageSize: 120 }, selectedPharmacyId) : await catalog.listProducts({ pageSize: 120 }, selectedPharmacyId);
      setUnfilteredResults(res);
    };
    fetchUnfiltered();
    
    if (q && selectedPharmacyId) {
      logSearch(selectedPharmacyId, q);
    }
  }, [q, selectedPharmacyId, logSearch]);

  useEffect(() => {
    // Fetch initial filtered for display
    const fetchFiltered = async () => {
      setPage(0);
      if (q) {
        const { results, didYouMean: dym } = await catalog.searchWithSuggestions(q, { ...filters, page: 0, pageSize: 24 }, selectedPharmacyId);
        setProductsList(results);
        setDidYouMean(dym);
        setHasMore(results.length >= 24);
      } else {
        const results = await catalog.listProducts({ ...filters, page: 0, pageSize: 24 }, selectedPharmacyId);
        setProductsList(results);
        setDidYouMean(undefined);
        setHasMore(results.length >= 24);
      }
    };
    fetchFiltered();
  }, [q, filters]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      let moreProducts: Produto[] = [];
      if (q) {
        const { results } = await catalog.searchWithSuggestions(q, { ...filters, page: nextPage, pageSize: 24 }, selectedPharmacyId);
        moreProducts = results;
      } else {
        moreProducts = await catalog.listProducts({ ...filters, page: nextPage, pageSize: 24 }, selectedPharmacyId);
      }
      setProductsList(prev => [...prev, ...moreProducts]);
      setPage(nextPage);
      if (moreProducts.length < 24) setHasMore(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilters: FilterOptions) => {
    navigate({
      search: { q, ...newFilters } as any,
      replace: true
    });
  };



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
            {productsList.length} produto{productsList.length === 1 ? "" : "s"} encontrado{productsList.length === 1 ? "" : "s"} {hasMore && "ou mais"}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {productsList.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 flex justify-center pb-8">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline" 
                className="w-full md:w-auto font-bold px-8 text-primary border-primary hover:bg-primary hover:text-white"
              >
                {loadingMore ? <Spinner size={16} className="mr-2" /> : null}
                {loadingMore ? "Carregando..." : "Carregar mais produtos"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
