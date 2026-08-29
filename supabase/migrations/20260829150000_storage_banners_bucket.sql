-- Garante a criação dos buckets banners e logos no Supabase Storage
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('banners', 'banners', true),
  ('logos', 'logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Leitura Pública
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read Banners'
  ) THEN
    CREATE POLICY "Public Read Banners" ON storage.objects FOR SELECT USING (bucket_id = 'banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Public Read Logos'
  ) THEN
    CREATE POLICY "Public Read Logos" ON storage.objects FOR SELECT USING (bucket_id = 'logos');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow All Banners Insert'
  ) THEN
    CREATE POLICY "Allow All Banners Insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow All Banners Update'
  ) THEN
    CREATE POLICY "Allow All Banners Update" ON storage.objects FOR UPDATE USING (bucket_id = 'banners');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND policyname = 'Allow All Banners Delete'
  ) THEN
    CREATE POLICY "Allow All Banners Delete" ON storage.objects FOR DELETE USING (bucket_id = 'banners');
  END IF;
END $$;
