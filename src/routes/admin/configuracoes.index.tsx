import { createFileRoute, Link } from "@tanstack/react-router";
import { 
  Settings, 
  Globe, 
  Mail, 
  CreditCard, 
  Truck, 
  ShoppingCart, 
  Link as LinkIcon, 
  Lock, 
  User, 
  Webhook 
} from "lucide-react";

export const Route = createFileRoute("/admin/configuracoes/")({
  component: ConfiguracoesPage,
});

function ConfiguracoesPage() {
  interface ConfigItem {
    id?: string;
    titulo: string;
    descricao: string;
    subDescricao?: string;
    url?: string;
    icon: React.ReactNode;
  }

  const configs: ConfigItem[] = [
    {
      id: "dados-loja",
      titulo: "Dados da loja",
      descricao: "Veja e atualize as informações da sua loja, como título, descrição etc.",
      icon: <Settings className="h-5 w-5 text-slate-600" />
    },
    {
      id: "dominios",
      titulo: "Domínios",
      descricao: "Gerencie os domínios para sua loja virtual e checkout.",
      icon: <Globe className="h-5 w-5 text-slate-600" />
    },
    {
      titulo: "E-mails transacionais",
      descricao: "Gerencie o remetente, os status dos pedidos e as mensagens que os seus clientes receberão por e-mail.",
      icon: <Mail className="h-5 w-5 text-slate-600" />
    },
    {
      id: "pagamento",
      titulo: "Formas de pagamento",
      descricao: "Configure suas formas de pagamento e gateways",
      icon: <CreditCard className="h-5 w-5 text-slate-600" />
    },
    {
      titulo: "Logística",
      descricao: "Configure as formas de entrega e regras de frete grátis.",
      subDescricao: "Frete grátis",
      icon: <Truck className="h-5 w-5 text-slate-600" />
    },

    {
      id: "redirects",
      titulo: "Redirect 301",
      descricao: "Mapeie suas URLs antigas e defina quais são as URLs novas",
      icon: <LinkIcon className="h-5 w-5 text-slate-600" />
    },
    {
      id: "usuarios",
      url: "/admin/usuarios",
      titulo: "Usuários",
      descricao: "Gerencie os usuários, grupos e permissões",
      icon: <User className="h-5 w-5 text-slate-600" />
    }
  ];

  return (
    <div className="max-w-4xl space-y-6 pb-10">
      <div>
        <h2 className="text-[26px] font-bold text-slate-800">Configurações</h2>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 divide-y divide-slate-100">
        {configs.map((config, i) => (
          config.id ? (
            <Link key={i} to={config.url || `/admin/configuracoes/${config.id}`} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer block">
              <div className="flex-shrink-0 mt-1 h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                {config.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-0.5">{config.titulo}</h3>
                <p className="text-sm text-slate-500">{config.descricao}</p>
                {config.subDescricao && (
                  <p className="text-xs text-slate-600 mt-2 font-medium">{config.subDescricao}</p>
                )}
              </div>
            </Link>
          ) : (
            <div key={i} className="flex items-start gap-4 p-5 hover:bg-slate-50 transition-colors cursor-pointer opacity-60">
              <div className="flex-shrink-0 mt-1 h-10 w-10 rounded bg-slate-100 flex items-center justify-center">
                {config.icon}
              </div>
              <div>
                <h3 className="font-bold text-slate-800 mb-0.5">{config.titulo}</h3>
                <p className="text-sm text-slate-500">{config.descricao} (Em breve)</p>
                {config.subDescricao && (
                  <p className="text-xs text-slate-600 mt-2 font-medium">{config.subDescricao}</p>
                )}
              </div>
            </div>
          )
        ))}
      </div>
    </div>
  );
}
