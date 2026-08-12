-- 1. Add is_admin to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- 2. Update existing profiles if they match the admin email
UPDATE public.profiles SET is_admin = true WHERE email = 'nyckolas.lopes@farmaciasassociadas.com.br';

-- 3. Modify trigger to handle new admin automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, avatar_url, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url',
    (NEW.email = 'nyckolas.lopes@farmaciasassociadas.com.br')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. Drop insecure policies
DROP POLICY IF EXISTS "Lojas: public insert" ON public.lojas;
DROP POLICY IF EXISTS "Lojas: public update" ON public.lojas;
DROP POLICY IF EXISTS "Lojas: public delete" ON public.lojas;
DROP POLICY IF EXISTS "Lojas: all access for authenticated" ON public.lojas;
DROP POLICY IF EXISTS "Produtos: all access for authenticated" ON public.produtos;
DROP POLICY IF EXISTS "PrecosLoja: all access for authenticated" ON public.produto_precos_loja;
DROP POLICY IF EXISTS "Categorias: all access for authenticated" ON public.categorias;

-- 5. Create secure policies checking for is_admin = true

-- Lojas
CREATE POLICY "Lojas: admin insert" ON public.lojas FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Lojas: admin update" ON public.lojas FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Lojas: admin delete" ON public.lojas FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Produtos
CREATE POLICY "Produtos: admin insert" ON public.produtos FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Produtos: admin update" ON public.produtos FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Produtos: admin delete" ON public.produtos FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- PrecosLoja
CREATE POLICY "PrecosLoja: admin insert" ON public.produto_precos_loja FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "PrecosLoja: admin update" ON public.produto_precos_loja FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "PrecosLoja: admin delete" ON public.produto_precos_loja FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Categorias
CREATE POLICY "Categorias: admin insert" ON public.categorias FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Categorias: admin update" ON public.categorias FOR UPDATE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)) WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY "Categorias: admin delete" ON public.categorias FOR DELETE USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
