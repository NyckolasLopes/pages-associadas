-- Update the RPC for syncing stock and prices to match the new JSON structure
-- Drop the old one if it exists
DROP FUNCTION IF EXISTS public.sync_estoque_loja;

-- Create the newly named RPC that matches the UI
CREATE OR REPLACE FUNCTION public.sync_estoque_preco_loja(api_key TEXT, payload JSON)
RETURNS JSON AS $$
DECLARE
  v_loja_id TEXT;
  v_produto JSON;
  v_loja_cnpj TEXT;
  v_prod_id TEXT;
  v_count INT := 0;
  v_valid BOOLEAN := false;
  v_target_loja_id TEXT;
BEGIN
  -- Validate API Key
  SELECT true, loja_id INTO v_valid, v_loja_id 
  FROM public.api_keys 
  WHERE key_hash = crypt(api_key, key_hash) AND tipo = 'loja' 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  FOR v_produto IN SELECT * FROM json_array_elements(payload->'produtos')
  LOOP
    v_loja_cnpj := v_produto->>'lojaCnpj';
    
    SELECT id INTO v_target_loja_id FROM public.lojas WHERE cnpj = v_loja_cnpj LIMIT 1;
    IF v_target_loja_id IS NULL THEN
       CONTINUE;
    END IF;
       
    IF v_loja_id IS NOT NULL AND v_loja_id != v_target_loja_id THEN
       CONTINUE;
    END IF;

    -- Find product by EAN or Codigo Interno
    SELECT id INTO v_prod_id FROM public.produtos 
    WHERE (ean = v_produto->>'ean' AND ean IS NOT NULL)
       OR (codigo_interno = v_produto->>'codigoInterno' AND codigo_interno IS NOT NULL) 
    LIMIT 1;
       
    IF v_prod_id IS NOT NULL THEN
       INSERT INTO public.produto_precos_loja (produto_id, loja_id, preco_de, preco_por, estoque)
       VALUES (
          v_prod_id, 
          v_target_loja_id, 
          CAST(v_produto->>'preco' AS NUMERIC), 
          CAST(v_produto->>'preco' AS NUMERIC), 
          CAST(v_produto->>'quantidade' AS INT)
       )
       ON CONFLICT (produto_id, loja_id) DO UPDATE SET
          preco_de = EXCLUDED.preco_de,
          preco_por = EXCLUDED.preco_por,
          estoque = EXCLUDED.estoque,
          updated_at = now();
          
       v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN json_build_object('success', true, 'updated_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
