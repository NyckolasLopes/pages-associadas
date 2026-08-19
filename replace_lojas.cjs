const fs = require('fs');

let admin = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf8');

const adminFormStart = admin.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const adminFormEnd = admin.lastIndexOf('</div>');
let endDivs = admin.substring(adminFormEnd);

admin = admin.substring(0, adminFormStart) + '<LojaFormFields form={form} update={update} />\n      ' + endDivs;
admin = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n' + admin;

fs.writeFileSync('src/routes/admin/lojas.nova.tsx', admin);

let pub = fs.readFileSync('src/routes/inscricao.$token.tsx', 'utf8');

const pubFormStart = pub.indexOf('{/* ========== DADOS DA LOJA ========== */}');
const pubFinalEnd = pub.indexOf('          <div className="pt-6 border-t flex justify-end">');

pub = pub.substring(0, pubFormStart) + '<LojaFormFields form={form} update={update} />\n' + pub.substring(pubFinalEnd);
pub = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n' + pub;

fs.writeFileSync('src/routes/inscricao.$token.tsx', pub);
console.log('done replacing');
