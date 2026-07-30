
-- =========================================
-- PROFILES
-- =========================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nome TEXT,
  email TEXT,
  telefone TEXT,
  cpf TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: select own" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "Profiles: insert own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Profiles: update own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Trigger updated_at helper
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on new auth user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nome, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- CATEGORIAS
-- =========================================
CREATE TABLE public.categorias (
  id TEXT PRIMARY KEY,
  nome TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  parent_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
  descricao_html TEXT,
  ordem INT DEFAULT 0,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categorias TO anon, authenticated;
GRANT ALL ON public.categorias TO service_role;
ALTER TABLE public.categorias ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categorias: public read" ON public.categorias FOR SELECT USING (true);
CREATE TRIGGER trg_categorias_updated BEFORE UPDATE ON public.categorias
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- LOJAS
-- =========================================
CREATE TABLE public.lojas (
  id TEXT PRIMARY KEY,
  cnpj TEXT NOT NULL UNIQUE,
  razao_social TEXT NOT NULL,
  nome_fantasia TEXT NOT NULL,
  farmaceutico_responsavel TEXT,
  crf TEXT,
  afe TEXT,
  alvara_sanitario TEXT,
  endereco TEXT,
  telefone TEXT,
  email TEXT,
  horario_funcionamento TEXT,
  faixas_cep JSONB NOT NULL DEFAULT '[]'::jsonb,
  metodos_pagamento JSONB NOT NULL DEFAULT '[]'::jsonb,
  sistema_utilizado TEXT,
  ativa BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.lojas TO anon, authenticated;
GRANT ALL ON public.lojas TO service_role;
ALTER TABLE public.lojas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Lojas: public read" ON public.lojas FOR SELECT USING (true);
CREATE TRIGGER trg_lojas_updated BEFORE UPDATE ON public.lojas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PRODUTOS
-- =========================================
CREATE TABLE public.produtos (
  id TEXT PRIMARY KEY,
  ean TEXT,
  nome TEXT NOT NULL,
  descricao TEXT,
  slug TEXT NOT NULL UNIQUE,
  fabricante TEXT,
  marca TEXT,
  preco_de NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_por NUMERIC(10,2) NOT NULL DEFAULT 0,
  preco_custo NUMERIC(10,2),
  estoque INT NOT NULL DEFAULT 0,
  registro_anvisa TEXT,
  tarja TEXT,
  retem_receita BOOLEAN NOT NULL DEFAULT false,
  generico BOOLEAN NOT NULL DEFAULT false,
  possui_imagem BOOLEAN NOT NULL DEFAULT false,
  categoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
  subcategoria_id TEXT REFERENCES public.categorias(id) ON DELETE SET NULL,
  categorias_adicionais JSONB DEFAULT '[]'::jsonb,
  internal_tags JSONB DEFAULT '[]'::jsonb,
  principios_ativos JSONB DEFAULT '[]'::jsonb,
  imagens JSONB DEFAULT '[]'::jsonb,
  video_url TEXT,
  destaque BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  em_campanha BOOLEAN NOT NULL DEFAULT false,
  preco_campanha NUMERIC(10,2),
  campanha_inicio TIMESTAMPTZ,
  campanha_fim TIMESTAMPTZ,
  classe_terapeutica TEXT,
  indicacao_terapeutica TEXT,
  tipo_medicamento TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX idx_produtos_slug ON public.produtos(slug);
CREATE INDEX idx_produtos_ativo ON public.produtos(ativo);
GRANT SELECT ON public.produtos TO anon, authenticated;
GRANT ALL ON public.produtos TO service_role;
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Produtos: public read" ON public.produtos FOR SELECT USING (true);
CREATE TRIGGER trg_produtos_updated BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PRODUTO PRECOS POR LOJA
-- =========================================
CREATE TABLE public.produto_precos_loja (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  produto_id TEXT NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  loja_id TEXT NOT NULL REFERENCES public.lojas(id) ON DELETE CASCADE,
  preco_de NUMERIC(10,2),
  preco_por NUMERIC(10,2),
  estoque INT NOT NULL DEFAULT 0,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (produto_id, loja_id)
);
GRANT SELECT ON public.produto_precos_loja TO anon, authenticated;
GRANT ALL ON public.produto_precos_loja TO service_role;
ALTER TABLE public.produto_precos_loja ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Precos: public read" ON public.produto_precos_loja FOR SELECT USING (true);
CREATE TRIGGER trg_precos_updated BEFORE UPDATE ON public.produto_precos_loja
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- FAVORITOS
-- =========================================
CREATE TABLE public.favoritos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  produto_id TEXT NOT NULL REFERENCES public.produtos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, produto_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.favoritos TO authenticated;
GRANT ALL ON public.favoritos TO service_role;
ALTER TABLE public.favoritos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Favoritos: own all" ON public.favoritos FOR ALL TO authenticated
USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================
-- PEDIDOS
-- =========================================
CREATE TABLE public.pedidos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE DEFAULT to_char(now(), 'YYYYMMDDHH24MISS') || lpad((floor(random()*10000))::text, 4, '0'),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE RESTRICT,
  loja_id TEXT REFERENCES public.lojas(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'novo',
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto NUMERIC(10,2) NOT NULL DEFAULT 0,
  frete NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  cep_entrega TEXT,
  endereco_entrega JSONB,
  metodo_entrega TEXT,
  metodo_pagamento TEXT,
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedidos_user ON public.pedidos(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedidos TO authenticated;
GRANT ALL ON public.pedidos TO service_role;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Pedidos: select own" ON public.pedidos FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Pedidos: insert own" ON public.pedidos FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Pedidos: update own" ON public.pedidos FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_pedidos_updated BEFORE UPDATE ON public.pedidos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- PEDIDO ITENS
-- =========================================
CREATE TABLE public.pedido_itens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pedido_id UUID NOT NULL REFERENCES public.pedidos(id) ON DELETE CASCADE,
  produto_id TEXT REFERENCES public.produtos(id) ON DELETE SET NULL,
  nome TEXT NOT NULL,
  qty INT NOT NULL DEFAULT 1,
  preco_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  desconto_unit NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_pedido_itens_pedido ON public.pedido_itens(pedido_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pedido_itens TO authenticated;
GRANT ALL ON public.pedido_itens TO service_role;
ALTER TABLE public.pedido_itens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "PedidoItens: select via pedido" ON public.pedido_itens FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));
CREATE POLICY "PedidoItens: insert via pedido" ON public.pedido_itens FOR INSERT TO authenticated
WITH CHECK (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));
CREATE POLICY "PedidoItens: update via pedido" ON public.pedido_itens FOR UPDATE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));
CREATE POLICY "PedidoItens: delete via pedido" ON public.pedido_itens FOR DELETE TO authenticated
USING (EXISTS (SELECT 1 FROM public.pedidos p WHERE p.id = pedido_id AND p.user_id = auth.uid()));
