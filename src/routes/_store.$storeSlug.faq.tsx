import { getBrandNameForHead } from "@/utils/brand";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronRight, HelpCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/_store/$storeSlug/faq")({
  head: ({ params }: any) => {
    const storeSlug = params?.storeSlug || "loja-padrao";
    const faqUrl = `https://farmaciasassociadas.com.br/${storeSlug}/faq`;
    return {
      links: [
        { rel: "canonical", href: faqUrl },
      ],
      meta: [
        { title: `Perguntas Frequentes (FAQ) — Farmácias Associadas` },
        { name: "description", content: "Tire suas dúvidas sobre compras, entrega, retirada, medicamentos controlados, pagamentos e devoluções na rede Farmácias Associadas." },
        { name: "robots", content: "index, follow, max-image-preview:large, max-snippet:-1" },
        { property: "og:title", content: "Perguntas Frequentes (FAQ) — Farmácias Associadas" },
        { property: "og:description", content: "Respostas rápidas para suas dúvidas sobre compras e tele-entrega nas Farmácias Associadas." },
        { property: "og:url", content: faqUrl },
        { property: "og:type", content: "website" },
      ],
    };
  },
  component: FAQPage,
});

type Group = { title: string; items: { q: string; a: React.ReactNode; textAnswer?: string }[] };

const GROUPS: Group[] = [
  {
    title: "1. Como Comprar e Cadastro",
    items: [
      {
        q: "Como faço para realizar um pedido no site?",
        a: <>Navegue, adicione produtos na cesta, insira seu CEP para escolher a farmácia mais próxima, selecione entrega ou retirada, escolha o pagamento e clique em <strong>"Finalizar Pedido"</strong>.</>,
        textAnswer: "Navegue, adicione produtos na cesta, insira seu CEP para escolher a farmácia mais próxima, selecione entrega ou retirada, escolha o pagamento e clique em Finalizar Pedido.",
      },
      {
        q: "Por que o site pede o meu CPF no cadastro?",
        a: <>O CPF é exigência legal e sanitária no Brasil para emissão de Notas Fiscais de medicamentos e produtos farmacêuticos. Guardamos seus dados de forma criptografada, em conformidade com a LGPD.</>,
        textAnswer: "O CPF é exigência legal e sanitária no Brasil para emissão de Notas Fiscais de medicamentos e produtos farmacêuticos. Guardamos seus dados em conformidade com a LGPD.",
      },
    ],
  },
  {
    title: "2. Entrega, Retirada e Prazos",
    items: [
      {
        q: "Quem entrega os meus produtos?",
        a: <>A pedido, separação e logística são realizadas <strong>exclusivamente pela farmácia parceira</strong> escolhida. O motoboy pertence à equipe daquela loja.</>,
        textAnswer: "A separação e logística são realizadas exclusivamente pela farmácia parceira escolhida da rede Farmácias Associadas.",
      },
      {
        q: "Qual é o prazo de entrega do meu pedido?",
        a: <>Estimativa calculada automaticamente com base na distância entre seu endereço e a farmácia. A contagem começa após confirmação do pagamento e validação do estoque.</>,
        textAnswer: "A estimativa é calculada com base na distância entre seu endereço e a farmácia associada mais próxima.",
      },
      {
        q: 'Como funciona a modalidade "Retirada em Loja"?',
        a: <>Compre pelo site e busque no balcão da farmácia, sem frete. <strong>Dirija-se à loja apenas após receber a notificação "Pronto para Retirada"</strong>.</>,
        textAnswer: "Compre pelo site e busque no balcão da farmácia sem custos de frete após a confirmação.",
      },
    ],
  },
  {
    title: "3. Regras para Medicamentos",
    items: [
      {
        q: "Posso comprar medicamentos controlados (tarja preta/antibióticos) para entrega em casa?",
        a: <><strong>Não.</strong> Por determinação da ANVISA, medicamentos que exigem retenção da receita não podem ser entregues em domicílio. O site bloqueia a entrega — você deve escolher <strong>"Retirada em Loja"</strong> e apresentar a receita física original.</>,
        textAnswer: "Não. Por determinação da ANVISA, medicamentos controlados com retenção de receita exigem retirada presencial na loja física com apresentação da receita médica original.",
      },
      {
        q: "Posso pedir medicamentos termolábeis por motoboy?",
        a: <><strong>Não.</strong> Produtos que precisam de refrigeração constante (cadeia de frio) são restritos à retirada em loja, garantindo que a eficácia não seja comprometida.</>,
        textAnswer: "Produtos termolábeis que exigem refrigeração contínua são restritos para retirada presencial na loja.",
      },
    ],
  },
  {
    title: "4. Pagamentos, Preços e Estorno",
    items: [
      {
        q: "Quais as formas de pagamento aceitas?",
        a: <>Online: <strong>Pix</strong> ou <strong>Cartão de Crédito</strong>. Presencial: dinheiro, maquininha de cartão, Pix ou convênios da loja escolhida.</>,
        textAnswer: "Aceitamos Pix e Cartão de Crédito online, além de dinheiro, cartões e convênios na retirada/entrega presencial.",
      },
      {
        q: "Quem emite a Nota Fiscal do meu pedido?",
        a: <>A NF é emitida unicamente pelo CNPJ da farmácia física que separou o pedido. Você recebe o documento junto com seus produtos.</>,
        textAnswer: "A Nota Fiscal é emitida pelo CNPJ da farmácia física da rede que processou o seu pedido.",
      },
    ],
  },
];

function FAQPage() {
  const { storeSlug } = Route.useParams();
  const effectiveStoreSlug = storeSlug || "loja-padrao";

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `https://farmaciasassociadas.com.br/${effectiveStoreSlug}/faq#faq`,
    "mainEntity": GROUPS.flatMap((g) =>
      g.items.map((it) => ({
        "@type": "Question",
        "name": it.q,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": it.textAnswer || it.q
        }
      }))
    )
  };

  return (
    <div className="bg-background min-h-[60vh]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <div className="container-fa py-8">
        <nav className="text-xs text-muted-foreground flex items-center gap-1 mb-4">
          <Link to="/" className="hover:text-primary">Início</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-foreground font-bold">Perguntas Frequentes</span>
        </nav>

        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-8">
            <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-primary text-primary-foreground mb-3">
              <HelpCircle className="h-7 w-7" />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-primary-dark">Perguntas Frequentes</h1>
            <p className="mt-3 text-muted-foreground">Encontre respostas rápidas para as dúvidas mais comuns sobre nosso site.</p>
          </header>

          {GROUPS.map((g) => (
            <section key={g.title} className="bg-card rounded-2xl shadow-card border p-4 md:p-6 mb-4">
              <h2 className="text-lg font-bold text-primary-dark mb-2">{g.title}</h2>
              <Accordion type="single" collapsible className="w-full">
                {g.items.map((it, i) => (
                  <AccordionItem key={i} value={`${g.title}-${i}`}>
                    <AccordionTrigger className="text-left font-bold">{it.q}</AccordionTrigger>
                    <AccordionContent className="text-[15px] text-foreground/85 leading-relaxed">
                      {it.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          ))}

          <div className="text-center mt-8 text-sm text-muted-foreground">
            Ainda precisa de ajuda? Envie um e-mail para{" "}
            <a href="mailto:faleconosco@farmaciasassociadas.com.br" className="text-primary-dark font-bold underline">
              faleconosco@farmaciasassociadas.com.br
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
