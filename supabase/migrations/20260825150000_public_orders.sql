-- Enable public inserts for orders so guests can checkout

-- 1. Make user_id optional since guests don't have an auth.uid()
ALTER TABLE public.pedidos ALTER COLUMN user_id DROP NOT NULL;

-- 2. Grant INSERT permissions to the anonymous role
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedido_itens TO anon;
GRANT INSERT ON public.pedido_historico_status TO anon;

-- 3. Create RLS policies allowing inserts without requiring auth
CREATE POLICY "Pedidos: public insert allowed" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "PedidoItens: public insert allowed" ON public.pedido_itens FOR INSERT WITH CHECK (true);
CREATE POLICY "PedidoHistorico: public insert allowed" ON public.pedido_historico_status FOR INSERT WITH CHECK (true);
