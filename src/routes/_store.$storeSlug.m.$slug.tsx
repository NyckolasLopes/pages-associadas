import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useMarcasStore } from "@/stores/marcas";
import { useAdmin } from "@/stores/admin";
import { safeSlugify } from "@/hooks/useActivePharmacy";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ProductGridSkeleton } from "@/components/storefront/ProductGridSkeleton";

export const Route = createFileRoute("/_store/$storeSlug/m/$slug")({
  loader: async ({ params }) => {
    // 1. Garantir marcas carregadas
    let marcas = useMarcasStore.getState().marcas;
    if (!marcas || marcas.length === 0) {
      await useMarcasStore.getState().loadMarcas();
      marcas = useMarcasStore.getState().marcas;
    }

    // 2. Resolver a loja / lojaId a partir do storeSlug
    const storeSlug = params.storeSlug;
    const { useAdmin } = await import("@/stores/admin");
    const adminState = useAdmin.getState();
    let pharmacies = adminState.pharmacies;
    if (!pharmacies || pharmacies.length === 0) {
      await adminState.loadPharmacies();
      pharmacies = useAdmin.getState().pharmacies;
    }
    const cleanStoreSlug = (storeSlug || "").toLowerCase();
    const loja = (pharmacies || []).find((ph: any) => 
      (ph.slug || "").toLowerCase() === cleanStoreSlug ||
      String(ph.id).toLowerCase() === cleanStoreSlug ||
      safeSlugify(ph.slug || ph.nome || "") === cleanStoreSlug
    );
    const lojaId = loja?.id || null;

    // 3. Encontrar a marca pelo slug ou seoUrl
    const cleanSlug = (params.slug || "").toLowerCase();
    const cleanSlugNorm = safeSlugify(params.slug || "");
    const marca = (marcas || []).find(m => 
      (m.seoUrl && m.seoUrl.toLowerCase() === cleanSlug) || 
      (m.slug && m.slug.toLowerCase() === cleanSlug) ||
      (m.id && String(m.id).toLowerCase() === cleanSlug) ||
      (m.nome && m.nome.toLowerCase() === cleanSlug) ||
      (m.slug && safeSlugify(m.slug) === cleanSlugNorm) ||
      (m.seoUrl && safeSlugify(m.seoUrl) === cleanSlugNorm) ||
      (m.nome && safeSlugify(m.nome) === cleanSlugNorm)
    );
    const brandName = marca ? marca.nome : params.slug.toUpperCase().replace(/-/g, " ");
    
    // 4. Buscar produtos da marca com o contexto da loja
    const produtos = await catalog.productsByBrand(brandName, { page: 0, pageSize: 24 }, lojaId);
    
    return { 
      slug: params.slug, 
      produtos, 
      fallbackBrandName: brandName,
      lojaId,
      storeSlug 
    };
  },
  head: ({ loaderData, params }: any) => {
    if (!loaderData) return {};
    
    const state = useMarcasStore.getState();
    const cleanSlug = (loaderData.slug || "").toLowerCase();
    const cleanSlugNorm = safeSlugify(loaderData.slug || "");
    const marca = state.marcas.find(m => 
      (m.seoUrl && m.seoUrl.toLowerCase() === cleanSlug) || 
      (m.slug && m.slug.toLowerCase() === cleanSlug) ||
      (m.id && String(m.id).toLowerCase() === cleanSlug) ||
      (m.nome && m.nome.toLowerCase() === cleanSlug) ||
      (m.slug && safeSlugify(m.slug) === cleanSlugNorm) ||
      (m.seoUrl && safeSlugify(m.seoUrl) === cleanSlugNorm) ||
      (m.nome && safeSlugify(m.nome) === cleanSlugNorm)
    );
    const storeSlug = params?.storeSlug || "loja-padrao";
    const brandName = marca ? marca.nome : loaderData.fallbackBrandName;
    const desc = marca?.descricao || `Compre produtos da marca ${brandName} com os melhores preços na Farmácias Associadas.`;
    const brandUrl = `https://farmaciasassociadas.com.br/${storeSlug}/m/${loaderData.slug}`;

    return {
      links: [
        { rel: "canonical", href: brandUrl },
      ],
      meta: [
        { title: `${brandName} — Farmácias Associadas` },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:title", content: `${brandName} — Farmácias Associadas` },
        { property: "og:description", content: desc },
        { property: "og:url", content: brandUrl },
        { property: "og:type", content: "website" },
        { property: "og:site_name", content: "Farmácias Associadas" },
        ...(marca?.logo ? [{ property: "og:image", content: marca.logo }] : []),
        { name: "twitter:card", content: "summary" },
        { name: "twitter:title", content: `${brandName} — Farmácias Associadas` },
        { name: "twitter:description", content: desc },
      ],
    };
  },
  component: BrandPage,
});

