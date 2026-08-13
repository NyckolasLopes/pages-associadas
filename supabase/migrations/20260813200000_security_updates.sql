-- 1. Adicionar coluna has_logged_in_before na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS has_logged_in_before BOOLEAN DEFAULT FALSE;

-- 2. Criar função para exclusão de conta do próprio usuário
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS void AS $$
BEGIN
  -- Deleta o usuário da tabela auth.users.
  -- Como o ID é o mesmo do auth.uid(), usamos o token JWT para confirmar a identidade.
  -- A restrição ON DELETE CASCADE na tabela profiles e outras tabelas dependentes
  -- garantirá que os dados relacionados sejam limpos.
  DELETE FROM auth.users WHERE id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
