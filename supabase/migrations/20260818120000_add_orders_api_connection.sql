-- Add orders_hash, orders_status, and orders_last_ping to store_api_connections
ALTER TABLE public.store_api_connections
ADD COLUMN IF NOT EXISTS orders_hash text,
ADD COLUMN IF NOT EXISTS orders_status text DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS orders_last_ping timestamp with time zone;
