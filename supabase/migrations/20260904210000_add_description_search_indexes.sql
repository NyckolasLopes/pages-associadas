-- Enable pg_trgm for ultra-fast text and substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN Indexes for ultra-fast ILIKE searches on product description and summary
CREATE INDEX IF NOT EXISTS idx_produtos_descricao_trgm ON public.produtos USING gin (descricao gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_resumo_descricao_trgm ON public.produtos USING gin (resumo_descricao gin_trgm_ops);
