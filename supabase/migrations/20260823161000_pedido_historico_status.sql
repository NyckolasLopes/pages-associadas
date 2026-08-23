-- Tabela para registrar o histórico de status dos pedidos
CREATE TABLE IF NOT EXISTS public.pedido_historico_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  situacao TEXT NOT NULL,
  autor TEXT NOT NULL DEFAULT 'Sistema',
  data TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.pedido_historico_status ENABLE ROW LEVEL SECURITY;

-- Permissões de leitura para todos autenticados
CREATE POLICY "Historico: admin select" ON public.pedido_historico_status
  FOR SELECT TO authenticated USING (true);

-- Permissão de inserção para admins e donos de loja
CREATE POLICY "Historico: admin insert" ON public.pedido_historico_status
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (is_admin = true OR lojas_vinculadas IS NOT NULL))
  );

-- Permissões de service_role
GRANT ALL ON public.pedido_historico_status TO service_role;
GRANT SELECT, INSERT ON public.pedido_historico_status TO authenticated;

-- Índice para performance (busca por pedido)
CREATE INDEX IF NOT EXISTS idx_pedido_historico_pedido_id ON public.pedido_historico_status(pedido_id);
CREATE INDEX IF NOT EXISTS idx_pedido_historico_data ON public.pedido_historico_status(data);
