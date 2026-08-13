-- 1. Ensure the profiles table has the necessary columns for admin users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS grupo_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lojas_vinculadas TEXT[];

-- 2. Allow admins to view all profiles
CREATE POLICY "Profiles: admin select" ON public.profiles
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 3. Allow admins to insert profiles
CREATE POLICY "Profiles: admin insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 4. Allow admins to update profiles
CREATE POLICY "Profiles: admin update" ON public.profiles
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- 5. Allow admins to delete profiles
CREATE POLICY "Profiles: admin delete" ON public.profiles
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
