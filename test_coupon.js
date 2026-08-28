import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL || '', process.env.VITE_SUPABASE_ANON_KEY || '');

async function test() {
  const codigo = '10OFF'; // testing from screenshot

  const { data: cupom, error: selErr } = await supabase
    .from('cupons')
    .select('id, numero_utilizacoes')
    .ilike('codigo', codigo)
    .single();
    
  console.log('Select:', cupom, selErr);

  if (cupom) {
    const { data: updData, error: updErr } = await supabase
      .from('cupons')
      .update({ numero_utilizacoes: (cupom.numero_utilizacoes || 0) + 1 })
      .eq('id', cupom.id)
      .select();
      
    console.log('Update:', updData, updErr);
  }
}
test();
