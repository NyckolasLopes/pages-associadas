-- Fix SELECT policies for pedidos and pedido_itens to gracefully handle JSONB arrays

-- Drop existing store admin policies
DROP POLICY IF EXISTS "Pedidos: select store admin" ON public.pedidos;
DROP POLICY IF EXISTS "PedidoItens: select store admin" ON public.pedido_itens;
DROP POLICY IF EXISTS "PedidoItens: select buyer" ON public.pedido_itens;

-- 1. Pedidos (Store Admin)
CREATE POLICY "Pedidos: select store admin" ON public.pedidos FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      -- Handles both JSONB and TEXT[] gracefully via string matching
      strpos(lojas_vinculadas::text, public.pedidos.loja_id::text) > 0
    )
  )
);

-- 2. Pedido Itens (Store Admin)
CREATE POLICY "PedidoItens: select store admin" ON public.pedido_itens FOR SELECT TO authenticated USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (
      strpos(lojas_vinculadas::text, (SELECT loja_id FROM public.pedidos WHERE id = public.pedido_itens.pedido_id)::text) > 0
    )
  )
);

-- 3. Pedido Itens (Buyer / Customer)
CREATE POLICY "PedidoItens: select buyer" ON public.pedido_itens FOR SELECT TO authenticated USING (
  (SELECT user_id FROM public.pedidos WHERE id = public.pedido_itens.pedido_id) = auth.uid()
);
