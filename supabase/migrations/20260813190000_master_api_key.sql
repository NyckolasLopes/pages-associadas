CREATE OR REPLACE FUNCTION public.create_master_api_key(p_nome TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_raw_key TEXT;
BEGIN
  -- Generate a random key
  v_raw_key := 'sk_master_' || encode(gen_random_bytes(24), 'hex');
  
  INSERT INTO public.api_keys (key_hash, tipo, nome)
  VALUES (crypt(v_raw_key, gen_salt('bf')), 'master', p_nome);
  
  RETURN v_raw_key;
END;
$$;
