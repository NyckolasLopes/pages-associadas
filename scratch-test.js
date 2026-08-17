import fs from 'fs';

const env = fs.readFileSync('.env', 'utf-8');
const lines = env.split('\n');
let url = '', key = '';
for(const line of lines) {
  if (line.startsWith('VITE_SUPABASE_URL=')) url = line.split('=')[1].trim().replace(/"/g, '').trim();
  if (line.startsWith('VITE_SUPABASE_PUBLISHABLE_KEY=')) key = line.split('=')[1].trim().replace(/"/g, '').trim();
}

const supabaseUrl = new URL(url);

const options = {
  hostname: supabaseUrl.hostname,
  port: 443,
  path: '/rest/v1/lojas?limit=1',
  method: 'GET',
  headers: {
    'apikey': key,
    'Authorization': `Bearer ${key}`
  }
};

import https from 'https';
const req = https.request(options, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      if (parsed.length > 0) {
        console.log("Columns: ", Object.keys(parsed[0]));
      } else {
        console.log("No rows, but response: ", parsed);
      }
    } catch(e) {
      console.log("Error parsing: ", data);
    }
  });
});

req.on('error', error => {
  console.error('Error: ', error);
});

req.end();
