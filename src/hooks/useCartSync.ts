import { useEffect, useRef } from 'react';
import { useCart, getEffectivePrice } from '@/stores/cart';
import { useAuth, safeSlugifyAuth, type User } from '@/stores/auth';
import { supabase } from '@/integrations/supabase/client';
import { useAdmin } from '@/stores/admin';
import { productImage } from '@/lib/format';

export async function syncAbandonedCartNow(userOverride?: User | null) {
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
        const unitPrice = effectivePrice.precoPor > 0
          ? effectivePrice.precoPor
          : Number(item.preco ?? item.precoPor ?? item.precoDe ?? item.price ?? 0);

        return {
          id: String(item.id),
          nome: item.nome || item.name || "Produto",
          qtd: Number(item.qty || item.qtd || item.quantidade || 1),
          valorUnitario: unitPrice,
          foto: item.foto || item.imagem || item.image || (item.possuiImagem ? productImage(item) : ""),
          ean: item.ean || "",
        };
      });

    if (safeItems.length === 0) return;

    const computedTotal = safeItems.reduce((acc, it) => acc + (it.valorUnitario * it.qtd), 0);
    const finalTotal = (typeof total === 'number' && total > 0) ? total : computedTotal;

    // Resolve store id to UUID if possible
    let normalizedLojaId = selectedPharmacyId;
    const pharmacies = useAdmin.getState().pharmacies || [];
    if (selectedPharmacyId && pharmacies.length > 0) {
      const ph = pharmacies.find(p => 
        p.id === selectedPharmacyId || 
        p.slug === selectedPharmacyId || 
        safeSlugifyAuth(p.slug) === safeSlugifyAuth(selectedPharmacyId)
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

    // Verifica se já existe um carrinho aberto para este usuário
    const { data: existingCarts, error: fetchErr } = await (supabase
      .from('carrinhos_abandonados' as any) as any)
      .select('id')
      .eq('status', 'abandonado')
      .eq('user_id', currentUser.id)
      .order('updated_at', { ascending: false })
      .limit(1);

    if (fetchErr) {
      console.error("[CartSync] Erro na verificação:", fetchErr.message);
      return;
    }

    const existingCart = existingCarts?.[0];

    if (existingCart) {
      const updatePayload: any = {
        loja_id: normalizedLojaId || null,
        nome_cliente: clienteNome,
        email_cliente: clienteEmail,
        telefone_cliente: clienteTelefone,
        items: safeItems,
        total: finalTotal,
        updated_at: new Date().toISOString()
      };

      const { error: updateErr } = await (supabase
        .from('carrinhos_abandonados' as any) as any)
        .update(updatePayload)
        .eq('id', existingCart.id);

      if (updateErr) {
        await (supabase.from('carrinhos_abandonados' as any) as any)
          .delete()
          .eq('user_id', currentUser.id)
          .eq('status', 'abandonado');
        await (supabase.from('carrinhos_abandonados' as any) as any)
          .insert(cartData);
      }
    } else {
      await (supabase
        .from('carrinhos_abandonados' as any) as any)
        .delete()
        .eq('user_id', currentUser.id)
        .eq('status', 'abandonado');

      await (supabase
        .from('carrinhos_abandonados' as any) as any)
        .insert(cartData);
    }
  } catch (err) {
    console.error("[CartSync] Erro ao sincronizar carrinho:", err);
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
