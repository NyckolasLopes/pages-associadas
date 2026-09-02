-- Migration to add optional/helper columns to produtos table
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS categorias_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS subcategorias_ids JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS filtros_valores JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS compre_junto_produto_id TEXT;
