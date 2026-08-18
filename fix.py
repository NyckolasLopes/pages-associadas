import re

with open('src/routes/admin/carrinhos-abandonados.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the TS errors:
content = content.replace('if (mainView === "concluidos" && item.status !== "Concluído") return false;', '')

# The KPIs
content = content.replace('onClick={() => setMainView("todos")}', '')
content = content.replace('onClick={() => setMainView("concluidos")}', '')

# The class conditionals that compare mainView
content = content.replace('mainView === "todos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : ""', '""')
content = content.replace('mainView === "concluidos" ? "ring-2 ring-emerald-500 border-emerald-500 bg-emerald-50/20" : ""', '""')

with open('src/routes/admin/carrinhos-abandonados.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
