import { useEffect, useRef } from "react";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/stores/admin";

export function CartSync() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total());
  const user = useAuth(s => s.user);
  const activeStoreId = useCart(s => s.selectedPharmacyId) || useAdmin.getState().activeStoreId;
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Only sync if user is logged in
    if (!user?.id) return;

    const syncCart = async () => {
      try {
        if (items.length > 0) {
          if (!activeStoreId) return; // Need a store ID to sync
          
          await supabase.from("carrinhos_abandonados").upsert({
            user_id: user.id,
            loja_id: activeStoreId,
            items: items,
            total: total,
            status: "abandonado"
          }, { onConflict: "user_id, loja_id" });
        } else {
          // If cart is empty, we don't necessarily delete immediately here, 
          // but we can mark it as 'convertido' or delete if they just cleared it.
          // Usually, successful checkout clears the cart.
          if (activeStoreId) {
            await supabase.from("carrinhos_abandonados").delete()
              .match({ user_id: user.id, loja_id: activeStoreId, status: "abandonado" });
          }
        }
      } catch (err) {
        console.error("Failed to sync abandoned cart:", err);
      }
    };

    // Debounce the sync to avoid spamming the database on every quantity change
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(syncCart, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items, total, user, activeStoreId]);

  return null;
}
