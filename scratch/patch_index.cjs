const fs = require('fs');
const file = 'src/routes/admin/index.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Imports
if (!content.includes('useMarketing')) {
  content = content.replace(
    `import { useAbandonedCartsStore } from "@/stores/abandoned-carts";`,
    `import { useAbandonedCartsStore } from "@/stores/abandoned-carts";\nimport { useMarketing } from "@/stores/marketing";`
  );
  content = content.replace(
    `  ExternalLink,\n  Globe\n} from "lucide-react";`,
    `  ExternalLink,\n  Globe,\n  Tag\n} from "lucide-react";`
  );
}

// 2. Add store variables
if (!content.includes('const { lojaPromocoes }')) {
  content = content.replace(
    `const { items: cartItems } = useCart();`,
    `const { items: cartItems } = useCart();\n  const { lojaPromocoes } = useMarketing();\n  const [showPromoModal, setShowPromoModal] = useState(false);`
  );
}

// 3. effectiveStoreId
content = content.replace(
  `const effectiveStoreId = activeStoreId || (!isGlobalAdmin() && currentUser?.lojasVinculadas?.[0]) || null;`,
  `const effectiveStoreId = activeStoreId || null;`
);

// 4. visitors useMemo
const oldVisitors = `  const visitors = useMemo(() => {
    if (!effectiveStoreId) return rawVisitors;
    return rawVisitors.filter(v => v.lojaId === effectiveStoreId || (v.url && v.url.includes(effectiveStoreId)));
  }, [rawVisitors, effectiveStoreId]);`;

const newVisitors = `  const visitors = useMemo(() => {
    let filtered = rawVisitors;
    if (!isGlobalAdmin() && currentUser?.lojasVinculadas) {
      filtered = filtered.filter(v => currentUser.lojasVinculadas.includes(v.lojaId));
    }
    if (effectiveStoreId) {
      filtered = filtered.filter(v => v.lojaId === effectiveStoreId || (v.url && v.url.includes(effectiveStoreId)));
    }
    return filtered;
  }, [rawVisitors, effectiveStoreId, currentUser]);`;
content = content.replace(oldVisitors, newVisitors);

// 5. orders useMemo
const oldOrders = `  const orders = useMemo(() => {
    if (!effectiveStoreId) return rawOrders;
    return rawOrders.filter(o => o.lojaId === effectiveStoreId);
  }, [rawOrders, effectiveStoreId]);`;

const newOrders = `  const orders = useMemo(() => {
    let filtered = rawOrders;
    if (!isGlobalAdmin() && currentUser?.lojasVinculadas) {
      filtered = filtered.filter(o => currentUser.lojasVinculadas.includes(o.lojaId));
    }
    if (effectiveStoreId) {
      filtered = filtered.filter(o => o.lojaId === effectiveStoreId);
    }
    return filtered;
  }, [rawOrders, effectiveStoreId, currentUser]);`;
content = content.replace(oldOrders, newOrders);

// 6. Dashboard widget for promotions
const promoWidget = `

          {/* ---- Widget de Promoções (Rede/Loja) ---- */}
          <div 
            onClick={() => setShowPromoModal(true)}
            className="bg-white rounded-xl border shadow-sm p-4 flex flex-col justify-between h-[110px] hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
                  <Tag className="h-4 w-4" />
                </div>
                <span className="text-xl font-bold text-slate-800">
                  {isGlobalAdmin() ? Object.keys(lojaPromocoes || {}).length : (lojaPromocoes?.[effectiveStoreId || currentUser?.lojasVinculadas?.[0] || '']?.length || 0)}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border-emerald-200">
                Promoções
              </Badge>
            </div>
            <div className="text-xs text-muted-foreground font-medium leading-tight">
              Acompanhamento de ofertas
              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>Clique para gerenciar</span>
              </div>
            </div>
          </div>`;

if (!content.includes('Widget de Promoções')) {
  // insert right after "Visitas por Loja" widget
  content = content.replace(
    `              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>{visitasPorLoja.length} lojas monitoradas</span>
                <span>•</span>
                <span>Clique para ver</span>
              </div>
            </div>
          </div>`,
    `              <div className="text-[10px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                <span>{visitasPorLoja.length} lojas monitoradas</span>
                <span>•</span>
                <span>Clique para ver</span>
              </div>
            </div>
          </div>${promoWidget}`
  );
}

// 7. Promo Modal
const promoModal = `

      {/* ---- Modal de Promoções por Loja ---- */}
      <Dialog open={showPromoModal} onOpenChange={setShowPromoModal}>
        <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
              <Tag className="h-5 w-5 text-emerald-600" />
              Promoções Ativas por Loja
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Acompanhamento detalhado das campanhas e ofertas sendo realizadas por cada unidade.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto pr-1 mt-4 space-y-4">
            {pharmacies
              ?.filter(loja => {
                if (isGlobalAdmin()) return true;
                if (effectiveStoreId) return loja.id === effectiveStoreId;
                return currentUser?.lojasVinculadas?.includes(loja.id);
              })
              .map(loja => {
              const promos = lojaPromocoes?.[loja.id] || [];
              if (promos.length === 0 && !isGlobalAdmin()) return null; // hide empty stores for normal admins

              return (
                <div key={loja.id} className="border border-slate-200 rounded-xl p-4 bg-white shadow-sm">
                  <div className="flex items-center gap-2 mb-3 border-b border-slate-100 pb-2">
                    <Store className="h-4 w-4 text-emerald-600" />
                    <h4 className="font-bold text-slate-800">{loja.nomeFantasia}</h4>
                  </div>
                  {promos.length > 0 ? (
                    <div className="space-y-2">
                      {promos.map(promo => (
                        <div key={promo.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3 rounded-lg border border-slate-100">
                          <div>
                            <div className="text-sm font-bold text-slate-700 flex items-center gap-2">
                              {promo.titulo}
                              <Badge variant="outline" className="text-[9px] uppercase tracking-wider bg-white">
                                {promo.tipoAlvo}
                              </Badge>
                            </div>
                          </div>
                          <div className="text-right">
                            <Link to="/admin/marketing/promocoes" className="text-xs text-emerald-600 font-bold hover:underline">
                              Editar promoção
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-xs text-slate-500 py-2">
                      Nenhuma promoção ativa no momento.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
`;

if (!content.includes('Modal de Promoções por Loja')) {
  // insert before final </div>
  content = content.replace(
    `    </div>\n  );\n}`,
    `${promoModal}    </div>\n  );\n}`
  );
}

fs.writeFileSync(file, content);
console.log('Script completed');
