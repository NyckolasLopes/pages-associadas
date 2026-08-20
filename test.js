
import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://uqwxpoxwwvyqnwgquxit.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd3hwb3h3d3Z5cW53Z3F1eGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTMxOTksImV4cCI6MjA5ODMyOTE5OX0.8D9DsqKn3kqIYVP4SFwD9jF-w8YV74fLlYyEn1I0AZ4');
async function run() {
  const r = await supabase.from('produtos').select('*').limit(1);
  console.log('Result:', JSON.stringify(r.data, null, 2), 'Error:', r.error);
}
run();

