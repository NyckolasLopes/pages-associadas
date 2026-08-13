import { useAdmin } from "@/stores/admin";

import { useCart } from "@/stores/cart";

export function SquarePromoGrid({ page = "Página inicial", lojaId }: { page?: string; lojaId?: string }) {
  const { banners, pharmacies } = useAdmin();
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const effectiveLojaId = lojaId || selectedPharmacyId;
  const isParceiro = pharmacies?.find(p => p.id === effectiveLojaId)?.categoriaAssociado === 'Parceiro';

  const miniBanners = banners.filter(b => {
    if (b.posicao !== "Mini Banner" || !b.active) return false;
    
    if (effectiveLojaId) {
      if (b.lojaId && b.lojaId !== effectiveLojaId) return false;
      if (!b.lojaId && isParceiro) return false;
    } else {
      if (b.lojaId) return false;
    }
    
    if (b.paginaPublicacao && b.paginaPublicacao !== "Todas as páginas" && b.paginaPublicacao !== page) return false;
    return true;
  });

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
