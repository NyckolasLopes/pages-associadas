import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://uqwxpoxwwvyqnwgquxit.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd3hwb3h3d3Z5cW53Z3F1eGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTMxOTksImV4cCI6MjA5ODMyOTE5OX0.8D9DsqKn3kqIYVP4SFwD9jF-w8YV74fLlYyEn1I0AZ4";

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
