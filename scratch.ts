import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();
const supabase = createClient(process.env.VITE_SUPABASE_URL!, process.env.VITE_SUPABASE_ANON_KEY!);

async function main() {
  const { data, error } = await supabase
    .from('pedidos')
    .select('*, pedido_itens(*, produtos(*))')
    .limit(1);
  console.log(error ? error : JSON.stringify(data?.[0]?.pedido_itens, null, 2));
}
main();
