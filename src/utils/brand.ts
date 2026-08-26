import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";

export function getBrandNameForHead(): string {
  try {
    const selectedPharmacyId = useCart.getState().selectedPharmacyId;
    const pharmacies = useAdmin.getState().pharmacies;
    const p = pharmacies.find(p => p.id === selectedPharmacyId);
    
    if (p?.categoriaAssociado === 'Parceiro') {
      return p.nome || "Loja Parceira";
    }
    return "Farmácias Associadas";
  } catch {
    return "Farmácias Associadas";
  }
}
