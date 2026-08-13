-- Allow admins to view all profiles
CREATE POLICY "Profiles: admin select" ON public.profiles
FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Allow admins to insert profiles
CREATE POLICY "Profiles: admin insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Allow admins to update profiles
CREATE POLICY "Profiles: admin update" ON public.profiles
FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));

-- Allow admins to delete profiles
CREATE POLICY "Profiles: admin delete" ON public.profiles
FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true));
