import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = "https://uqwxpoxwwvyqnwgquxit.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd3hwb3h3d3Z5cW53Z3F1eGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTMxOTksImV4cCI6MjA5ODMyOTE5OX0.8D9DsqKn3kqIYVP4SFwD9jF-w8YV74fLlYyEn1I0AZ4";
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
