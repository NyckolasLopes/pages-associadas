import { supabase } from './src/integrations/supabase/client';

async function test() {
  const codigo = '10OFF'; 

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
