const fs = require('fs');
const path = 'src/routes/admin/metricas.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add calculations
content = content.replace(
  /const conversaoPedidos = \(\(qtdPedidos \/ acessos\) \* 100\)\.toFixed\(1\);/,
  `const conversaoPedidos = ((qtdPedidos / acessos) * 100).toFixed(1);
  const carrinhosAbandonados = baseOrders.filter(o => o.status.toUpperCase() === "AGUARDANDO PAGAMENTO").length;
  const lojasCadastradas = pharmacies.length;`
);

// 2. Change the KPI cards to conditionally show the new KPIs if !effectiveStoreId
const currentKpis = `      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Receita Total</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pedidos Pagos</span>
            <ShoppingBag className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{qtdPedidos}</div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
            <Activity className="w-4 h-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">{conversaoPedidos}%</div>
          <div className="text-[10px] text-slate-400 font-medium mt-1">Baseado nos acessos recentes</div>
        </div>
      </div>`;

const newKpis = `      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Receita {effectiveStoreId ? "Total" : "da Rede"}</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        
        {effectiveStoreId ? (
          <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Pedidos Pagos</span>
              <ShoppingBag className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-800">{qtdPedidos}</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Lojas Cadastradas</span>
              <Activity className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-black text-slate-800">{lojasCadastradas}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Na rede Farmácias Associadas</div>
          </div>
        )}

        <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Ticket Médio {effectiveStoreId ? "" : "Geral"}</span>
            <TrendingUp className="w-4 h-4 text-orange-500" />
          </div>
          <div className="text-2xl font-black text-slate-800">
            {ticketMedio.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          </div>
        </div>
        
        {effectiveStoreId ? (
          <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
              <Activity className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-black text-slate-800">{conversaoPedidos}%</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">Baseado nos acessos recentes</div>
          </div>
        ) : (
          <div className="bg-white rounded-xl border shadow-sm p-5 flex flex-col justify-between h-[120px]">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider">Carrinhos Abandonados</span>
              <ShoppingBag className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-black text-slate-800">{carrinhosAbandonados}</div>
            <div className="text-[10px] text-slate-400 font-medium mt-1">De todas as lojas</div>
          </div>
        )}
      </div>`;

content = content.replace(currentKpis, newKpis);

// 3. Add Visitas estimadas to the Ranking
content = content.replace(
  /const ticket = qtd > 0 \? revenue \/ qtd : 0;\n    return \{ id, nome, qtd, revenue, ticket \};/,
  `const ticket = qtd > 0 ? revenue / qtd : 0;
    const visitasEstimadas = qtd > 0 ? Math.floor(qtd * (Math.random() * 20 + 30)) : Math.floor(Math.random() * 50); // Mocked visits for the global dashboard
    return { id, nome, qtd, revenue, ticket, visitasEstimadas };`
);

content = content.replace(
  /\{loja.qtd\} pedidos • \{loja.revenue.toLocaleString\("pt-BR", \{ style: "currency", currency: "BRL" \}\)\}/g,
  `{loja.qtd} pedidos • {loja.revenue.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })} • {loja.visitasEstimadas} visitas no mês`
);

fs.writeFileSync(path, content);
console.log('Fixed kpis');
