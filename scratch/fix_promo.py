import re

file_path = 'src/routes/admin/marketing.promocoes.nova.tsx'
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import catalog
if 'import { catalog }' not in content:
    content = content.replace(
        'import { useAdminCategories } from "@/stores/categories";',
        'import { useAdminCategories } from "@/stores/categories";\nimport { catalog } from "@/services/catalog";'
    )

# 2. Add states
state_code = '''
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProductsCache, setSelectedProductsCache] = useState<Record<string, any>>({});
'''
if 'const [searchResults' not in content:
    content = content.replace('const [searchQuery, setSearchQuery] = useState("");', 'const [searchQuery, setSearchQuery] = useState("");\n' + state_code)

# 3. Replace filteredProdutos useMemo
old_filtered = '''  const filteredProdutos = useMemo(() => {
    if (!searchQuery.trim()) return produtos;
    const q = searchQuery.toLowerCase();
    return produtos.filter((p: any) => 
      p.nome.toLowerCase().includes(q) || 
      (p.marca && p.marca.toLowerCase().includes(q)) ||
      (p.id && String(p.id).includes(q))
    );
  }, [produtos, searchQuery]);'''

new_filtered = '''
  useEffect(() => {
    if (formData.tipoAlvo !== "produtos") return;
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await catalog.search(searchQuery);
        setSearchResults(res.slice(0, 50));
        setSelectedProductsCache(prev => {
          const next = { ...prev };
          res.forEach(p => { next[p.id] = p; });
          return next;
        });
      } catch(e) {}
      setIsSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, formData.tipoAlvo]);

  useEffect(() => {
    if (existing && existing.tipoAlvo === "produtos" && existing.alvosId.length > 0) {
      Promise.all(existing.alvosId.map(id => catalog.getProductById(id, effectiveStoreId)))
        .then(prods => {
          setSelectedProductsCache(prev => {
            const next = { ...prev };
            prods.forEach(p => { if (p) next[p.id] = p; });
            return next;
          });
        });
    }
  }, [existing, effectiveStoreId]);
'''
content = content.replace(old_filtered, new_filtered)

# 4. Replace filteredProdutos usages
content = content.replace('filteredProdutos', 'searchResults')

# 5. Replace produtos.find
content = re.sub(r'const\s+(\w+)\s*=\s*produtos\.find\(\(p:\s*any\)\s*=>\s*p\.id\s*===\s*(id|selectedPreviewProductId)\);', r'const \1 = selectedProductsCache[\2];', content)
content = re.sub(r'const\s+(\w+)\s*=\s*produtos\.find\(\(p:\s*any\)\s*=>\s*formData\.alvosId\.includes\(p\.id\)\);', r'const \1 = selectedProductsCache[formData.alvosId[0]];', content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done!')
