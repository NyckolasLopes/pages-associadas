-- Garante que os buckets existem e são públicos
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('banners', 'banners', true),
  ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas para o bucket LOGOS (INSERT/UPDATE/DELETE)
DO $$
BEGIN
  -- Logos: leitura pública
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Read Logos'
  ) THEN
    CREATE POLICY "Public Read Logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
  END IF;

  -- Logos: insert para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Logos Insert'
  ) THEN
    CREATE POLICY "Allow Auth Logos Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Logos: update para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Logos Update'
  ) THEN
    CREATE POLICY "Allow Auth Logos Update" ON storage.objects FOR UPDATE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Logos: delete para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Logos Delete'
  ) THEN
    CREATE POLICY "Allow Auth Logos Delete" ON storage.objects FOR DELETE USING (bucket_id = 'logos' AND auth.role() = 'authenticated');
  END IF;

  -- Banners: insert para usuários autenticados (mais restritivo que "All")
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Banners Insert'
  ) THEN
    CREATE POLICY "Allow Auth Banners Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners' AND auth.role() = 'authenticated');
  END IF;

  -- Banners: update para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Banners Update'
  ) THEN
    CREATE POLICY "Allow Auth Banners Update" ON storage.objects FOR UPDATE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
  END IF;

  -- Banners: delete para usuários autenticados
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Allow Auth Banners Delete'
  ) THEN
    CREATE POLICY "Allow Auth Banners Delete" ON storage.objects FOR DELETE USING (bucket_id = 'banners' AND auth.role() = 'authenticated');
  END IF;
END $$;
