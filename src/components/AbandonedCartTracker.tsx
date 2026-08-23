import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";

export function AbandonedCartTracker() {
  const items = useCart((s) => s.items);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const total = useCart((s) => s.subtotal());
  const user = useAuth((s) => s.user);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // We only track abandoned carts for logged in users
    if (!user?.id) return;

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(async () => {
      try {
        if (items.length === 0) {
          // Se o carrinho foi esvaziado (compra concluída ou esvaziado manualmente), 
          // marca como recuperado se existir um abandonado.
          await supabase
            .from("carrinhos_abandonados")
            .update({ status: "recuperado", updated_at: new Date().toISOString() })
            .eq("user_id", user.id)
            .eq("status", "abandonado");
          return;
        }

        // Verifica se já existe um carrinho abandonado para o usuário
        const { data: existing } = await supabase
          .from("carrinhos_abandonados")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "abandonado")
          .maybeSingle();

        if (existing) {
          // Atualiza carrinho existente
          await supabase
            .from("carrinhos_abandonados")
            .update({
              loja_id: selectedPharmacyId || null,
              items: items as any, // jsonb
              total,
              updated_at: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          // Cria novo carrinho abandonado
          await supabase.from("carrinhos_abandonados").insert({
            user_id: user.id,
            loja_id: selectedPharmacyId || null,
            nome_cliente: user.nome || user.name || user.email,
            email_cliente: user.email,
            telefone_cliente: user.celular || "",
            items: items as any,
            total,
            status: "abandonado",
          });
        }
      } catch (error) {
        console.error("Erro ao sincronizar carrinho abandonado:", error);
      }
    }, 2000); // 2s debounce

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items, selectedPharmacyId, total, user]);

  return null;
}
