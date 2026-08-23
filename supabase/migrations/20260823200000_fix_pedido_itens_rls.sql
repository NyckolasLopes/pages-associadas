-- Fix SELECT policies for pedidos and pedido_itens so Admins and Store Owners can see them.

-- 1. Pedidos
CREATE POLICY "Pedidos: select any admin" ON public.pedidos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "Pedidos: select store admin" ON public.pedidos FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND loja_id = ANY(lojas_vinculadas))
);

-- 2. Pedido itens
CREATE POLICY "PedidoItens: select any admin" ON public.pedido_itens FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

CREATE POLICY "PedidoItens: select store admin" ON public.pedido_itens FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (SELECT loja_id FROM public.pedidos WHERE id = pedido_id) = ANY(lojas_vinculadas)
  )
);
