const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function run() {
  const payload = {
    id: "p" + Date.now(),
    ativa: true,
    cnpj: "00.000.000/0000-00",
    razao_social: "Teste",
    nome_fantasia: "Teste",
    email: "teste@teste.com",
    telefone: "0000000000"
  };

  const { data, error } = await supabase.from('lojas').insert(payload);
  console.log("Error:", error);
  console.log("Data:", data);
}

run();
