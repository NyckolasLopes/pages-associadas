const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = "http://20.7.19.49:3006";
const SUPABASE_KEY = "sb_publishable_lMKRz-zf_I7AXgFPgB9VWf_J1KIKAYU";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function test() {
  console.log('Tentando login com nyckolas.lopes@gmail.com / Aspro@2026');
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'nyckolas.lopes@gmail.com',
    password: 'Aspro@2026',
  });

  if (error) {
    console.error('Login error:', error.message);
  } else {
    console.log('Login success! User ID:', data.user.id);
    
    // Check profile
    const { data: profile, error: profError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user.id)
      .single();
      
    if (profError) {
      console.error('Profile fetch error:', profError.message);
    } else {
      console.log('Profile:', profile);
    }
  }
}

test();
