-- Limpa registros de carrinhos abandonados de visitantes não logados
DELETE FROM public.carrinhos_abandonados
WHERE user_id IS NULL 
   OR nome_cliente = 'Cliente Visitante' 
   OR nome_cliente = 'Cliente Não Identificado'
   OR nome_cliente IS NULL;
