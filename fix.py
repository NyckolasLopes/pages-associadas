import re

with open('src/routes/admin/carrinhos-abandonados.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('const [mainView, setMainView] = useState<"todos" | "concluidos" | "carrinhos">("todos");', 'const [mainView, setMainView] = useState<"carrinhos">("carrinhos");')
content = content.replace('function PedidosPage', 'function CarrinhosAbandonadosPage')
content = content.replace('export const Route = createFileRoute("/admin/pedidos/")({', 'export const Route = createFileRoute("/admin/carrinhos-abandonados")({')

content = re.sub(r'<div className="inline-flex bg-slate-100 p-1 rounded-xl">.*?</div>\s*<Popover>', '<Popover>', content, flags=re.DOTALL)

new_kpi_section = '''
        {/* Header Específico para Carrinhos Abandonados */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-4">
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">Carrinhos Abandonados</h1>
              <span className="text-sm font-semibold text-amber-800 bg-amber-100 px-2.5 py-0.5 rounded-full">
                {kpis.carrinhosARecuperar} pendentes
              </span>
            </div>
            <p className="text-slate-500 font-medium text-sm">
              Acompanhe os clientes que iniciaram uma compra mas não finalizaram o pedido.
            </p>
          </div>
        </div>
'''

content = re.sub(r'<div className="flex items-center justify-between">.*?</div>\s*<div className="grid grid-cols-1 md:grid-cols-3 gap-6">.*?</div>', new_kpi_section, content, flags=re.DOTALL)

with open('src/routes/admin/carrinhos-abandonados.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
