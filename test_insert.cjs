const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_PUBLISHABLE_KEY);

async function test() {
  const p = {
    id: 'test-store-' + Date.now(),
    ativo: true,
    cnpj: '12345678901234',
    razaoSocial: 'Test Store Ltd',
    nome: 'Test Store',
    email: 'test@test.com',
    telefone: '11999999999',
    cep: '00000000',
    endereco: 'Rua Test',
    numero: '123',
    complemento: '',
    bairro: 'Centro',
    cidade: 'Sao Paulo',
    uf: 'SP',
    latitude: -23.5,
    longitude: -46.6
  };
  
  const tema_cores_payload = { test: true };
  
  const { error: minError } = await supabase.from('lojas').insert({
    id: p.id,
    ativa: p.ativo ?? true,
    cnpj: p.cnpj,
    razao_social: p.razaoSocial,
    nome_fantasia: p.nome,
    email: p.email,
    telefone: p.telefone,
    cep: p.cep,
    logradouro: p.endereco,
    numero: p.numero,
    
    bairro: p.bairro,
    cidade: p.cidade,
    estado: p.uf,
    tema_cores: tema_cores_payload,
    latitude: p.latitude,
    longitude: p.longitude,
  });
  
  console.log('Insert minError:', minError);
}
test();
