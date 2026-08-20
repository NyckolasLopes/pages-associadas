// @ts-nocheck
import { useEffect, useRef } from "react";
import { useCart } from "@/stores/cart";
import { useAuth } from "@/stores/auth";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/stores/admin";

export function CartSync() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total());
  const user = useAuth(s => s.user);
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Só sincroniza se o usuário estiver logado
    if (!user?.id) return;

    const syncCart = async () => {
      try {
        if (items.length > 0) {
          // Tenta obter o ID da loja: primeiro do selecionado, depois infere pelos itens
          let lojaId = selectedPharmacyId || useAdmin.getState().activeStoreId;

          // Se ainda não tem loja, infere pelo primeiro item que tem precosPorLoja
          if (!lojaId) {
            for (const item of items) {
              if (item.precosPorLoja) {
                const lojas = Object.keys(item.precosPorLoja);
                if (lojas.length > 0) {
                  lojaId = lojas[0];
                  break;
                }
              }
            }
          }

          if (!lojaId) return; // Ainda sem loja, não sincroniza

          await supabase.from("carrinhos_abandonados").upsert({
            user_id: user.id,
            loja_id: lojaId,
            items: items,
            total: total,
            status: "abandonado",
            // Dados do cliente salvos diretamente (evita join com profiles bloqueado por RLS)
            nome_cliente: user.nome || user.name || user.email || '',
            email_cliente: user.email || '',
            telefone_cliente: user.celular || '',
          }, { onConflict: "user_id, loja_id" });
        } else {
          // Carrinho vazio: remove o carrinho abandonado dessa sessão
          const lojaId = selectedPharmacyId || useAdmin.getState().activeStoreId;
          if (lojaId) {
            await supabase.from("carrinhos_abandonados").delete()
              .match({ user_id: user.id, loja_id: lojaId, status: "abandonado" });
          }
        }
      } catch (err) {
        console.error("Failed to sync abandoned cart:", err);
      }
    };

    // Debounce: aguarda 3 segundos sem mudanças antes de salvar
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(syncCart, 3000);

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [items, total, user, selectedPharmacyId]);

  return null;
}
