-- Adicionar colunas JSONB para preços e estoques por loja na tabela produtos
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS precos_por_loja JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS estoques_por_loja JSONB DEFAULT '{}'::jsonb;
