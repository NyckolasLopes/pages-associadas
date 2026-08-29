-- Função robusta para exclusão de conta pelo próprio usuário
CREATE OR REPLACE FUNCTION public.delete_own_account()
RETURNS boolean AS $$
DECLARE
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Não autenticado';
  END IF;

  -- 1. Desvincular pedidos do usuário para preservar histórico e integridade fiscal
  BEGIN
    UPDATE public.pedidos SET user_id = NULL WHERE user_id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 2. Deletar carrinhos abandonados
  BEGIN
    DELETE FROM public.carrinhos_abandonados WHERE user_id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 3. Deletar endereços do usuário
  BEGIN
    DELETE FROM public.enderecos WHERE user_id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 4. Deletar favoritos se a tabela existir
  BEGIN
    DELETE FROM public.favoritos WHERE user_id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 5. Deletar avaliações se a tabela existir
  BEGIN
    DELETE FROM public.avaliacoes WHERE user_id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 6. Deletar perfil
  BEGIN
    DELETE FROM public.profiles WHERE id = current_user_id;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  -- 7. Deletar usuário de auth.users
  DELETE FROM auth.users WHERE id = current_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.delete_own_account() TO authenticated;
