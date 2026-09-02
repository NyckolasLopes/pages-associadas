-- Enable pg_trgm for ultra-fast text and substring search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Trigram GIN Indexes for ultra-fast ILIKE searches on products
CREATE INDEX IF NOT EXISTS idx_produtos_nome_trgm ON public.produtos USING gin (nome gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_marca_trgm ON public.produtos USING gin (marca gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_produtos_ean ON public.produtos (ean);
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos (slug);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos (ativo);
CREATE INDEX IF NOT EXISTS idx_produtos_categoria_id ON public.produtos (categoria_id);

-- Composite index on produto_precos_loja for lightning fast price joins
CREATE INDEX IF NOT EXISTS idx_precos_loja_composite ON public.produto_precos_loja (produto_id, loja_id);
CREATE INDEX IF NOT EXISTS idx_precos_loja_loja_id ON public.produto_precos_loja (loja_id);
