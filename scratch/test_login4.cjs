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
    
    // Create user if not exists?
    // Note: We can't use signUp if email confirmation is required, but let's see!
    if (error.message.includes('Invalid login credentials')) {
        console.log('Tentando registrar...');
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'nyckolas.lopes@gmail.com',
            password: 'Aspro@2026'
        });
        if (signUpError) {
            console.error('SignUp Error:', signUpError.message);
        } else {
            console.log('SignUp Success:', signUpData);
        }
    }
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
