const fs = require('fs');
const path = 'src/routes/admin/banners.tsx';
let content = fs.readFileSync(path, 'utf8');

const targetStr = `<Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
            <Save className="w-4 h-4 mr-2" /> Salvar Cores
          </Button>`;

const replacementStr = `<div className="flex items-center gap-3">
            {currentPharmacy && (
              <Button 
                variant="outline" 
                className="flex items-center gap-2 border-emerald-200 text-emerald-700 hover:bg-emerald-50 bg-white"
                onClick={() => window.open(\`/\${currentPharmacy.slug}\`, '_blank')}
              >
                <Eye className="w-4 h-4" /> Ver na minha loja
              </Button>
            )}
            <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
              <Save className="w-4 h-4 mr-2" /> Salvar Cores
            </Button>
          </div>`;

content = content.replace(targetStr, replacementStr);
fs.writeFileSync(path, content);
console.log('Done!');
