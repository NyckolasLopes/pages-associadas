-- ==============================================================================
-- Migração de Alta Performance e Escala: Índices Estratégicos
-- Acelera consultas de pedidos por loja, ordenação por data, status e rastreamento de acessos
-- ==============================================================================

-- 1. Índices para a tabela de Pedidos
CREATE INDEX IF NOT EXISTS idx_pedidos_loja_id ON public.pedidos (loja_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_created_at ON public.pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos (status);
CREATE INDEX IF NOT EXISTS idx_pedidos_numero ON public.pedidos (numero);

-- 2. Índices para a tabela de Acessos do Site (Live Presence & Analytics)
CREATE INDEX IF NOT EXISTS idx_site_acessos_created_at ON public.site_acessos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_site_acessos_loja_id ON public.site_acessos (loja_id);

-- 3. Índices para Destaques e Preços de Loja
CREATE INDEX IF NOT EXISTS idx_precos_loja_destaque ON public.produto_precos_loja (loja_id, destaque) WHERE destaque = true;
