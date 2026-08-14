import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Carregar variáveis do .env local
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltam variáveis de ambiente VITE_SUPABASE_URL ou VITE_SUPABASE_ANON_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearOrders() {
  console.log("Buscando último pedido real...");
  const { data: pedidos } = await supabase.from('pedidos').select('id').order('created_at', { ascending: false }).limit(1);
  
  if (pedidos && pedidos.length > 0) {
    const ultimoId = pedidos[0].id;
    console.log(`Preservando o pedido real: ${ultimoId}`);
    
    console.log("Apagando itens de pedidos fictícios...");
    const { error: errItens } = await supabase.from('pedido_itens').delete().neq('pedido_id', ultimoId);
    if (errItens) console.error("Erro ao apagar itens:", errItens);
    else console.log("Itens apagados com sucesso.");

    console.log("Apagando pedidos fictícios...");
    const { error: errPedidos } = await supabase.from('pedidos').delete().neq('id', ultimoId);
    if (errPedidos) console.error("Erro ao apagar pedidos:", errPedidos);
    else console.log("Pedidos fictícios apagados com sucesso.");
  } else {
    console.log("Nenhum pedido encontrado no sistema.");
  }
  
  process.exit(0);
}

clearOrders();
