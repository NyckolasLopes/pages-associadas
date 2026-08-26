-- Adiciona a coluna destaque na tabela produto_precos_loja (para permitir destaque de produtos por loja)
ALTER TABLE public.produto_precos_loja
ADD COLUMN IF NOT EXISTS destaque BOOLEAN DEFAULT false;
