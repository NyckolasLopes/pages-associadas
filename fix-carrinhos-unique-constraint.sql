-- Adiciona constraint UNIQUE em (user_id, loja_id) na tabela carrinhos_abandonados para permitir UPSERT
ALTER TABLE public.carrinhos_abandonados ADD CONSTRAINT carrinhos_abandonados_user_loja_key UNIQUE (user_id, loja_id);
