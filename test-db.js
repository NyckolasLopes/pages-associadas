import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://lffomfhmvwqoxrswkdfv.supabase.co';
const SUPABASE_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'your_anon_key';

// Note: I will use the service role key to test if it's an RLS issue, but I don't have it.
// Wait, I can just read the .env file!
