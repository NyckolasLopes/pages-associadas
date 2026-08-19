const fs = require('fs');

let admin = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf8');
let pub = fs.readFileSync('src/routes/inscricao.$token.tsx', 'utf8');

const adminFormStart = admin.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const adminFormEnd = admin.lastIndexOf('</div>');

let adminForm = admin.substring(adminFormStart, adminFormEnd);
// Let's remove the wrapper div closing tags that might be too many
adminForm = adminForm.substring(0, adminForm.lastIndexOf('</div>'));
adminForm = adminForm.substring(0, adminForm.lastIndexOf('</div>'));
// Basically adminForm has the fields

const pubFormStart = pub.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const pubFormEnd = pub.indexOf('          {/* ========== OUTROS MEIOS DE ENTREGA (Removido) ========== */}');

const newPub = pub.substring(0, pubFormStart) + adminForm + '\n\n' + pub.substring(pubFormEnd);

fs.writeFileSync('src/routes/inscricao.$token.tsx', newPub);
console.log('done');
