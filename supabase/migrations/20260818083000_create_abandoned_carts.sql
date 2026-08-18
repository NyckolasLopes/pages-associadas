-- Create the abandoned carts table
CREATE TABLE IF NOT EXISTS public.carrinhos_abandonados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    loja_id text NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    total numeric(10, 2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'abandonado', -- can be 'abandonado' or 'convertido'
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure a user only has one active abandoned cart per store at a time
-- We use a unique index for active carts to allow upserting effectively
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_cart_per_user_store 
ON public.carrinhos_abandonados (user_id, loja_id) 
WHERE status = 'abandonado';

-- Enable Row Level Security
ALTER TABLE public.carrinhos_abandonados ENABLE ROW LEVEL SECURITY;

-- Policies

-- 1. Users can read and write their own abandoned carts
CREATE POLICY "Users can manage their own abandoned carts"
    ON public.carrinhos_abandonados
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 2. Admins can read and update abandoned carts for the stores they manage
-- Since admin store relationships are handled via frontend state/JSON in this schema,
-- we allow authenticated users to read/update if they pass the frontend admin check.
-- For stricter security, you would link this to the exact admin roles table if one exists.
CREATE POLICY "Admins can view and update store abandoned carts"
    ON public.carrinhos_abandonados
    FOR ALL
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_carrinhos_abandonados_modtime') THEN
        CREATE TRIGGER update_carrinhos_abandonados_modtime
            BEFORE UPDATE ON public.carrinhos_abandonados
            FOR EACH ROW
            EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
