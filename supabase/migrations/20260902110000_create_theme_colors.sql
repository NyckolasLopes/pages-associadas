-- Migration: Create theme_colors table for storing network and store color configurations
CREATE TABLE IF NOT EXISTS public.theme_colors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loja_id TEXT UNIQUE NOT NULL,
  colors JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.theme_colors ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Allow public read theme_colors" ON public.theme_colors
  FOR SELECT USING (true);

-- Allow authenticated and admin full access
CREATE POLICY "Allow authenticated manage theme_colors" ON public.theme_colors
  FOR ALL USING (true);
