-- 1. Create get_pedidos_loja RPC
CREATE OR REPLACE FUNCTION public.get_pedidos_loja(api_key TEXT)
RETURNS JSON AS $$
DECLARE
  v_valid BOOLEAN := false;
  v_loja_id TEXT;
  v_result JSON;
BEGIN
  -- Validate Orders API Key
  SELECT true, loja_id INTO v_valid, v_loja_id 
  FROM public.store_api_connections 
  WHERE orders_hash = api_key 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  SELECT json_build_object(
    'sucesso', true,
    'pedidos', COALESCE(
      (
        SELECT json_agg(
          json_build_object(
            'pedido_id', p.id,
            'numero', p.numero,
            'data_criacao', p.created_at,
            'status', p.status,
            'origem', p.origem,
            'totais', json_build_object(
              'subtotal', p.subtotal,
              'desconto', p.desconto,
              'frete', p.frete,
              'total', p.total
            ),
            'pagamento', json_build_object(
              'metodo', p.metodo_pagamento,
              'status', 'aprovado'
            ),
            'entrega', json_build_object(
              'metodo', p.metodo_entrega,
              'cep', p.cep_entrega,
              'endereco', p.endereco_entrega
            ),
            'cliente', json_build_object(
              'id', pr.id,
              'nome', pr.nome,
              'cpf', pr.cpf,
              'telefone', pr.telefone,
              'email', pr.email
            ),
            'observacoes', p.observacoes,
            'itens', (
              SELECT json_agg(
                json_build_object(
                  'produto_id', pi.produto_id,
                  'ean', prod.ean,
                  'codigoInterno', prod.codigo_interno,
                  'nome', pi.nome,
                  'quantidade', pi.qty,
                  'valores', json_build_object(
                    'preco_unitario', pi.preco_unit,
                    'desconto_unitario', pi.desconto_unit,
                    'subtotal', (pi.preco_unit - pi.desconto_unit) * pi.qty
                  )
                )
              )
              FROM public.pedido_itens pi
              LEFT JOIN public.produtos prod ON prod.id = pi.produto_id
              WHERE pi.pedido_id = p.id
            )
          )
        )
        FROM public.pedidos p
        LEFT JOIN public.profiles pr ON pr.id = p.user_id
        WHERE p.loja_id = v_loja_id
      ),
      '[]'::json
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 2. Create update_pedido_status_loja RPC
CREATE OR REPLACE FUNCTION public.update_pedido_status_loja(api_key TEXT, p_pedido_id TEXT, p_novo_status TEXT)
RETURNS JSON AS $$
DECLARE
  v_valid BOOLEAN := false;
  v_loja_id TEXT;
  v_updated INT := 0;
BEGIN
  -- Validate Orders API Key
  SELECT true, loja_id INTO v_valid, v_loja_id 
  FROM public.store_api_connections 
  WHERE orders_hash = api_key 
  LIMIT 1;

  IF NOT v_valid THEN
    RAISE EXCEPTION 'Chave de API invalida ou nao autorizada';
  END IF;

  UPDATE public.pedidos 
  SET status = p_novo_status, updated_at = now()
  WHERE id = p_pedido_id AND loja_id = v_loja_id;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  IF v_updated = 0 THEN
     RAISE EXCEPTION 'Pedido nao encontrado ou nao pertence a esta loja';
  END IF;

  RETURN json_build_object('sucesso', true, 'mensagem', 'Status atualizado com sucesso');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
