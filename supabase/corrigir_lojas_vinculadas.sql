-- Corrige as lojas vinculadas do perfil para os IDs reais das lojas criadas no banco de dados
UPDATE public.profiles
SET 
  lojas_vinculadas = '["loja-poa-centro", "loja-caxias"]'::jsonb
WHERE email = 'nyckolas.lopes@gmail.com';