function BrandPage() {
  const { slug, produtos, fallbackBrandName, lojaId, storeSlug } = Route.useLoaderData();
  const { storeSlug: paramStoreSlug } = Route.useParams();
  
  // Get reactive store data
  const { marcas, loadMarcas } = useMarcasStore();
  const { pharmacies, activePharmacyId } = useAdmin();

  useEffect(() => {
    loadMarcas();
  }, [loadMarcas]);

  const cleanSlug = (slug || "").toLowerCase();
  const cleanSlugNorm = safeSlugify(slug || "");
  const marca = marcas.find(m => 
    (m.seoUrl && m.seoUrl.toLowerCase() === cleanSlug) || 
    (m.slug && m.slug.toLowerCase() === cleanSlug) ||
    (m.id && String(m.id).toLowerCase() === cleanSlug) ||
    (m.nome && m.nome.toLowerCase() === cleanSlug) ||
    (m.slug && safeSlugify(m.slug) === cleanSlugNorm) ||
    (m.seoUrl && safeSlugify(m.seoUrl) === cleanSlugNorm) ||
    (m.nome && safeSlugify(m.nome) === cleanSlugNorm)
  );
  
  const brand = marca?.nome || fallbackBrandName;
  const desc = marca?.descricao || `Conheça e compre toda a linha de produtos da ${brand}.`;
  const logo = marca?.logo;
  
  const effectiveStoreSlug = paramStoreSlug || storeSlug || "loja-padrao";
  const currentLoja = pharmacies.find(p => (p.slug || "").toLowerCase() === effectiveStoreSlug.toLowerCase()) ||
    (activePharmacyId ? pharmacies.find(p => p.id === activePharmacyId) : null);
  const effectiveLojaId = lojaId || currentLoja?.id || null;

  const brandUrl = `https://farmaciasassociadas.com.br/${effectiveStoreSlug}/m/${slug}`;
  const storeUrl = `https://farmaciasassociadas.com.br/${effectiveStoreSlug}`;

  const schemaOrg = [
    {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      "@id": `${brandUrl}#brandCollection`,
      "name": `Produtos ${brand} | Farmácias Associadas`,
      "description": desc,
      "url": brandUrl,
      "about": {
        "@type": "Brand",
        "name": brand,
        ...(logo ? { "logo": logo, "image": logo } : {})
      }
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        {
          "@type": "ListItem",
          "position": 1,
          "name": "Início",
          "item": storeUrl
        },
        {
          "@type": "ListItem",
          "position": 2,
          "name": brand,
          "item": brandUrl
        }
      ]
    }
  ];
  
  const [productsList, setProductsList] = useState(produtos);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(produtos.length >= 24);

  useEffect(() => {
    setProductsList(produtos);
    setPage(0);
    setHasMore(produtos.length >= 24);
  }, [slug, produtos]);

  // Se o loader retornou vazio (ex: carregamento antes da hidratação da loja/marcas), faz nova busca no cliente
  useEffect(() => {
    let isMounted = true;
    if (productsList.length === 0) {
      catalog.productsByBrand(brand, { page: 0, pageSize: 24 }, effectiveLojaId)
        .then((fresh) => {
          if (isMounted && fresh && fresh.length > 0) {
            setProductsList(fresh);
            setHasMore(fresh.length >= 24);
          }
        })
        .catch(console.error);
    }
    return () => { isMounted = false; };
  }, [brand, effectiveLojaId]);

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    const nextPage = page + 1;
    try {
      const moreProducts = await catalog.productsByBrand(brand, { page: nextPage, pageSize: 24 }, effectiveLojaId);
      setProductsList((prev: any) => [...prev, ...moreProducts]);
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      <nav className="text-xs text-muted-foreground mb-4 flex items-center flex-wrap gap-1">
        <Link to="/$storeSlug" params={{ storeSlug: storeSlug || "loja-padrao" }} className="hover:underline">Início</Link> /{" "}
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
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 md:gap-4 items-stretch">
            {productsList.map((p: any) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>

          {loadingMore && (
            <div className="mt-4">
              <ProductGridSkeleton count={10} />
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
                {loadingMore ? "Carregando produtos..." : "Carregar mais produtos"}
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
