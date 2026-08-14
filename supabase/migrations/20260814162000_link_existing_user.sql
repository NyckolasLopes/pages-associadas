CREATE OR REPLACE FUNCTION public.link_existing_user(
  p_email TEXT,
  p_nome TEXT,
  p_is_admin BOOLEAN,
  p_grupo_id TEXT,
  p_lojas_vinculadas TEXT[]
) RETURNS void AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Verificar se o usuário que está chamando é um admin
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true) THEN
    RAISE EXCEPTION 'Acesso negado';
  END IF;

  -- Buscar o ID do usuário na tabela auth.users
  SELECT id INTO v_user_id FROM auth.users WHERE email = p_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado na autenticação';
  END IF;

  -- Criar ou atualizar o perfil
  INSERT INTO public.profiles (id, email, nome, is_admin, grupo_id, lojas_vinculadas)
  VALUES (v_user_id, p_email, p_nome, p_is_admin, p_grupo_id, p_lojas_vinculadas)
  ON CONFLICT (id) DO UPDATE SET
    nome = EXCLUDED.nome,
    is_admin = EXCLUDED.is_admin,
    grupo_id = EXCLUDED.grupo_id,
    lojas_vinculadas = EXCLUDED.lojas_vinculadas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
