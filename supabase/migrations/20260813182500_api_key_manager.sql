-- Migration para gerenciar API Keys das lojas

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
  
  -- Delete old keys for this store to keep it 1:1
  DELETE FROM public.api_keys WHERE loja_id = p_loja_id AND tipo = 'loja';
  
  INSERT INTO public.api_keys (key_hash, tipo, loja_id)
  VALUES (crypt(v_raw_key, gen_salt('bf')), 'loja', p_loja_id);
  
  RETURN v_raw_key;
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_loja_api_key(p_raw_key TEXT, p_loja_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_valid BOOLEAN := false;
BEGIN
  SELECT true INTO v_valid 
  FROM public.api_keys 
  WHERE key_hash = crypt(p_raw_key, key_hash) 
    AND tipo = 'loja' 
    AND loja_id = p_loja_id
  LIMIT 1;
  
  RETURN coalesce(v_valid, false);
END;
$$;
