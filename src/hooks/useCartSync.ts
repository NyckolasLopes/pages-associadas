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
        .select('items')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data && data.items && Array.isArray(data.items) && data.items.length > 0) {
            // Se o carrinho local estiver vazio, restaura o do banco
            if (useCart.getState().items.length === 0) {
              useCart.getState().restoreCart(data.items);
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
          // Se o carrinho foi esvaziado intencionalmente, exclui o carrinho abandonado
          await supabase
            .from('carrinhos_abandonados' as any)
            .delete()
            .eq('user_id', user.id);
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
        const { data: existingCart } = await supabase
          .from('carrinhos_abandonados' as any)
          .select('id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingCart) {
          // Atualiza carrinho existente
          const { error: updateErr } = await supabase
            .from('carrinhos_abandonados' as any)
            .update(cartData)
            .eq('id', existingCart.id);
          if (updateErr) console.error("[CartSync] Erro ao atualizar:", updateErr.message, updateErr.details);
        } else {
          // Insere novo carrinho
          const { error: insertErr } = await supabase
            .from('carrinhos_abandonados' as any)
            .insert(cartData);
          if (insertErr) console.error("[CartSync] Erro ao inserir:", insertErr.message, insertErr.details);
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
