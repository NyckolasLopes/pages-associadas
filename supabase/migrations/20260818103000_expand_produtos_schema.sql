-- Migration to expand produtos table with new catalog fields
ALTER TABLE public.produtos
ADD COLUMN IF NOT EXISTS eans_secundarios jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS codigo_interno text,
ADD COLUMN IF NOT EXISTS tipo_produto text,
ADD COLUMN IF NOT EXISTS produto_natureza text DEFAULT 'fisico',
ADD COLUMN IF NOT EXISTS ncm text,
ADD COLUMN IF NOT EXISTS subcategorias_adicionais jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prioridade integer,
ADD COLUMN IF NOT EXISTS lancamento boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS peso numeric,
ADD COLUMN IF NOT EXISTS tamanho text,
ADD COLUMN IF NOT EXISTS tipo_receita text,
ADD COLUMN IF NOT EXISTS dcb text,
ADD COLUMN IF NOT EXISTS prescricao text,
ADD COLUMN IF NOT EXISTS apresentacao text,
ADD COLUMN IF NOT EXISTS via_administracao text,
ADD COLUMN IF NOT EXISTS dosagem text,
ADD COLUMN IF NOT EXISTS area_aplicacao text,
ADD COLUMN IF NOT EXISTS faixa_etaria text,
ADD COLUMN IF NOT EXISTS titulo_seo text,
ADD COLUMN IF NOT EXISTS meta_description text;

-- Atualizar metadados dos tipos nas policies e views caso existam (se não necessário, ignora)
