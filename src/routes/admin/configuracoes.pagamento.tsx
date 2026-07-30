import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CreditCard, ExternalLink, Info, CheckCircle2, DollarSign, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { useConfig } from "@/stores/config";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/admin/configuracoes/pagamento")({
  component: PagamentoPage,
});

function PagamentoPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { paymentAsaas, setPaymentAsaas } = useConfig();
  
  // Local state for modal editing
  const [formData, setFormData] = useState({ ...paymentAsaas });

  const handleConfig = () => {
    setFormData({ ...paymentAsaas });
    setModalOpen(true);
  };

  const handleSaveConfig = () => {
    setPaymentAsaas(formData);
    toast.success("Configuração de pagamento salva com sucesso!");
    setModalOpen(false);
  };

  const isInstalled = paymentAsaas.cartaoAtivo || paymentAsaas.pixAtivo;

  return (
    <div className="max-w-[1400px] w-full mx-auto space-y-8 pb-16 pt-4">
      <div>
        <h2 className="text-[22px] font-bold text-[#1a1a1a]">Formas de pagamento</h2>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Configure as integrações e gateways para receber pagamentos na sua loja.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Asaas Card */}
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm flex flex-col relative overflow-hidden transition-shadow hover:shadow-md h-full">
          {isInstalled && (
            <div className="absolute top-4 right-4 z-10 flex items-center gap-1 bg-slate-700 text-white text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Ativo
            </div>
          )}
          
          <div className="px-6 pt-6 flex-none">
            <div className="h-14 flex items-center justify-start">
              <div className="flex items-center justify-center bg-blue-50 w-12 h-12 rounded-lg">
                <DollarSign className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="px-6 pb-6 pt-2 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-lg text-slate-800 leading-tight pr-4">Asaas</h3>
            </div>
            
            <p className="text-slate-500 text-sm leading-relaxed mb-6 flex-1 line-clamp-4">
              Receba pagamentos por cartão de crédito, boleto e Pix com taxas competitivas e liberação rápida usando a integração nativa Asaas.
            </p>

            <div className="flex items-center gap-3 mt-auto pt-2">
              <Button 
                className="flex-1 font-bold shadow-sm"
                onClick={handleConfig}
                variant={isInstalled ? "outline" : "default"}
              >
                {isInstalled ? "Configurar" : "Instalar"}
              </Button>
              
              <Button variant="outline" size="icon" className="shrink-0 rounded shadow-sm w-10 h-10 border-slate-200">
                <ExternalLink className="w-4 h-4 text-slate-500" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Configuração Asaas</DialogTitle>
            <DialogDescription>
              Ajuste as regras de pagamento para cartão e Pix.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-8 py-4">
            
            {/* INSTALAÇÃO */}
            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-lg border-b pb-2">Instalação</h4>
              
              <div className="space-y-2">
                <Label className="font-bold">Ambiente</Label>
                <Select value={formData.ambiente} onValueChange={(v) => setFormData({ ...formData, ambiente: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Produção">Produção</SelectItem>
                    <SelectItem value="Teste">Teste</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="font-bold">Token</Label>
                <Input 
                  type="password"
                  value={formData.token}
                  onChange={(e) => setFormData({ ...formData, token: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label className="font-bold">URL de Webhook <span className="font-normal text-slate-400">(opcional)</span></Label>
                <div className="flex items-center gap-2">
                  <Input 
                    readOnly
                    className="bg-slate-50 text-slate-500 font-mono text-xs"
                    value={formData.webhookUrl}
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="icon" 
                    className="shrink-0"
                    onClick={() => {
                      navigator.clipboard.writeText(formData.webhookUrl);
                      toast.success("URL copiada!");
                    }}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Copie esse link nas configurações de webhooks em seu painel da Asaas
                  <br />
                  <a href="#" className="text-primary hover:underline font-medium">Veja o artigo</a>
                </div>
              </div>
            </div>

            {/* CARTÃO DE CRÉDITO */}
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-lg border-b pb-2">Pagamento com Cartão</h4>
              
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="font-bold text-base">Pagamento com cartão ativo?</Label>
                  <p className="text-xs text-muted-foreground">Habilitar checkout transparente via cartão.</p>
                </div>
                <Switch 
                  checked={formData.cartaoAtivo}
                  onCheckedChange={(c) => setFormData({ ...formData, cartaoAtivo: c })}
                />
              </div>

              {formData.cartaoAtivo && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Valor mínimo (caso não tenha deixe R$0.00)</Label>
                    <Input 
                      placeholder="0.00" 
                      value={formData.valorMinimoCartao}
                      onChange={(e) => setFormData({ ...formData, valorMinimoCartao: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Informe o valor mínimo para exibir esta forma de pagamento.</p>
                  </div>

                  <div className="bg-sky-50 text-sky-800 p-3 rounded-lg border border-sky-100 flex gap-2">
                    <Info className="w-4 h-4 shrink-0 mt-0.5" />
                    <span className="text-sm">O valor mínimo de parcela aceito pelo Asaas é de <strong>R$5,00</strong></span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="font-bold">Máximo de parcelas</Label>
                      <Select value={formData.maxParcelas} onValueChange={(v) => setFormData({ ...formData, maxParcelas: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                            <SelectItem key={num} value={num.toString()}>Até {num}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Quantidade máxima de parcelas.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="font-bold">Parcelas sem juros</Label>
                      <Select value={formData.parcelasSemJuros} onValueChange={(v) => setFormData({ ...formData, parcelasSemJuros: v })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                            <SelectItem key={num} value={num.toString()}>Até {num}x</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="font-bold">Tempo de Disponibilidade de Saldo para a Loja</Label>
                    <Select value={formData.tempoDisponibilidade} onValueChange={(v) => setFormData({ ...formData, tempoDisponibilidade: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="D+15">D+15</SelectItem>
                        <SelectItem value="D+30">D+30</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
            </div>

            {/* PIX */}
            <div className="space-y-6">
              <h4 className="font-bold text-slate-800 text-lg border-b pb-2">Configuração de Pix</h4>
              
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-lg border">
                <div className="space-y-0.5">
                  <Label className="font-bold text-base">Pix ativo?</Label>
                  <p className="text-xs text-muted-foreground">Habilitar pagamento instantâneo via Pix.</p>
                </div>
                <Switch 
                  checked={formData.pixAtivo}
                  onCheckedChange={(c) => setFormData({ ...formData, pixAtivo: c })}
                />
              </div>

              {formData.pixAtivo && (
                <div className="space-y-4 pt-2">
                  <div className="space-y-2">
                    <Label className="font-bold">Valor mínimo</Label>
                    <Input 
                      placeholder="0.00" 
                      value={formData.valorMinimoPix}
                      onChange={(e) => setFormData({ ...formData, valorMinimoPix: e.target.value })}
                    />
                    <p className="text-xs text-muted-foreground">Informe o valor mínimo para exibir forma de pagamento via Pix.</p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="font-bold">USAR DESCONTO NO PIX</Label>
                      <p className="text-xs text-muted-foreground">Marque esse campo caso você queira aplicar o desconto no pagamento via Pix.</p>
                    </div>
                    <Switch 
                      checked={formData.usarDescontoPix}
                      onCheckedChange={(c) => setFormData({ ...formData, usarDescontoPix: c })}
                    />
                  </div>

                  {formData.usarDescontoPix && (
                    <div className="space-y-4 pl-4 border-l-2 border-slate-100 py-2">
                      <div className="space-y-2">
                        <Label className="font-bold">Desconto percentual aplicado (%)</Label>
                        <Input 
                          placeholder="Ex: 5" 
                          value={formData.descontoPix}
                          onChange={(e) => setFormData({ ...formData, descontoPix: e.target.value })}
                        />
                      </div>

                      <div className="flex items-start space-x-2 pt-2">
                        <Checkbox 
                          id="aplicarTotal" 
                          checked={formData.aplicarDescontoTotalPix}
                          onCheckedChange={(c) => setFormData({ ...formData, aplicarDescontoTotalPix: c === true })}
                        />
                        <div className="grid leading-none">
                          <Label htmlFor="aplicarTotal" className="font-bold cursor-pointer">
                            APLICAR TOTAL O DESCONTO?
                          </Label>
                          <p className="text-xs text-muted-foreground mt-1">
                            Aplicar desconto no total da compra (incluir por exemplo o frete).
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <Label className="font-bold">Tempo de expiração do pix</Label>
                    <Select value={formData.expiracaoPix} onValueChange={(v) => setFormData({ ...formData, expiracaoPix: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="30 min">30 min</SelectItem>
                        <SelectItem value="1 hora">1 hora</SelectItem>
                        <SelectItem value="2 horas">2 horas</SelectItem>
                        <SelectItem value="5 horas">5 horas</SelectItem>
                        <SelectItem value="12 horas">12 horas</SelectItem>
                        <SelectItem value="24 horas">24 horas</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">Prazo que o cliente vai ter para realizar o pagamento antes que o código expire.</p>
                  </div>
                </div>
              )}
            </div>

          </div>

          <div className="flex justify-end gap-2 pt-4 border-t mt-2">
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button onClick={handleSaveConfig} className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
              Salvar Alterações
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
