-- Correção: permitir inserção anônima (guest) na tabela pedidos
-- A migration 20260825150000_public_orders.sql foi adicionada ao repositório
-- mas pode não ter sido aplicada ao banco de dados. Este arquivo a reaaplica com segurança.

-- 1. Garantir que user_id pode ser NULL (para pedidos de visitantes não logados)
ALTER TABLE public.pedidos ALTER COLUMN user_id DROP NOT NULL;

-- 2. Remover políticas antigas de INSERT que exigiam auth.uid() para não conflitar
DROP POLICY IF EXISTS "Pedidos: insert own" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: public insert allowed" ON public.pedidos;

-- 3. Garantir permissão de INSERT para o papel anon (visitantes não autenticados)
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedido_itens TO anon;
GRANT INSERT ON public.pedido_historico_status TO anon;

-- 4. Recriar a política de INSERT pública (permite qualquer inserção, sem restrição de RLS)
CREATE POLICY "Pedidos: public insert allowed"
  ON public.pedidos
  FOR INSERT
  WITH CHECK (true);

-- 5. Para pedido_itens
DROP POLICY IF EXISTS "PedidoItens: insert own" ON public.pedido_itens;
DROP POLICY IF EXISTS "PedidoItens: public insert allowed" ON public.pedido_itens;
CREATE POLICY "PedidoItens: public insert allowed"
  ON public.pedido_itens
  FOR INSERT
  WITH CHECK (true);

-- 6. Para pedido_historico_status
DROP POLICY IF EXISTS "PedidoHistorico: public insert allowed" ON public.pedido_historico_status;
CREATE POLICY "PedidoHistorico: public insert allowed"
  ON public.pedido_historico_status
  FOR INSERT
  WITH CHECK (true);
