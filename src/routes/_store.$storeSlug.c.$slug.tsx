import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search as SearchIcon, ChevronRight } from "lucide-react";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Produto, Categoria } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { SquarePromoGrid } from "@/components/storefront/SquarePromoGrid";
import { sanitizeHtml } from "@/lib/security";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { NotFound } from "@/components/storefront/NotFound";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export const Route = createFileRoute("/_store/$storeSlug/c/$slug")({
  validateSearch: zodValidator(
    z.object({
      marcas: z.array(z.string()).optional(),
      minPrice: z.number().optional(),
      maxPrice: z.number().optional(),
      dinamicos: z.record(z.array(z.string())).optional(),
    })
  ),
  loaderDeps: ({ search }) => search,
  loader: async ({ params, deps }) => {
    const cat = await catalog.getCategoryBySlug(params.slug);
    if (!cat) throw notFound();
    
    const [unfilteredProducts, filteredProducts, subs] = await Promise.all([
      catalog.productsByCategory(cat.id),
      catalog.productsByCategory(cat.id, deps),
      catalog.listSubcategories(cat.id),
    ]);
    
    return { cat, unfilteredProducts, filteredProducts, subs };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const cat = loaderData.cat;
    const title = cat.metaTitle || `${cat.nome} | Farmácias Associadas`;
    const desc = cat.metaDescription || `Compre ${cat.nome} online nas Farmácias Associadas com os melhores preços. Entrega rápida e segura para toda a família.`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
      ],
    };
  },
  errorComponent: ({ error }) => (
    <div className="container-fa py-12 text-center">{error.message}</div>
  ),
  notFoundComponent: () => <NotFound type="category" />,
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, unfilteredProducts, filteredProducts: initialProducts, subs } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const { storeSlug } = Route.useParams();
  const navigate = useNavigate();
  const [showSubs, setShowSubs] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  
  const [products, setProducts] = useState<Produto[]>(initialProducts);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialProducts.length >= 24);

  const allBanners = useAdmin((s) => s.banners);
  const lojaId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);
  
  const categoryBanners = allBanners.filter(b => 
    b.active && 
    b.posicao === "Banner por Categoria" && 
    String(b.topicoVinculado) === String(cat.id) &&
    (!b.lojaId || b.lojaId === lojaId)
  );

  // Reset pagination when category or filters change
  useEffect(() => {
    setProducts(initialProducts);
    setPage(0);
    setHasMore(initialProducts.length >= 24);
    setDescExpanded(false);
  }, [cat.id, searchParams, initialProducts]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const moreProducts = await catalog.productsByCategory(cat.id, { ...searchParams, page: nextPage, pageSize: 24 });
      setProducts(prev => [...prev, ...moreProducts]);
      setPage(nextPage);
      if (moreProducts.length < 24) {
        setHasMore(false);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  const handleFilterChange = (newFilters: any) => {
    navigate({
      search: newFilters,
      replace: true,
      params: { slug: cat.slug } as any
    });
  };

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": cat.nome,
    "description": cat.descricaoBreve || `Categoria de produtos: ${cat.nome}`,
    "url": `https://associadas.com.br/c/${cat.slug}`
  };

  return (
    <div className="container-fa py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/$storeSlug" params={{ storeSlug: storeSlug || "loja-padrao" }} className="hover:underline">Início</Link> /{" "}
        <span className="text-foreground">{cat.nome}</span>
      </nav>
      <h1 className="text-3xl font-bold mb-4">{cat.nome}</h1>
      
      {/* Banner por Categoria renderizado logo abaixo do título */}
      {categoryBanners.length > 0 && (
        <div className="mb-6 rounded-xl overflow-hidden shadow-sm border border-slate-100">
          <img 
            src={categoryBanners[0].imageUrl} 
            alt={categoryBanners[0].nome || cat.nome} 
            className="w-full h-auto object-cover max-h-[300px]"
          />
        </div>
      )}

      {/* Descrição Expansível */}
      {(cat.descricaoBreve || cat.descricaoHtml) && (
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 mb-8 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setDescExpanded(!descExpanded)}>
            <h3 className="font-bold text-slate-800 text-lg">Descrição da Categoria</h3>
            <button className="text-primary font-medium text-sm flex items-center gap-1 hover:underline">
              {descExpanded ? "Ler menos" : "Ler mais"}
              {descExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
          
          <div className={`mt-3 prose prose-sm max-w-none text-slate-600 transition-all duration-300 ease-in-out ${descExpanded ? "max-h-[2000px] opacity-100" : "max-h-[4.5rem] overflow-hidden opacity-80"}`}>
            {cat.descricaoHtml ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(cat.descricaoHtml) }} />
            ) : (
              <p>{cat.descricaoBreve}</p>
            )}
          </div>
          
          {!descExpanded && (
            <div 
              className="h-12 w-full absolute bottom-0 left-0 bg-gradient-to-t from-slate-50 to-transparent pointer-events-none"
            />
          )}
        </div>
      )}

      {subs.length > 0 && (
        <div className="mt-6 border rounded-xl p-4 bg-slate-50 mb-6">
           <button 
             onClick={() => setShowSubs(!showSubs)}
             className="w-full flex items-center justify-between font-bold text-sm text-slate-700 hover:text-primary transition"
           >
             <span className="flex items-center gap-2 text-primary">
               <SearchIcon className="h-4 w-4" />
               Pesquisa Rápida
             </span>
             {showSubs ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
           </button>
           
           {showSubs && (
             <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200 items-center">
               {subs.map((s: Categoria) => {
                 const isMarcaPropria = cat.id === "300";
                 return (
                   <Link
                     key={s.id}
                     to="/$storeSlug/c/$slug"
                     params={{ storeSlug: storeSlug || "loja-padrao", slug: s.slug }}
                     className={isMarcaPropria 
                       ? "bg-white p-2 border rounded-xl hover:border-primary hover:shadow-md transition flex items-center justify-center shrink-0 h-12 min-w-[90px]" 
                       : "text-[11px] md:text-xs px-3 py-1.5 bg-secondary text-white font-bold rounded-full hover:bg-primary transition shadow-sm"
                     }
                     title={isMarcaPropria ? s.nome : undefined}
                   >
                     {isMarcaPropria ? (
                       <img src={`/marcas/${s.slug}.png`} alt={s.nome} className="max-h-full max-w-full object-contain mix-blend-multiply" />
                     ) : (
                       s.nome
                     )}
                   </Link>
                 );
               })}
             </div>
           )}
        </div>
      )}

      {/* Banners for Category Page */}
      <div className="mb-6">
        <HeroCarousel page="Página de Categoria" categoriaId={cat.id} />
        <SquarePromoGrid page="Página de Categoria" />
      </div>

      <div className="mt-8 flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-[280px] shrink-0">
          <ProductFilterSidebar 
            unfilteredProducts={unfilteredProducts} 
            currentFilters={searchParams}
            onFilterChange={handleFilterChange}
            isCategory={true}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <h2 className="text-xl font-bold">Resultado de busca feita por categoria</h2>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {products.length} produto{products.length === 1 ? "" : "s"} encontrado{products.length === 1 ? "" : "s"} {hasMore && "ou mais"}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {products.map((p: Produto) => (
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
