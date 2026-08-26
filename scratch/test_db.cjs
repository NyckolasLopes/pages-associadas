const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const env = fs.readFileSync('.env', 'utf-8');

let url, key;
for (const line of env.split('\n')) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim();
  if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) key = line.split('=')[1].trim();
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('produtos').select('alerta_regulatorio, alerta_texto, categorias_adicionais, subcategorias_adicionais').limit(1);
  if (error) {
    console.error("ERROR:", error);
  } else {
    console.log("DATA:", data);
  }
}
test();
