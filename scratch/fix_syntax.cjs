const fs = require('fs');
const path = 'src/routes/admin/metricas.tsx';
let content = fs.readFileSync(path, 'utf8');

content = content.replace(/\\`/g, '`').replace(/\\\$/g, '$');

fs.writeFileSync(path, content);
console.log('Fixed syntax errors');
