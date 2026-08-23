-- Permitir que administradores globais deletem qualquer pedido
CREATE POLICY "Pedidos: delete any admin" ON public.pedidos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Permitir que donos de loja deletem pedidos da sua loja
CREATE POLICY "Pedidos: delete store admin" ON public.pedidos FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND loja_id = ANY(lojas_vinculadas))
);

-- Permitir que o próprio usuário delete seu pedido (se necessário)
CREATE POLICY "Pedidos: delete own" ON public.pedidos FOR DELETE TO authenticated USING (auth.uid() = user_id);


-- O mesmo para pedido_itens
CREATE POLICY "Pedido itens: delete any admin" ON public.pedido_itens FOR DELETE TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Pedido itens: delete store admin" ON public.pedido_itens FOR DELETE TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (SELECT loja_id FROM public.pedidos WHERE id = pedido_id) = ANY(lojas_vinculadas)
  )
);

CREATE POLICY "Pedido itens: delete own" ON public.pedido_itens FOR DELETE TO authenticated USING (
  pedido_id IN (SELECT id FROM public.pedidos WHERE user_id = auth.uid())
);
