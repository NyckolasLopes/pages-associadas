import { useEffect, useState } from "react";
import { Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";

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
    <div className="fixed inset-x-0 bottom-[4.5rem] md:bottom-0 z-[60] bg-background border-t shadow-elevated">
      <div className="container-fa py-4 flex flex-col md:flex-row md:items-center gap-3">
        <Cookie className="h-6 w-6 text-primary shrink-0" />
        <p className="text-xs md:text-sm flex-1 text-muted-foreground leading-relaxed">
          Usamos cookies para melhorar sua experiência, personalizar conteúdo e
          analisar o tráfego. Ao continuar navegando, você concorda com nossa{" "}
          <Link to="/ajuda/$page" params={{ page: "privacidade" }} className="underline text-primary-dark font-bold">
            Política de Privacidade
          </Link>
          .
        </p>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" onClick={() => accept("essential")}>
            Apenas essenciais
          </Button>
          <Button size="sm" onClick={() => accept("all")}>
            Aceitar todos
          </Button>
        </div>
      </div>
    </div>
  );
}
