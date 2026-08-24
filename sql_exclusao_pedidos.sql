-- Remover políticas anteriores se existirem (para evitar erros)
DROP POLICY IF EXISTS "Pedidos: delete own" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: delete any admin" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: delete store admin" ON public.pedidos;
DROP POLICY IF EXISTS "Pedido itens: delete own" ON public.pedido_itens;
DROP POLICY IF EXISTS "Pedido itens: delete any admin" ON public.pedido_itens;
DROP POLICY IF EXISTS "Pedido itens: delete store admin" ON public.pedido_itens;

-- Permitir que o próprio usuário delete seu pedido (se necessário)
CREATE POLICY "Pedidos: delete own" ON public.pedidos FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Permitir que administradores globais deletem qualquer pedido
CREATE POLICY "Pedidos: delete any admin" ON public.pedidos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Permitir que donos de loja deletem pedidos da sua loja (usando formato JSONB que é o formato atual do banco)
CREATE POLICY "Pedidos: delete store admin" ON public.pedidos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND COALESCE(lojas_vinculadas, '[]'::jsonb) ? public.pedidos.loja_id)
);

-- O mesmo para os itens do pedido
CREATE POLICY "Pedido itens: delete own" ON public.pedido_itens FOR DELETE TO authenticated USING (
  pedido_id IN (SELECT id FROM public.pedidos WHERE user_id = auth.uid())
);

CREATE POLICY "Pedido itens: delete any admin" ON public.pedido_itens FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Pedido itens: delete store admin" ON public.pedido_itens FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND COALESCE(lojas_vinculadas, '[]'::jsonb) ? (SELECT loja_id FROM public.pedidos WHERE id = public.pedido_itens.pedido_id)
  )
);
