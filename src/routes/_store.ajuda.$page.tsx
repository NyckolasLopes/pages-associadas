import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { POLICIES } from "@/data/policies";
import { ChevronRight } from "lucide-react";
import { NotFound } from "@/components/storefront/NotFound";

export const Route = createFileRoute("/_store/ajuda/$page")({
  head: ({ params }) => {
    const p = POLICIES[params.page];
    if (!p) return { meta: [{ title: `Não encontrado — ${getBrandNameForHead()}` }] };
    return {
      meta: [
        { title: `${p.title} — ${getBrandNameForHead()}` },
        { name: "description", content: p.description },
        { property: "og:title", content: p.title },
        { property: "og:description", content: p.description },
      ],
    };
  },
  loader: ({ params }) => {
    const p = POLICIES[params.page];
    if (!p) throw notFound();
    return p;
  },
  component: PolicyPage,
  notFoundComponent: () => <NotFound type="page" />,
});

function PolicyPage() {
  const p = Route.useLoaderData() as any;
  if (!p) return null;
  return (
    <div className="bg-background min-h-[60vh]">
      <div className="container-fa py-8">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
          <Link to="/" className="hover:text-primary">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span>Ajuda</span>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-bold">{p.title}</span>
        </nav>

        <article className="bg-card rounded-2xl shadow-card border p-6 md:p-10 max-w-4xl mx-auto">
          <header className="border-b pb-6 mb-2">
            <h1 className="text-3xl md:text-4xl font-bold text-primary-dark">{p.title}</h1>
            <p className="mt-3 text-muted-foreground">{p.description}</p>
          </header>
          {p.content}
        </article>
      </div>
    </div>
  );
}
