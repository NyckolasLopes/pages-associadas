import { useState, useEffect } from "react";
import { useAdmin, Pharmacy } from "@/stores/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Eye, EyeOff } from "lucide-react";

export function LojaConfiguracoesTab({ lojaId }: { lojaId: string }) {
  const { pharmacies, updatePharmacy, currentUser, grupos } = useAdmin();
  const loja = pharmacies.find((p) => p.id === lojaId);
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined || Boolean(currentUser?.grupoId && grupos?.find(g => g.id === currentUser?.grupoId)?.permissao_total);

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

        <h3 className="font-semibold text-slate-700 border-b pb-2 pt-4">Informações no Topo (Faixa de Aviso)</h3>
        <p className="text-xs text-slate-500 mb-4">Esta faixa aparece no topo do site, acima do menu e do banner.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Texto da Faixa</Label>
            <Input 
              value={formData.topBarText || ""} 
              onChange={(e) => handleChange("topBarText", e.target.value)} 
              placeholder="Ex: Cupom de primeira compra: use 10OFF..."
            />
          </div>
          <div className="space-y-2">
            <Label>Cor de Fundo da Faixa</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                className="w-14 h-10 p-1 cursor-pointer" 
                value={formData.topBarBgColor || "#f97316"} 
                onChange={(e) => handleChange("topBarBgColor", e.target.value)} 
              />
              <Input 
                value={formData.topBarBgColor || "#f97316"} 
                onChange={(e) => handleChange("topBarBgColor", e.target.value)} 
                placeholder="#HexColor"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Cor do Texto da Faixa</Label>
            <div className="flex gap-2">
              <Input 
                type="color" 
                className="w-14 h-10 p-1 cursor-pointer" 
                value={formData.topBarTextColor || "#ffffff"} 
                onChange={(e) => handleChange("topBarTextColor", e.target.value)} 
              />
              <Input 
                value={formData.topBarTextColor || "#ffffff"} 
                onChange={(e) => handleChange("topBarTextColor", e.target.value)} 
                placeholder="#HexColor"
              />
            </div>
          </div>
          <div className="space-y-2 pt-2 border-t md:col-span-2 mt-2">
            <Label className="text-muted-foreground text-xs">O Telefone e WhatsApp configurados abaixo também aparecerão no menu utilitário superior.</Label>
          </div>
          <div className="space-y-2">
            <Label>Telefone (Topo/Rodapé)</Label>
            <Input 
              value={formData.telefone || ""} 
              onChange={(e) => handleChange("telefone", e.target.value)} 
            />
          </div>
          <div className="space-y-2">
            <Label>WhatsApp (Topo/Rodapé)</Label>
            <Input 
              value={formData.whatsapp || ""} 
              onChange={(e) => handleChange("whatsapp", e.target.value)} 
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
