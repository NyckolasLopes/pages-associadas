-- Adiciona campos faltantes na tabela de lojas
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS footer_plataforma_texto TEXT;
