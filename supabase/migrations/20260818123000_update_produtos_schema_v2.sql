-- Update products schema: add new fields and remove deprecated ones

-- Adicionar novos campos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS caracteristicas jsonb[] DEFAULT ARRAY[]::jsonb[],
ADD COLUMN IF NOT EXISTS classe_terapeutica text;

-- Remover campos obsoletos
ALTER TABLE public.produtos 
DROP COLUMN IF EXISTS peso,
DROP COLUMN IF EXISTS tamanho,
DROP COLUMN IF EXISTS prescricao,
DROP COLUMN IF EXISTS apresentacao,
DROP COLUMN IF EXISTS via_administracao,
DROP COLUMN IF EXISTS dosagem,
DROP COLUMN IF EXISTS area_aplicacao,
DROP COLUMN IF EXISTS dcb,
DROP COLUMN IF EXISTS fabricante;
