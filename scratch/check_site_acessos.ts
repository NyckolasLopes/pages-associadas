import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const { data, error } = await supabase.from('site_acessos').select('*', { count: 'exact' });
  console.log('Total accesses in db:', data?.length);
  if (data && data.length > 0) {
    console.log('Sample access:', data[0]);
  }
  if (error) console.error(error);
}

check();
