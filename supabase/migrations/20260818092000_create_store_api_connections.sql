-- Create store_api_connections table
CREATE TABLE IF NOT EXISTS public.store_api_connections (
    loja_id text PRIMARY KEY,
    stock_price_hash text,
    stock_price_status text DEFAULT 'offline',
    stock_price_last_ping timestamp with time zone,
    catalog_hash text,
    catalog_status text DEFAULT 'offline',
    catalog_last_ping timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.store_api_connections ENABLE ROW LEVEL SECURITY;

-- Allow read access
CREATE POLICY "Enable read access for all users" ON public.store_api_connections
    FOR SELECT USING (true);

-- Allow insert access
CREATE POLICY "Enable insert access for all users" ON public.store_api_connections
    FOR INSERT WITH CHECK (true);

-- Allow update access
CREATE POLICY "Enable update access for all users" ON public.store_api_connections
    FOR UPDATE USING (true);

-- Allow delete access
CREATE POLICY "Enable delete access for all users" ON public.store_api_connections
    FOR DELETE USING (true);
