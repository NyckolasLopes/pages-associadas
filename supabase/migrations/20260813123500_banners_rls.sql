-- Remove políticas antigas que possam estar bloqueando
DROP POLICY IF EXISTS "Banners: public read" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin insert" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin update" ON public.banners;
DROP POLICY IF EXISTS "Banners: admin delete" ON public.banners;
DROP POLICY IF EXISTS "Banners: all access for authenticated" ON public.banners;

-- Cria políticas seguras permitindo que admins gerenciem os banners
CREATE POLICY "Banners: public read" 
ON public.banners 
FOR SELECT 
USING (true);

CREATE POLICY "Banners: admin insert" 
ON public.banners 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Banners: admin update" 
ON public.banners 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

CREATE POLICY "Banners: admin delete" 
ON public.banners 
FOR DELETE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
