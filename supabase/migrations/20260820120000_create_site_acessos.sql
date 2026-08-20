
CREATE TABLE IF NOT EXISTS public.site_acessos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    loja_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.site_acessos ENABLE ROW LEVEL SECURITY;

-- Allow anon to insert
CREATE POLICY "Allow anon insert" ON public.site_acessos
    FOR INSERT
    TO public
    WITH CHECK (true);

-- Allow authenticated users (admin) to select
CREATE POLICY "Allow authenticated select" ON public.site_acessos
    FOR SELECT
    TO authenticated
    USING (true);

-- Also allow anon to select so that the frontend can compute stats (if needed)
CREATE POLICY "Allow anon select" ON public.site_acessos
    FOR SELECT
    TO public
    USING (true);
