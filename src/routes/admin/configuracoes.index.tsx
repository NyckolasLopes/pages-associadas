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
  Webhook,
  Store,
  Palette
} from "lucide-react";

import { useAdmin } from "@/stores/admin";

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

  const { currentUser } = useAdmin();
  const isGlobalAdmin = currentUser?.proprietario || currentUser?.lojasVinculadas === undefined;

  let configs: ConfigItem[] = [];

  // @ts-ignore
  if (isGlobalAdmin || currentUser?.permissoes?.includes("conf_usuarios")) {
    configs.push({
      id: "usuarios",
      url: "/admin/usuarios",
      titulo: "Usuários",
      descricao: "Gerencie os usuários, grupos e permissões",
      icon: <User className="h-5 w-5 text-slate-600" />
    });
  }

  if (isGlobalAdmin) {
    configs.push({
      id: "cores-rede",
      url: "/admin/design/cores-rede",
      titulo: "Cores da Rede",
      descricao: "Defina a paleta de cores padrão da rede. Novas lojas Pleno herdam essas cores automaticamente.",
      icon: <Palette className="h-5 w-5 text-indigo-600" />
    });
  }

  if (!isGlobalAdmin) {
    configs.push({
      id: "dados-loja",
      url: "/admin/configuracoes/loja",
      titulo: "Dados da minha loja",
      descricao: "Altere textos de rodapé, informações da empresa e SEO para o Google.",
      icon: <Store className="h-5 w-5 text-slate-600" />
    });
  }

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