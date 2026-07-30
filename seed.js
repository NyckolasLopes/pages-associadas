import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SUPABASE_URL = "https://uqwxpoxwwvyqnwgquxit.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVxd3hwb3h3d3Z5cW53Z3F1eGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI3NTMxOTksImV4cCI6MjA5ODMyOTE5OX0.8D9DsqKn3kqIYVP4SFwD9jF-w8YV74fLlYyEn1I0AZ4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function seed() {
  console.log("Reading data...");
  const categoriesData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/categories.json'), 'utf8'));
  const productsData = JSON.parse(fs.readFileSync(path.join(__dirname, 'src/data/products.json'), 'utf8'));

  console.log(`Found ${categoriesData.length} categories and ${productsData.length} products.`);

  // Seed Categories
  const categoriesDb = categoriesData.map(c => ({
    id: c.id,
    nome: c.nome,
    slug: c.slug,
    parent_id: c.parentId || null,
    descricao_html: c.descricaoHtml || null,
    ativa: c.ativa !== false
  }));

  console.log("Inserting categories...");
  for (let i = 0; i < categoriesDb.length; i += 50) {
    const chunk = categoriesDb.slice(i, i + 50);
    const { error } = await supabase.from('categorias').upsert(chunk);
    if (error) {
      console.error("Error inserting categories:", error);
    }
  }
  console.log("Categories done!");

  // Seed Products
  const productsDb = productsData.map(p => ({
    id: p.id,
    nome: p.nome,
    ean: p.ean || null,
    descricao: p.descricao || null,
    slug: p.url || p.slug || p.id,
    fabricante: p.fabricante || null,
    preco_de: p.precoDe || 0,
    preco_por: p.precoPor || 0,
    estoque: p.estoque || 0,
    registro_anvisa: p.registroAnvisa || null,
    tarja: p.tarja || null,
    retem_receita: p.retemReceita || false,
    generico: p.generico || false,
    possui_imagem: p.possuiImagem || false,
    categoria_id: p.categoriaId || null,
    subcategoria_id: p.subcategoriaId || null,
    categorias_adicionais: p.categoriasAdicionais || [],
    internal_tags: p.internalTags || [],
    ativo: p.ativo !== false,
    principios_ativos: p.principiosAtivos || [],
    video_url: p.videoUrl || null,
    imagens: p.imagens || []
  }));

  console.log("Inserting products...");
  for (let i = 0; i < productsDb.length; i += 50) {
    const chunk = productsDb.slice(i, i + 50);
    const { error } = await supabase.from('produtos').upsert(chunk);
    if (error) {
      console.error("Error inserting products:", error);
    }
  }
  console.log("Products done!");
  console.log("Database seeded successfully!");
}

seed().catch(console.error);
