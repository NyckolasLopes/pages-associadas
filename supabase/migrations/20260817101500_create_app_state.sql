-- Create app_state table for storing Zustand persist state in Supabase
CREATE TABLE IF NOT EXISTS public.app_state (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.app_state ENABLE ROW LEVEL SECURITY;

-- Allow all admins to manage app_state
CREATE POLICY "Admins can manage app_state" ON public.app_state
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.grupo_id IS NOT NULL)
    )
  );

-- For now, allow public read access for storefront
CREATE POLICY "Public read access for app_state" ON public.app_state
  FOR SELECT
  USING (true);
