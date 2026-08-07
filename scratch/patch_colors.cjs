const fs = require('fs');

const path = 'src/routes/admin/banners.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldComponentRegex = /function StoreColorsConfig\(\) \{[\s\S]*?(?=^export default function Banners\(\))/m;

const newComponent = `function StoreColorsConfig() {
  const { activeStoreId, pharmacies, updatePharmacy } = useAdmin();
  const currentPharmacy = pharmacies.find(p => p.id === activeStoreId);
  const [colors, setColors] = useState<Record<string, string>>(currentPharmacy?.themeColors || {
    primary: "#00B5AD",
    secondary: "#10b981",
    accent: "#f43f5e"
  });

  if (!currentPharmacy) return <div className="p-8 text-center text-slate-500">Selecione uma loja para gerenciar as cores.</div>;

  const handleSave = () => {
    updatePharmacy(currentPharmacy.id, { ...currentPharmacy, themeColors: colors });
    toast.success("Cores salvas com sucesso!");
  };

  const updateColor = (key: string, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mt-6">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
        <div>
          <h3 className="text-lg font-bold text-slate-800">Personalizar Cores da Loja</h3>
          <p className="text-sm text-slate-500 mt-1">
            Escolha as cores principais que representarão a sua marca no site.
          </p>
        </div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm">
          <Save className="w-4 h-4 mr-2" /> Salvar Cores
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-0 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
        
        {/* Left Column: Controles */}
        <div className="p-8 space-y-8 bg-white">
          <div>
            <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-400" /> Paleta de Cores
            </h4>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.primary }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor Primária</Label>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">A cor principal da sua marca. Usada em botões de destaque, links ativos e no cabeçalho.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.primary} onChange={e => updateColor("primary", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-32 h-10 text-sm" value={colors.primary} onChange={e => updateColor("primary", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.secondary }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor Secundária</Label>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">Usada em botões secundários, ícones de menu, badges de informação e rodapé.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.secondary} onChange={e => updateColor("secondary", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-32 h-10 text-sm" value={colors.secondary} onChange={e => updateColor("secondary", e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full shadow-inner border border-black/10 flex-shrink-0 mt-1" style={{ backgroundColor: colors.accent }} />
                <div className="flex-1">
                  <Label className="font-bold text-sm text-slate-700">Cor de Destaque (Accent)</Label>
                  <p className="text-xs text-slate-500 mb-2 leading-relaxed">Usada para chamar atenção: tags de desconto, preço promocional, alertas e botões urgentes.</p>
                  <div className="flex items-center gap-2">
                    <Input type="color" className="w-12 h-10 p-1 cursor-pointer rounded-md border-slate-200" value={colors.accent} onChange={e => updateColor("accent", e.target.value)} />
                    <Input type="text" className="font-mono uppercase w-32 h-10 text-sm" value={colors.accent} onChange={e => updateColor("accent", e.target.value)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="p-8 bg-slate-50/50">
          <h4 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-slate-400" /> Demonstração ao vivo
          </h4>
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden scale-[0.85] origin-top md:scale-100 transition-all">
            {/* Fake Header */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ backgroundColor: colors.primary }}>
              <div className="font-black text-xl text-white tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-sm" />
                </div>
                {currentPharmacy.nomeFantasia || currentPharmacy.nome}
              </div>
              <div className="flex items-center gap-4">
                <div className="h-2 w-16 bg-white/30 rounded-full" />
                <div className="h-2 w-16 bg-white/30 rounded-full" />
                <div className="relative">
                  <ShoppingCart className="w-6 h-6 text-white" />
                  <span className="absolute -top-1.5 -right-1.5 text-[9px] font-bold text-white px-1.5 py-0.5 rounded-full border border-white" style={{ backgroundColor: colors.accent }}>3</span>
                </div>
              </div>
            </div>

            {/* Fake Content */}
            <div className="p-6 space-y-6">
              {/* Fake Banner */}
              <div className="w-full h-32 rounded-lg bg-slate-100 flex items-center justify-center border border-slate-200 overflow-hidden relative group">
                <div className="absolute inset-0 opacity-10" style={{ background: \`linear-gradient(45deg, \${colors.primary}, \${colors.secondary})\` }} />
                <div className="relative z-10 text-center">
                  <div className="font-bold text-lg text-slate-800">Oferta Especial</div>
                  <div className="text-sm text-slate-500 mt-1">Aproveite os descontos</div>
                  <div className="mt-3 inline-block px-4 py-1.5 rounded-full text-xs font-bold text-white shadow-sm" style={{ backgroundColor: colors.accent }}>
                    Até 50% OFF
                  </div>
                </div>
              </div>

              {/* Fake Product Grid */}
              <div className="grid grid-cols-2 gap-4">
                {/* Fake Product 1 */}
                <div className="border border-slate-200 rounded-lg p-4 relative bg-white">
                  <div className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: colors.accent }}>
                    -20%
                  </div>
                  <div className="w-full h-24 bg-slate-50 rounded mb-3 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="h-3 w-3/4 bg-slate-200 rounded mb-2" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded mb-4" />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 line-through mb-0.5">R$ 49,90</div>
                      <div className="font-bold text-sm" style={{ color: colors.primary }}>R$ 39,90</div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer shadow-sm hover:opacity-90" style={{ backgroundColor: colors.primary }}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>

                {/* Fake Product 2 */}
                <div className="border border-slate-200 rounded-lg p-4 relative bg-white">
                  <div className="absolute top-2 left-2 text-[10px] font-bold text-white px-2 py-0.5 rounded shadow-sm" style={{ backgroundColor: colors.secondary }}>
                    Novidade
                  </div>
                  <div className="w-full h-24 bg-slate-50 rounded mb-3 flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-300" />
                  </div>
                  <div className="h-3 w-3/4 bg-slate-200 rounded mb-2" />
                  <div className="h-2 w-1/2 bg-slate-100 rounded mb-4" />
                  <div className="flex items-end justify-between">
                    <div>
                      <div className="font-bold text-sm" style={{ color: colors.primary }}>R$ 129,90</div>
                    </div>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer shadow-sm hover:opacity-90" style={{ backgroundColor: colors.primary }}>
                      <Plus className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
`;

content = content.replace(oldComponentRegex, newComponent);
fs.writeFileSync(path, content);
console.log("Done");
