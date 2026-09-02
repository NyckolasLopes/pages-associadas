-- Create cupons table if not exists with all required columns
CREATE TABLE IF NOT EXISTS public.cupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  descricao TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  total_disponiveis INT DEFAULT 100,
  valor_minimo NUMERIC(10,2) DEFAULT 0,
  data_inicio TIMESTAMPTZ,
  data_termino TIMESTAMPTZ,
  exigir_min_itens BOOLEAN DEFAULT false,
  tipo_desconto TEXT DEFAULT 'percentual',
  valor_desconto NUMERIC(10,2) DEFAULT 0,
  aplicar_frete_gratis BOOLEAN DEFAULT false,
  aplicacao_automatica BOOLEAN DEFAULT false,
  permite_acumular BOOLEAN DEFAULT false,
  uso_unico BOOLEAN DEFAULT false,
  cupom_primeira_compra BOOLEAN DEFAULT false,
  numero_utilizacoes INT DEFAULT 0,
  loja_id TEXT REFERENCES public.lojas(id) ON DELETE CASCADE,
  tipo_alvo TEXT DEFAULT 'todos',
  alvos_id JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Ensure all columns exist if table was already created
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS tipo_alvo TEXT DEFAULT 'todos';
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS alvos_id JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS loja_id TEXT;
ALTER TABLE public.cupons ADD COLUMN IF NOT EXISTS numero_utilizacoes INT DEFAULT 0;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cupons_codigo ON public.cupons(codigo);
CREATE INDEX IF NOT EXISTS idx_cupons_loja ON public.cupons(loja_id);

-- RLS
ALTER TABLE public.cupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cupons' AND policyname = 'Cupons: public read') THEN
    CREATE POLICY "Cupons: public read" ON public.cupons FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cupons' AND policyname = 'Cupons: admin manage') THEN
    CREATE POLICY "Cupons: admin manage" ON public.cupons FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'cupons' AND policyname = 'Cupons: anon manage') THEN
    CREATE POLICY "Cupons: anon manage" ON public.cupons FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;

GRANT ALL ON public.cupons TO anon, authenticated, service_role;
