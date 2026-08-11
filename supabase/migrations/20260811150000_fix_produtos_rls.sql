
-- Permissões para que administradores autenticados possam criar, editar e excluir produtos
CREATE POLICY "Produtos: all access for authenticated" ON public.produtos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Permissões para que administradores autenticados possam criar, editar e excluir preços por loja
CREATE POLICY "PrecosLoja: all access for authenticated" ON public.produto_precos_loja FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Garantir que a role authenticated tenha as permissões no banco
GRANT INSERT, UPDATE, DELETE ON public.produtos TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.produto_precos_loja TO authenticated;

-- Permiss�es para lojas e categorias
CREATE POLICY "Categorias: all access for authenticated" ON public.categorias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Lojas: all access for authenticated" ON public.lojas FOR ALL TO authenticated USING (true) WITH CHECK (true);

GRANT INSERT, UPDATE, DELETE ON public.categorias TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.lojas TO authenticated;

