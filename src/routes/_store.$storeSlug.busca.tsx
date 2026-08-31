import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useEffect, useState } from "react";
import { catalog, FilterOptions } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import type { Produto } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { Button } from "@/components/ui/button";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";
import { Search, PackageOpen } from "lucide-react";
import { ProductGridSkeleton } from "@/components/storefront/ProductGridSkeleton";

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
  
  const [productsList, setProductsList] = useState<Produto[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const activePharmacy = useActivePharmacy();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId) || activePharmacy?.id;
  const logSearch = useSearchHistory((s) => s.logSearch);

  useEffect(() => {
    if (q && selectedPharmacyId) {
      logSearch(selectedPharmacyId, q);
    }
  }, [q, selectedPharmacyId, logSearch]);

  useEffect(() => {
    // Fetch initial filtered for display
    let isCurrent = true;
    const fetchFiltered = async () => {
      setLoading(true);
      setPage(0);
      try {
        if (q) {
          const { results, didYouMean: dym } = await catalog.searchWithSuggestions(q, { ...filters, page: 0, pageSize: 24 }, selectedPharmacyId);
          if (!isCurrent) return;
          setProductsList(results || []);
          setDidYouMean(dym);
          setHasMore((results || []).length >= 24);
        } else {
          const results = await catalog.listProducts({ ...filters, page: 0, pageSize: 24 }, selectedPharmacyId);
          if (!isCurrent) return;
          setProductsList(results || []);
          setDidYouMean(undefined);
          setHasMore((results || []).length >= 24);
        }
      } catch (e) {
        if (!isCurrent) return;
        setProductsList([]);
        setHasMore(false);
      } finally {
        if (isCurrent) setLoading(false);
      }
    };
    fetchFiltered();
    return () => {
      isCurrent = false;
    };
  }, [q, JSON.stringify(filters), selectedPharmacyId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      let moreProducts: Produto[] = [];
      if (q) {
        const { results } = await catalog.searchWithSuggestions(q, { ...filters, page: nextPage, pageSize: 24 }, selectedPharmacyId);
        moreProducts = results || [];
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
      <h1 className="text-2xl md:text-3xl font-bold">{q ? `Resultados para "${q}"` : "Todos os Produtos"}</h1>
      
      <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-8">
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
            <h2 className="text-lg md:text-xl font-bold">Produtos</h2>
          </div>
          
          {didYouMean && (
            <div className="mb-6 p-4 bg-primary/10 rounded-xl border border-primary/20 flex flex-wrap items-center gap-2">
              <span className="text-muted-foreground text-sm">Você quis dizer:</span>
              <Button 
                variant="link" 
                className="p-0 h-auto font-bold text-primary text-base"
                onClick={() => navigate({ search: { q: didYouMean } as any, replace: true })}
              >
                {didYouMean}?
              </Button>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              <div className="h-4 w-40 bg-slate-200 rounded animate-pulse mb-4" />
              <ProductGridSkeleton count={12} />
            </div>
          ) : productsList.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-center bg-card rounded-2xl border p-8">
              <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                <PackageOpen className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-foreground mb-2">Nenhum produto encontrado</h3>
              <p className="text-sm text-muted-foreground max-w-md mb-6">
                Não encontramos nenhum resultado para <span className="font-semibold text-foreground">"{q || "sua busca"}"</span>. Tente verificar a ortografia ou buscar por termos mais genéricos.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => navigate({ search: { q: "" } as any, replace: true })}
                >
                  Limpar busca e ver todos
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="text-sm text-muted-foreground mb-4 font-medium">
                {productsList.length} produto{productsList.length === 1 ? "" : "s"} encontrado{productsList.length === 1 ? "" : "s"} {hasMore && "ou mais"}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {productsList.map((p) => (
                  <ProductCard key={p.id} p={p} />
                ))}
              </div>

              {loadingMore && (
                <div className="mt-4">
                  <ProductGridSkeleton count={8} />
                </div>
              )}
              
              {hasMore && (
                <div className="mt-8 flex justify-center pb-8">
                  <Button 
                    onClick={loadMore} 
                    disabled={loadingMore}
                    variant="outline" 
                    className="w-full md:w-auto font-bold px-8 text-primary border-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                  >
                    {loadingMore ? <Spinner size={16} className="mr-2" /> : null}
                    {loadingMore ? "Carregando mais produtos..." : "Carregar mais produtos"}
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
