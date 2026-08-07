import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfig } from "@/stores/config";
import { useAdmin } from "@/stores/admin";
import { toast } from "sonner";
import { MapPin, Store, HelpCircle, Save, Globe } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export const Route = createFileRoute("/admin/configuracoes/dados-loja")({
  component: DadosLojaPage,
});

function DadosLojaPage() {
  const { dadosLoja: globalDados, setDadosLoja: setGlobalDados } = useConfig();
  const { activeStoreId, pharmacies, updatePharmacy } = useAdmin();
  
  const [formData, setFormData] = useState<any>({});
  
  // Decide if we are editing a specific store or the global network
  const isLocalStore = !!activeStoreId;
  const currentPharmacy = isLocalStore ? pharmacies.find(p => p.id === activeStoreId) : null;

  useEffect(() => {
    if (isLocalStore && currentPharmacy) {
      setFormData({
        nomeLoja: currentPharmacy.nome || "",
        descricao: currentPharmacy.descricaoSeo || "",
        razaoSocial: currentPharmacy.razaoSocial || "",
        cnpj: currentPharmacy.cnpj || "",
        responsavel: currentPharmacy.respTecnico || "",
        blog: "",
        email: currentPharmacy.email || "",
        telefone: currentPharmacy.telefone || "",
        whatsapp: currentPharmacy.whatsapp || "",
        cep: currentPharmacy.cep || "",
        endereco: currentPharmacy.endereco || "",
        numero: currentPharmacy.numero || "",
        complemento: currentPharmacy.complemento || "",
        bairro: currentPharmacy.bairro || "",
        cidade: currentPharmacy.cidade || "",
        estado: currentPharmacy.uf || "",
        exibirMapa: true,
        seoTitle: currentPharmacy.seoTitle || "",
        googleMyBusinessUrl: currentPharmacy.googleMyBusinessUrl || ""
      });
    } else {
      setFormData({ ...globalDados });
    }
  }, [isLocalStore, currentPharmacy, globalDados]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev: any) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSave = () => {
    if (isLocalStore && currentPharmacy) {
      updatePharmacy(currentPharmacy.id, {
        ...currentPharmacy,
        nome: formData.nomeLoja,
        descricaoSeo: formData.descricao,
        razaoSocial: formData.razaoSocial,
        cnpj: formData.cnpj,
        respTecnico: formData.responsavel,
        email: formData.email,
        telefone: formData.telefone,
        whatsapp: formData.whatsapp,
        cep: formData.cep,
        endereco: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        uf: formData.estado,
        seoTitle: formData.seoTitle,
        googleMyBusinessUrl: formData.googleMyBusinessUrl
      });
      toast.success("Dados da loja atualizados com sucesso!");
    } else {
      setGlobalDados(formData);
      toast.success("Dados globais atualizados com sucesso!");
    }
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-[26px] font-bold text-slate-800 flex items-center gap-2">
            <Store className="h-6 w-6 text-slate-500" />
            Dados da loja {isLocalStore ? `(${currentPharmacy?.nome})` : "(Geral)"}
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Gerencie as informações principais que serão exibidas para seus clientes e no Google para otimizar SEO Local.
          </p>
        </div>
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700">
          <Save className="w-4 h-4 mr-2" /> Salvar Configurações
        </Button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center gap-2">
          <Globe className="h-5 w-5 text-indigo-500" />
          <h3 className="text-lg font-bold text-slate-800">Local SEO & Presença Digital</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100 mb-4">
            <p className="text-sm text-indigo-800">
              <strong>Importante para o Google:</strong> Preencher corretamente essas informações ajuda sua loja a aparecer nos resultados de buscas locais por região (ex: "Farmácia perto de mim" ou "Medicamentos em {formData.cidade || 'sua cidade'}"). Mantenha os dados sempre atualizados e consistentes com o Google Meu Negócio.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1">
                Nome da Loja (Title SEO)
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400" /></TooltipTrigger>
                    <TooltipContent>Nome que aparecerá na aba do navegador e no título do Google.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input name="seoTitle" value={formData.seoTitle || formData.nomeLoja || ""} onChange={handleChange} placeholder="Ex: Farmácia Principal - Centro" />
              <p className="text-xs text-slate-500">Recomendado: Nome Fantasia + Bairro ou Cidade.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Link Google Meu Negócio</Label>
              <Input name="googleMyBusinessUrl" value={formData.googleMyBusinessUrl || ""} onChange={handleChange} placeholder="https://g.page/..." />
              <p className="text-xs text-slate-500">Ajuda clientes a abrirem a rota diretamente no mapa.</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label className="font-bold">Descrição (Meta Description)</Label>
            <Textarea 
              name="descricao" 
              value={formData.descricao || ""} 
              onChange={handleChange} 
              className="h-24"
              placeholder="Descreva sua loja, especialidades, e região atendida."
            />
            <p className="text-xs text-slate-500">Aparecerá abaixo do título nos resultados do Google. Limite recomendado: 160 caracteres.</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Informações Cadastrais</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">Razão Social</Label>
              <Input name="razaoSocial" value={formData.razaoSocial || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">CNPJ</Label>
              <Input name="cnpj" value={formData.cnpj || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Responsável / Farmacêutico</Label>
              <Input name="responsavel" value={formData.responsavel || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Nome Fantasia (Interno)</Label>
              <Input name="nomeLoja" value={formData.nomeLoja || ""} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Contatos (Telefone e E-mail)</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">E-mail Comercial</Label>
              <Input name="email" type="email" value={formData.email || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Telefone Principal</Label>
              <Input name="telefone" value={formData.telefone || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">WhatsApp</Label>
              <Input name="whatsapp" value={formData.whatsapp || ""} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço Físico
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Endereço utilizado para retiradas em loja e exibição no mapa. Este endereço sinaliza ao Google a sua localidade exata para entregas locais.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">CEP</Label>
              <Input name="cep" value={formData.cep || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Logradouro / Endereço</Label>
              <Input name="endereco" value={formData.endereco || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">Número</Label>
              <Input name="numero" value={formData.numero || ""} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Complemento</Label>
              <Input name="complemento" value={formData.complemento || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Bairro</Label>
              <Input name="bairro" value={formData.bairro || ""} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <Label className="font-bold">Cidade</Label>
              <Input name="cidade" value={formData.cidade || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">Estado (UF)</Label>
              <Input name="estado" value={formData.estado || ""} onChange={handleChange} />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button onClick={handleSave} className="bg-emerald-600 hover:bg-emerald-700 h-12 px-8 text-base">
          <Save className="w-5 h-5 mr-2" /> Salvar Configurações
        </Button>
      </div>
    </div>
  );
}
