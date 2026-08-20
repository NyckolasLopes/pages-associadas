DELETE FROM pedidos 
WHERE user_id IS NULL OR (nome_cliente = 'Cliente' AND (telefone_cliente IS NULL OR telefone_cliente = ''));
