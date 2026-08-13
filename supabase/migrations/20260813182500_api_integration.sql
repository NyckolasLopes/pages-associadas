CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. Create api_keys table
CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key_hash TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL CHECK (tipo IN ('master', 'loja')),
  loja_id TEXT REFERENCES public.lojas(id) ON DELETE CASCADE,
  nome TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS for api_keys
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
GRANT ALL ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;

CREATE POLICY "Acesso as chaves" ON public.api_keys FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- 2. Add new columns to produtos
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS codigo_interno TEXT,
ADD COLUMN IF NOT EXISTS eans_secundarios JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS caracteristicas JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS lancamento BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS resumo_descricao TEXT,
ADD COLUMN IF NOT EXISTS titulo_seo TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS alerta_regulatorio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alerta_texto TEXT,
ADD COLUMN IF NOT EXISTS kit BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS peso NUMERIC(10,3),
ADD COLUMN IF NOT EXISTS quantidade_embalagem INT,
ADD COLUMN IF NOT EXISTS quantidade_conteudo INT,
ADD COLUMN IF NOT EXISTS unidade_embalagem TEXT,
ADD COLUMN IF NOT EXISTS unidade_conteudo TEXT,
ADD COLUMN IF NOT EXISTS prescricao TEXT,
ADD COLUMN IF NOT EXISTS apresentacao TEXT,
ADD COLUMN IF NOT EXISTS via_administracao TEXT,
ADD COLUMN IF NOT EXISTS dosagem TEXT,
ADD COLUMN IF NOT EXISTS sabor TEXT,
ADD COLUMN IF NOT EXISTS tamanho TEXT,
ADD COLUMN IF NOT EXISTS area_aplicacao TEXT,
ADD COLUMN IF NOT EXISTS fps INT,
ADD COLUMN IF NOT EXISTS faixa_etaria TEXT,
ADD COLUMN IF NOT EXISTS categorias_secundarias JSONB DEFAULT '[]'::jsonb;

-- 3. Create sync_estoque_loja RPC
CREATE OR REPLACE FUNCTION public.sync_estoque_loja(api_key TEXT, payload JSON)
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
          CAST(v_produto->>'PrecoDe' AS NUMERIC), 
          CAST(v_produto->>'PrecoPor' AS NUMERIC), 
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


-- 4. Create sync_produtos_master RPC
CREATE OR REPLACE FUNCTION public.sync_produtos_master(api_key TEXT, payload JSON)
RETURNS JSON AS $$
DECLARE
  v_valid BOOLEAN := false;
  v_produto JSON;
  v_count INT := 0;
  v_prod_id TEXT;
  v_ean TEXT;
