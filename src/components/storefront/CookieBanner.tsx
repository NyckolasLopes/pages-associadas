import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const KEY = "fa-cookie-consent-v1";

export function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(KEY)) setShow(true);
    } catch {}
  }, []);

  const accept = (level: "all" | "essential") => {
    try {
      localStorage.setItem(KEY, level);
    } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <Dialog open={show} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-[425px]" hideClose>
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <Cookie className="h-6 w-6 text-primary shrink-0" />
            <DialogTitle>Aviso de Cookies</DialogTitle>
          </div>
          <DialogDescription className="text-sm text-slate-600 leading-relaxed text-left">
            Usamos cookies para melhorar sua experiência, personalizar conteúdo e
            analisar o tráfego. Ao continuar navegando, você concorda com nossa{" "}
            <Link to="/ajuda/$page" params={{ page: "privacidade" }} className="underline text-primary-dark font-bold">
              Política de Privacidade
            </Link>.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col sm:flex-row gap-2 mt-4 pt-4 border-t">
          <Button variant="outline" className="flex-1" onClick={() => accept("essential")}>
            Apenas essenciais
          </Button>
          <Button className="flex-1" onClick={() => accept("all")}>
            Aceitar todos
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
