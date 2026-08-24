-- Add columns if they do not exist
ALTER TABLE public.marcas ADD COLUMN IF NOT EXISTS loja_id text;
ALTER TABLE public.marcas ADD COLUMN IF NOT EXISTS global_pleno boolean DEFAULT false;

-- Make sure RLS is allowing insert
DROP POLICY IF EXISTS "Marcas: insert all" ON public.marcas;
CREATE POLICY "Marcas: insert all" ON public.marcas FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Marcas: update all" ON public.marcas;
CREATE POLICY "Marcas: update all" ON public.marcas FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Marcas: delete all" ON public.marcas;
CREATE POLICY "Marcas: delete all" ON public.marcas FOR DELETE USING (true);
