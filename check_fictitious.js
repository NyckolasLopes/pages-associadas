import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://epnuvpyuodpsbcqdxlmm.supabase.co', 'sb_publishable_R3vpPxcidobuL0_PoGnpKQ_ZdZyesJ1');

async function run() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('id, numero, user_id, nome_cliente, telefone_cliente')
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching:', error);
    return;
  }
  
  console.log('Total orders:', data.length);
  const fictitious = data.filter(d => 
    !d.user_id || 
    (d.nome_cliente === 'Cliente' && (!d.telefone_cliente || d.telefone_cliente.trim() === ''))
  );
  
  console.log('Fictitious orders found:', fictitious.length);
  console.log(fictitious.slice(0, 5));
  
  // Now actually delete them
  if (fictitious.length > 0) {
    const idsToDelete = fictitious.map(f => f.id);
    const { error: delError } = await supabase
      .from('pedidos')
      .delete()
      .in('id', idsToDelete);
      
    if (delError) {
      console.error('Error deleting:', delError);
    } else {
      console.log('Deleted successfully!');
    }
  }
}
run();
