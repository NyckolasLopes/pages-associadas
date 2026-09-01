import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "http://20.7.19.49:3006";
const SUPABASE_KEY = "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
  const { error } = await supabase.from('produtos').upsert({
    id: "prod-test-123",
    nome: "Teste Produto",
    slug: "teste-produto",
    preco_de: 0,
    preco_por: 0,
    estoque: 0,
    ativo: true,
    visivel: true,
    buscavel: true,
    lancamento: false,
    loja_id: null
  });
  console.log("Error:", error);
}

run();
