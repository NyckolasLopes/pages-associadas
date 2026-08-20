-- Adicionar colunas de dados do cliente diretamente na tabela pedidos
-- Isso evita o problema de RLS que bloqueia join com profiles para admins/lojistas

ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS nome_cliente TEXT DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS telefone_cliente TEXT DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS email_cliente TEXT DEFAULT '';
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS cpf_cliente TEXT DEFAULT '';
