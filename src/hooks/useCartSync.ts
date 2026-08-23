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

  useEffect(() => {
    // Apenas sincroniza se o usuário estiver logado
    if (!user || !user.id) return;

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(async () => {
      try {
        if (items.length === 0) {
          // Se o carrinho foi esvaziado, exclui o carrinho abandonado
          await supabase
            .from('carrinhos_abandonados' as any)
            .delete()
            .eq('user_id', user.id);
          return;
        }

        const cartData = {
          user_id: user.id,
          loja_id: selectedPharmacyId || null,
          nome_cliente: user.nome || user.name || 'Cliente',
          email_cliente: user.email || '',
          telefone_cliente: user.celular || '',
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
          await supabase
            .from('carrinhos_abandonados' as any)
            .update(cartData)
            .eq('id', existingCart.id);
        } else {
          // Insere novo carrinho
          await supabase
            .from('carrinhos_abandonados' as any)
            .insert(cartData);
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
