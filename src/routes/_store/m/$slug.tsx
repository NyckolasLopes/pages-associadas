import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useMarcasStore } from "@/stores/marcas";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export const Route = createFileRoute("/_store/m/$slug")({
  loader: async ({ params }) => {
    // We can't access zustand store directly in the loader without importing the state, 
    // but since it's an indexedDB persisted store it might not be hydrated yet on first load in the loader.
    // So we fetch the products generically based on the slug, or we can get the brand inside the component.
    const state = useMarcasStore.getState();
    const marca = state.marcas.find(m => (m.seoUrl === params.slug) || (m.slug === params.slug));
    
    // If we can't find it immediately in state, fallback to using the slug as brand name
    const brandName = marca ? marca.nome : params.slug.toUpperCase().replace("-", " ");
    const produtos = await catalog.productsByBrand(brandName);
    
    return { slug: params.slug, produtos, fallbackBrandName: brandName };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    
    const state = useMarcasStore.getState();
    const marca = state.marcas.find(m => (m.seoUrl === loaderData.slug) || (m.slug === loaderData.slug));
    
    const brandName = marca ? marca.nome : loaderData.fallbackBrandName;
    const desc = marca?.descricao || `Compre produtos da marca ${brandName} com os melhores preços na Farmácias Associadas.`;
    
    return {
      meta: [
        { title: `${brandName} — Farmácias Associadas` },
        { name: "description", content: desc },
        { property: "og:title", content: `${brandName} — Farmácias Associadas` },
        { property: "og:description", content: desc }
      ],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { slug, produtos, fallbackBrandName } = Route.useLoaderData();
  
  // Get reactive store data
  const { marcas } = useMarcasStore();
  const marca = marcas.find(m => (m.seoUrl === slug) || (m.slug === slug));
  
  const brand = marca?.nome || fallbackBrandName;
  const desc = marca?.descricao || `Conheça e compre toda a linha de produtos da ${brand}.`;
  const logo = marca?.logo;
  
  const [productsList, setProductsList] = useState(produtos);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(produtos.length >= 24);

  useEffect(() => {
    setProductsList(produtos);
    setPage(0);
    setHasMore(produtos.length >= 24);
  }, [slug, produtos]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const moreProducts = await catalog.productsByBrand(brand, { page: nextPage, pageSize: 24 });
      setProductsList(prev => [...prev, ...moreProducts]);
      setPage(nextPage);
      if (moreProducts.length < 24) setHasMore(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="container-fa py-8">
      <nav className="text-xs text-muted-foreground mb-4 flex items-center flex-wrap gap-1">
        <Link to="/" className="hover:underline">Início</Link> /{" "}
        <span className="text-foreground font-bold">{brand}</span>
      </nav>
      
      <div className="bg-white border rounded-2xl p-6 md:p-10 mb-8 flex flex-col md:flex-row items-center gap-6 md:gap-10 shadow-sm">
        <div className="w-40 h-28 shrink-0 flex items-center justify-center p-4 border rounded-xl bg-slate-50">
           {logo ? (
             <img src={logo} alt={brand} className="max-w-full max-h-full object-contain mix-blend-multiply" />
           ) : (
             <span className="font-black text-muted-foreground/60 tracking-wider text-xl text-center uppercase">{brand}</span>
           )}
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-3">{brand}</h1>
          <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
            {desc}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold">Produtos {brand}</h2>
        <span className="text-sm text-muted-foreground">{productsList.length} {productsList.length === 1 ? 'produto encontrado' : 'produtos encontrados'} {hasMore && "ou mais"}</span>
      </div>

      {productsList.length > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4">
            {productsList.map((p: any) => (
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
        </>
      ) : (
        <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed">
          <p className="text-muted-foreground">Nenhum produto cadastrado para esta marca no momento.</p>
        </div>
      )}
    </div>
  );
}
