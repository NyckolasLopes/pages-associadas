-- Remove políticas antigas que possam estar bloqueando
DROP POLICY IF EXISTS "Banners: public read" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin insert" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin update" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin delete" ON public.banners;
DROP POLICY IF EXISTS "Banners: all access for authenticated" ON public.banners;

-- Cria política permitindo leitura pública
CREATE POLICY "Banners: public read" 
ON public.banners 
FOR SELECT 
USING (true);

-- Permite que usuários autenticados gerenciem banners 
-- (segue o mesmo padrão que as outras tabelas do banco atualmente)
CREATE POLICY "Banners: all access for authenticated" 
ON public.banners 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
