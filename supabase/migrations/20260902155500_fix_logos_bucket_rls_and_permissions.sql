-- 1. Garante que o bucket 'logos' existe no Supabase Storage e é público
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Configura políticas RLS para o bucket 'logos' (leitura e gravação completas)
DO $$
BEGIN
  -- Leitura pública para o bucket logos
  DROP POLICY IF EXISTS "Public Read Logos" ON storage.objects;
  CREATE POLICY "Public Read Logos" ON storage.objects
    FOR SELECT USING (bucket_id = 'logos');

  -- Permissão de inserção para o bucket logos
  DROP POLICY IF EXISTS "Allow All Logos Insert" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Logos Insert" ON storage.objects;
  CREATE POLICY "Allow All Logos Insert" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'logos');

  -- Permissão de atualização para o bucket logos
  DROP POLICY IF EXISTS "Allow All Logos Update" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Logos Update" ON storage.objects;
  CREATE POLICY "Allow All Logos Update" ON storage.objects
    FOR UPDATE USING (bucket_id = 'logos');

  -- Permissão de exclusão para o bucket logos
  DROP POLICY IF EXISTS "Allow All Logos Delete" ON storage.objects;
  DROP POLICY IF EXISTS "Allow Auth Logos Delete" ON storage.objects;
  CREATE POLICY "Allow All Logos Delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'logos');
END $$;

-- 3. Caso existam arquivos com nome de logo/favicon em outros buckets, move para 'logos'
UPDATE storage.objects
SET bucket_id = 'logos'
WHERE bucket_id != 'logos'
  AND (
    name LIKE '%logo%' 
    OR name LIKE '%favicon%' 
    OR name LIKE '%anvisa%'
  );
