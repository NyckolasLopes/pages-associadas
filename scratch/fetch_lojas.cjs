const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "https://epnuvpyuodpsbcqdxlmm.supabase.co";
const SUPABASE_KEY = "sb_publishable_R3vpPxcidobuL0_PoGnpKQ_ZdZyesJ1";

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
