import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfig } from "@/stores/config";
import { toast } from "sonner";
import { MapPin, Store, HelpCircle } from "lucide-react";
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
  const { dadosLoja, setDadosLoja } = useConfig();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setDadosLoja({ [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    toast.success("Dados da loja atualizados com sucesso!");
  };

  return (
    <div className="max-w-4xl space-y-8 pb-16">
      <div>
        <h2 className="text-[26px] font-bold text-slate-800 flex items-center gap-2">
          <Store className="h-6 w-6 text-slate-500" />
          Dados da loja
        </h2>
        <p className="text-slate-500 mt-1 text-sm">
          Gerencie as informações principais que serão exibidas para seus clientes e no Google.
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Informações Gerais</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1">
                Nome da sua loja 
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400" /></TooltipTrigger>
                    <TooltipContent>Nome fantasia da sua loja</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              <Input name="nomeLoja" value={dadosLoja.nomeLoja || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold flex items-center gap-1">
                Nome da loja no &lt;title&gt;
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger><HelpCircle className="h-4 w-4 text-slate-400" /></TooltipTrigger>
                    <TooltipContent>Será mostrado na aba do seu navegador e na página do Google.</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </Label>
              {/* Keeping title input but mapping to nomeLoja for simplicity, or we can add title to the store later. I'll use nomeLoja here for now to avoid breaking. */}
              <Input name="nomeLoja" value={dadosLoja.nomeLoja || ""} onChange={handleChange} />
              <p className="text-xs text-slate-500">Será mostrado na aba do seu navegador e na página do Google.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="font-bold">Descrição da sua loja</Label>
            <Textarea 
              name="descricao" 
              value={dadosLoja.descricao || ""} 
              onChange={handleChange} 
              className="h-24"
            />
            <p className="text-xs text-slate-500">Preencha o campo com uma breve descrição sobre sua loja. Esta informação ficará disponível na página principal e para o Google.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">Razão Social</Label>
              <Input name="razaoSocial" value={dadosLoja.razaoSocial || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">CNPJ</Label>
              <Input name="cnpj" value={dadosLoja.cnpj || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Nome do responsável pela loja</Label>
              <Input name="responsavel" value={dadosLoja.responsavel || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Link para seu blog</Label>
              <Input name="blog" value={dadosLoja.blog || ""} onChange={handleChange} placeholder="https://" />
              <p className="text-xs text-slate-500">Caso possua um blog, preencha o campo para mostrar o link na sua loja.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800">Contatos</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="font-bold">E-mail de contato</Label>
              <Input name="email" type="email" value={dadosLoja.email || ""} onChange={handleChange} />
              <p className="text-xs text-slate-500">Se preenchido, ficará disponível na página de contato.</p>
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Telefone de contato</Label>
              <Input name="telefone" value={dadosLoja.telefone || ""} onChange={handleChange} />
            </div>

            <div className="space-y-2">
              <Label className="font-bold">Telefone Whatsapp</Label>
              <Input name="whatsapp" value={dadosLoja.whatsapp || ""} onChange={handleChange} />
              <p className="text-xs text-slate-500">Se preenchido, ficará disponível em sua loja.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col gap-1">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Endereço da Loja
          </h3>
          <p className="text-sm text-slate-600 mt-2">
            Este endereço será usado na impressão do pedido e no formulário de contato. No momento em que for imprimir o seu pedido o endereço cadastrado aparecerá na etiqueta do remetente. <span className="text-primary hover:underline cursor-pointer">Exemplo de etiqueta</span>
          </p>
          <p className="text-sm text-slate-600 mt-1">
            Dentro da loja o menu "Fale Conosco" conterá o endereço cadastrado e o mapa do google com a localização.
          </p>
        </div>
        
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">CEP</Label>
              <Input name="cep" value={dadosLoja.cep || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Endereço</Label>
              <Input name="endereco" value={dadosLoja.endereco || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">Número</Label>
              <Input name="numero" value={dadosLoja.numero || ""} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Complemento (opcional)</Label>
              <Input name="complemento" value={dadosLoja.complemento || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-bold">Bairro</Label>
              <Input name="bairro" value={dadosLoja.bairro || ""} onChange={handleChange} />
            </div>
            
            <div className="space-y-2 md:col-span-3">
              <Label className="font-bold">Cidade</Label>
              <Input name="cidade" value={dadosLoja.cidade || ""} onChange={handleChange} />
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label className="font-bold">Estado</Label>
              <Input name="estado" value={dadosLoja.estado || ""} onChange={handleChange} />
            </div>
          </div>

          <div className="flex items-center space-x-2 pt-2">
            <Checkbox 
              id="exibirMapa" 
              checked={dadosLoja.exibirMapa} 
              onCheckedChange={(c) => setDadosLoja({ exibirMapa: c === true })}
            />
            <Label htmlFor="exibirMapa" className="font-medium cursor-pointer">
              Exibir este endereço no mapa?
            </Label>
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button size="lg" className="font-bold px-8" onClick={handleSave}>
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
