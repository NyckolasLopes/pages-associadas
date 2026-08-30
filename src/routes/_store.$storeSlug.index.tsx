import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useRef, useEffect, useState, useMemo } from "react";
import { Header } from "@/components/storefront/Header";
import { Footer } from "@/components/storefront/Footer";
import { catalog } from "@/services/catalog";
import { ProductCard } from "@/components/storefront/ProductCard";
import { ProductCarousel, ProductCarouselSkeleton } from "@/components/storefront/ProductCarousel";
import { HeroCarousel } from "@/components/storefront/HeroCarousel";
import { SquarePromoGrid } from "@/components/storefront/SquarePromoGrid";
import { ServicesSection } from "@/components/storefront/ServicesSection";
import { Clock, Store, Percent, Activity, ScanBarcode, Pill, Sparkles, Leaf, Stethoscope, Baby, Flower2, ShoppingBag, Sun, TrendingUp, Heart, Handshake, Tag, Droplets, HeartPulse, Eye, Smile, User, Scale, Coffee, Dumbbell, Thermometer, BriefcaseMedical, Battery, Wind, Flame, Truck, MapPin, ShieldCheck, Banknote, ChevronLeft, ChevronRight, ExternalLink, Star } from "lucide-react";
import { isCampanhaAtiva } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { LazySection } from "@/components/ui/LazySection";

import { GeoPopup } from "@/components/storefront/GeoPopup";
// InstallPrompt are rendered globally in __root.tsx
import type { Produto, Categoria, VitrineLocal } from "@/types";
import { useAdmin } from "@/stores/admin";
import { useCart, useGeoCep } from "@/stores/cart";
import { NotFound } from "@/components/storefront/NotFound";
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

function getDeduplicatedBanners(bannersToFilter: any[]) {
  // Se houver banners específicos desta loja na lista, eles têm precedência absoluta sobre os globais
  const hasStoreBanners = bannersToFilter.some(b => !!b.lojaId);
  const targetBanners = hasStoreBanners ? bannersToFilter.filter(b => !!b.lojaId) : bannersToFilter;

  const uniqueMap = new Map();
  for (const b of targetBanners) {
    // Deduplicate by name and position so store-specific banners override global banners with the same name.
    // If nome is empty, fallback to id so they don't overwrite each other randomly.
    const key = (b.nome || b.id) + b.posicao;
    if (!uniqueMap.has(key) || b.lojaId) {
      uniqueMap.set(key, b);
    }
  }
  return Array.from(uniqueMap.values());
}

