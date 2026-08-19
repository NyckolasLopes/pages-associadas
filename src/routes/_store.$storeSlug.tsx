import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useEffect, useState, useMemo } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductCarousel } from "@/components/storefront/ProductCarousel";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { SquarePromoGrid } from "@/components/storefront/SquarePromoGrid";
import { ServicesSection } from "@/components/storefront/ServicesSection";
import { Clock, Store, Percent, Activity, ScanBarcode, Pill, Sparkles, Leaf, Stethoscope, Baby, Flower2, ShoppingBag, Sun, TrendingUp, Heart, Handshake, Tag, Droplets, HeartPulse, Eye, Smile, User, Scale, Coffee, Dumbbell, Thermometer, BriefcaseMedical, Battery, Wind, Flame, Truck, MapPin, ShieldCheck, Banknote, ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import { isCampanhaAtiva } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";

import { GeoPopup } from "@/components/storefront/GeoPopup";
// InstallPrompt are rendered globally in __root.tsx
import type { Produto, Categoria, VitrineLocal } from "@/types";
import { useAdmin } from "@/stores/admin";
import { useCart, useGeoCep } from "@/stores/cart";
import mascot404 from "@/assets/404-mascot.png";
import { useLive } from "@/stores/live";
import { useAdminProducts } from "@/stores/products";
import { useMarcasStore } from "@/stores/marcas";
import { getDeterministicStock } from "@/lib/stock";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
const VITRINE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Flame: Flame, Sparkles: Sparkles, TrendingUp: TrendingUp, Percent: Percent, Tag: Tag,
  Heart: Heart, Star: Star, ShoppingBag: ShoppingBag, Pill: Pill, Leaf: Leaf,
  Baby: Baby, Flower2: Flower2, Stethoscope: Stethoscope, Sun: Sun, Dumbbell: Dumbbell,
  Activity: Activity, ShieldCheck: ShieldCheck, Thermometer: Thermometer, Battery: Battery,
  Wind: Wind, Droplets: Droplets, Eye: Eye, Smile: Smile, Coffee: Coffee,
  HeartPulse: HeartPulse, Scale: Scale, BriefcaseMedical: BriefcaseMedical, Handshake: Handshake,
};

