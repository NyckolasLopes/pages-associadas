-- =================================================================================
-- SCRIPT: LIMPEZA DE LOJAS
-- Deleta todas as lojas exceto POA Centro e POA Zona Sul
-- =================================================================================

DELETE FROM public.lojas 
WHERE id NOT IN ('loja-poa-centro', 'loja-poa-zonasul');
