import { useEffect, useState, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export function HeroCarousel({ page = "Página inicial" }: { page?: string }) {
  const { banners: adminBanners } = useAdmin();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const [i, setI] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand persist hydration before rendering
  useEffect(() => {
    const unsub = useAdmin.persist?.onFinishHydration(() => {
      setHydrated(true);
    });
    // If already hydrated (e.g. navigating back)
    if (useAdmin.persist?.hasHydrated()) {
      setHydrated(true);
    }
    return () => unsub?.();
  }, []);

  const activeBanners = adminBanners.filter(b => {
    if (b.posicao !== "Full Banner") return false;
    if (!b.active) return false;
    if (b.lojaId && b.lojaId !== selectedPharmacyId) return false;
    if (b.paginaPublicacao && b.paginaPublicacao !== "Todas as páginas" && b.paginaPublicacao !== page) return false;
    const now = new Date();
    if (b.startDate && new Date(b.startDate) > now) return false;
    if (b.endDate && new Date(b.endDate) < now) return false;
    return true;
  });
  
  const totalSlides = activeBanners.length;

  // Preload ALL banner images on mount for instant transitions
  useEffect(() => {
    activeBanners.forEach((banner) => {
      const getOptimized = (url: string, isMobile: boolean) => {
        if (!url) return url;
        if (!url.includes("unsplash.com")) return url;
        let optimized = url.replace(/w=\d+/, isMobile ? 'w=800' : 'w=1200');
        optimized = optimized.replace(/q=\d+/, 'q=60');
        return optimized;
      };

      if (banner.imageUrl) {
        const img = new Image();
        img.src = getOptimized(banner.imageUrl, false);
      }
      if (banner.mobileImageUrl) {
        const img = new Image();
        img.src = getOptimized(banner.mobileImageUrl, true);
      }
    });
  }, [activeBanners]);

  useEffect(() => {
    if (totalSlides <= 1) return;
    const interval = setInterval(() => {
      setI((prev) => (prev + 1) % totalSlides);
    }, 6000);
    return () => clearInterval(interval);
  }, [totalSlides, i]);

  // Reset index if slides change
  useEffect(() => {
    setI(0);
  }, [totalSlides]);

  const prev = () => setI((prev) => (prev - 1 + totalSlides) % totalSlides);
  const next = () => setI((prev) => (prev + 1) % totalSlides);

  // Allow rendering the first slide immediately from initial state to prevent LCP delays
  const bannersToRender = hydrated ? activeBanners : adminBanners.filter(b => 
    b.posicao === "Full Banner" && 
    b.active && 
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  );
  const totalSlidesToRender = bannersToRender.length;

  if (totalSlidesToRender === 0) {
    return (
      <section className="relative w-full overflow-hidden bg-[#f5f5f5]" style={{ aspectRatio: '1800 / 600' }} />
    );
  }

  return (
    <section className="relative w-full overflow-hidden bg-[#f5f5f5]">
      <div 
        className="flex transition-transform duration-700 ease-out"
        style={{ transform: `translateX(-${i * 100}%)`, aspectRatio: '1800 / 600' }}
      >
        {bannersToRender.map((banner, idx) => (
          <div key={banner.id} className="w-full shrink-0 relative">
            <a 
              href={banner.link || "#"} 
              target={banner.link && (banner.link.startsWith("http") || banner.link.startsWith("//")) ? "_blank" : undefined}
              rel={banner.link && (banner.link.startsWith("http") || banner.link.startsWith("//")) ? "noopener noreferrer" : undefined}
              className="absolute inset-0 w-full h-full block"
            >
              <img 
                srcSet={`${(banner.mobileImageUrl || banner.imageUrl)?.includes("unsplash.com") ? (banner.mobileImageUrl || banner.imageUrl).replace(/w=\d+/, 'w=800').replace(/q=\d+/, 'q=60') : (banner.mobileImageUrl || banner.imageUrl)} 800w, ${banner.imageUrl?.includes("unsplash.com") ? banner.imageUrl.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=60') : banner.imageUrl} 1200w`}
                sizes="(max-width: 767px) 320px, 1200px"
                src={banner.imageUrl?.includes("unsplash.com") ? banner.imageUrl.replace(/w=\d+/, 'w=1200').replace(/q=\d+/, 'q=60') : banner.imageUrl} 
                alt={banner.nome} 
                className="w-full h-full object-cover md:object-contain object-center" 
                fetchPriority={idx === 0 ? "high" : "auto"}
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
                width={1800}
                height={600}
              />
            </a>
          </div>
        ))}
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
                  idx === i ? "w-8 bg-white" : "w-2 bg-white/50"
                }`}
              />
            ))}
          </div>
          <button 
            aria-label="Slide anterior"
            onClick={prev}
            className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition z-20"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8" />
          </button>
          <button 
            aria-label="Próximo slide"
            onClick={next}
            className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/20 text-white hover:bg-black/40 transition z-20"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8" />
          </button>
        </>
      )}
    </section>
  );
}
