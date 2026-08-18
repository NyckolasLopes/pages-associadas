-- 1. Add tipo_de_receita column to produtos if it doesn't exist
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS tipo_de_receita TEXT;

-- 2. Update sync_estoque_preco_loja to use the correct store_api_connections table
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
  -- Validate API Key using store_api_connections
  SELECT true, loja_id INTO v_valid, v_loja_id 
  FROM public.store_api_connections 
  WHERE stock_price_hash = api_key 
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
    WHERE (ean = v_produto->>'ean' AND ean IS NOT NULL AND ean != '')
       OR (codigo_interno = v_produto->>'codigoInterno' AND codigo_interno IS NOT NULL AND codigo_interno != '') 
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


-- 3. Create sync_produtos_loja RPC for product catalog
CREATE OR REPLACE FUNCTION public.sync_produtos_loja(api_key TEXT, payload JSONB)
RETURNS JSON AS $$
DECLARE
  v_valid BOOLEAN := false;
  v_produto JSONB;
  v_count INT := 0;
  v_prod_id TEXT;
  v_ean TEXT;
  v_ativo BOOLEAN;
  v_imagens JSONB;
BEGIN
  -- Validate Catalog API Key
  SELECT true INTO v_valid 
  FROM public.store_api_connections 
  WHERE catalog_hash = api_key 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  FOR v_produto IN SELECT * FROM jsonb_array_elements(payload->'produtos')
  LOOP
    v_ean := v_produto->>'ean';
    IF v_ean IS NULL OR v_ean = '' THEN
      CONTINUE;
    END IF;
    
    -- Parse status ("Ativo" / "Inativo" to true/false)
    v_ativo := lower(v_produto->>'status') IN ('ativo', 'sim', 'true', '1');
    
    -- Extract imagens array of strings from objects
    SELECT COALESCE(jsonb_agg(elem->>'caminhoImagem'), '[]'::jsonb) INTO v_imagens
    FROM jsonb_array_elements(
       CASE WHEN jsonb_typeof(v_produto->'imagens') = 'array' 
            THEN v_produto->'imagens' 
            ELSE '[]'::jsonb 
       END
    ) AS elem;

    -- Look for existing product
    SELECT id INTO v_prod_id FROM public.produtos WHERE ean = v_ean LIMIT 1;

    IF v_prod_id IS NULL THEN
      v_prod_id := gen_random_uuid()::text;
      
      INSERT INTO public.produtos (
        id, ean, eans_secundarios, codigo_interno, nome, descricao,
        marca, tipo_produto, produto_natureza, ncm,
        categoria_id, subcategoria_id, categorias_adicionais, subcategorias_adicionais,
        ativo, prioridade, lancamento, registro_anvisa, generico,
        tarja, retem_receita, tipo_de_receita,
        principios_ativos, caracteristicas, classe_terapeutica, imagens,
        slug
      ) VALUES (
        v_prod_id,
        v_ean,
        COALESCE(v_produto->'eans_secundarios', '[]'::jsonb),
        v_produto->>'codigoInterno',
        v_produto->>'Nome do produto',
        v_produto->>'Descrição do produto',
        v_produto->>'marca',
        v_produto->>'tipo do produto',
        v_produto->>'produto',
        v_produto->>'ncm',
        v_produto->>'categoria_id',
        v_produto->>'subcategoria_id',
        COALESCE(v_produto->'categorias_secundarias_ids', '[]'::jsonb),
        COALESCE(v_produto->'subcategorias_secundarias_ids', '[]'::jsonb),
        v_ativo,
        (v_produto->>'prioridade')::numeric,
        COALESCE((v_produto->>'lancamento')::boolean, false),
        v_produto->>'numeroRegistroAnvisa',
        COALESCE((v_produto->>'generico')::boolean, false),
        v_produto->>'tarja',
        COALESCE((v_produto->>'retem_receita')::boolean, false),
        v_produto->>'tipo de receita',
        COALESCE(v_produto->'principiosAtivos', '[]'::jsonb),
        COALESCE(v_produto->'caracteristicas', '[]'::jsonb),
        v_produto->>'classe terapêutica',
        v_imagens,
        regexp_replace(lower(v_produto->>'Nome do produto'), '[^a-z0-9]+', '-', 'g') || '-' || v_prod_id
      );
    ELSE
      -- Update existing
      UPDATE public.produtos SET
        eans_secundarios = COALESCE(v_produto->'eans_secundarios', eans_secundarios),
        codigo_interno = COALESCE(v_produto->>'codigoInterno', codigo_interno),
        nome = COALESCE(v_produto->>'Nome do produto', nome),
        descricao = COALESCE(v_produto->>'Descrição do produto', descricao),
        marca = COALESCE(v_produto->>'marca', marca),
        tipo_produto = COALESCE(v_produto->>'tipo do produto', tipo_produto),
        produto_natureza = COALESCE(v_produto->>'produto', produto_natureza),
        ncm = COALESCE(v_produto->>'ncm', ncm),
        categoria_id = COALESCE(v_produto->>'categoria_id', categoria_id),
        subcategoria_id = COALESCE(v_produto->>'subcategoria_id', subcategoria_id),
        categorias_adicionais = COALESCE(v_produto->'categorias_secundarias_ids', categorias_adicionais),
        subcategorias_adicionais = COALESCE(v_produto->'subcategorias_secundarias_ids', subcategorias_adicionais),
        ativo = v_ativo,
        prioridade = COALESCE((v_produto->>'prioridade')::numeric, prioridade),
        lancamento = COALESCE((v_produto->>'lancamento')::boolean, lancamento),
        registro_anvisa = COALESCE(v_produto->>'numeroRegistroAnvisa', registro_anvisa),
        generico = COALESCE((v_produto->>'generico')::boolean, generico),
        tarja = COALESCE(v_produto->>'tarja', tarja),
        retem_receita = COALESCE((v_produto->>'retem_receita')::boolean, retem_receita),
        tipo_de_receita = COALESCE(v_produto->>'tipo de receita', tipo_de_receita),
        principios_ativos = COALESCE(v_produto->'principiosAtivos', principios_ativos),
        caracteristicas = COALESCE(v_produto->'caracteristicas', caracteristicas),
        classe_terapeutica = COALESCE(v_produto->>'classe terapêutica', classe_terapeutica),
        imagens = COALESCE(v_imagens, imagens),
        updated_at = now()
      WHERE id = v_prod_id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'updated_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
