-- Adiciona as colunas fabricante e bula_url na tabela produtos
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS fabricante TEXT,
ADD COLUMN IF NOT EXISTS bula_url TEXT;

COMMENT ON COLUMN public.produtos.fabricante IS 'Nome da empresa fabricante do produto';
COMMENT ON COLUMN public.produtos.bula_url IS 'URL ou anexo do documento/PDF da bula do medicamento ou produto';