function SingleDynamicVitrine({
  vitrine,
  lojaId,
  storeSlug,
  page,
  allBanners,
}: {
  vitrine: any;
  lojaId?: string;
  storeSlug: string;
  page: string;
  allBanners: any[];
}) {
  const [prods, setProds] = useState<Produto[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setLoading(true);
      try {
        let results: Produto[] = [];
        if (vitrine.modo === "manual" && vitrine.produtoIds && vitrine.produtoIds.length > 0) {
          results = await catalog.productsByVitrine(vitrine.id.toString(), vitrine.categoriaId, undefined, vitrine.produtoIds, lojaId);
        } else {
          results = await catalog.productsByVitrine(vitrine.id.toString(), vitrine.categoriaId, undefined, undefined, lojaId);
          if (vitrine.produtoIds && vitrine.produtoIds.length > 0) {
            const highlighted = await catalog.productsByVitrine(vitrine.id.toString(), "manual", undefined, vitrine.produtoIds, lojaId);
            const highlightedIds = new Set(highlighted.map(p => String(p.id)));
            results = [...highlighted, ...results.filter(p => !highlightedIds.has(String(p.id)))];
          }
        }
        
        const sorted = [...results].sort((a, b) => {
          const stockA = getDeterministicStock(a, lojaId) > 0 ? 1 : 0;
          const stockB = getDeterministicStock(b, lojaId) > 0 ? 1 : 0;
          return stockB - stockA;
        });

        if (!isCancelled) {
          setProds(sorted);
        }
      } catch (err) {
        if (!isCancelled) setProds([]);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [vitrine.id, vitrine.modo, vitrine.categoriaId, JSON.stringify(vitrine.produtoIds), lojaId]);

  if (!loading && (!prods || prods.length === 0)) {
    return null;
  }

  const linkedBanners = allBanners.filter(b => 
    b.active && 
    b.posicao === "Banner Extra" &&
    b.vitrineVinculada === vitrine.id.toString() &&
    (b.lojaId === lojaId || !b.lojaId) && 
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  );
  const IconComponent = vitrine.icone ? VITRINE_ICONS[vitrine.icone] || Sparkles : Sparkles;
  const vitrineSlug = vitrine.linkSeo || vitrine.nome.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

  return (
    <div>
      <section className="container-fa py-4 md:py-6">
        <div className="flex items-end justify-between mb-3 md:mb-4">
          <h2 className="text-lg md:text-2xl font-bold flex items-center gap-2 text-foreground">
            <IconComponent className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            {vitrine.nome}
          </h2>
          <Link
            to="/$storeSlug/v/$slug"
            params={{ storeSlug: storeSlug || "loja-padrao", slug: vitrineSlug }}
            className="text-xs md:text-sm font-bold text-primary hover:underline flex items-center gap-1"
          >
            Ver todos <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
        {vitrine.descricaoSeo && (
          <p className="sr-only">{vitrine.descricaoSeo}</p>
        )}
        {loading ? (
          <ProductCarouselSkeleton />
        ) : (
          <ProductCarousel products={prods || []} selectedStoreId={lojaId} />
        )}
      </section>
      
      {linkedBanners.length > 0 && (
        <div className="container-fa pb-4 md:pb-6 flex flex-col gap-4 md:gap-6">
          {linkedBanners.map(banner => (
            <RecursiveBanner key={banner.id} banner={banner} allBanners={allBanners} />
          ))}
        </div>
      )}
    </div>
  );
}

function DynamicVitrines({ local, page = "Página inicial", lojaId, storeSlug: propStoreSlug }: { local: VitrineLocal; page?: string; lojaId?: string; storeSlug?: string }) {
  const allVitrines = useAdminProducts((s) => s.getStoreVitrines(lojaId));
  const params = useParams({ strict: false });
  const storeSlug = propStoreSlug || (params as any)?.storeSlug || "loja-padrao";
  const allBanners = useAdmin((s) => s.banners);

  const vitrines = useMemo(() => 
    (allVitrines || [])
      .filter(v => v.ativa && v.local === local && (!v.lojaVinculadaId || v.lojaVinculadaId === lojaId))
      .sort((a, b) => (a.ordem || 0) - (b.ordem || 0)),
    [allVitrines, local, lojaId]
  );

  return (
    <>
      {vitrines.map(v => (
        <LazySection key={v.id} height="360px">
          <SingleDynamicVitrine
            vitrine={v}
            lojaId={lojaId}
            storeSlug={storeSlug}
            page={page}
            allBanners={allBanners}
          />
        </LazySection>
      ))}
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

export const Route = createFileRoute("/_store/$storeSlug/")({
  loader: ({ params }) => {
    const adminState = useAdmin.getState();
    const pharmacies = adminState.pharmacies;
    const storeSlug = params.storeSlug;
    const pharmacy = pharmacies.find(
      (p) => (p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id)) === storeSlug || p.id === storeSlug
    );
    // Inicia carregamentos em segundo plano sem travar a navegação
    if (!adminState.pharmaciesLoaded) {
      adminState.loadPharmacies();
    }
    if (pharmacy?.id) {
      adminState.fetchBanners(pharmacy.id);
    } else {
      adminState.fetchBanners();
    }
    const allBanners = adminState.banners || [];
    const heroBanner = allBanners.find(b => 
      b.active && 
      b.posicao === "Full Banner" && 
      (!b.lojaId || b.lojaId === pharmacy?.id) &&
      (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === "Página inicial")
    );
    return { pharmacy, storeSlug, banners: allBanners, heroBanner };
  },
  head: ({ loaderData }) => {
    const p = loaderData?.pharmacy;
    const storeSlug = loaderData?.storeSlug || "loja-padrao";
    const heroBanner = loaderData?.heroBanner;
    const isParceiro = p?.categoriaAssociado === 'Parceiro' || p?.categoriaAssociado === 'Associado' || p?.isPleno === false;
    const title = p?.pageTitle || (p ? (isParceiro ? `${p.nome} - ${p.cidade}/${p.uf}` : `Farmácias Associadas - ${p.nome} - ${p.cidade}/${p.uf}`) : `${getBrandNameForHead()} — Medicamentos, dermocosméticos e mais`);
    const desc = p?.metaDescription || p?.seoDescricao || (p ? `Sua farmácia completa em ${p.cidade || "sua região"}. Medicamentos, perfumaria, dermocosméticos e ofertas exclusivas com entrega rápida em ${p.bairro || p.cidade || "sua localidade"}.` : "Compre online medicamentos, vitaminas, dermocosméticos e itens de higiene com entrega rápida.");
    const storeUrl = `https://farmaciasassociadas.com.br/${storeSlug}`;
    const logoUrl = p?.logoUrl || (isParceiro ? "" : "https://farmaciasassociadas.com.br/icone-associadas.png");

    const preloadLinks: any[] = [
      { rel: "canonical", href: storeUrl },
    ];

    if (heroBanner?.mobileImageUrl) {
      preloadLinks.push({
        rel: "preload",
        as: "image",
        href: heroBanner.mobileImageUrl,
        media: "(max-width: 767px)",
        // @ts-ignore
        fetchpriority: "high",
      });
    }
    if (heroBanner?.imageUrl) {
      preloadLinks.push({
        rel: "preload",
        as: "image",
        href: heroBanner.imageUrl,
        media: heroBanner.mobileImageUrl ? "(min-width: 768px)" : undefined,
        // @ts-ignore
        fetchpriority: "high",
      });
    }

    const geoRegion = p?.uf ? `BR-${p.uf.toUpperCase()}` : "BR-RS";
    const geoPlacename = [p?.bairro, p?.cidade, p?.uf].filter(Boolean).join(", ") || "Rio Grande do Sul, Brasil";
    const hasGeo = p?.latitude && p?.longitude;
    const geoPosition = hasGeo ? `${p.latitude};${p.longitude}` : undefined;
    const icbm = hasGeo ? `${p.latitude}, ${p.longitude}` : undefined;

    return {
      links: preloadLinks,
      meta: [
        { title },
        { name: "description", content: desc },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: storeUrl },
        { property: "og:image", content: logoUrl },
        { property: "og:locale", content: "pt_BR" },
        { property: "og:site_name", content: "Farmácias Associadas" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: logoUrl },
        { name: "geo.region", content: geoRegion },
        { name: "geo.placename", content: geoPlacename },
        ...(geoPosition ? [{ name: "geo.position", content: geoPosition }] : []),
        ...(icbm ? [{ name: "ICBM", content: icbm }] : []),
      ],
    };
  },
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

function DynamicTarja({ page = "Página inicial", lojaId, initialBanners }: { page?: string; lojaId?: string; initialBanners?: any[] }) {
  const allBanners = useAdmin((s) => s.banners);
  const bannersToUse = (initialBanners && initialBanners.length > 0) ? initialBanners : allBanners;
  
  const tarjasOld = useMemo(() => getDeduplicatedBanners((bannersToUse || []).filter(b => 
    b.active && 
    b.posicao === "Banner Tarja" &&
    (b.lojaId === lojaId || !b.lojaId) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  )), [bannersToUse, page, lojaId]);
  
  const tarjaItems = useMemo(() => {
    const bannerWithJson = tarjasOld.find(b => b.formatoExtra && b.formatoExtra.trim().startsWith('['));
    if (bannerWithJson) {
      try {
        const parsed = JSON.parse(bannerWithJson.formatoExtra!);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch(e) {}
    }
    
    // Legacy fallback
    if (tarjasOld.length > 0) {
      return tarjasOld.map(b => ({
        icon: b.imageUrl,
        title: "",
        subtitle: b.nome,
        isLegacy: true,
      }));
    }
    
    return [];
  }, [tarjasOld]);
  
  if (tarjaItems.length === 0) return null;

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
    <section className="bg-white border-y py-3 md:py-4 mt-2 md:mt-4 shadow-[0_1px_3px_rgb(0,0,0,0.03)]">
      <div className="container-fa">
        <div className="flex overflow-x-auto pb-2 px-4 -mx-4 md:px-0 md:mx-0 snap-x scrollbar-none lg:justify-between lg:items-stretch divide-x divide-slate-200">
          {tarjaItems.map((item, index) => {
            const Icon = getIcon(item.icon);
            
            // Format text for legacy items (supporting **bold**)
            const formatLegacyText = (text?: string) => {
              if (!text) return null;
              const parts = text.split(/(\*\*.*?\*\*)/g);
              let content: React.ReactNode[] = [];
              parts.forEach((part, i) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  content.push(<strong key={i} className="block text-[#0a2540] font-bold text-[13px] md:text-[15px] leading-tight uppercase tracking-tight">{part.slice(2, -2)}</strong>);
                } else if (part.trim().length > 0) {
                  content.push(<span key={`text-${i}`} className="block text-slate-500 text-[11px] md:text-[13px] leading-tight">{part.trim()}</span>);
                }
              });
              return <div className="flex flex-col justify-center">{content}</div>;
            };

            return (
              <div key={index} className={`shrink-0 w-[240px] lg:flex-1 flex items-center justify-center gap-3 lg:gap-4 snap-start px-4 md:px-6 ${index === 0 ? 'pl-0' : ''} ${index === tarjaItems.length - 1 ? 'pr-0' : ''}`}>
                <div className="h-10 w-10 md:h-12 md:w-12 shrink-0 flex items-center justify-center text-[#0a2540] overflow-hidden">
                  {Icon ? (
                    <Icon className="h-8 w-8 md:h-10 md:w-10 stroke-[1.5]" />
                  ) : item.icon ? (
                    <img src={item.icon} alt="" className="w-full h-full object-contain" />
                  ) : (
                    <Truck className="h-8 w-8 md:h-10 md:w-10 stroke-[1.5]" />
                  )}
                </div>
                <div className="flex-1">
                  {item.isLegacy ? (
                    formatLegacyText(item.subtitle)
                  ) : (
                    <div className="flex flex-col justify-center">
                      {item.title && <strong className="block text-[#0a2540] font-bold text-[13px] md:text-[15px] leading-tight uppercase tracking-tight">{item.title}</strong>}
                      {item.subtitle && <span className="block text-slate-500 text-[11px] md:text-[13px] leading-tight">{item.subtitle}</span>}
                    </div>
                  )}
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
  
  const categorias = useMemo(() => getDeduplicatedBanners((allBanners || []).filter(b => 
    b.active && 
    (b.posicao === "Banner Categoria" || b.posicao === "Banner Compre por categoria") &&
    (b.lojaId === lojaId || !b.lojaId) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  )), [allBanners, page, lojaId]);
  
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
                  <div className="h-16 w-16 md:h-20 md:w-20 rounded-2xl bg-slate-100 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform overflow-hidden p-3 border-4 border-transparent group-hover:border-primary/20">
                    {Icon ? (
                      <Icon className="h-8 w-8 md:h-10 md:w-10 text-primary" />
                    ) : cat.imageUrl ? (
                      <img src={cat.imageUrl} alt={cat.nome} className="w-full h-full object-cover rounded-2xl" />
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
                <img src={banner.imageUrl} alt={banner.nome || "Banner promocional"} loading="lazy" decoding="async" className="w-full h-auto aspect-[2/1] md:aspect-[2/1] object-cover object-center" />
              </picture>
            </Link>
            {banner.imageUrl2 && (
              <Link to={banner.link2 || "/"} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <picture>
                  {banner.mobileImageUrl2 && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl2} />}
                  <img src={banner.imageUrl2} alt={banner.nome || "Banner promocional 2"} loading="lazy" decoding="async" className="w-full h-auto aspect-[2/1] md:aspect-[2/1] object-cover object-center" />
                </picture>
              </Link>
            )}
          </div>
        ) : (
          <Link to={banner.link || "/"} className="block overflow-hidden rounded-xl shadow-sm hover:shadow-md transition-shadow">
            <picture>
              {banner.mobileImageUrl && <source media="(max-width: 768px)" srcSet={banner.mobileImageUrl} />}
              <img src={banner.imageUrl} alt={banner.nome || "Banner promocional"} loading="lazy" decoding="async" className="w-full h-auto aspect-[2/1] md:aspect-[4/1] object-cover object-center" />
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
  
  const extras = useMemo(() => getDeduplicatedBanners((allBanners || []).filter(b => 
    b.active && 
    b.posicao === "Banner Extra" && 
    (!b.vitrineVinculada || b.vitrineVinculada === "none") && 
    (!b.topicoVinculado || b.topicoVinculado === "none") &&
    (!b.bannerVinculado || b.bannerVinculado === "none") &&
    (b.lojaId === lojaId || !b.lojaId) &&
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  )), [allBanners, page, lojaId]);
  
  if (extras.length === 0) return null;

  return (
    <div className="container-fa py-8 flex flex-col gap-6">
      {extras.map(banner => (
        <RecursiveBanner key={banner.id} banner={banner} allBanners={allBanners} />
      ))}
    </div>
  );
}

function DynamicTopicBanners({ topicId, page = "Página inicial", lojaId }: { topicId: string; page?: string; lojaId?: string }) {
  const allBanners = useAdmin((s) => s.banners);
  
  const extras = useMemo(() => getDeduplicatedBanners((allBanners || []).filter(b => {
    if (!b.active) return false;
    if (b.lojaId && b.lojaId !== lojaId) return false;
    if (b.paginaPublicacao && b.paginaPublicacao !== "Todas as páginas" && b.paginaPublicacao !== page) return false;
    if (b.bannerVinculado && b.bannerVinculado !== "none") return false;

    if (topicId === "diferenciais" && b.posicao === "Banner Diferenciais") {
      return true;
    }

    return b.posicao === "Banner Extra" && b.topicoVinculado === topicId;
  })), [allBanners, page, lojaId, topicId]);
  
  if (extras.length === 0) return null;

  return (
    <div className="container-fa pb-8 flex flex-col gap-6 mt-[-16px]">
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
      customProducts.filter(cp => {
        const globalCampaign = isCampanhaAtiva(cp) && (cp.lojaId === lojaId || !cp.lojaId);
        const localCampaign = lojaId && cp.precosPorLoja?.[lojaId] && isCampanhaAtiva({
           emCampanha: true,
           campanhaInicio: cp.precosPorLoja[lojaId].campanhaInicio,
           campanhaFim: cp.precosPorLoja[lojaId].campanhaFim
        });
        return globalCampaign || localCampaign;
      }).map(cp => cp.id)
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
  const loaderData = Route.useLoaderData();
  const { pharmacies, pharmaciesLoaded, fetchBanners } = useAdmin();
  const loja = useMemo(() => loaderData?.pharmacy || pharmacies.find((p) => (p.slug ? safeSlugify(p.slug) : safeSlugify(p.nome || p.id)) === storeSlug), [loaderData, pharmacies, storeSlug]);
  const lojaId = loja?.id;

  useEffect(() => {
    if (lojaId && (!loaderData?.banners || loaderData.banners.length === 0)) {
      fetchBanners(lojaId);
    }
  }, [lojaId, fetchBanners, loaderData]);

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


  const { marcas } = useMarcasStore();
  const activeMarcas = marcas.filter(m => m.ativo && m.destaque);

  const schemaOrg = useMemo(() => {
    if (loja) {
      const socialSameAs: string[] = [];
      if (loja.socialLinks?.instagram) socialSameAs.push(loja.socialLinks.instagram);
      if (loja.socialLinks?.facebook) socialSameAs.push(loja.socialLinks.facebook);
      if (loja.whatsapp) {
        const cleanZap = loja.whatsapp.replace(/\D/g, "");
        if (cleanZap) socialSameAs.push(`https://wa.me/55${cleanZap}`);
      }

      const areaServedList: any[] = [];
      if (loja.cidade) {
        areaServedList.push({
          "@type": "City",
          "name": loja.cidade
        });
      }
      if (loja.bairro) {
        areaServedList.push({
          "@type": "AdministrativeArea",
          "name": loja.bairro
        });
      }

      const openingHoursSpec: any[] = [];
      if (loja.horarioFuncionamento) {
        openingHoursSpec.push({
          "@type": "OpeningHoursSpecification",
          "dayOfWeek": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
          "description": loja.horarioFuncionamento
        });
      }

      return {
        "@context": "https://schema.org",
        "@type": ["Pharmacy", "MedicalBusiness", "LocalBusiness"],
        "@id": `https://farmaciasassociadas.com.br/${storeSlug}#pharmacy`,
        "name": loja.nome || "Farmácias Associadas",
        "alternateName": `Farmácias Associadas - ${loja.nome}`,
        "description": loja.metaDescription || loja.seoDescricao || `Sua farmácia completa em ${loja.cidade || "sua região"}. Medicamentos, perfumaria e ofertas com tele-entrega.`,
        "url": `https://farmaciasassociadas.com.br/${storeSlug}`,
        "telephone": loja.telefone || loja.whatsapp || undefined,
        "image": loja.logoUrl || "https://farmaciasassociadas.com.br/icone-associadas.png",
        "logo": loja.logoUrl || "https://farmaciasassociadas.com.br/icone-associadas.png",
        "priceRange": "$$",
        "currenciesAccepted": "BRL",
        "paymentAccepted": "Cartão de Crédito, Cartão de Débito, PIX, Dinheiro",
        "address": {
          "@type": "PostalAddress",
          "streetAddress": `${loja.endereco || ""}, ${loja.numero || ""}${loja.complemento ? ` - ${loja.complemento}` : ""}`.trim(),
          "addressLocality": loja.cidade || "",
          "addressRegion": loja.uf || "RS",
          "postalCode": loja.cep || "",
          "addressCountry": "BR"
        },
        ...(loja.latitude && loja.longitude ? {
          "geo": {
            "@type": "GeoCoordinates",
            "latitude": loja.latitude,
            "longitude": loja.longitude
          }
        } : {}),
        ...(areaServedList.length > 0 ? { "areaServed": areaServedList } : {}),
        ...(openingHoursSpec.length > 0 ? { "openingHoursSpecification": openingHoursSpec } : {}),
        ...(socialSameAs.length > 0 ? { "sameAs": socialSameAs } : {}),
        "potentialAction": {
          "@type": "SearchAction",
          "target": `https://farmaciasassociadas.com.br/${storeSlug}/busca?q={search_term_string}`,
          "query-input": "required name=search_term_string"
        }
      };
    }

    return {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": "Farmácias Associadas",
      "url": "https://farmaciasassociadas.com.br",
      "potentialAction": {
        "@type": "SearchAction",
        "target": "https://farmaciasassociadas.com.br/busca?q={search_term_string}",
        "query-input": "required name=search_term_string"
      }
    };
  }, [loja, storeSlug]);

  if (storeSlug === "loja-padrao") {
    if (typeof window !== "undefined") {
      window.location.replace("/");
      return null;
    }
  }

  if (!loja && pharmacies.length > 0 && pharmaciesLoaded) {
    return <NotFound type="page" />;
  }

  if (loja?.virtualStoreStatus === 'Inativa') {
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
        {/* Full Banner Hero Carousel (Topo prioritário absoluto no mobile e desktop) */}
        <HeroCarousel lojaId={lojaId} />

        {/* Banner de Tarja (Vantagens) - Abaixo do Full Banner em mobile e desktop */}
        <DynamicTarja lojaId={lojaId} />

        <SquarePromoGrid lojaId={lojaId} />

        {/* Top critical above-the-fold content: render immediately */}
        <section className="container-fa pt-2 pb-4 md:pb-6 relative group">
          <h1 className="text-lg md:text-2xl font-bold mb-3 md:mb-4 text-foreground">Compre por categoria</h1>
          <DynamicCategoriaBanners lojaId={lojaId} />
        </section>

        {/* Dynamic Vitrines Space 1: each individual vitrine is lazy loaded with skeleton */}
        <DynamicVitrines local="espaco_1" lojaId={lojaId} storeSlug={storeSlug} />
        
        <LazySection height="250px">
          <DynamicExtraBanners lojaId={lojaId} />
        </LazySection>
        
        {loja?.offersServices !== false && (
          <LazySection height="300px">
            <ServicesSection />
            <DynamicTopicBanners topicId="servicos" lojaId={lojaId} />
          </LazySection>
        )}
        
        {/* Dynamic Vitrines Space 2: each individual vitrine is lazy loaded with skeleton */}
        <DynamicVitrines local="espaco_2" lojaId={lojaId} storeSlug={storeSlug} />




        {/* Diferenciais da Rede */}
        {!(loja?.categoriaAssociado === 'Parceiro' || loja?.categoriaAssociado === 'Associado' || loja?.isPleno === false || storeSlug !== 'loja-padrao') && (
          <LazySection height="400px">
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
            <DynamicTopicBanners topicId="diferenciais" lojaId={lojaId} />
          </LazySection>
        )}
        
        <LazySection height="400px">
          <DynamicVitrines local="espaco_3" lojaId={lojaId} storeSlug={storeSlug} />
        </LazySection>

        {/* Parceiros / Marcas */}
        <LazySection height="300px">
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
                        to="/$storeSlug/m/$slug"
                        params={{ storeSlug: storeSlug || "loja-padrao", slug: marca.seoUrl || marca.slug }}
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
        </LazySection>




      </main>
      
      
    </div>
  );
}
