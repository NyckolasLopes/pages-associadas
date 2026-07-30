import { type Produto } from "@/types";
import { ProductCard } from "@/components/storefront/ProductCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

export function ProductCarousel({ products }: { products: Produto[] }) {
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
        <CarouselContent className="-ml-3 pb-4 md:pb-2">
          {products.map((p) => (
            <CarouselItem
              key={p.id}
              className="pl-3 basis-[45vw] sm:basis-[30vw] md:basis-[25%] lg:basis-[20%] flex"
            >
              <div className="w-full h-full pb-1">
                <ProductCard p={p} />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        <CarouselPrevious 
          className="hidden md:flex absolute -left-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" 
        />
        <CarouselNext 
          className="hidden md:flex absolute -right-4 top-1/2 -translate-y-1/2 z-10 h-10 w-10 bg-white shadow-elevated border items-center justify-center text-primary hover:bg-primary hover:text-white transition opacity-0 group-hover:opacity-100" 
        />
      </Carousel>
    </div>
  );
}
