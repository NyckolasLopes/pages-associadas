import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY
);

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
