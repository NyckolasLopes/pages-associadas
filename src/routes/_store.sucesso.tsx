import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdmin } from "@/stores/admin";
import { useCart } from "@/stores/cart";
import { brl } from "@/lib/format";
import { useEffect } from "react";

export const Route = createFileRoute("/_store/sucesso")({
  component: SucessoPage,
});

function SucessoPage() {
  const search = Route.useSearch() as any;
  const navigate = useNavigate();
  const allPharmacies = useAdmin((s) => s.pharmacies);
  const selectedPharmacyId = useCart((s) => s.selectedPharmacyId);
  const activeStore = allPharmacies.find((p) => p.id === selectedPharmacyId) || allPharmacies[0];

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  return (
    <div className="container-fa py-12 text-center max-w-lg mx-auto min-h-[60vh] flex flex-col justify-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <MessageCircle className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="text-3xl font-bold text-slate-800 mb-2">Pedido Recebido! 🎉</h1>
      <p className="text-slate-600 mb-8 text-lg">
        O seu pedido {search.id ? `(#${search.id})` : ""} foi gerado com sucesso.
      </p>

      <div className="bg-emerald-50 p-6 rounded-xl border border-emerald-100 mb-8">
        <p className="text-emerald-800 mb-4">
          Seu carrinho foi encaminhado para o nosso <strong>WhatsApp</strong>. Acompanhe o status por lá ou fale com a nossa equipe.
        </p>
        <Button 
          className="w-full bg-emerald-600 hover:bg-emerald-700 h-12 text-lg"
          onClick={() => {
            const phone = (activeStore?.telefone || "51999999999").replace(/\D/g, "");
            const waNumber = phone.startsWith("55") ? phone : `55${phone}`;
            window.open(`https://wa.me/${waNumber}`, "_blank");
          }}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          Ir para o WhatsApp Agora
        </Button>
      </div>

      <Link to={`/${activeStore?.slug || ''}`}>
        <Button variant="outline" className="w-full h-12">Voltar para a página inicial</Button>
      </Link>
    </div>
  );
}
