import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, notFound, Link, useNavigate } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { ProductCard } from "@/components/storefront/ProductCard";
import { Button } from "@/components/ui/button";
import type { Produto, Vitrine } from "@/types";
import { ProductFilterSidebar } from "@/components/storefront/ProductFilterSidebar";
import { z } from "zod";
import { zodValidator } from "@tanstack/zod-adapter";
import { useAdminProducts } from "@/stores/products";
import { catalog } from "@/services/catalog";
import { NotFound } from "@/components/storefront/NotFound";
import { Flame, Sparkles, TrendingUp, Percent, Tag, Heart, ShoppingBag, Pill, Leaf, Baby, Flower2, Stethoscope, Sun, Dumbbell, Activity, ShieldCheck, Thermometer, Battery, Wind, Droplets, Eye, Smile, Coffee, HeartPulse, Scale, BriefcaseMedical } from "lucide-react";

const VITRINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame, Sparkles, TrendingUp, Percent, Tag, Heart, ShoppingBag, Pill, Leaf, Baby, Flower2, Stethoscope, Sun, Dumbbell, Activity, ShieldCheck, Thermometer, Battery, Wind, Droplets, Eye, Smile, Coffee, HeartPulse, Scale, BriefcaseMedical
};

import { useCart } from "@/stores/cart";
import { ProductGridSkeleton } from "@/components/storefront/ProductGridSkeleton";

export const Route = createFileRoute("/_store/$storeSlug/v/$slug")({
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
    // In loader we can access the state directly
    const lojaId = useCart.getState().selectedPharmacyId;
    const vitrines = useAdminProducts.getState().getStoreVitrines(lojaId);
    const vitrine = vitrines.find(v => {
      if (v.lojaVinculadaId && v.lojaVinculadaId !== lojaId) return false;
      const slug = v.linkSeo || v.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      return slug === params.slug;
    });

    if (!vitrine) throw notFound();

    const isOfertasSemana = vitrine.categoriaId === "ofertas" || 
                            vitrine.linkSeo === "ofertas-da-semana" || 
                            (vitrine.nome && vitrine.nome.toLowerCase().includes("ofertas da semana"));

    const filteredProducts = await catalog.productsByVitrine(
      vitrine.id.toString(), 
      vitrine.categoriaId, 
      deps, 
      (vitrine.modo === "manual" || (isOfertasSemana && vitrine.produtoIds && vitrine.produtoIds.length > 0)) ? vitrine.produtoIds : undefined,
      lojaId
    );

    return { vitrine, unfilteredProducts: filteredProducts, filteredProducts };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { vitrine } = loaderData;
    const title = vitrine.tituloSeo || `${vitrine.nome} | Farmácias Associadas`;
    const desc = vitrine.descricaoSeo || `Confira as melhores ofertas de ${vitrine.nome} online nas Farmácias Associadas com os melhores preços. Entrega rápida e segura para toda a família.`;
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
  notFoundComponent: () => <NotFound type="showcase" />,
  component: VitrinePage,
});

function VitrinePage() {
  const { vitrine, unfilteredProducts, filteredProducts } = Route.useLoaderData();
  const { storeSlug } = Route.useParams();
  const searchParams = Route.useSearch();
  const navigate = useNavigate();
  const [visibleCount, setVisibleCount] = useState(24);

  // Reset pagination when vitrine or filters change
  useEffect(() => {
    setVisibleCount(24);
  }, [vitrine.id, searchParams]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = visibleCount < filteredProducts.length;

  const handleFilterChange = (newFilters: any) => {
    navigate({
      search: newFilters,
      replace: true,
      params: { slug: vitrine.linkSeo || vitrine.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') } as any
    });
  };

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": vitrine.nome,
    "description": vitrine.descricaoSeo || `Produtos em destaque: ${vitrine.nome}`,
  };

  const IconComponent = vitrine.icone ? VITRINE_ICONS[vitrine.icone] || Sparkles : Sparkles;

  return (
    <div className="container-fa py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <nav className="text-xs text-muted-foreground mb-3">
        <Link to="/$storeSlug" params={{ storeSlug: storeSlug || "loja-padrao" }} className="hover:underline">Início</Link> /{" "}
        <span className="text-foreground">{vitrine.nome}</span>
      </nav>
      <h1 className="text-3xl font-bold flex items-center gap-2">
        <IconComponent className="h-8 w-8 text-primary" />
        {vitrine.nome}
      </h1>
      
      {vitrine.descricaoSeo && (
        <div className="prose prose-sm max-w-none mt-3 text-muted-foreground">
          <p>{vitrine.descricaoSeo}</p>
        </div>
      )}

      <div className="mt-6 md:mt-8 flex flex-col md:flex-row gap-4 md:gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-[280px] shrink-0">
          <ProductFilterSidebar 
            unfilteredProducts={unfilteredProducts} 
            currentFilters={searchParams}
            onFilterChange={handleFilterChange}
            isCategory={false}
          />
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4 border-b pb-4">
            <h2 className="text-xl font-bold">Resultado de busca feita por vitrine</h2>
          </div>
          <div className="text-sm text-muted-foreground mb-4">
            {filteredProducts.length} produto{filteredProducts.length === 1 ? "" : "s"} encontrado{filteredProducts.length === 1 ? "" : "s"}
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 items-stretch">
            {displayedProducts.map((p: Produto) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          
          {hasMore && (
            <div className="mt-8 flex justify-center pb-8">
              <Button 
                onClick={() => setVisibleCount(v => v + 24)} 
                variant="outline" 
                className="w-full md:w-auto font-bold px-8 text-primary border-primary hover:bg-primary hover:text-white transition-all shadow-sm"
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
