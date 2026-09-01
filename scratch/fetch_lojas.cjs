const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "http://20.7.19.49:3006";
const SUPABASE_KEY = "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  const { data, error } = await supabase.from('lojas').select('id, nome_fantasia');
  if (error) {
    console.error('Error fetching lojas:', error.message);
  } else {
    console.log('Lojas na base de dados:', data);
  }
}

test();
