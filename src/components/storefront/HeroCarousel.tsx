import { useEffect, useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin, AdminBanner } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { useActivePharmacy } from "@/hooks/useActivePharmacy";

interface HeroCarouselProps {
  page?: string;
  lojaId?: string;
  posicao?: string;
  categoriaId?: string;
  initialBanners?: AdminBanner[];
}

export function HeroCarousel({ 
  page = "Página inicial", 
  lojaId, 
  posicao = "Full Banner", 
  categoriaId,
  initialBanners
}: HeroCarouselProps) {
  const activePharmacy = useActivePharmacy();
  const storeSlug = activePharmacy?.slug || "loja-padrao";
  const { banners: adminBanners, bannersLoaded, fetchBanners } = useAdmin();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const effectiveLojaId = lojaId || selectedPharmacyId || activePharmacy?.id;

  const [i, setI] = useState(0);

  useEffect(() => {
    if (!initialBanners || initialBanners.length === 0) {
      if (effectiveLojaId) {
        fetchBanners(effectiveLojaId);
      } else {
        fetchBanners();
      }
    }
  }, [effectiveLojaId, fetchBanners, initialBanners]);

  const activeBanners = useMemo(() => {
    const bannersList = (initialBanners && initialBanners.length > 0)
      ? initialBanners
      : (adminBanners && adminBanners.length > 0 ? adminBanners : []);
    
    const filtered = bannersList.filter(b => {
      // Both Full Banner and Banner por Categoria share this carousel component
      if (b.posicao !== "Full Banner" && b.posicao !== "Banner por Categoria") return false;
      
      // Se a página for "Página de Categoria", priorizar os "Banner por Categoria"
      if (page === "Página de Categoria" && b.posicao !== "Banner por Categoria") return false;
      if (page !== "Página de Categoria" && b.posicao === "Banner por Categoria") return false;
      if (page === "Página de Categoria" && b.posicao === "Banner por Categoria" && categoriaId) {
        if (b.topicoVinculado !== categoriaId) return false;
      }

      if (!b.active) return false;
      
      // Check if there are ANY local banners for this position in this store
      const hasLocalBannerForPosition = bannersList.some(
        local => {
          if (local.lojaId !== effectiveLojaId || local.posicao !== b.posicao) return false;
          if (b.posicao === "Banner por Categoria") {
            return local.topicoVinculado === b.topicoVinculado;
          }
          return true;
        }
      );

      // Filtro de Loja: Só mostra se for banner específico da loja, ou se for global (e a loja não tiver sobreposto essa posição)
      if (effectiveLojaId) {
        if (b.lojaId) {
          if (b.lojaId !== effectiveLojaId) return false;
        } else {
          // Se a loja cadastrou banners próprios para essa posição, oculta os globais
          if (hasLocalBannerForPosition) return false;
        }
      } else {
        // Se não tem loja selecionada, não mostra banners de lojas específicas
        if (b.lojaId) return false;
      }

      if (b.paginaPublicacao && b.paginaPublicacao !== "Todas as páginas" && b.paginaPublicacao !== page) return false;
      const now = new Date();
      if (b.startDate && new Date(b.startDate) > now) return false;
      if (b.endDate && new Date(b.endDate) < now) return false;
      return true;
    });

    return filtered;
  }, [adminBanners, initialBanners, page, categoriaId, effectiveLojaId]);

  const deduplicatedActiveBanners = useMemo(() => {
    const uniqueMap = new Map();
    for (const b of activeBanners) {
      const key = (b.imageUrl || "") + b.posicao;
      if (!uniqueMap.has(key) || b.lojaId) {
        uniqueMap.set(key, b);
      }
    }
    return Array.from(uniqueMap.values());
  }, [activeBanners]);

  const totalSlides = deduplicatedActiveBanners.length;

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setI((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [totalSlides]);

  // Reset index if slides change
  useEffect(() => {
    setI(0);
  }, [totalSlides]);

  const prev = () => setI((prev) => (prev - 1 + totalSlides) % totalSlides);
  const next = () => setI((prev) => (prev + 1) % totalSlides);

  const isCategoryPage = page === "Página de Categoria";
  const containerAspectClass = isCategoryPage
    ? "aspect-[2/1] sm:aspect-[2.5/1] md:aspect-[1920/350]"
    : "aspect-[2/1] sm:aspect-[2.5/1] md:aspect-[1920/600]";

  // Enquanto banners estão carregando e não temos slides, renderizar o Skeleton com o aspect-ratio exato
  // Isso impede que a DynamicTarja suba para o topo da tela do celular durante o carregamento!
  const isStillLoading = !bannersLoaded && (!initialBanners || initialBanners.length === 0) && totalSlides === 0;
  if (isStillLoading) {
    return (
      <section className={`relative w-full overflow-hidden bg-slate-100 animate-pulse ${containerAspectClass}`}>
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-slate-100 via-slate-200 to-slate-100" />
      </section>
    );
  }

  // Se já carregou tudo e não há slides configurados para este contexto, retornar null
  if (totalSlides === 0) {
    return null;
  }

  return (
    <section 
      className={`relative w-full overflow-hidden bg-slate-100 ${containerAspectClass}`}
    >
      <div 
        className="flex transition-transform duration-700 ease-out h-full w-full"
        style={{ transform: `translateX(-${i * 100}%)` }}
      >
        {deduplicatedActiveBanners.map((banner, idx) => {
          const isFirstSlide = idx === 0;

          return (
            <div key={banner.id} className="w-full h-full shrink-0 relative">
              <a 
                href={banner.link?.match(/^\/(c|v|m|p|busca)\b/) ? `/${storeSlug}${banner.link}` : banner.link || "#"} 
                target={banner.link && (banner.link.startsWith("http") || banner.link.startsWith("//")) ? "_blank" : undefined}
                rel={banner.link && (banner.link.startsWith("http") || banner.link.startsWith("//")) ? "noopener noreferrer" : undefined}
                className="block w-full h-full"
              >
                <picture className="block w-full h-full">
                  {/* Fonte mobile quando configurada */}
                  {banner.mobileImageUrl && (
                    <source
                      media="(max-width: 767px)"
                      srcSet={banner.mobileImageUrl}
                      sizes="100vw"
                    />
                  )}
                  {/* Imagem principal com alta prioridade no primeiro slide e lazy no restante */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.nome || "Banner Principal"}
                    className="w-full h-full object-cover object-center"
                    fetchPriority={isFirstSlide ? "high" : "low"}
                    loading={isFirstSlide ? "eager" : "lazy"}
                    decoding="async"
                    sizes="100vw"
                    width={1920}
                    height={600}
                  />
                </picture>
              </a>
            </div>
          );
        })}
      </div>

      {totalSlides > 1 && (
        <>
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {Array.from({ length: totalSlides }).map((_, idx) => (
              <button
                key={idx}
                aria-label={`Slide ${idx + 1}`}
                onClick={() => setI(idx)}
                className={`h-2 rounded-full transition-all ${
                  idx === i ? "w-8 bg-white shadow" : "w-2 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
          <button 
            aria-label="Slide anterior"
            onClick={prev}
            className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition z-20 shadow-md"
          >
            <ChevronLeft className="h-5 w-5 md:h-7 md:w-7" />
          </button>
          <button 
            aria-label="Próximo slide"
            onClick={next}
            className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-sm transition z-20 shadow-md"
          >
            <ChevronRight className="h-5 w-5 md:h-7 md:w-7" />
          </button>
        </>
      )}
    </section>
  );
}
