import { useEffect, useRef } from 'react';
import { useCart } from '@/stores/cart';
import { useAuth } from '@/stores/auth';
import { supabase } from '@/integrations/supabase/client';

export function useCartSync() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total());
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const { user } = useAuth();
  const syncTimeout = useRef<any>(undefined);

  // 2. Sincroniza em tempo real as alterações do carrinho com o Supabase (EXCLUSIVAMENTE para clientes logados)
  useEffect(() => {
    // SÓ SINCRONIZA CARRINHO ABANDONADO SE O USUÁRIO ESTIVER LOGADO
    if (!user?.id) {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      return;
    }

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(async () => {
      try {
        if (!user?.id) return;

        let safeItems: any[] = [];
        if (Array.isArray(items)) {
          safeItems = items
            .filter((item: any) => item && item.id && (Number(item.qty || item.qtd || 0) > 0))
            .map((item: any) => ({
              id: item.id,
              nome: item.nome || item.name || "Produto",
              qtd: item.qty || item.qtd || item.quantidade || 1,
              valorUnitario: item.precoPor || item.preco || item.price || 0,
              foto: item.foto || item.imagem || item.image || "",
              ean: item.ean || "",
            }));
        }

        // Se o carrinho foi esvaziado, atualiza status para recuperado
        if (safeItems.length === 0) {
          await supabase
            .from('carrinhos_abandonados' as any)
            .update({ status: 'recuperado', updated_at: new Date().toISOString() })
            .eq('user_id', user.id)
            .eq('status', 'abandonado');
          return;
        }

        const clienteNome = (user as any)?.nome || (user as any)?.name || (user?.email ? user.email.split('@')[0] : 'Cliente');
        const clienteEmail = user?.email || '';
        const clienteTelefone = (user as any)?.celular || (user as any)?.telefone || '';

        const cartData: any = {
          user_id: user.id,
          loja_id: selectedPharmacyId || null,
          nome_cliente: clienteNome,
          email_cliente: clienteEmail,
          telefone_cliente: clienteTelefone,
          items: safeItems,
          total: total || 0,
          status: 'abandonado',
          notes: '',
          updated_at: new Date().toISOString()
        };

        // Verifica se já existe um carrinho aberto para este usuário
        const { data: existingCarts, error: fetchErr } = await (supabase
          .from('carrinhos_abandonados' as any) as any)
          .select('id')
          .eq('status', 'abandonado')
          .eq('user_id', user.id)
          .order('updated_at', { ascending: false })
          .limit(1);

        if (fetchErr) {
          console.error("[CartSync] Erro na verificação:", fetchErr.message);
          return;
        }

        const existingCart = existingCarts?.[0];

        if (existingCart) {
          // Atualiza carrinho existente (apenas dados mutáveis para evitar conflito de índice único)
          const updatePayload: any = {
            loja_id: selectedPharmacyId || null,
            nome_cliente: clienteNome,
            email_cliente: clienteEmail,
            telefone_cliente: clienteTelefone,
            items: safeItems,
            total: total || 0,
            updated_at: new Date().toISOString()
          };

          const { error: updateErr } = await (supabase
            .from('carrinhos_abandonados' as any) as any)
            .update(updatePayload)
            .eq('id', existingCart.id);

          if (updateErr) {
            // Se houver conflito de índice único, limpa duplicatas do usuário e reinsere
            await (supabase.from('carrinhos_abandonados' as any) as any)
              .delete()
              .eq('user_id', user.id)
              .eq('status', 'abandonado');
            await (supabase.from('carrinhos_abandonados' as any) as any)
              .insert(cartData);
          }
        } else {
          // Garante que não há registros anteriores em conflito antes de inserir
          await (supabase
            .from('carrinhos_abandonados' as any) as any)
            .delete()
            .eq('user_id', user.id)
            .eq('status', 'abandonado');

          await (supabase
            .from('carrinhos_abandonados' as any) as any)
            .insert(cartData);
        }
      } catch (err) {
        // Log silencioso sem interromper a navegação do cliente
      }
    }, 800);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [items, user, total, selectedPharmacyId]);
}
