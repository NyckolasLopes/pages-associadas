-- Tornar loja_id opcional (carrinho sem loja selecionada ainda deve ser rastreado)
ALTER TABLE public.carrinhos_abandonados ALTER COLUMN loja_id DROP NOT NULL;

-- Adicionar colunas de dados do cliente que o frontend tenta gravar
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS nome_cliente TEXT;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS email_cliente TEXT;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS telefone_cliente TEXT;

-- Remover o índice único que exige loja_id (precisamos de um novo)
DROP INDEX IF EXISTS unique_active_cart_per_user_store;

-- Recriar o índice: um carrinho por usuário (sem depender de loja_id)
CREATE UNIQUE INDEX IF NOT EXISTS unique_active_cart_per_user
ON public.carrinhos_abandonados (user_id)
WHERE status = 'abandonado';

-- Remover a FK que impede loja_id nulo para lojas (caso exista)
-- Isso permite que o carrinho seja salvo mesmo sem loja selecionada
ALTER TABLE public.carrinhos_abandonados DROP CONSTRAINT IF EXISTS carrinhos_abandonados_loja_id_fkey;

-- Recriar sem NOT NULL constraint
ALTER TABLE public.carrinhos_abandonados ADD CONSTRAINT carrinhos_abandonados_loja_id_fkey
  FOREIGN KEY (loja_id) REFERENCES public.lojas(id) ON DELETE SET NULL DEFERRABLE;
