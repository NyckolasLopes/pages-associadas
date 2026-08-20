-- Fix: permitir admins e lojistas verem carrinhos abandonados de outros usuários

-- Remover policies antigas que bloqueiam acesso
DROP POLICY IF EXISTS "Users can manage their own abandoned carts" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Admins can view and update store abandoned carts" ON public.carrinhos_abandonados;

-- Policy 1: Usuário vê e gerencia seu próprio carrinho
CREATE POLICY "Carrinho: usuario gerencia o proprio"
ON public.carrinhos_abandonados
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 2: Admin global vê todos os carrinhos
CREATE POLICY "Carrinho: admin global ve tudo"
ON public.carrinhos_abandonados
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Policy 3: Admin global pode atualizar/deletar qualquer carrinho
CREATE POLICY "Carrinho: admin global gerencia tudo"
ON public.carrinhos_abandonados
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.is_admin = true
  )
);

-- Policy 4: Lojista associado vê carrinhos da sua loja
CREATE POLICY "Carrinho: lojista ve carrinhos da sua loja"
ON public.carrinhos_abandonados
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.lojas_vinculadas ? carrinhos_abandonados.loja_id
  )
);

-- Policy 5: Lojista associado pode atualizar carrinhos da sua loja
CREATE POLICY "Carrinho: lojista atualiza carrinhos da sua loja"
ON public.carrinhos_abandonados
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.lojas_vinculadas ? carrinhos_abandonados.loja_id
  )
);

-- Policy 6: Lojista associado pode deletar carrinhos da sua loja
CREATE POLICY "Carrinho: lojista deleta carrinhos da sua loja"
ON public.carrinhos_abandonados
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
    AND p.lojas_vinculadas ? carrinhos_abandonados.loja_id
  )
);
