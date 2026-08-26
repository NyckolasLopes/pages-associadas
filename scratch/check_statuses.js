import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);
async function run() {
    const { data, error } = await supabase.from('pedidos').select('status');
    if (error) console.error(error);
    else {
        const statuses = new Set(data.map(d => d.status));
        console.log("Unique statuses:", Array.from(statuses));
    }
}
run();
