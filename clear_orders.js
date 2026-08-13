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
  console.log("Apagando todos os itens de pedidos...");
  const { error: errItens } = await supabase.from('pedido_itens').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errItens) console.error("Erro ao apagar itens:", errItens);
  else console.log("Itens apagados com sucesso.");

  console.log("Apagando todos os pedidos...");
  const { error: errPedidos } = await supabase.from('pedidos').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (errPedidos) console.error("Erro ao apagar pedidos:", errPedidos);
  else console.log("Pedidos apagados com sucesso.");
  
  process.exit(0);
}

clearOrders();
