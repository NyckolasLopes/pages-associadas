-- 1. Cria uma função SECURITY DEFINER para verificar se o usuário é admin
-- O "SECURITY DEFINER" faz a consulta ignorar as regras de RLS, evitando o loop infinito
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND (proprietario = true OR grupo_id IS NOT NULL)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Recria as políticas problemáticas usando a nova função
DROP POLICY IF EXISTS "Profiles: admins read all" ON public.profiles;
CREATE POLICY "Profiles: admins read all" ON public.profiles FOR SELECT TO authenticated USING (
  public.is_admin()
);

DROP POLICY IF EXISTS "Profiles: admins update all" ON public.profiles;
CREATE POLICY "Profiles: admins update all" ON public.profiles FOR UPDATE TO authenticated USING (
  public.is_admin()
);
