-- Adicionar colunas de dados do cliente diretamente na tabela carrinhos_abandonados
-- Evita necessidade de join com profiles (que é bloqueado por RLS para admins/lojistas)

ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS nome_cliente TEXT DEFAULT '';
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS email_cliente TEXT DEFAULT '';
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS telefone_cliente TEXT DEFAULT '';

-- Executar TAMBÉM o fix-carrinhos-rls.sql se ainda não executou:
-- Ele corrige as políticas de acesso para que admins e lojistas possam ver os carrinhos.
