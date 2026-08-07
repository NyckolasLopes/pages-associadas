const fs = require('fs');
const path = 'src/routes/admin/banners.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldPreviewRegex = /\{\/\* Right Column: Preview \*\/\}[\s\S]*?(?=      <\/div>\n    <\/div>\n  \);\n\})/m;

const newPreview = `{/* Right Column: Preview */}
        <div className="p-8 bg-slate-50/50 flex flex-col items-center justify-start overflow-hidden">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2 self-start">
            <Monitor className="w-5 h-5 text-slate-400" /> Demonstração na loja
          </h4>
          
          <div className="bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200 overflow-hidden w-full max-w-[420px] scale-95 md:scale-100 origin-top">
            {/* Fake Header */}
            <div className="px-5 py-4 flex flex-col gap-4" style={{ backgroundColor: colors.headerBg || colors.primary }}>
              <div className="flex items-center justify-between">
                <div className="font-black text-xl tracking-tight flex items-center gap-2" style={{ color: colors.headerIcons || "#ffffff" }}>
                  {currentPharmacy?.logoUrl ? (
                    <img src={currentPharmacy.logoUrl} alt="Logo" className="h-6 w-auto brightness-0 invert" style={{ filter: colors.headerIcons === '#ffffff' ? 'brightness(0) invert(1)' : 'none' }} />
                  ) : (
                    <><Store className="w-6 h-6" /> LOJA</>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <Search className="w-5 h-5" style={{ color: colors.headerIcons || "#ffffff" }} />
                  <div className="relative">
                    <ShoppingCart className="w-5 h-5" style={{ color: colors.headerIcons || "#ffffff" }} />
                    <span className="absolute -top-1.5 -right-1.5 text-[10px] w-4 h-4 flex items-center justify-center rounded-full text-white font-bold" style={{ backgroundColor: colors.accent || "#f43f5e" }}>2</span>
                  </div>
                </div>
              </div>
              <div className="w-full h-10 rounded-lg flex items-center px-4" style={{ backgroundColor: colors.searchBg || "#ffffff" }}>
                <Search className="w-4 h-4 text-slate-400 mr-2" />
                <div className="h-2 w-32 bg-slate-200 rounded"></div>
              </div>
            </div>

            {/* Fake Banner */}
            <div className="h-32 flex flex-col items-center justify-center relative overflow-hidden" style={{ backgroundColor: (colors.secondary || "#10b981") + "15" }}>
              <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-slate-900 to-transparent"></div>
              <div className="z-10 text-center space-y-1">
                <div className="inline-block px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest text-white mb-1" style={{ backgroundColor: colors.secondary || "#10b981" }}>OFERTAS ESPECIAIS</div>
                <div className="text-xl font-black text-slate-800">CUIDADO DIÁRIO</div>
                <div className="text-xs font-medium text-slate-500">Até 50% de desconto</div>
              </div>
            </div>

            {/* Fake Content */}
            <div className="p-5 space-y-5">
              <div className="flex items-center justify-between">
                <div className="font-black text-base text-slate-800">Mais Vendidos</div>
                <div className="text-xs font-bold hover:opacity-80 cursor-pointer" style={{ color: colors.primary || "#00B5AD" }}>VER TODOS</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[1,2].map(i => (
                  <div key={i} className="border border-slate-100/80 shadow-sm rounded-xl p-3 hover:shadow-md transition-shadow bg-white">
                    <div className="w-full h-24 bg-slate-50 rounded-lg mb-3 flex items-center justify-center relative">
                      <div className="absolute top-1 left-1 bg-white text-[8px] font-bold px-1.5 py-0.5 rounded shadow-sm flex items-center gap-0.5 text-amber-500">
                        <Monitor className="w-2 h-2 fill-amber-500" /> 4.9
                      </div>
                      <img src="https://placehold.co/100x100/e2e8f0/94a3b8?text=Produto" className="w-16 h-16 object-contain rounded-md mix-blend-multiply" alt="produto" />
                    </div>
                    <div className="h-2 w-20 bg-slate-200 rounded mb-1.5"></div>
                    <div className="h-2 w-12 bg-slate-100 rounded mb-3"></div>
                    <div className="text-[10px] text-slate-400 line-through mb-0.5">R$ 29,90</div>
                    <div className="font-black text-base leading-none mb-3" style={{ color: colors.accent || "#f43f5e" }}>R$ 19,90</div>
                    <div className="w-full h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white transition-opacity hover:opacity-90 shadow-sm cursor-pointer" style={{ backgroundColor: colors.primary || "#00B5AD" }}>
                      COMPRAR
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Fake Institutional (Improved based on screenshot) */}
            <div className="px-6 py-8 flex flex-col items-center justify-center text-center mt-2" style={{ backgroundColor: colors.institutionalBg || "#f97316" }}>
              <div className="font-black text-white text-xl mb-1">Farmácias Associadas</div>
              <div className="font-medium text-white/90 text-[11px] mb-6 max-w-[250px] leading-relaxed">
                Farmácias Associadas, muito mais que farmácia, aqui você tem amigos.
              </div>
              
              <div className="grid grid-cols-2 gap-3 w-full">
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center mb-2 shadow-sm transform hover:scale-105 transition-transform w-12 h-12">
                    <Heart className="w-6 h-6" style={{ color: colors.institutionalBg || "#f97316" }} />
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight">Atendimento Humanizado</div>
                </div>
                <div className="flex flex-col items-center">
                  <div className="bg-white p-2.5 rounded-2xl flex items-center justify-center mb-2 shadow-sm transform hover:scale-105 transition-transform w-12 h-12">
                    <Truck className="w-6 h-6" style={{ color: colors.institutionalBg || "#f97316" }} />
                  </div>
                  <div className="text-[10px] font-bold text-white leading-tight">Entrega Rápida</div>
                </div>
              </div>
            </div>

          </div>
        </div>`;

if (oldPreviewRegex.test(content)) {
  const newContent = content.replace(oldPreviewRegex, newPreview);
  fs.writeFileSync(path, newContent);
  console.log('Preview section replaced correctly!');
} else {
  console.log('Regex did not match!');
}
