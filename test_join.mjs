require('dotenv').config();
const fs = require('fs');

async function check() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  
  const res = await fetch(`${url}/rest/v1/produtos?select=id,nome,produto_precos_loja(loja_id,estoque)&limit=1`, {
    headers: {
      "apikey": key,
      "Authorization": `Bearer ${key}`
    }
  });
  
  const data = await res.json();
  console.log(JSON.stringify(data, null, 2));
}

check();