BEGIN
  -- Validate Master API Key
  SELECT true INTO v_valid 
  FROM public.api_keys 
  WHERE key_hash = crypt(api_key, key_hash) AND tipo = 'master' 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  FOR v_produto IN SELECT * FROM json_array_elements(payload->'produtos')
  LOOP
    v_ean := v_produto->>'ean';
    IF v_ean IS NULL THEN
      CONTINUE;
    END IF;

    -- Look for existing product
    SELECT id INTO v_prod_id FROM public.produtos WHERE ean = v_ean LIMIT 1;

    IF v_prod_id IS NULL THEN
      v_prod_id := gen_random_uuid()::text;
      
      INSERT INTO public.produtos (
        id, ean, codigo_interno, nome, descricao, slug,
        categoria_id, subcategoria_id, categorias_secundarias,
        eans_secundarios, caracteristicas, tipo_medicamento,
        tarja, retem_receita, ativo, imagens, registro_anvisa,
        fabricante, principios_ativos, lancamento,
        resumo_descricao, titulo_seo, meta_description,
        alerta_regulatorio, alerta_texto, kit, peso,
        quantidade_embalagem, quantidade_conteudo, unidade_embalagem, unidade_conteudo,
        prescricao, apresentacao, via_administracao, dosagem,
        sabor, tamanho, area_aplicacao, fps, faixa_etaria
      ) VALUES (
        v_prod_id,
        v_ean,
        v_produto->>'codigoInterno',
        v_produto->>'nome',
        v_produto->>'descricao',
        -- basic slug generation
        regexp_replace(lower(v_produto->>'nome'), '[^a-z0-9]+', '-', 'g') || '-' || v_prod_id,
        v_produto->>'categoria_id',
        v_produto->>'subcategoria_id',
        COALESCE(v_produto->'categorias_secundarias', '[]'::jsonb),
        COALESCE(v_produto->'eans_secundarios', '[]'::jsonb),
        COALESCE(v_produto->'caracteristicas', '[]'::jsonb),
        v_produto->>'tipo_medicamento',
        v_produto->>'tarja',
        COALESCE((v_produto->>'retem_receita')::boolean, false),
        COALESCE((v_produto->>'ativo')::boolean, true),
        COALESCE(v_produto->'imagens', '[]'::jsonb),
        v_produto->>'numeroRegistroAnvisa',
        v_produto->>'fabricante',
        COALESCE(v_produto->'principiosAtivos', '[]'::jsonb),
        COALESCE((v_produto->>'lancamento')::boolean, false),
        v_produto->>'resumo_descricao',
        v_produto->>'titulo_seo',
        v_produto->>'meta_description',
        COALESCE((v_produto->>'alerta_regulatorio')::boolean, false),
        v_produto->>'alerta_texto',
        COALESCE((v_produto->>'kit')::boolean, false),
        (v_produto->>'peso')::numeric,
        (v_produto->>'quantidade_embalagem')::int,
        (v_produto->>'quantidade_conteudo')::int,
        v_produto->>'unidade_embalagem',
        v_produto->>'unidade_conteudo',
        v_produto->>'prescricao',
        v_produto->>'apresentacao',
        v_produto->>'via_administracao',
        v_produto->>'dosagem',
        v_produto->>'sabor',
        v_produto->>'tamanho',
        v_produto->>'area_aplicacao',
        (v_produto->>'fps')::int,
        v_produto->>'faixa_etaria'
      );
    ELSE
      -- Update existing
      UPDATE public.produtos SET
        codigo_interno = COALESCE(v_produto->>'codigoInterno', codigo_interno),
        nome = COALESCE(v_produto->>'nome', nome),
        descricao = COALESCE(v_produto->>'descricao', descricao),
        categoria_id = COALESCE(v_produto->>'categoria_id', categoria_id),
        subcategoria_id = COALESCE(v_produto->>'subcategoria_id', subcategoria_id),
        categorias_secundarias = COALESCE(v_produto->'categorias_secundarias', categorias_secundarias),
        eans_secundarios = COALESCE(v_produto->'eans_secundarios', eans_secundarios),
        caracteristicas = COALESCE(v_produto->'caracteristicas', caracteristicas),
        tipo_medicamento = COALESCE(v_produto->>'tipo_medicamento', tipo_medicamento),
        tarja = COALESCE(v_produto->>'tarja', tarja),
        retem_receita = COALESCE((v_produto->>'retem_receita')::boolean, retem_receita),
        ativo = COALESCE((v_produto->>'ativo')::boolean, ativo),
        imagens = COALESCE(v_produto->'imagens', imagens),
        registro_anvisa = COALESCE(v_produto->>'numeroRegistroAnvisa', registro_anvisa),
        fabricante = COALESCE(v_produto->>'fabricante', fabricante),
        principios_ativos = COALESCE(v_produto->'principiosAtivos', principios_ativos),
        lancamento = COALESCE((v_produto->>'lancamento')::boolean, lancamento),
        resumo_descricao = COALESCE(v_produto->>'resumo_descricao', resumo_descricao),
        titulo_seo = COALESCE(v_produto->>'titulo_seo', titulo_seo),
        meta_description = COALESCE(v_produto->>'meta_description', meta_description),
        alerta_regulatorio = COALESCE((v_produto->>'alerta_regulatorio')::boolean, alerta_regulatorio),
        alerta_texto = COALESCE(v_produto->>'alerta_texto', alerta_texto),
        kit = COALESCE((v_produto->>'kit')::boolean, kit),
        peso = COALESCE((v_produto->>'peso')::numeric, peso),
        quantidade_embalagem = COALESCE((v_produto->>'quantidade_embalagem')::int, quantidade_embalagem),
        quantidade_conteudo = COALESCE((v_produto->>'quantidade_conteudo')::int, quantidade_conteudo),
        unidade_embalagem = COALESCE(v_produto->>'unidade_embalagem', unidade_embalagem),
        unidade_conteudo = COALESCE(v_produto->>'unidade_conteudo', unidade_conteudo),
        prescricao = COALESCE(v_produto->>'prescricao', prescricao),
        apresentacao = COALESCE(v_produto->>'apresentacao', apresentacao),
        via_administracao = COALESCE(v_produto->>'via_administracao', via_administracao),
        dosagem = COALESCE(v_produto->>'dosagem', dosagem),
        sabor = COALESCE(v_produto->>'sabor', sabor),
        tamanho = COALESCE(v_produto->>'tamanho', tamanho),
        area_aplicacao = COALESCE(v_produto->>'area_aplicacao', area_aplicacao),
        fps = COALESCE((v_produto->>'fps')::int, fps),
        faixa_etaria = COALESCE(v_produto->>'faixa_etaria', faixa_etaria),
        updated_at = now()
      WHERE id = v_prod_id;
    END IF;

    v_count := v_count + 1;
  END LOOP;

  RETURN json_build_object('success', true, 'updated_count', v_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
