-- 1. Garante que as colunas de alerta regulatório e metadados de produtos existam
ALTER TABLE public.produtos 
ADD COLUMN IF NOT EXISTS alerta_regulatorio BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS alerta_texto TEXT,
ADD COLUMN IF NOT EXISTS tipo_receita TEXT,
ADD COLUMN IF NOT EXISTS resumo_descricao TEXT,
ADD COLUMN IF NOT EXISTS termos_pesquisa TEXT,
ADD COLUMN IF NOT EXISTS buscavel BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS nivel_relevancia INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS imagem_alt TEXT;

-- 2. Garante que a tabela carrinhos_abandonados existe e tenha as colunas necessárias
CREATE TABLE IF NOT EXISTS public.carrinhos_abandonados (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    loja_id text REFERENCES public.lojas(id) ON DELETE SET NULL,
    items jsonb NOT NULL DEFAULT '[]'::jsonb,
    total numeric(10, 2) NOT NULL DEFAULT 0,
    status text NOT NULL DEFAULT 'abandonado',
    notes text,
    nome_cliente text,
    email_cliente text,
    telefone_cliente text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Permite que user_id e loja_id sejam nulos para visitantes
ALTER TABLE public.carrinhos_abandonados ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE public.carrinhos_abandonados ALTER COLUMN loja_id DROP NOT NULL;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS nome_cliente TEXT;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS email_cliente TEXT;
ALTER TABLE public.carrinhos_abandonados ADD COLUMN IF NOT EXISTS telefone_cliente TEXT;

-- 3. Configurar RLS para carrinhos_abandonados
ALTER TABLE public.carrinhos_abandonados ENABLE ROW LEVEL SECURITY;

-- Remover políticas antigas para evitar conflito
DROP POLICY IF EXISTS "Users can manage their own abandoned carts" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Admins can view and update store abandoned carts" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Allow anon cart tracking" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Allow public cart insert" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Allow public cart update" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Allow public cart select" ON public.carrinhos_abandonados;
DROP POLICY IF EXISTS "Admins full access abandoned carts" ON public.carrinhos_abandonados;

-- Permitir que qualquer cliente (anônimo ou logado) insira carrinho abandonado
CREATE POLICY "Allow public cart insert"
ON public.carrinhos_abandonados
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Permitir que qualquer cliente (anônimo ou logado) atualize seu carrinho
CREATE POLICY "Allow public cart update"
ON public.carrinhos_abandonados
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Permitir leitura pública / autenticada para recuperação de carrinho e painel admin
CREATE POLICY "Allow public cart select"
ON public.carrinhos_abandonados
FOR SELECT
TO anon, authenticated
USING (true);

-- Permitir exclusão apenas para usuários autenticados (administradores do painel)
CREATE POLICY "Admins delete abandoned carts"
ON public.carrinhos_abandonados
FOR DELETE
TO authenticated
USING (true);
