-- 1. Tornar user_id opcional para permitir pedidos de visitantes (sem login)
ALTER TABLE public.pedidos ALTER COLUMN user_id DROP NOT NULL;

-- 2. Conceder permissões para usuários anônimos poderem inserir pedidos (visitantes)
GRANT INSERT ON public.pedidos TO anon;
GRANT INSERT ON public.pedido_itens TO anon;

-- 3. Remover políticas antigas limitantes
DROP POLICY IF EXISTS "Pedidos: select own" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: insert own" ON public.pedidos;
DROP POLICY IF EXISTS "Pedidos: update own" ON public.pedidos;

-- 4. Criar novas políticas de acesso para a tabela pedidos

-- Inserção: Todos podem inserir pedidos (logados ou não)
CREATE POLICY "Pedidos: todos podem inserir" 
ON public.pedidos FOR INSERT 
WITH CHECK (true);

-- Leitura: Admins veem tudo, Lojistas veem da sua loja, Clientes veem os seus
CREATE POLICY "Pedidos: visibilidade geral" 
ON public.pedidos FOR SELECT 
USING (
  -- É Admin Global
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  OR
  -- É Lojista Associado (a loja do pedido está nas lojas vinculadas dele)
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.lojas_vinculadas ? pedidos.loja_id))
  OR
  -- É o próprio cliente que fez o pedido
  (auth.uid() = user_id)
);

-- Atualização: Admins, Lojistas e o próprio cliente podem atualizar
CREATE POLICY "Pedidos: atualizacao geral" 
ON public.pedidos FOR UPDATE 
USING (
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.is_admin = true))
  OR
  (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.lojas_vinculadas ? pedidos.loja_id))
  OR
  (auth.uid() = user_id)
);

-- 5. Atualizar políticas para pedido_itens (Itens do pedido)
DROP POLICY IF EXISTS "PedidoItens: select via pedido" ON public.pedido_itens;
DROP POLICY IF EXISTS "PedidoItens: insert via pedido" ON public.pedido_itens;

CREATE POLICY "PedidoItens: todos podem inserir" 
ON public.pedido_itens FOR INSERT 
WITH CHECK (true);

CREATE POLICY "PedidoItens: visibilidade geral" 
ON public.pedido_itens FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.pedidos p 
    WHERE p.id = pedido_id AND (
      (p.user_id = auth.uid()) OR
      (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.is_admin = true)) OR
      (EXISTS (SELECT 1 FROM public.profiles pr WHERE pr.id = auth.uid() AND pr.lojas_vinculadas ? p.loja_id))
    )
  )
);
