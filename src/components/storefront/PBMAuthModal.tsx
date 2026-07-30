import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PBM_PROVIDERS, type PBMProvider } from "@/lib/pbm";
import { useCart } from "@/stores/cart";
import { toast } from "sonner";
import { CheckCircle2, Tag } from "lucide-react";

export function PBMAuthModal({ trigger }: { trigger: React.ReactNode }) {
  const pbm = useCart((s) => s.pbm);
  const connect = useCart((s) => s.connectPbm);
  const disconnect = useCart((s) => s.disconnectPbm);
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<PBMProvider>("epharma");
  const [cpf, setCpf] = useState("");
  const [card, setCard] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5 text-accent" />
            Desconto por convênio (PBM)
          </DialogTitle>
        </DialogHeader>

        {pbm ? (
          <div className="space-y-4">
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-accent shrink-0 mt-0.5" />
              <div className="text-sm">
                <div className="font-bold">Convênio conectado</div>
                <div className="text-muted-foreground">
                  {PBM_PROVIDERS.find((p) => p.id === pbm.provider)?.label} •
                  CPF {pbm.cpf}
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                disconnect();
                toast.success("Convênio desconectado");
                setOpen(false);
              }}
            >
              Desconectar
            </Button>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              connect({ provider, cpf, card });
              toast.success("Convênio conectado! Descontos aplicados ao carrinho.");
              setOpen(false);
            }}
            className="space-y-4"
          >
            <div className="grid gap-2">
              <Label>Convênio</Label>
              <div className="grid gap-2">
                {PBM_PROVIDERS.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`text-left border-2 rounded-xl p-4 transition-all duration-200 flex items-center gap-4 ${
                      provider === p.id
                        ? "border-accent bg-accent/5 shadow-sm"
                        : "border-muted/40 hover:border-accent/40 hover:bg-muted/10"
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                      provider === p.id ? "border-accent" : "border-muted-foreground/30"
                    }`}>
                      {provider === p.id && <div className="w-2.5 h-2.5 rounded-full bg-accent" />}
                    </div>
                    <div className="flex-1">
                      <div className={`font-bold text-sm transition-colors ${provider === p.id ? "text-accent" : ""}`}>{p.label}</div>
                      <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{p.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>CPF</Label>
              <Input
                value={cpf}
                onChange={(e) => setCpf(e.target.value)}
                placeholder="000.000.000-00"
                required
              />
            </div>
            <div>
              <Label>Cartão do convênio</Label>
              <Input
                value={card}
                onChange={(e) => setCard(e.target.value)}
                placeholder="Número impresso no cartão"
                required
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
              Aplicar desconto
            </Button>
            <p className="text-[10px] text-muted-foreground text-center">
              Mock — nenhuma credencial é enviada a servidor.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
