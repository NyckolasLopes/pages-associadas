-- Adiciona permissão de exclusão (DELETE) na tabela pedidos
-- Permite que Admin Global ou o Associado (dono da loja) possam excluir o pedido
CREATE POLICY "Pedidos: exclusao geral" 
ON public.pedidos FOR DELETE 
USING (
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  OR
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.lojas_vinculadas ? pedidos.loja_id))
);
