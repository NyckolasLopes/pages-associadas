-- Atualiza a função sync_estoque_preco_loja para suportar:
-- 1. API Key tanto via Header HTTP (apikey, x-api-key) quanto via corpo/query param
-- 2. Body direto com { "produtos": [...] } ou formato com { "payload": { "produtos": [...] } }

CREATE OR REPLACE FUNCTION public.sync_estoque_preco_loja(
  produtos JSON DEFAULT NULL,
  payload JSON DEFAULT NULL,
  api_key TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_loja_id TEXT;
  v_produto JSON;
  v_loja_cnpj TEXT;
  v_prod_id TEXT;
  v_count INT := 0;
  v_valid BOOLEAN := false;
  v_target_loja_id TEXT;
  v_resolved_key TEXT;
  v_headers JSON;
  v_items JSON;
BEGIN
  -- 1. Resolver API Key (Argumento direto ou Headers da requisição HTTP)
  v_resolved_key := NULLIF(TRIM(api_key), '');
  
  IF v_resolved_key IS NULL THEN
    BEGIN
      v_headers := current_setting('request.headers', true)::json;
      v_resolved_key := COALESCE(
        v_headers->>'apikey',
        v_headers->>'x-api-key',
        v_headers->>'authorization'
      );
      IF v_resolved_key ILIKE 'Bearer %' THEN
        v_resolved_key := TRIM(SUBSTRING(v_resolved_key FROM 8));
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_resolved_key := NULL;
    END;
  END IF;

  -- Valida a API Key na tabela store_api_connections
  SELECT true, loja_id INTO v_valid, v_loja_id 
  FROM public.store_api_connections 
  WHERE stock_price_hash = v_resolved_key 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  -- 2. Resolver lista de produtos (se veio como "produtos" direto ou dentro de "payload")
  IF produtos IS NOT NULL AND json_typeof(produtos) = 'array' THEN
    v_items := produtos;
  ELSIF payload IS NOT NULL THEN
    IF payload->'produtos' IS NOT NULL AND json_typeof(payload->'produtos') = 'array' THEN
      v_items := payload->'produtos';
    ELSIF json_typeof(payload) = 'array' THEN
      v_items := payload;
    END IF;
  END IF;

  IF v_items IS NULL OR json_array_length(v_items) = 0 THEN
    RETURN json_build_object('success', true, 'updated_count', 0, 'message', 'Nenhum produto enviado para sincronizacao');
  END IF;

  -- 3. Atualizar estoque e precos
  FOR v_produto IN SELECT * FROM json_array_elements(v_items)
  LOOP
    v_loja_cnpj := v_produto->>'lojaCnpj';
    
    -- Se lojaCnpj for informado, valida o CNPJ da loja
    IF v_loja_cnpj IS NOT NULL AND TRIM(v_loja_cnpj) != '' THEN
      SELECT id INTO v_target_loja_id 
      FROM public.lojas 
      WHERE regexp_replace(cnpj, '\D', '', 'g') = regexp_replace(v_loja_cnpj, '\D', '', 'g') 
      LIMIT 1;

      IF v_target_loja_id IS NULL THEN
        CONTINUE;
      END IF;

      IF v_loja_id IS NOT NULL AND v_loja_id != v_target_loja_id THEN
        CONTINUE;
      END IF;
    ELSE
      -- Se nao informou lojaCnpj, utiliza a loja vinculada a API Key
      v_target_loja_id := v_loja_id;
    END IF;

    IF v_target_loja_id IS NULL THEN
      CONTINUE;
    END IF;

    -- Localiza o produto por EAN ou Codigo Interno
    SELECT id INTO v_prod_id FROM public.produtos 
    WHERE (ean = v_produto->>'ean' AND ean IS NOT NULL AND ean != '')
       OR (codigo_interno = v_produto->>'codigoInterno' AND codigo_interno IS NOT NULL AND codigo_interno != '') 
    LIMIT 1;
       
    IF v_prod_id IS NOT NULL THEN
       INSERT INTO public.produto_precos_loja (produto_id, loja_id, preco_de, preco_por, estoque)
       VALUES (
          v_prod_id, 
          v_target_loja_id, 
          CAST(COALESCE(v_produto->>'preco', v_produto->>'PrecoPor', v_produto->>'PrecoDe', '0') AS NUMERIC), 
          CAST(COALESCE(v_produto->>'preco', v_produto->>'PrecoPor', '0') AS NUMERIC), 
          CAST(COALESCE(v_produto->>'quantidade', v_produto->>'estoque', '0') AS INT)
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
