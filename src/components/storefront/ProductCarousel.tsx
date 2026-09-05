import { type Produto } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard";
import { useAdmin } from "@/stores/admin";
import { useSelos } from "@/stores/selos";
import { useParams } from "@tanstack/react-router";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function ProductCarouselSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden pb-4 md:pb-2 pt-1">
      {[1, 2, 3, 4, 5].map((idx) => (
        <div
          key={idx}
          className="shrink-0 w-[44vw] sm:w-[30vw] md:w-[25%] lg:w-[20%] rounded-2xl border bg-card p-3 flex flex-col gap-2.5 animate-pulse"
        >
          <div className="aspect-square w-full rounded-xl bg-muted" />
          <div className="h-3 w-1/3 bg-muted rounded" />
          <div className="h-4 w-full bg-muted rounded" />
          <div className="h-4 w-2/3 bg-muted rounded" />
          <div className="h-5 w-1/2 bg-muted rounded mt-auto" />
          <div className="h-9 w-full bg-primary/10 rounded-xl" />
        </div>
      ))}
    </div>
  );
}

export function ProductCarousel({ products, selectedStoreId }: { products: Produto[], selectedStoreId?: string }) {
  const params = useParams({ strict: false });
  const pharmacies = useAdmin(s => s.pharmacies);
  const allSelos = useSelos((s) => s.selos);
  const storeSlug = (params as any)?.storeSlug;
  const activeStoreId = selectedStoreId || pharmacies.find(f => f.slug === storeSlug)?.id;
  const activePharm = activeStoreId ? pharmacies.find(f => f.id === activeStoreId) : undefined;

  const visibleProducts = products.filter(p => {
    const activeSelos = allSelos.filter(s => s.ativo && p.selosIds?.includes(s.id));
    const isServiceByTag = p.selo?.toUpperCase() === "SERVIÇO";
    const isServiceBySelo = activeSelos.some(s => s.id === 'servico' || s.nome.toUpperCase() === "SERVIÇO");
    const isServiceByType = p.tipoProduto === "servico";
    const isService = isServiceByTag || isServiceBySelo || isServiceByType;
    
    if (isService && activePharm?.offersServices === false) {
      return false;
    }
    return true;
  });
  return (
    <div className="relative group/pcarousel w-full">
      <Carousel
        opts={{
          align: "start",
          loop: false,
          dragFree: true,
        }}
        className="w-full"
      >
        <CarouselContent className="-ml-3 pb-4 md:pb-2">
          {visibleProducts.map((p) => (
            <CarouselItem
              key={p.id}
              className="pl-3 basis-[44vw] sm:basis-[30vw] md:basis-[25%] lg:basis-[20%] flex items-stretch"
            >
              <div className="w-full h-full pb-1 flex flex-col">
                <ProductCard p={p} selectedStoreId={selectedStoreId} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious 
          className="flex absolute -left-2 sm:-left-3 md:-left-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition cursor-pointer" 
        />
        <CarouselNext 
          className="flex absolute -right-2 sm:-right-3 md:-right-4 top-1/2 -translate-y-1/2 z-10 h-8 w-8 md:h-10 md:w-10 rounded-full bg-white shadow-md border border-slate-200 items-center justify-center text-slate-700 hover:bg-primary hover:text-white hover:border-primary transition cursor-pointer" 
        />
      </Carousel>
    </div>
  );
}
