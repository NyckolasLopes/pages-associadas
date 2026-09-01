
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('http://20.7.19.49:3006', 'sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU');
async function run() {
  const r = await supabase.from('produtos').select('*').limit(1);
  console.log('Result:', JSON.stringify(r.data, null, 2), 'Error:', r.error);
}
run();

