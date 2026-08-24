-- Liberar que donos de loja possam inserir/atualizar preços na tabela produto_precos_loja
-- APENAS para as lojas vinculadas ao usuário (com perfil is_admin = false mas lojas_vinculadas não vazio)

-- Insert para donos de loja
CREATE POLICY "PrecosLoja: store owner insert" ON public.produto_precos_loja
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND COALESCE(lojas_vinculadas, '[]'::jsonb) ? loja_id
  )
);

-- Update para donos de loja (apenas das suas lojas)
CREATE POLICY "PrecosLoja: store owner update" ON public.produto_precos_loja
FOR UPDATE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND COALESCE(lojas_vinculadas, '[]'::jsonb) ? loja_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND COALESCE(lojas_vinculadas, '[]'::jsonb) ? loja_id
  )
);
