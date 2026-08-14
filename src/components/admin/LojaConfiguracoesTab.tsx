import { useState, useEffect } from "react";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";

export function LojaConfiguracoesTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy } = useAdmin();
  const loja = pharmacies.find((p) => p.id === lojaId);

  const [formData, setFormData] = useState<Partial<Pharmacy> & { apiKeyTemp?: string }>({});
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    if (loja) {
      let initialData = { ...loja };
      
      if (!initialData.footerPlataformaTexto && loja.categoriaAssociado !== 'Parceiro') {
        initialData.footerPlataformaTexto = `Plataforma Digital de Vendas da Rede: Farmacias Associadas - ${loja.nome || '(nome da sua loja)'} | CNPJ: ${loja.cnpj || '61.585.865/0240-93'} | I.E. 116.756.280.113 | ${loja.endereco || 'Av. Nsa. Sra. Assunção'}, ${loja.numero || '638'} - ${loja.bairro || 'Bairro'} - ${loja.cidade || 'CIDADE'}/${loja.uf || 'ESTADO SIGLA'} - CEP: ${loja.cep || '0000-001'} | Para dúvidas, elogios e reclamações acesse nossa Central de Atendimento no Whatsapp | Farmacêutico responsável: ${loja.respTecnico || 'NOME DO FARMACEUTICO'} | CRF: ${loja.inscricaoFarmaceutico || '000000'} | AFE: ${loja.afe || '0000'} | ALVARÁ: ${loja.alvara || 'XXXXXXXXXXXX'}

AVISO LEGAL E RESPONSABILIDADE SANITÁRIA (RDC ANVISA 44/2009): As informações contidas neste site não devem ser usadas para automedicação e não substituem, em hipótese alguma, as orientações dadas pelo profissional da área médica. Somente o médico está apto a diagnosticar qualquer problema de saúde e prescrever o tratamento adequado. Ao persistirem os sintomas, um médico deverá ser consultado. Os preços e promoções divulgados no site são válidos apenas para pedidos feitos pela internet. Maiores esclarecimentos, consultar o site: www.anvisa.gov.br. A Farmacias Associadas trabalha com tecnologias de proteção de dados, para que você possa realizar seus pedidos com segurança. A privacidade e a segurança dos clientes são compromissos da Farmacias Associadas. Todos os pedidos efetuados estão sujeitos à confirmação da disponibilidade de produto em nosso estoque consultado pelo Whatsapp da loja ${loja.whatsapp || '(00) 00000-0000'}.`;
      }
      
      setFormData(initialData);
    }
  }, [loja]);

  const handleChange = (field: keyof Pharmacy | "apiKeyTemp", value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    if (lojaId && formData) {
      updatePharmacy(lojaId, formData as Pharmacy);
      toast.success("Configurações atualizadas com sucesso!");
    }
  };

  if (!loja) return <div>Loja não encontrada.</div>;

  return (
    <div className="space-y-8 bg-white p-6 rounded-md shadow-sm border border-slate-200">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Configurações e Dados da Loja</h2>
        <p className="text-sm text-slate-500">Atualize as informações cadastrais e textos exibidos na sua loja.</p>
      </div>

      <div className="space-y-6">
        <h3 className="font-semibold text-slate-700 border-b pb-2">Informações Básicas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Nome Fantasia</Label>
            <Input 
              value={formData.nome || ""} 
              onChange={(e) => handleChange("nome", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Razão Social</Label>
            <Input 
              value={formData.razaoSocial || ""} 
              onChange={(e) => handleChange("razaoSocial", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>CNPJ</Label>
            <Input 
              value={formData.cnpj || ""} 
              onChange={(e) => handleChange("cnpj", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Email de Contato</Label>
            <Input 
              value={formData.email || ""} 
              onChange={(e) => handleChange("email", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>Telefone</Label>
            <Input 
              value={formData.telefone || ""} 
              onChange={(e) => handleChange("telefone", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp</Label>
            <Input 
              value={formData.whatsapp || ""} 
              onChange={(e) => handleChange("whatsapp", e.target.value)} 
            />
          </div>
        </div>

        <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Endereço</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2 md:col-span-1">
            <Label>CEP</Label>
            <Input 
              value={formData.cep || ""} 
              onChange={(e) => handleChange("cep", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Endereço</Label>
            <Input 
              value={formData.endereco || ""} 
              onChange={(e) => handleChange("endereco", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Número</Label>
            <Input 
              value={formData.numero || ""} 
              onChange={(e) => handleChange("numero", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Complemento</Label>
            <Input 
              value={formData.complemento || ""} 
              onChange={(e) => handleChange("complemento", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Bairro</Label>
            <Input 
              value={formData.bairro || ""} 
              onChange={(e) => handleChange("bairro", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Cidade</Label>
            <Input 
              value={formData.cidade || ""} 
              onChange={(e) => handleChange("cidade", e.target.value)} 
            />
          </div>
          <div className="space-y-2 md:col-span-1">
            <Label>Estado (UF)</Label>
            <Input 
              value={formData.uf || ""} 
              onChange={(e) => handleChange("uf", e.target.value)} 
            />
          </div>
        </div>

        <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Rodapé (Footer)</h3>
        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-2 mt-2">
            <h4 className="font-bold text-sm">Informações da Marca</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Frase abaixo do Logo</Label>
                <Input 
                  value={formData.footerDescricao || ""} 
                  onChange={(e) => handleChange("footerDescricao", e.target.value)} 
                  placeholder="Ex: Somos a maior rede associativa do Brasil."
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 mt-2 border-t pt-4">
            <h4 className="font-bold text-sm">Central de Relacionamento</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <div className="space-y-2 md:col-span-2">
                <Label>Título da Seção</Label>
                <Input 
                  value={formData.footerTituloContato || ""} 
                  onChange={(e) => handleChange("footerTituloContato", e.target.value)} 
                  placeholder="Ex: CENTRAL DE RELACIONAMENTO"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Endereço</Label>
                <Input 
                  value={formData.endereco || ""} 
                  onChange={(e) => handleChange("endereco", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input 
                  value={formData.telefone || ""} 
                  onChange={(e) => handleChange("telefone", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp</Label>
                <Input 
                  value={formData.whatsapp || ""} 
                  onChange={(e) => handleChange("whatsapp", e.target.value)} 
                />
              </div>
              <div className="space-y-2">
                <Label>E-mail de Contato</Label>
                <Input 
                  value={formData.email || ""} 
                  onChange={(e) => handleChange("email", e.target.value)} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-2 border-t pt-4">
            <h4 className="font-bold text-sm">Redes Sociais</h4>
            <p className="text-xs text-slate-500">Preencha com o link completo (ex: https://instagram.com/sua-loja). Deixe em branco para ocultar o ícone.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2">
              <div className="space-y-2">
                <Label>Instagram</Label>
                <Input 
                  value={formData.socialLinks?.instagram || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, instagram: e.target.value } }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>Facebook</Label>
                <Input 
                  value={formData.socialLinks?.facebook || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, facebook: e.target.value } }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>TikTok</Label>
                <Input 
                  value={formData.socialLinks?.tiktok || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, tiktok: e.target.value } }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>LinkedIn</Label>
                <Input 
                  value={formData.socialLinks?.linkedin || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, linkedin: e.target.value } }))} 
                />
              </div>
              <div className="space-y-2">
                <Label>YouTube</Label>
                <Input 
                  value={formData.socialLinks?.youtube || ""} 
                  onChange={(e) => setFormData(prev => ({ ...prev, socialLinks: { ...prev.socialLinks, youtube: e.target.value } }))} 
                />
              </div>
            </div>
          </div>

          <div className="space-y-2 mt-2 border-t pt-4">
            <h4 className="font-bold text-sm">Texto Legal (Aviso Sanitário)</h4>
            <Label>Texto referente a legislação da sua loja</Label>
            <Textarea 
              value={formData.footerPlataformaTexto || ""} 
              onChange={(e) => handleChange("footerPlataformaTexto", e.target.value)} 
              rows={12}
              placeholder="Ex: Farmacias Associadas - Sua Farmácia | CNPJ: ..."
            />
          </div>
        </div>

        <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Integração ERP (API Privada)</h3>
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 space-y-4">
          <p className="text-sm text-slate-500 mb-4">
            Gere uma chave de API para permitir que o ERP desta loja atualize automaticamente os preços e estoques através dos nossos endpoints.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label>Chave de API (Secret Key)</Label>
              <div className="relative">
                <Input 
                  type={showKey ? "text" : "password"}
                  value={formData.apiKeyTemp || formData.api_key || ""} 
                  placeholder="••••••••••••••••••••••••••••••••"
                  readOnly 
                  className="font-mono bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button 
              onClick={async () => {
                const { supabase } = await import('@/integrations/supabase/client');
                const { data, error } = await supabase.rpc('create_loja_api_key', { p_loja_id: lojaId });
                if (error) {
                  toast.error("Erro ao gerar chave: " + error.message);
                } else {
                  handleChange("apiKeyTemp", data);
                  toast.success("Chave gerada! Copie-a agora, ela não será exibida novamente.");
                }
              }} 
              className="bg-indigo-600 hover:bg-indigo-700 w-full sm:w-auto"
            >
              Gerar Nova Chave
            </Button>
          </div>
          
          <div className="pt-4 mt-4 border-t border-slate-200 flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 space-y-2 w-full">
              <Label>Validador de Chave (Teste)</Label>
              <Input 
                placeholder="Cole uma chave de API aqui para testar..." 
                id="api_key_test"
                className="font-mono bg-white"
              />
            </div>
            <Button 
              variant="outline"
              onClick={async () => {
                const testKey = (document.getElementById('api_key_test') as HTMLInputElement).value;
                if (!testKey) return toast.error("Insira uma chave para testar.");
                
                const { supabase } = await import('@/integrations/supabase/client');
                const { data, error } = await supabase.rpc('validate_loja_api_key', { p_raw_key: testKey, p_loja_id: lojaId });
                
                if (error || !data) {
                  toast.error("Chave INVÁLIDA para esta loja.");
                } else {
                  toast.success("✅ Chave VÁLIDA e funcionando perfeitamente.");
                }
              }}
              className="w-full sm:w-auto"
            >
              Testar Chave
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-6 border-t mt-8">
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold">
          <Save className="w-4 h-4 mr-2" />
          Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
