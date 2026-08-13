-- Migration para zerar todos os pedidos
DELETE FROM public.pedido_itens;
DELETE FROM public.pedidos;
