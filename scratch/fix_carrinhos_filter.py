import re

fp = 'src/routes/admin/carrinhos-abandonados.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the filteredUnifiedOrders filter
old_filter = '''        // Filtro por view - página específica de carrinhos abandonados, mostra somente pendentes
        if (item.status !== "Pendente") return false;'''

new_filter = '''        // Filtro por view - página específica de carrinhos abandonados, mostra somente pendentes
        const st = (item.status || "").toLowerCase();
        if (st.includes("conclu") || st.includes("cancel")) return false;'''

content = content.replace(old_filter, new_filter)
with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)
print('Fixed carrinhos filter')
