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
import { Search, PackageOpen, Loader2 } from "lucide-react";
import { ProductGridSkeleton } from "@/components/storefront/ProductGridSkeleton";
import mascotNotFound from "@/assets/produto-nao-encontrado.png";
import { useCart } from "@/stores/cart";
import { useSearchHistory } from "@/stores/searchHistory";

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
  const [unfilteredResults, setUnfilteredResults] = useState<Produto[]>([]);
  const [didYouMean, setDidYouMean] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const activePharmacy = useActivePharmacy();
  const isParceiro = activePharmacy?.categoriaAssociado === 'Parceiro';
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
          setUnfilteredResults(results || []);
          setDidYouMean(dym);
          setHasMore((results || []).length >= 24);
        } else {
          const results = await catalog.listProducts({ ...filters, page: 0, pageSize: 24 }, selectedPharmacyId);
          if (!isCurrent) return;
          setProductsList(results || []);
          setUnfilteredResults(results || []);
          setDidYouMean(undefined);
          setHasMore((results || []).length >= 24);
        }
      } catch (e) {
        if (!isCurrent) return;
        setProductsList([]);
        setUnfilteredResults([]);
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
      
      <div className="mt-4 md:mt-8 flex flex-col md:flex-row gap-4 md:gap-8">
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
            isParceiro ? (
              <div className="py-12 px-4 flex flex-col items-center justify-center text-center bg-card rounded-2xl border p-8 animate-in fade-in duration-300">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4 text-muted-foreground">
                  <Search className="w-8 h-8 opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">Nenhum produto encontrado</h3>
                <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Não encontramos nenhum resultado para <span className="font-semibold text-foreground">"{q || "sua busca"}"</span>. Tente verificar a ortografia ou buscar por outros termos.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button 
                    variant="outline" 
                    onClick={() => navigate({ search: { q: "" } as any, replace: true })}
                    className="font-bold px-6 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Ver todos os produtos
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-8 px-4 flex flex-col items-center justify-center text-center bg-white dark:bg-card rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm animate-in fade-in duration-300">
                <img 
                  src={mascotNotFound} 
                  alt="Produto não encontrado" 
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  className="w-full max-w-[300px] sm:max-w-[360px] h-auto mb-4 object-contain pointer-events-none drop-shadow-sm" 
                />
                {q && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 mb-3">
                    <span>Nenhum resultado para:</span>
                    <span className="font-bold text-foreground">"{q}"</span>
                  </div>
                )}
                <p className="text-xs sm:text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
                  Tente verificar a ortografia, buscar pela marca, princípio ativo ou categoria do produto.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button 
                    onClick={() => navigate({ search: { q: "" } as any, replace: true })}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-6 py-2.5 rounded-xl shadow-sm transition"
                  >
                    Ver todos os produtos
                  </Button>
                </div>
              </div>
            )
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
                    {loadingMore ? <Loader2 size={16} className="mr-2 animate-spin" /> : null}
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
