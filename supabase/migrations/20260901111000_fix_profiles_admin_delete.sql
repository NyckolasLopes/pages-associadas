-- Garante que admins globais (proprietario = true ou is_admin = true) podem deletar qualquer perfil de cliente

-- Remove policies antigas que podem estar conflitando
DROP POLICY IF EXISTS "Profiles: admin delete" ON public.profiles;

-- Recria a policy de delete usando a função segura anti-recursão
CREATE POLICY "Profiles: admin delete" ON public.profiles
FOR DELETE TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND (p.is_admin = true OR p.proprietario = true)
  )
);

-- Garante que usuários podem deletar seu próprio perfil
DROP POLICY IF EXISTS "Profiles: self delete" ON public.profiles;
CREATE POLICY "Profiles: self delete" ON public.profiles
FOR DELETE TO authenticated
USING (id = auth.uid());
