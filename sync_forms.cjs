const fs = require('fs');

let adminContent = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf8');
let publicContent = fs.readFileSync('src/routes/inscricao.$token.tsx', 'utf8');

// Find the start and end of the form inside lojas.nova.tsx
const adminFormStart = adminContent.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const adminFormEnd = adminContent.indexOf('      </div>\n    </div>\n  );\n}');

const adminFormBody = adminContent.substring(adminFormStart, adminFormEnd).trim();

// Find the start and end of the form inside inscricao.$token.tsx
const publicFormStart = publicContent.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const publicFormEnd = publicContent.indexOf('          <div className="pt-6 border-t flex justify-end">');

publicContent = publicContent.substring(0, publicFormStart) + adminFormBody + '\n\n' + publicContent.substring(publicFormEnd);

fs.writeFileSync('src/routes/inscricao.$token.tsx', publicContent);
console.log('Done syncing forms!');
