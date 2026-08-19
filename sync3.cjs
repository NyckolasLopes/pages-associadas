const fs = require('fs');

// Read files
let admin = fs.readFileSync('src/routes/admin/lojas.nova.tsx', 'utf8');
let pub = fs.readFileSync('src/routes/inscricao.$token.tsx', 'utf8');

// For admin, we want to replace everything inside:
// <div className="bg-white rounded-xl shadow-sm border p-6 space-y-8"> ... </div>
const adminPrefix = '<div className="bg-white rounded-xl shadow-sm border p-6 space-y-8">';
const adminSuffix = '      </div>\n    </div>\n  );\n}';
const adminStartIdx = admin.indexOf(adminPrefix) + adminPrefix.length;
const adminEndIdx = admin.lastIndexOf(adminSuffix);

admin = admin.substring(0, adminStartIdx) + '\n        <LojaFormFields form={form} update={update} />\n' + admin.substring(adminEndIdx);
admin = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n' + admin;
fs.writeFileSync('src/routes/admin/lojas.nova.tsx', admin);

// For public, we want to replace everything inside:
// <div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 sm:p-10 space-y-10"> ... <div className="pt-6 border-t flex justify-end">
const pubPrefix = '<div className="bg-white rounded-xl shadow-lg border border-slate-100 p-6 sm:p-10 space-y-10">';
const pubSuffix = '<div className="pt-6 border-t flex justify-end">';

const pubStartIdx = pub.indexOf(pubPrefix) + pubPrefix.length;
const pubEndIdx = pub.indexOf(pubSuffix);

pub = pub.substring(0, pubStartIdx) + '\n          <LojaFormFields form={form} update={update} />\n          ' + pub.substring(pubEndIdx);
pub = 'import { LojaFormFields } from "@/components/admin/LojaFormFields";\n' + pub;
fs.writeFileSync('src/routes/inscricao.$token.tsx', pub);

console.log('done replacing exactly inside the wrappers');
