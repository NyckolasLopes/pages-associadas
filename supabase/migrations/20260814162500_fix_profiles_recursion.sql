-- Drop the recursive policies
DROP POLICY IF EXISTS "Profiles: admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin delete" ON public.profiles;
DROP POLICY IF EXISTS "Super admin pode ver e editar todos os perfis" ON public.profiles;

-- Create a secure function to check admin status without recursion
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  SELECT is_admin INTO v_is_admin FROM public.profiles WHERE id = auth.uid() LIMIT 1;
  RETURN COALESCE(v_is_admin, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Recreate policies using the secure function
CREATE POLICY "Profiles: admin select" ON public.profiles
FOR SELECT TO authenticated
USING (public.is_user_admin());

CREATE POLICY "Profiles: admin insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.is_user_admin());

CREATE POLICY "Profiles: admin update" ON public.profiles
FOR UPDATE TO authenticated
USING (public.is_user_admin())
WITH CHECK (public.is_user_admin());

CREATE POLICY "Profiles: admin delete" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_user_admin());
