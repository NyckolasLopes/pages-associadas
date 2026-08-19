import fs from 'fs';

let content = fs.readFileSync('src/routes/admin/produtos.estoque.tsx', 'utf-8');

// Imports
if (!content.includes('import { catalog }')) {
  content = content.replace(
    'import { Spinner } from "@/components/ui/spinner";',
    'import { Spinner } from "@/components/ui/spinner";\nimport { catalog } from "@/services/catalog";\nimport type { Produto } from "@/types";'
  );
}

// Variables
content = content.replace(
  'const { customProducts, fornecedores, setFornecedores, removeFornecedor } = useAdminProducts();',
  'const { fornecedores, setFornecedores, removeFornecedor } = useAdminProducts();\n  const [serverProducts, setServerProducts] = useState<Produto[]>([]);\n  const [totalProducts, setTotalProducts] = useState(0);'
);

// Loading Effect
const oldEffect = `  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // Load all stock data from produto_precos_loja
  useEffect(() => {
    async function loadAllStock() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("produto_precos_loja")
        .select("produto_id, loja_id, estoque");

      if (!error && data) {
        const map: Record<string, Record<string, number>> = {};
        data.forEach((row: any) => {
          if (!map[row.produto_id]) map[row.produto_id] = {};
          map[row.produto_id][row.loja_id] = row.estoque ?? 0;
        });
        setStockData(map);
      }
      setIsLoading(false);
    }
    loadAllStock();
  }, []);`;

const newEffect = `  // Reset page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, pageSize]);

  // Load all stock data from produto_precos_loja AND server products
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      
      // Load global stocks
      const { data, error } = await supabase
        .from("produto_precos_loja")
        .select("produto_id, loja_id, estoque");

      if (!error && data) {
        const map: Record<string, Record<string, number>> = {};
        data.forEach((row: any) => {
          if (!map[row.produto_id]) map[row.produto_id] = {};
          map[row.produto_id][row.loja_id] = row.estoque ?? 0;
        });
        setStockData(map);
      }
      
      // Load products
      try {
        const { results, count } = await catalog.adminSearchProducts({
          search,
          page: currentPage,
          pageSize
        });
        setServerProducts(results);
        setTotalProducts(count);
      } catch (e) {
        console.error(e);
      }

      setIsLoading(false);
    }
    
    const timeout = setTimeout(loadData, 300);
    return () => clearTimeout(timeout);
  }, [search, currentPage, pageSize]);`;

content = content.replace(oldEffect, newEffect);

// Remove filteredProducts
const oldFiltered = `  const filteredProducts = useMemo(() => {
    if (!search) return customProducts;
    const s = search.toLowerCase();
    return customProducts.filter(p =>
      (p.nome && p.nome.toLowerCase().includes(s)) ||
      (p.ean && p.ean.toLowerCase().includes(s)) ||
      (p.codigoInterno && p.codigoInterno.toLowerCase().includes(s)) ||
      (p.id && p.id.toLowerCase().includes(s))
    );
  }, [customProducts, search]);`;

content = content.replace(oldFiltered, '');

// Replace customProducts with serverProducts in getStock
content = content.replace(/customProducts/g, 'serverProducts');

// Replace paginatedProducts
content = content.replace(
  `  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredProducts.slice(startIndex, startIndex + pageSize);
  }, [filteredProducts, currentPage, pageSize]);`,
  `  const paginatedProducts = serverProducts;`
);

// Fix pagination UI
content = content.replace(/filteredProducts\.length/g, 'totalProducts');

fs.writeFileSync('src/routes/admin/produtos.estoque.tsx', content);
