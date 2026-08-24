import { useEffect, useRef } from 'react';
import { useCart } from '@/stores/cart';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/integrations/supabase/client';

export function useCartSync() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total());
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const { user } = useAuth();
  const syncTimeout = useRef<NodeJS.Timeout>();
  const initialLoadDone = useRef(false);

  useEffect(() => {
    // Quando o usuário logar, tentar buscar o carrinho existente
    if (user?.id && !initialLoadDone.current) {
      initialLoadDone.current = true;
      supabase
        .from('carrinhos_abandonados' as any)
        .select('items, id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(1)
        .then(({ data, error }) => {
          if (error) console.error("Error restoring cart:", error);
          const cart = data?.[0];
          if (cart && cart.items && Array.isArray(cart.items) && cart.items.length > 0) {
            // Se o carrinho local estiver vazio, restaura o do banco
            if (useCart.getState().items.length === 0) {
              useCart.getState().restoreCart(cart.items);
            }
          }
        });
    }

    // Reseta quando fizer logout
    if (!user?.id) {
      initialLoadDone.current = false;
    }
  }, [user?.id]);

  useEffect(() => {
    // Apenas sincroniza se o usuário estiver logado e se o initial load já rodou
    if (!user || !user.id || !initialLoadDone.current) return;

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(async () => {
      try {
        if (items.length === 0) {
          // Se o carrinho foi esvaziado (compra concluída ou esvaziado manualmente),
          // marca como recuperado se existir um abandonado.
          await supabase
            .from('carrinhos_abandonados' as any)
            .update({ status: 'recuperado', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('status', 'abandonado');
          return;
        }

        const cartData = {
          user_id: user.id,
          loja_id: selectedPharmacyId || null,
          nome_cliente: (user as any).nome || (user as any).name || user.email || 'Cliente',
          email_cliente: user.email || '',
          telefone_cliente: (user as any).celular || (user as any).telefone || '',
          items: items,
          total: total,
          status: 'abandonado',
          updated_at: new Date().toISOString()
        };

        // Verifica se já existe um carrinho para este cliente
        const { data: existingCarts, error: fetchErr } = await supabase
          .from('carrinhos_abandonados' as any)
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'abandonado')
          .order('updated_at', { ascending: false })
          .limit(1);

        const existingCart = existingCarts?.[0];

        if (fetchErr) {
          console.error("[CartSync] Erro ao buscar carrinho existente:", fetchErr.message);
          return;
        }

        if (existingCart) {
          // Atualiza carrinho existente
          const { error: updateErr } = await supabase
            .from('carrinhos_abandonados' as any)
            .update(cartData)
            .eq('id', existingCart.id);
          if (updateErr) {
            console.error("[CartSync] Erro ao atualizar:", updateErr.message, updateErr.details);
          } else {
            console.log("[CartSync] Carrinho abandonado atualizado com sucesso!");
          }
        } else {
          // Insere novo carrinho
          const { error: insertErr } = await supabase
            .from('carrinhos_abandonados' as any)
            .insert(cartData);
          if (insertErr) {
            console.error("[CartSync] Erro ao inserir:", insertErr.message, insertErr.details);
          } else {
            console.log("[CartSync] Novo carrinho abandonado inserido com sucesso!");
          }
        }
      } catch (err) {
        console.error("Failed to sync cart:", err);
      }
    }, 2000); // 2 segundos de debounce para não inundar o banco

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [items, user, total, selectedPharmacyId]);
}
