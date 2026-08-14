import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ChevronDown, ChevronUp, Search as SearchIcon } from "lucide-react";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import type { Produto, Categoria } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { SquarePromoGrid } from "@/components/storefront/SquarePromoGrid";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import mascot404 from "@/assets/404-mascot.png";

export const Route = createFileRoute("/_store/c/$slug")({
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
  notFoundComponent: () => (
    <div className="container-fa py-12 text-center flex flex-col items-center">
      <img src={mascot404} alt="Categoria não encontrada" className="w-64 max-w-full h-auto mb-4 drop-shadow-md" />
      <h1 className="text-2xl font-bold mb-2">Categoria não encontrada</h1>
      <p className="text-muted-foreground mb-6">A categoria que você tentou acessar não existe.</p>
      <Link to="/" className="text-blue-600 font-medium hover:underline">Voltar para o início</Link>
    </div>
  ),
  component: CategoryPage,
});

function CategoryPage() {
  const { cat, unfilteredProducts, filteredProducts, subs } = Route.useLoaderData();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [showSubs, setShowSubs] = useState(false);
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset pagination when category or filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [cat.id, searchParams]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

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
        <Link to="/" className="hover:underline">Início</Link> /{" "}
        <span className="text-foreground">{cat.nome}</span>
      </nav>
      <h1 className="text-3xl font-bold">{cat.nome}</h1>
      {cat.descricaoBreve && (
        <p className="text-sm text-slate-500 mt-2">{cat.descricaoBreve}</p>
      )}
      {cat.descricaoHtml && (
        <div
          className="prose prose-sm max-w-none mt-3 text-muted-foreground"
          dangerouslySetInnerHTML={{ __html: cat.descricaoHtml }}
        />
      )}

      {/* Banners for Category Page */}
      <div className="mt-6 mb-6">
        <HeroCarousel page="Página de Categoria" />
        <SquarePromoGrid page="Página de Categoria" />
      </div>

      {subs.length > 0 && (
        <div className="mt-6 border rounded-xl p-4 bg-slate-50">
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
                     to="/c/$slug"
                     params={{ slug: s.slug }}
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
            {filteredProducts.length} produto{filteredProducts.length === 1 ? "" : "s"} encontrado{filteredProducts.length === 1 ? "" : "s"}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {displayedProducts.map((p: Produto) => (
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
