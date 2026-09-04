import { useEffect, useRef } from 'react';
import { useCart, getEffectivePrice } from '@/stores/cart';
import { useAuth, safeSlugifyAuth, type User } from '@/stores/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/stores/admin';
import { productImage } from '@/lib/format';

let isSyncing = false;

export async function syncAbandonedCartNow(userOverride?: User | null) {
  if (isSyncing) return;
  isSyncing = true;
  try {
    const authState = useAuth.getState();
    const currentUser = userOverride || authState.user;
    if (!currentUser?.id) return;

    const cartState = useCart.getState();
    const items = cartState.items;
    const selectedPharmacyId = cartState.selectedPharmacyId;
    const total = cartState.total();

    if (!Array.isArray(items) || items.length === 0) {
      return;
    }

    const safeItems = items
      .filter((item: any) => item && item.id && (Number(item.qty || item.qtd || 0) > 0))
      .map((item: any) => {
        const effectivePrice = getEffectivePrice(item, selectedPharmacyId);
        const resolvedUnitPrice = effectivePrice.precoPor > 0
          ? effectivePrice.precoPor
          : Number(item.preco ?? item.precoPor ?? item.precoDe ?? item.price ?? (item as any).preco_por ?? 0);

        return {
          id: String(item.id),
          nome: item.nome || item.name || "Produto",
          qtd: Number(item.qty || item.qtd || item.quantidade || 1),
          valorUnitario: resolvedUnitPrice,
          preco: resolvedUnitPrice,
          preco_unitario: resolvedUnitPrice,
          foto: item.foto || item.imagem || item.image || productImage(item),
          ean: item.ean || "",
        };
      });

    if (safeItems.length === 0) return;

    const computedTotal = safeItems.reduce((acc, it) => acc + (it.valorUnitario * it.qtd), 0);
    const finalTotal = (typeof total === 'number' && total > 0) ? total : computedTotal;

    // Resolve store id to UUID if possible
    let rawStoreId = selectedPharmacyId || useAdmin.getState().activeStoreId;
    if (!rawStoreId && typeof window !== 'undefined') {
      const slugCandidate = window.location.pathname.split('/')[1];
      if (slugCandidate && !['admin', 'auth', 'cart', 'checkout', 'p', 'api'].includes(slugCandidate)) {
        rawStoreId = slugCandidate;
      }
    }

    let normalizedLojaId = rawStoreId;
    const pharmacies = useAdmin.getState().pharmacies || [];
    if (rawStoreId && pharmacies.length > 0) {
      const ph = pharmacies.find(p => 
        p.id === rawStoreId || 
        p.slug === rawStoreId || 
        (p as any).sub_domain === rawStoreId ||
        safeSlugifyAuth(p.slug) === safeSlugifyAuth(rawStoreId) ||
        safeSlugifyAuth((p as any).sub_domain || '') === safeSlugifyAuth(rawStoreId)
      );
      if (ph) {
        normalizedLojaId = ph.id;
      }
    }

    const clienteNome = (currentUser as any)?.nome || (currentUser as any)?.name || (currentUser?.email ? currentUser.email.split('@')[0] : 'Cliente');
    const clienteEmail = currentUser?.email || '';
    const clienteTelefone = (currentUser as any)?.celular || (currentUser as any)?.telefone || '';

    const cartData: any = {
      user_id: currentUser.id,
      loja_id: normalizedLojaId || null,
      nome_cliente: clienteNome,
      email_cliente: clienteEmail,
      telefone_cliente: clienteTelefone,
      items: safeItems,
      total: finalTotal,
      status: 'abandonado',
      notes: '',
      updated_at: new Date().toISOString()
    };

    // 1. Procura se já existe um carrinho para este usuário e esta loja
    let existingForLojaQuery = supabase
      .from('carrinhos_abandonados' as any)
      .select('id')
      .eq('user_id', currentUser.id);

    if (normalizedLojaId) {
      existingForLojaQuery = (existingForLojaQuery as any).eq('loja_id', normalizedLojaId);
    } else {
      existingForLojaQuery = (existingForLojaQuery as any).is('loja_id', null);
    }

    const { data: existingForLoja } = await (existingForLojaQuery.limit(1).maybeSingle() as any);

    if (existingForLoja?.id) {
      // Desativa qualquer outro carrinho abandonado deste usuário para satisfazer o índice único
      await (supabase.from('carrinhos_abandonados' as any) as any)
        .update({ status: 'recuperado' })
        .eq('user_id', currentUser.id)
        .eq('status', 'abandonado')
        .neq('id', existingForLoja.id);

      // Atualiza o carrinho desta loja
      await (supabase.from('carrinhos_abandonados' as any) as any)
        .update(cartData)
        .eq('id', existingForLoja.id);
    } else {
      // Desativa qualquer outro carrinho abandonado deste usuário para satisfazer o índice único
      await (supabase.from('carrinhos_abandonados' as any) as any)
        .update({ status: 'recuperado' })
        .eq('user_id', currentUser.id)
        .eq('status', 'abandonado');

      const { error: insertErr } = await (supabase.from('carrinhos_abandonados' as any) as any)
        .insert(cartData);

      if (insertErr && (insertErr.code === '23505' || String(insertErr.message || '').includes('duplicate') || String(insertErr.message || '').includes('unique'))) {
        // Concorrência: atualiza a linha que colidiu
        if (normalizedLojaId) {
          await (supabase.from('carrinhos_abandonados' as any) as any)
            .update(cartData)
            .eq('user_id', currentUser.id)
            .eq('loja_id', normalizedLojaId);
        } else {
          await (supabase.from('carrinhos_abandonados' as any) as any)
            .update(cartData)
            .eq('user_id', currentUser.id)
            .is('loja_id', null);
        }
      }
    }
  } catch (err) {
    console.error("[CartSync] Erro ao sincronizar carrinho:", err);
  } finally {
    isSyncing = false;
  }
}

export function useCartSync() {
  const items = useCart(s => s.items);
  const total = useCart(s => s.total());
  const selectedPharmacyId = useCart(s => s.selectedPharmacyId);
  const { user } = useAuth();
  const syncTimeout = useRef<any>(undefined);

  useEffect(() => {
    if (!user?.id) {
      if (syncTimeout.current) clearTimeout(syncTimeout.current);
      return;
    }

    if (syncTimeout.current) {
      clearTimeout(syncTimeout.current);
    }

    syncTimeout.current = setTimeout(() => {
      syncAbandonedCartNow(user);
    }, 600);

    return () => {
      if (syncTimeout.current) {
        clearTimeout(syncTimeout.current);
      }
    };
  }, [items, user, total, selectedPharmacyId]);
}
