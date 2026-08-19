import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data: lojas } = await supabase.from('lojas').select('*').limit(1);
  if (!lojas || lojas.length === 0) return console.log("No lojas");
  
  const lojaId = lojas[0].id;
  const { error } = await supabase.from('lojas').update({
    ativa: true,
    aceitaEntrega: true,
    modeloFrete: 'raio',
    custoEntrega: 0
  }).eq('id', lojaId);
  
  console.log("Full update error:", error);
  
  const { error: minError } = await supabase.from('lojas').update({
    ativa: true,
    cnpj: lojas[0].cnpj,
    razao_social: lojas[0].razao_social
  }).eq('id', lojaId);
  
  console.log("Min update error:", minError);
}

test();
