import re

fp = 'src/routes/admin/carrinhos-abandonados.tsx'
with open(fp, 'r', encoding='utf-8') as f:
    content = f.read()

# Add useOrdersKpis to imports if not there
if 'useOrdersKpis' not in content:
    content = content.replace(
        'import { useAdmin } from "@/stores/admin";',
        'import { useAdmin } from "@/stores/admin";\nimport { useOrdersKpis } from "@/hooks/useOrdersQuery";'
    )

# Add dbKpis definition if not there
if 'dbKpis' not in content[:content.find('const kpis = {')]:
    content = content.replace(
        'const [mainView, setMainView] = useState<"carrinhos">("carrinhos");',
        'const [mainView, setMainView] = useState<"carrinhos">("carrinhos");\n  const { data: dbKpis } = useOrdersKpis(activeStoreId || undefined);'
    )

with open(fp, 'w', encoding='utf-8') as f:
    f.write(content)

print('carrinhos-abandonados.tsx completely fixed')
