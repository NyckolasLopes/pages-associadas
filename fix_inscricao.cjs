const fs = require('fs');

let adminContent = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf8');
let publicContent = fs.readFileSync('src/routes/inscricao.$token.tsx', 'utf8');

const adminFormStart = adminContent.indexOf('<div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">');
const adminFormEnd = adminContent.lastIndexOf('</div>\n    </div>\n  );\n}\n');

const adminForm = adminContent.substring(adminFormStart, adminFormEnd);

const publicFormStart = publicContent.indexOf('<div className="bg-white shadow-sm border rounded-xl p-8 space-y-10">');
const publicFormEnd = publicContent.lastIndexOf('</div>\n    </div>\n  );\n}\n');

publicContent = publicContent.substring(0, publicFormStart) + adminForm + publicContent.substring(publicFormEnd);

fs.writeFileSync('src/routes/inscricao.$token.tsx', publicContent);
console.log('Done!');
