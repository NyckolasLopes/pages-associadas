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
  const initialRestoreDone = useRef(false);

  // 1. Restaura carrinho ao fazer login caso o carrinho local esteja vazio
  useEffect(() => {
    if (user?.id && !initialRestoreDone.current) {
      initialRestoreDone.current = true;
      (supabase
        .from('carrinhos_abandonados' as any) as any)
        .select('items, id')
        .eq('user_id', user.id)
        .eq('status', 'abandonado')
        .order('updated_at', { ascending: false })
        .limit(1)
        .then(({ data, error }: any) => {
          if (error) {
            console.error("Erro ao verificar carrinho anterior:", error);
            return;
          }
          const cart = data?.[0];
          if (cart && cart.items && Array.isArray(cart.items) && cart.items.length > 0) {
            if (useCart.getState().items.length === 0) {
              useCart.getState().restoreCart(cart.items);
            }
          }
        });
    }

    if (!user?.id) {
      initialRestoreDone.current = false;
    }
  }, [user?.id]);

  // 2. Sincroniza em tempo real as alterações do carrinho com o Supabase (para clientes logados e visitantes)
  useEffect(() => {
    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(async () => {
      try {
        let safeItems: any[] = [];
        if (Array.isArray(items)) {
          safeItems = items.map((item: any) => ({
            id: item.id,
            nome: item.nome || item.name || "Produto",
            qtd: item.qtd || item.quantidade || 1,
            valorUnitario: item.precoPor || item.preco || item.price || 0,
            foto: item.foto || item.imagem || item.image || "",
            ean: item.ean || "",
          }));
        }

        // Obtém dados de contato armazenados temporariamente pelo checkout ou login
        let contact: { nome?: string; email?: string; telefone?: string } | null = null;
        try {
          const stored = localStorage.getItem('fa-customer-contact') || sessionStorage.getItem('fa-customer-contact');
          if (stored) contact = JSON.parse(stored);
        } catch {}

        // Identificador de sessão para visitantes
        let guestSessionId = '';
        try {
          guestSessionId = sessionStorage.getItem('fa-visitor-session') || localStorage.getItem('fa-visitor-session') || '';
          if (!guestSessionId) {
            guestSessionId = 'guest_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem('fa-visitor-session', guestSessionId);
            localStorage.setItem('fa-visitor-session', guestSessionId);
          }
        } catch {}

        // Se o carrinho foi esvaziado, atualiza status para recuperado
        if (safeItems.length === 0) {
          if (user?.id) {
            await supabase
              .from('carrinhos_abandonados' as any)
              .update({ status: 'recuperado', updated_at: new Date().toISOString() })
              .eq('user_id', user.id)
              .eq('status', 'abandonado');
          } else if (guestSessionId) {
            await supabase
              .from('carrinhos_abandonados' as any)
              .update({ status: 'recuperado', updated_at: new Date().toISOString() })
              .eq('notes', `session:${guestSessionId}`)
              .eq('status', 'abandonado');
          }
          return;
        }

        const clienteNome = (user as any)?.nome || (user as any)?.name || contact?.nome || (user?.email ? user.email.split('@')[0] : 'Cliente Visitante');
        const clienteEmail = user?.email || contact?.email || '';
        const clienteTelefone = (user as any)?.celular || (user as any)?.telefone || contact?.telefone || '';

        const cartData: any = {
          user_id: user?.id || null,
          loja_id: selectedPharmacyId || null,
          nome_cliente: clienteNome,
          email_cliente: clienteEmail,
          telefone_cliente: clienteTelefone,
          items: safeItems,
          total: total || 0,
          status: 'abandonado',
          notes: !user?.id ? `session:${guestSessionId}` : '',
          updated_at: new Date().toISOString()
        };

        // Verifica se já existe um carrinho aberto para este usuário ou sessão
        let query = (supabase
          .from('carrinhos_abandonados' as any) as any)
          .select('id')
          .eq('status', 'abandonado');

        if (user?.id) {
          query = query.eq('user_id', user.id);
        } else {
          query = query.eq('notes', `session:${guestSessionId}`);
        }

        const { data: existingCarts, error: fetchErr } = await query.order('updated_at', { ascending: false }).limit(1);

        if (fetchErr) {
          console.error("[CartSync] Erro na verificação:", fetchErr.message);
          return;
        }

        const existingCart = existingCarts?.[0];

        if (existingCart) {
          // Atualiza carrinho existente
          await (supabase
            .from('carrinhos_abandonados' as any) as any)
            .update(cartData)
            .eq('id', existingCart.id);
        } else if (user?.id && selectedPharmacyId) {
          // Usuário logado: upsert evitando conflito de chave única (user_id, loja_id)
          await (supabase
            .from('carrinhos_abandonados' as any) as any)
            .upsert(cartData, { onConflict: 'user_id, loja_id' });
        } else {
          // Visitante: insere novo carrinho abandonado
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
