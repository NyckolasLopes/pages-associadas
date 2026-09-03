-- Migration to add custom colors for regulatory alert on products
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS alerta_cor_fundo text DEFAULT '#fffbeb',
ADD COLUMN IF NOT EXISTS alerta_cor_texto text DEFAULT '#78350f';
