-- Drop the unique constraint on slug to prevent import failures
-- Products are identified by their ID (primary key), slug is just for SEO URLs
ALTER TABLE IF EXISTS public.produtos DROP CONSTRAINT IF EXISTS produtos_slug_key;

-- Create a non-unique index for performance on slug lookups
CREATE INDEX IF NOT EXISTS idx_produtos_slug ON public.produtos (slug);
