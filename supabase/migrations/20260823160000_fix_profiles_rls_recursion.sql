-- Corrige o problema de referência circular no RLS de profiles
-- A política "Profiles: admin select" usa um subquery em profiles para verificar is_admin,
-- o que causa recursão infinita e o SELECT retorna 0 linhas silenciosamente.

-- Remover a política problemática
DROP POLICY IF EXISTS "Profiles: admin select" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin insert" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin update" ON public.profiles;
DROP POLICY IF EXISTS "Profiles: admin delete" ON public.profiles;

-- Recriar a política usando a função security definer para evitar recursão
-- Isso cria uma função que roda com privilégios elevados e não é afetada pelo RLS

CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT COALESCE(
    (SELECT is_admin FROM public.profiles WHERE id = auth.uid()),
    false
  );
$$;

-- Política de SELECT: o usuário vê seu próprio perfil OU todos se for admin
CREATE POLICY "Profiles: select own or admin" ON public.profiles
FOR SELECT TO authenticated
USING (auth.uid() = id OR public.is_admin_user());

-- Política de INSERT: apenas admin pode inserir (o próprio usuário é criado pelo trigger)
CREATE POLICY "Profiles: admin insert" ON public.profiles
FOR INSERT TO authenticated
WITH CHECK (public.is_admin_user());

-- Política de UPDATE: cada um atualiza o próprio, admin atualiza qualquer um
CREATE POLICY "Profiles: update own or admin" ON public.profiles
FOR UPDATE TO authenticated
USING (auth.uid() = id OR public.is_admin_user())
WITH CHECK (auth.uid() = id OR public.is_admin_user());

-- Política de DELETE: apenas admin pode deletar
CREATE POLICY "Profiles: admin delete" ON public.profiles
FOR DELETE TO authenticated
USING (public.is_admin_user());
