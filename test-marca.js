import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function test() {
  const m = {
      id: 'test_m1',
      nome: 'Teste',
      slug: 'teste',
      descricao: null,
      logo: null,
      ativo: true,
      destaque: false,
      seo_url: 'teste',
      marca_propria: false,
      loja_id: null,
      global_pleno: false,
  };
  
  const { data, error } = await supabase.from('marcas').upsert(m);
  console.log('Data:', data);
  console.log('Error:', error);
}

test();
