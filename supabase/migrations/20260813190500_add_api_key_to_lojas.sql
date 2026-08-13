ALTER TABLE public.lojas ADD COLUMN IF NOT EXISTS api_key TEXT;

CREATE OR REPLACE FUNCTION public.create_loja_api_key(p_loja_id TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_raw_key TEXT;
BEGIN
  -- Generate a random key
  v_raw_key := 'sk_loja_' || encode(gen_random_bytes(16), 'hex');
  
  -- Delete old keys for this store to keep it 1:1 in api_keys table
  DELETE FROM public.api_keys WHERE loja_id = p_loja_id AND tipo = 'loja';
  
  -- Insert hash for validation
  INSERT INTO public.api_keys (key_hash, tipo, loja_id)
  VALUES (crypt(v_raw_key, gen_salt('bf')), 'loja', p_loja_id);
  
  -- Also save raw key to lojas table for admin visibility
  UPDATE public.lojas SET api_key = v_raw_key WHERE id = p_loja_id;
  
  RETURN v_raw_key;
END;
$$;
