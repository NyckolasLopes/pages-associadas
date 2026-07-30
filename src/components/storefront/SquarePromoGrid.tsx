import { useAdmin } from "@/stores/admin";

export function SquarePromoGrid({ page = "Página inicial" }: { page?: string }) {
  const banners = useAdmin(s => s.banners);
  const miniBanners = banners.filter(b => 
    b.posicao === "Mini Banner" && 
    b.active && 
    (!b.paginaPublicacao || b.paginaPublicacao === "Todas as páginas" || b.paginaPublicacao === page)
  );

  return (
    <section className="container-fa py-6">
      <div className="flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 snap-x scrollbar-none md:grid md:grid-cols-8 md:gap-4 md:overflow-visible md:px-0 md:mx-0">
        {miniBanners.map(b => (
          <a 
            key={b.id} 
            href={b.link || "#"} 
            target={b.target || "_self"}
            className="shrink-0 snap-start w-[140px] md:w-auto aspect-square rounded-2xl overflow-hidden shadow-card hover:shadow-elevated hover:-translate-y-0.5 transition block relative"
          >
            <img src={b.imageUrl} alt={b.titulo || b.nome} className="w-full h-full object-cover" />
          </a>
        ))}
      </div>
    </section>
  );
}
