-- Confirma o email na tabela de autenticação para permitir o login
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = 'nyckolas.lopes@gmail.com';

-- Atualiza o perfil para ter as permissões de Associado e ser vinculado à Loja 1
UPDATE public.profiles
SET 
  grupo_id = 'grupo-associado',
  lojas_vinculadas = '["1"]'::jsonb,
  proprietario = false,
  nome = 'Nyckolas Lopes (Associado)'
WHERE email = 'nyckolas.lopes@gmail.com';
