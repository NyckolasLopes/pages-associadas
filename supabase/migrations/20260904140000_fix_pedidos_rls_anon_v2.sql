-- Fix definitivo: permitir inserção anônima na tabela pedidos
-- Aplica permissões corretas para o papel anon (clientes sem login)

-- 1. Garantir que user_id pode ser NULL (clientes não autenticados)
ALTER TABLE public.pedidos ALTER COLUMN user_id DROP NOT NULL;

-- 2. Remover políticas conflitantes de INSERT
DROP POLICY IF EXISTS "Pedidos: insert own" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: public insert allowed" ON public.pedidos;
DROP POLICY IF EXISTS "Allow anon insert pedidos" ON public.pedidos;

-- 3. Garantir GRANT de INSERT para anon e authenticated
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedidos TO authenticated;
GRANT INSERT ON public.pedido_itens TO anon;
GRANT INSERT ON public.pedido_itens TO authenticated;
GRANT INSERT ON public.pedido_historico_status TO anon;
GRANT INSERT ON public.pedido_historico_status TO authenticated;

-- 4. Criar política de INSERT pública (qualquer um pode criar pedido)
CREATE POLICY "Pedidos: public insert allowed"
  ON public.pedidos
  FOR INSERT
  WITH CHECK (true);

-- 5. Política para pedido_itens
DROP POLICY IF EXISTS "PedidoItens: insert own" ON public.pedido_itens;
DROP POLICY IF EXISTS "PedidoItens: public insert allowed" ON public.pedido_itens;
CREATE POLICY "PedidoItens: public insert allowed"
  ON public.pedido_itens
  FOR INSERT
  WITH CHECK (true);

-- 6. Política para pedido_historico_status
DROP POLICY IF EXISTS "PedidoHistorico: public insert allowed" ON public.pedido_historico_status;
CREATE POLICY "PedidoHistorico: public insert allowed"
  ON public.pedido_historico_status
  FOR INSERT
  WITH CHECK (true);
