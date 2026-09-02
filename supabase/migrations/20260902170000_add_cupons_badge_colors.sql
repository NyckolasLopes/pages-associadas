-- Adiciona colunas para cores personalizadas do selo "Com Cupom" na tabela cupons
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS badge_bg TEXT;
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS badge_text TEXT;
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS badge_border TEXT;
