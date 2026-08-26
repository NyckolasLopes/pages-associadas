import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, Map } from "lucide-react";
import categoriesData from "@/data/categories.json";
import type { Categoria } from "@/types";

const ROOT_CATS = (categoriesData as Categoria[]).filter((c) => !c.parentId);

export const Route = createFileRoute("/_store/mapa-site")({
  head: () => ({
    meta: [
      { title: "Mapa do Site — Farmácias Associadas" },
      { name: "description", content: "Navegue por todas as páginas e seções do site das Farmácias Associadas." },
      { property: "og:title", content: "Mapa do Site" },
      { property: "og:description", content: "Visão hierárquica de todas as rotas do site." },
    ],
  }),
  component: SiteMap,
});

function SiteMap() {
  return (
    <div className="bg-background min-h-[60vh]">
      <div className="container-fa py-8">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
          <Link to="/" className="hover:text-primary">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-bold">Mapa do Site</span>
        </nav>

        <div className="max-w-5xl mx-auto bg-card rounded-2xl shadow-card border p-6 md:p-10">
          <header className="border-b pb-6 mb-6 flex items-center gap-3">
            <Map className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold text-primary-dark">Mapa do Site</h1>
              <p className="text-sm text-muted-foreground mt-1">Todas as páginas e categorias do nosso site.</p>
            </div>
          </header>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Column title="Navegação Principal">
              <Row><Link to="/" className="hover:text-primary">→ Início</Link></Row>
              <Row><Link to="/busca" className="hover:text-primary">→ Buscar produtos</Link></Row>
              <Row><Link to="/$storeSlug/cart" params={{ storeSlug: "loja-padrao" }} className="hover:text-primary">→ Cesta</Link></Row>
              <Row><Link to="/checkout" className="hover:text-primary">→ Checkout</Link></Row>
              <Row><Link to="/login" className="hover:text-primary">→ Entrar / Cadastrar</Link></Row>
            </Column>

            <Column title="Categorias">
              {ROOT_CATS.map((c) => (
                <Link
                  key={c.id}
                  to="/c/$slug"
                  params={{ slug: c.slug }}
                  className="block text-sm hover:text-primary py-1"
                >
                  → {c.nome}
                </Link>
              ))}
            </Column>

            <Column title="Atendimento">
              <Row><Link to="/ajuda/$page" params={{ page: "como-comprar" }} className="hover:text-primary">→ Como Comprar</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "formas-pagamento" }} className="hover:text-primary">→ Formas de Pagamento</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "prazo-entrega" }} className="hover:text-primary">→ Prazo de Entrega e Retirada</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "cancelamento" }} className="hover:text-primary">→ Cancelamento e Reembolso</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "devolucao" }} className="hover:text-primary">→ Devolução e Trocas</Link></Row>
              <Row><Link to="/faq" className="hover:text-primary">→ Perguntas Frequentes (FAQ)</Link></Row>
            </Column>

            <Column title="Segurança e Privacidade">
              <Row><Link to="/ajuda/$page" params={{ page: "protecao-dados" }} className="hover:text-primary">→ Como Protegemos Seus Dados</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "privacidade" }} className="hover:text-primary">→ Política de Privacidade</Link></Row>
              <Row><Link to="/ajuda/$page" params={{ page: "termos-de-uso" }} className="hover:text-primary">→ Termos e Condições de Uso</Link></Row>
            </Column>

            <Column title="Institucional">
              <span className="block text-sm text-muted-foreground py-1">Quem Somos</span>
              <span className="block text-sm text-muted-foreground py-1">Nossas Lojas</span>
              <span className="block text-sm text-muted-foreground py-1">Sustentabilidade</span>
              <span className="block text-sm text-muted-foreground py-1">Trabalhe Conosco</span>
              <span className="block text-sm text-muted-foreground py-1">Blog "Saúde em Pauta"</span>
            </Column>

            <Column title="Serviços de Saúde">
              <span className="block text-sm text-muted-foreground py-1">Vacinas</span>
              <span className="block text-sm text-muted-foreground py-1">Testes Rápidos</span>
              <span className="block text-sm text-muted-foreground py-1">Atendimento Farmacêutico</span>
              <span className="block text-sm text-muted-foreground py-1">Aferição de Pressão</span>
            </Column>
          </div>
        </div>
      </div>
    </div>
  );
}

function Column({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-bold text-primary-dark mb-3 uppercase text-xs tracking-wider">{title}</h2>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="text-sm py-1">{children}</div>;
}
