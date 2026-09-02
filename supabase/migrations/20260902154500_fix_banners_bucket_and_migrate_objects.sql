-- 1. Garante que o bucket 'banners' existe no Supabase Storage e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Configura políticas RLS para o bucket 'banners' (Leitura pública e gravação liberada)
DO $$
BEGIN
  -- Leitura pública para o bucket banners
  DROP POLICY IF EXISTS "Public Read Banners" ON storage.objects;
  CREATE POLICY "Public Read Banners" ON storage.objects
    FOR SELECT USING (bucket_id = 'banners');

  -- Permissão de inserção no bucket banners
  DROP POLICY IF EXISTS "Allow All Banners Insert" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Banners Insert" ON storage.objects;
  CREATE POLICY "Allow All Banners Insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'banners');

  -- Permissão de atualização no bucket banners
  DROP POLICY IF EXISTS "Allow All Banners Update" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Banners Update" ON storage.objects;
  CREATE POLICY "Allow All Banners Update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'banners');

  -- Permissão de exclusão no bucket banners
  DROP POLICY IF EXISTS "Allow All Banners Delete" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Banners Delete" ON storage.objects;
  CREATE POLICY "Allow All Banners Delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'banners');
END $$;

-- 3. Move arquivos de banner que foram salvos por engano no bucket 'logos' para o bucket 'banners'
UPDATE storage.objects
SET bucket_id = 'banners'
WHERE bucket_id = 'logos'
  AND (
    name LIKE 'banner%' 
    OR name LIKE 'desktop%' 
    OR name LIKE 'mobile%' 
    OR name LIKE 'tarja%'
  );

-- 4. Atualiza os links existentes na tabela 'banners' para apontar para o bucket 'banners'
UPDATE public.banners
SET 
  image_url = REPLACE(image_url, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  mobile_image_url = REPLACE(mobile_image_url, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  image_url2 = REPLACE(image_url2, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  mobile_image_url2 = REPLACE(mobile_image_url2, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  image_url3 = REPLACE(image_url3, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  mobile_image_url3 = REPLACE(mobile_image_url3, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/'),
  formato_extra = REPLACE(formato_extra, '/storage/v1/object/public/logos/', '/storage/v1/object/public/banners/')
WHERE 
  image_url LIKE '%/storage/v1/object/public/logos/%'
  OR mobile_image_url LIKE '%/storage/v1/object/public/logos/%'
  OR image_url2 LIKE '%/storage/v1/object/public/logos/%'
  OR mobile_image_url2 LIKE '%/storage/v1/object/public/logos/%'
  OR image_url3 LIKE '%/storage/v1/object/public/logos/%'
  OR mobile_image_url3 LIKE '%/storage/v1/object/public/logos/%'
  OR formato_extra LIKE '%/storage/v1/object/public/logos/%';

-- 5. Atualiza ocorrências salvas no app_state
UPDATE public.app_state
SET value = REPLACE(value::text, '/storage/v1/object/public/logos/banner_', '/storage/v1/object/public/banners/banner_')::json
WHERE value::text LIKE '%/storage/v1/object/public/logos/banner_%';

UPDATE public.app_state
SET value = REPLACE(value::text, '/storage/v1/object/public/logos/desktop_', '/storage/v1/object/public/banners/desktop_')::json
WHERE value::text LIKE '%/storage/v1/object/public/logos/desktop_%';

UPDATE public.app_state
SET value = REPLACE(value::text, '/storage/v1/object/public/logos/mobile_', '/storage/v1/object/public/banners/mobile_')::json
WHERE value::text LIKE '%/storage/v1/object/public/logos/mobile_%';

UPDATE public.app_state
SET value = REPLACE(value::text, '/storage/v1/object/public/logos/tarja_', '/storage/v1/object/public/banners/tarja_')::json
WHERE value::text LIKE '%/storage/v1/object/public/logos/tarja_%';