function DynamicVitrines({ local, page = "Página inicial", lojaId }: { local: VitrineLocal; page?: string; lojaId?: string }) {
  const allVitrines = useAdminProducts((s) => s.vitrines);
  const customProducts = useAdminProducts((s) => s.customProducts);
  
  const vitrines = useMemo(() => 
    (allVitrines || [])
      .filter(v => v.ativa && v.local === local)
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
    [allVitrines, local]
  );
  const [data, setData] = useState<Record<number, Produto[]>>({});
  const allBanners = useAdmin((s) => s.banners);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const isParceiro = pharmacies.find(p => p.id === lojaId)?.categoriaAssociado === 'Parceiro';

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      if (vitrines.length === 0) {
        setData({});
        return;
      }
      try {
        const results = await Promise.all(
          vitrines.map(async (v) => {
            const prods = (v.modo === "manual" && v.produtoIds && v.produtoIds.length > 0)
              ? await catalog.productsByVitrine(v.id.toString(), v.categoriaId, undefined, v.produtoIds, lojaId)
              : await catalog.productsByVitrine(v.id.toString(), v.categoriaId, undefined, undefined, lojaId);
            
            // Priority: Products with stock > 0 appear first
            const sortedProds = [...prods].sort((a, b) => {
              // fallback to a fake ID if lojaId is missing so we use the best stock
              const storeId = lojaId || undefined;
              const stockA = getDeterministicStock(a, storeId) > 0 ? 1 : 0;
              const stockB = getDeterministicStock(b, storeId) > 0 ? 1 : 0;
              return stockB - stockA;
            });
            
            return { id: v.id, prods: sortedProds };
          })
        );
        if (!isCancelled) {
          const res: Record<number, Produto[]> = {};
          results.forEach(({ id, prods }) => {
            res[id] = prods;
          });
          setData(res);
        }
      } catch (err) {
        console.error("Erro ao carregar vitrines concorrentes:", err);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [vitrines, customProducts, lojaId]);

  return (
    <>
      {vitrines.map(v => {
        const prods = data[v.id] || [];
        if (prods.length === 0) return null;
        
        const linkedBanners = allBanners.filter(b => 
          b.active && 
          b.posicao === "Banner Extra" &&
          b.vitrineVinculada === v.id.toString() &&
          (b.lojaId === lojaId || (!b.lojaId && !isParceiro)) && 
          (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
        );
        const IconComponent = v.icone ? VITRINE_ICONS[v.icone] || Sparkles : Sparkles;
        const vitrineSlug = v.linkSeo || v.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

        return (
          <div key={v.id}>
            <section className="container-fa py-6">
              <div className="flex items-end justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
                  <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
                  {v.nome}
                </h2>
                <Link
                  to="/v/$slug"
                  params={{ slug: vitrineSlug }}
                  className="hidden sm:inline-flex items-center gap-1 text-sm font-bold text-primary hover:underline"
                >
                  Ver todos <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
              {/* SEO/AEO/GEO hidden description */}
              {v.descricaoSeo && (
                <p className="sr-only">{v.descricaoSeo}</p>
              )}
              <ProductCarousel products={prods} selectedStoreId={lojaId} />
            </section>
            
            {linkedBanners.length > 0 && (
              <div className="container-fa pb-6 flex flex-col gap-6">
                {linkedBanners.map(banner => (
                  <RecursiveBanner key={banner.id} banner={banner} allBanners={allBanners} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </>
  );
}

function safeSlugify(text: string): string {
  if (!text) return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export const Route = createFileRoute("/_store/$storeSlug")({
  head: () => {
    const title = "Farmácias Associadas — Medicamentos, dermocosméticos e mais";
    const desc = "Compre online medicamentos, vitaminas, dermocosméticos e itens de higiene com entrega rápida. Aqui você tem amigos.";
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: "https://associadas.com.br" },
      ],
    };
  },
  loader: async () => ({
    featured: await catalog.featured(),
    cats: await catalog.listMainCategories(true),
    allCats: await catalog.listCategories(true),
  }),
  component: StoreHome,
});

const CAT_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "142": Pill,
  "143": Sparkles,
  "146": Leaf,
  "147": Stethoscope,
  "144": Baby,
  "145": Flower2,
  "148": ShoppingBag,
};

function getSubcategoryIcon(name: string) {
  const n = String(name || "").toLowerCase();
  if (n.includes("coração") || n.includes("pressão")) return HeartPulse;
  if (n.includes("olho") || n.includes("colírio") || n.includes("ocular")) return Eye;
  if (n.includes("dente") || n.includes("bucal") || n.includes("boca")) return Smile;
  if (n.includes("unha") || n.includes("esmalte")) return Sparkles;
  if (n.includes("mulher") || n.includes("ginecologia") || n.includes("gestante")) return Flower2;
  if (n.includes("homem") || n.includes("urologia") || n.includes("barba") || n.includes("lâmina") || n.includes("depilação")) return User;
  if (n.includes("emagrecer") || n.includes("peso") || n.includes("termogênico")) return Scale;
  if (n.includes("diabetes") || n.includes("glicose")) return Activity;
  if (n.includes("aparelho") || n.includes("medidor") || n.includes("médico") || n.includes("hospitalar") || n.includes("oxímetro")) return BriefcaseMedical;
  if (n.includes("alimento") || n.includes("bebida") || n.includes("papinha") || n.includes("fórmula")) return Coffee;
  if (n.includes("nervoso") || n.includes("calmante") || n.includes("fitoterápico")) return Leaf;
  if (n.includes("osso") || n.includes("articulaç")) return Activity;
  if (n.includes("socorro") || n.includes("curativo")) return BriefcaseMedical;
  if (n.includes("vacina") || n.includes("teste")) return Stethoscope;
  if (n.includes("desodorante") || n.includes("antitranspirante")) return Wind;
  if (n.includes("shampoo") || n.includes("condicionador") || n.includes("capilar")) return Wind;
  if (n.includes("íntim")) return Heart;
  if ((n.includes("dor") && !n.includes("desodor")) || n.includes("febre") || n.includes("term") || n.includes("gripe") || n.includes("resfriado") || n.includes("alergia") || n.includes("infecç") || n.includes("estômago") || n.includes("digestão")) return Thermometer;
  if (n.includes("imunidade")) return ShieldCheck;
  if (n.includes("beb") || n.includes("infantil") || n.includes("mamadeira") || n.includes("chupeta") || n.includes("fralda")) return Baby;
  if (n.includes("multivitam") || n.includes("mineral") || n.includes("vitamina")) return Battery;
  if (n.includes("suplemento") || n.includes("whey") || n.includes("colágeno")) return Dumbbell;
  if (n.includes("beleza") || n.includes("maquiagem") || n.includes("cosmético") || n.includes("creme") || n.includes("pele") || n.includes("rosto") || n.includes("solar") || n.includes("acne") || n.includes("idade") || n.includes("loç")) return Sparkles;
  if (n.includes("banho") || n.includes("sabonete") || n.includes("higiene") || n.includes("cabelo") || n.includes("tintura")) return Droplets;
  if (n.includes("repelente") || n.includes("inseto")) return Leaf;
  return Tag;
}

function DynamicTarja({ page = "Página inicial", lojaId }: { page?: string; lojaId?: string }) {
  const allBanners = useAdmin((s) => s.banners);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const isParceiro = pharmacies.find(p => p.id === lojaId)?.categoriaAssociado === 'Parceiro';
  
  const tarjas = useMemo(() => (allBanners || []).filter(b => 
    b.active && 
    b.posicao === "Banner Tarja" &&
    (b.lojaId === lojaId || (!b.lojaId && !isParceiro)) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  ), [allBanners, page, lojaId, isParceiro]);
  
  if (tarjas.length === 0) return null;

  const getIcon = (url: string) => {
    if (!url || !url.startsWith("icon:")) return null;
    if (url === "icon:Truck") return Truck;
    if (url === "icon:Store") return Store;
    if (url === "icon:Percent") return Percent;
    if (url === "icon:ShieldCheck") return ShieldCheck;
    if (url === "icon:Stethoscope") return Stethoscope;
    return Truck;
  };

  return (
    <section className="bg-white border-y py-4">
      <div className="container-fa">
        <div className="flex gap-3 overflow-x-auto pb-2 px-4 -mx-4 md:px-0 md:mx-0 snap-x scrollbar-none lg:justify-between lg:gap-3 lg:items-stretch">
          {tarjas.map(tarja => {
            const Icon = getIcon(tarja.imageUrl);
            
            // Format text to support **bold** natively
            const formatText = (text?: string) => {
              if (!text) return null;
              const parts = text.split(/(\*\*.*?\*\*)/g);
              return parts.map((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return <><br key={`br-${i}`}/><strong key={i} className="text-slate-800">{part.slice(2, -2)}</strong></>;
                }
                return part;
              });
            };

            return (
              <div key={tarja.id} className="shrink-0 w-[260px] lg:w-auto lg:flex-1 bg-slate-50 rounded-xl py-3 px-4 flex items-center gap-3 snap-start border border-slate-100">
                <div className="h-10 w-10 shrink-0 bg-white rounded-full flex items-center justify-center border border-slate-200 shadow-sm text-primary overflow-hidden">
                  {Icon ? (
                    <Icon className="h-5 w-5 stroke-[1.5]" />
                  ) : tarja.imageUrl ? (
                    <img src={tarja.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Truck className="h-5 w-5 stroke-[1.5]" />
                  )}
                </div>
                <div className="text-[11px] xl:text-xs leading-[1.2] text-slate-500">
                  {formatText(tarja.nome)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function DynamicCategoriaBanners({ page = "Página inicial", lojaId }: { page?: string; lojaId?: string }) {
  const allBanners = useAdmin((s) => s.banners);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const isParceiro = pharmacies.find(p => p.id === lojaId)?.categoriaAssociado === 'Parceiro';
  
  const categorias = useMemo(() => (allBanners || []).filter(b => 
    b.active && 
    b.posicao === "Banner Categoria" &&
    (b.lojaId === lojaId || (!b.lojaId && !isParceiro)) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  ), [allBanners, page, lojaId, isParceiro]);
  
  if (categorias.length === 0) return null;

  const getIcon = (url: string) => {
    if (!url || !url.startsWith("icon:")) return null;
    const iconName = url.replace("icon:", "");
    // Fallback simple mapping for category icons
    if (iconName === "Thermometer") return Thermometer;
    if (iconName === "Leaf") return Leaf;
    if (iconName === "Smile") return Smile;
    if (iconName === "Droplets") return Droplets;
    if (iconName === "Battery") return Battery;
    if (iconName === "Wind") return Wind;
    if (iconName === "Heart") return Heart;
    if (iconName === "ShieldCheck") return ShieldCheck;
    return Sparkles; // default
  };

  return (
    <div className="relative group w-full">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-4 md:-ml-6 pb-4">
          {categorias.map(cat => {
            const Icon = getIcon(cat.imageUrl);
            return (
              <CarouselItem key={cat.id} className="pl-4 md:pl-6 basis-auto flex">
                <Link
                  to={cat.link || "/"}
                  className="flex flex-col items-center gap-2 text-center group shrink-0 w-[80px] md:w-[100px]"
                >
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-full bg-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-3 border-4 border-transparent group-hover:border-primary/20">
                    {Icon ? (
                      <Icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    ) : cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.nome} className="w-full h-full object-cover rounded-full" />
                    ) : null}
                  </div>
                  <span className="text-[10px] md:text-xs font-bold leading-tight line-clamp-2">
                    {cat.nome}
                  </span>
                </Link>
              </CarouselItem>
            );
          })}
        </CarouselContent>
        <CarouselPrevious className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" />
        <CarouselNext className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" />
      </Carousel>
    </div>
  );
}

function RecursiveBanner({ banner, allBanners }: { banner: any; allBanners: any[] }) {
  const children = (allBanners || []).filter(b => b.active && b.posicao === "Banner Extra" && b.bannerVinculado === banner.id);
  
  return (
    <>
      <div key={banner.id}>
        {banner.formatoExtra === "2_banners" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <Link to={banner.link || "/"} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow">
              <picture>
                {banner.mobileImageUrl && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />}
                <img src={banner.imageUrl} alt={banner.nome || "Banner promocional"} loading="lazy" decoding="async" className="w-full h-auto object-cover object-center" width={600} height={300} />
              </picture>
            </Link>
            {banner.imageUrl2 && (
              <Link to={banner.link2 || "/"} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <picture>
                  {banner.mobileImageUrl2 && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl2} />}
                  <img src={banner.imageUrl2} alt={banner.nome || "Banner promocional 2"} loading="lazy" decoding="async" className="w-full h-auto object-cover object-center" width={600} height={300} />
                </picture>
              </Link>
            )}
          </div>
        ) : (
          <Link to={banner.link || "/"} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <picture>
              {banner.mobileImageUrl && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />}
              <img src={banner.imageUrl} alt={banner.nome || "Banner promocional"} loading="lazy" decoding="async" className="w-full h-auto object-cover object-center max-h-[300px]" width={1200} height={300} />
            </picture>
          </Link>
        )}
      </div>
      {children.map(child => (
        <RecursiveBanner key={child.id} banner={child} allBanners={allBanners} />
      ))}
    </>
  );
}

function DynamicExtraBanners({ page = "Página inicial", lojaId }: { page?: string; lojaId?: string }) {
  const allBanners = useAdmin((s) => s.banners);
  const pharmacies = useAdmin((s) => s.pharmacies);
  const isParceiro = pharmacies.find(p => p.id === lojaId)?.categoriaAssociado === 'Parceiro';
  
  const extras = useMemo(() => (allBanners || []).filter(b => 
    b.active && 
    b.posicao === "Banner Extra" && 
    (!b.vitrineVinculada || b.vitrineVinculada === "none") && 
    (!b.bannerVinculado || b.bannerVinculado === "none") &&
    (b.lojaId === lojaId || (!b.lojaId && !isParceiro)) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  ), [allBanners, page, lojaId, isParceiro]);
  
  if (extras.length === 0) return null;

  return (
    <div className="container-fa py-8 flex flex-col gap-6">
      {extras.map(banner => (
        <RecursiveBanner key={banner.id} banner={banner} allBanners={allBanners} />
      ))}
    </div>
  );
}

function CampaignHighlight({ lojaId }: { lojaId?: string }) {
  const customProducts = useAdminProducts((s) => s.customProducts);
  const [allProducts, setAllProducts] = useState<Produto[]>([]);

  useEffect(() => {
    catalog.featured().then(setAllProducts);
  }, [customProducts]);

  const campaignProducts = useMemo(() => {
    // Check customProducts for emCampanha flag
    const campaignIds = new Set(
      customProducts.filter(cp => isCampanhaAtiva(cp) && (cp.lojaId === lojaId || !cp.lojaId)).map(cp => cp.id)
    );
    if (campaignIds.size === 0) return [];
    return allProducts.filter(p => campaignIds.has(p.id)).map(p => {
      const cp = customProducts.find(c => c.id === p.id);
      if (cp) return { ...p, ...cp };
      return p;
    });
  }, [customProducts, allProducts]);

  const monthName = new Date().toLocaleString('pt-BR', { month: 'long' }).replace(/^\w/, c => c.toUpperCase());

  if (campaignProducts.length === 0) return null;

  return (
    <section className="container-fa py-6">
      <div className="flex items-end justify-between mb-4">
        <h2 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <Flame className="h-5 w-5 md:h-6 md:w-6 text-orange-500" />
          Ofertas de {monthName}
        </h2>
        <span className="hidden sm:inline text-sm font-bold text-orange-500">
          Preços exclusivos da campanha
        </span>
      </div>
      <ProductCarousel products={campaignProducts} selectedStoreId={lojaId} />
    </section>
  );
}

function StoreHome() {

  const { storeSlug } = Route.useParams();
  const { pharmacies, fetchBanners } = useAdmin();
  const loja = useMemo(() => pharmacies.find((p) => safeSlugify(p.nome || p.id) === storeSlug), [pharmacies, storeSlug]);
  const lojaId = loja?.id;

  useEffect(() => {
    if (lojaId) {
      fetchBanners(lojaId);
    }
  }, [lojaId, fetchBanners]);

  const { setSelectedPharmacyId } = useCart();
  const { recordLojaAccess, initPresence } = useLive();
  
  useEffect(() => {
    if (lojaId) {
      setSelectedPharmacyId(lojaId);
      recordLojaAccess(lojaId);
      const sessionId = sessionStorage.getItem("fa-visitor-session") || Math.random().toString(36).substring(2);
      sessionStorage.setItem("fa-visitor-session", sessionId);
      initPresence(sessionId, lojaId);
    } else {
      setSelectedPharmacyId(null);
    }
  }, [lojaId, setSelectedPharmacyId, recordLojaAccess, initPresence]);


  const { featured, cats, allCats } = Route.useLoaderData();
  const categoryIcons = useAdmin((s) => s.categoryIcons);
  const featuredCategoriesIds = useAdmin((s) => s.featuredCategories);
  const [featuredCategoriesData, setFeaturedCategoriesData] = useState<Array<{categoria: Categoria, produtos: Produto[]}>>([]);
  
  const grid = featured.slice(0, 12);
  const brandsRef = useRef<HTMLDivElement>(null);

  const customProducts = useAdminProducts((s) => s.customProducts);
  
  useEffect(() => {
    async function loadFeatured() {
      const data = await Promise.all(
        featuredCategoriesIds.map(async (id) => {
          const categoria = await catalog.getCategoryById(id);
          const produtos = await catalog.productsByCategory(id);
          return categoria ? { categoria, produtos } : null;
        })
      );
      setFeaturedCategoriesData(data.filter(Boolean) as any);
    }
    loadFeatured();
  }, [featuredCategoriesIds, customProducts]);

  const { marcas } = useMarcasStore();
  const activeMarcas = marcas.filter(m => m.ativo && m.destaque);

  const scrollBrands = (dir: "left" | "right") => {
    if (brandsRef.current) {
      brandsRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  const schemaOrg = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Farmácias Associadas",
    "url": "https://associadas.com.br",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://associadas.com.br/busca?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  if (pharmacies.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Spinner className="h-16 w-16" />
      </div>
    );
  }

  if (!loja) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-slate-50">
        <img src={mascot404} alt="Página não encontrada" className="w-full max-w-xl h-auto mb-8 drop-shadow-md" />
        <a 
          href="/" 
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium flex items-center justify-center gap-2 px-6 py-3 rounded-md transition-colors"
        >
          <ChevronLeft className="w-5 h-5" /> Voltar para o início
        </a>
      </div>
    );
  }

  if (loja.virtualStoreStatus === 'Inativa') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-slate-50">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
          <Store className="w-8 h-8 text-red-500" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800 mb-4">Loja Temporariamente Indisponível</h1>
        <p className="text-muted-foreground text-lg mb-8 max-w-md">
          Esta loja está inativa no momento. Por favor, volte mais tarde ou procure por outra Farmácia Associada.
        </p>
        <a href="/" className="text-blue-600 font-medium hover:underline flex items-center gap-2">
          <ChevronLeft className="w-4 h-4" /> Voltar para o início
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaOrg) }} />
      
      <main className="flex-1 pb-16 md:pb-0 overflow-x-hidden">
        <HeroCarousel lojaId={lojaId} />
        <SquarePromoGrid lojaId={lojaId} />

        {/* Advantages Banner (Imagem 2) */}
        <DynamicTarja lojaId={lojaId} />

        {/* As vitrines agora são todas gerenciadas dinamicamente via Admin */}

        <section className="container-fa pt-2 pb-6 relative group">
          <h1 className="text-xl md:text-2xl font-bold mb-4">Compre por categoria</h1>
          <DynamicCategoriaBanners lojaId={lojaId} />
        </section>



        <DynamicVitrines local="espaco_1" lojaId={lojaId} />
        
        <DynamicExtraBanners lojaId={lojaId} />
        
        {loja?.offersServices !== false && <ServicesSection />}
        
        <DynamicVitrines local="espaco_2" lojaId={lojaId} />




        {/* Diferenciais da Rede */}
        {loja?.categoriaAssociado !== 'Parceiro' && (
          <section className="container-fa my-12">
            <div className="bg-orange-500 text-white rounded-2xl p-6 md:p-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold">Farmácias Associadas</h2>
                <p className="text-orange-100 mt-2">Farmácias Associadas, muito mais que farmácia, aqui você tem amigos.</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {/* Força Associadas (Icone do Usuário) */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-sm">
                    <img src="/icone-associadas.png" alt="A Força das Associadas" className="h-10 w-10 object-contain" />
                  </div>
                  <h3 className="font-bold text-sm">A Força de uma Rede Gigante</h3>
                  <p className="text-xs text-orange-100">Somos a maior rede associativa de farmácias do Sul do Brasil.</p>
                </div>

                {/* Atendimento Humanizado */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-500">
                    <Heart className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-sm">Atendimento Humanizado</h3>
                  <p className="text-xs text-orange-100">Aqui você tem amigos. Um time preparado para cuidar de você.</p>
                </div>

                {/* Entrega Rápida */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-500">
                    <Truck className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-sm">Entrega Rápida</h3>
                  <p className="text-xs text-orange-100">Receba seus produtos no conforto do seu lar com segurança.</p>
                </div>

                {/* Qualidade */}
                <div className="flex flex-col items-center text-center gap-3">
                  <div className="h-16 w-16 bg-white rounded-xl flex items-center justify-center shadow-sm text-orange-500">
                    <ShieldCheck className="h-8 w-8" />
                  </div>
                  <h3 className="font-bold text-sm">Qualidade Comprovada</h3>
                  <p className="text-xs text-orange-100">Produtos originais e com a garantia que você e sua família merecem.</p>
                </div>
              </div>
            </div>
          </section>
        )}
        
        <DynamicVitrines local="espaco_3" lojaId={lojaId} />

        {/* Parceiros / Marcas */}
        <section className="container-fa my-12">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Handshake className="h-6 w-6 text-primary" />
              <h2 className="text-xl md:text-2xl font-bold">Somos parceiros das melhores marcas</h2>
            </div>
          </div>
          
          <div className="relative group w-full">
            <Carousel
              opts={{
                align: "start",
                loop: false,
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-4 md:-ml-6 pb-4">
                {activeMarcas.map((marca) => (
                  <CarouselItem
                    key={marca.id}
                    className="pl-4 md:pl-6 basis-auto flex"
                  >
                    <Link 
                      to="/m/$slug"
                      params={{ slug: marca.seoUrl || marca.slug }}
                      className="shrink-0 w-[120px] h-[80px] md:w-[150px] md:h-[100px] bg-white border rounded-xl flex items-center justify-center shadow-sm hover:border-[#00AFA9] transition cursor-pointer p-4"
                      title={marca.nome}
                    >
                      {marca.logo ? (
                        <img src={marca.logo} alt={marca.nome} className="w-full h-full object-contain" />
                      ) : (
                        <span className="font-black text-muted-foreground/60 tracking-wider text-sm md:text-base text-center px-2">{marca.nome}</span>
                      )}
                    </Link>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" />
              <CarouselNext className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" />
            </Carousel>
          </div>
        </section>




      </main>
      
      
    </div>
  );
}
