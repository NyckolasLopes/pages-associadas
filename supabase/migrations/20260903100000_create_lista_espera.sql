-- Criação da tabela lista_espera para clientes interessados em produtos indisponíveis
CREATE TABLE IF NOT EXISTS public.lista_espera (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  loja_id TEXT NOT NULL,
  loja_nome TEXT,
  cliente_nome TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  produto_id TEXT NOT NULL,
  produto_nome TEXT NOT NULL,
  produto_imagem TEXT,
  quantidade INTEGER NOT NULL DEFAULT 1,
  preco_momento NUMERIC(10,2),
  mensagem TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  notificado_em TIMESTAMPTZ
);

-- Índices de performance
CREATE INDEX IF NOT EXISTS idx_lista_espera_loja_id ON public.lista_espera(loja_id);
CREATE INDEX IF NOT EXISTS idx_lista_espera_created_at ON public.lista_espera(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_lista_espera_produto_id ON public.lista_espera(produto_id);

-- Ativar RLS
ALTER TABLE public.lista_espera ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
DROP POLICY IF EXISTS "Permitir insercao publica na lista_espera" ON public.lista_espera;
CREATE POLICY "Permitir insercao publica na lista_espera"
  ON public.lista_espera
  FOR INSERT
  TO public
  WITH CHECK (true);

DROP POLICY IF EXISTS "Permitir leitura da lista_espera" ON public.lista_espera;
CREATE POLICY "Permitir leitura da lista_espera"
  ON public.lista_espera
  FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Permitir atualizacao na lista_espera" ON public.lista_espera;
CREATE POLICY "Permitir atualizacao na lista_espera"
  ON public.lista_espera
  FOR UPDATE
  TO public
  USING (true);

DROP POLICY IF EXISTS "Permitir delecao na lista_espera" ON public.lista_espera;
CREATE POLICY "Permitir delecao na lista_espera"
  ON public.lista_espera
  FOR DELETE
  TO public
  USING (true);
