import re

fp = 'src/routes/admin/pedidos/index.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the filteredUnifiedOrders filter
old_filter = '''        // Filtro por view
        if (mainView === "concluidos" && item.status !== "Concluído") return false;
        if (mainView === "carrinhos" && item.status !== "Pendente") return false;'''

new_filter = '''        // Filtro por view
        if (mainView === "concluidos" && item.status !== "Concluído") return false;
        if (mainView === "carrinhos") {
           const st = (item.status || "").toLowerCase();
           if (st.includes("conclu") || st.includes("cancel")) return false;
        }'''

content = content.replace(old_filter, new_filter)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed pedidos filter')
