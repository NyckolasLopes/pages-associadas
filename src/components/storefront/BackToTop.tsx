import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export function FloatingElements() {
  const [show, setShow] = useState(false);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const pharmacies = useAdmin((s) => s.pharmacies);
  
  const activePharmacy = pharmacies.find((p) => p.id === selectedPharmacyId) || pharmacies[0] || null;
  const whatsappNumber = activePharmacy?.whatsapp ? activePharmacy.whatsapp.replace(/\D/g, "") : "5508000000000";
  const whatsappLink = whatsappNumber.startsWith("55") ? `https://wa.me/${whatsappNumber}` : `https://wa.me/55${whatsappNumber}`;

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {show && (
        <button
          type="button"
          aria-label="Voltar ao topo"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-[4.5rem] md:bottom-6 left-6 z-50 h-12 w-12 rounded-full bg-accent text-accent-foreground shadow-elevated flex items-center justify-center hover:bg-accent/90 transition animate-in fade-in slide-in-from-bottom-2"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

    </>
  );
}
