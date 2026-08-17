ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS footer_descricao TEXT;
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS footer_titulo_contato TEXT;
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS social_links JSONB;
