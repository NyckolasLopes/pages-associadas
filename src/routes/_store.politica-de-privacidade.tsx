import { createFileRoute, Link } from "@tanstack/react-router";
import { ShieldCheck, Scale, FileText } from "lucide-react";

export const Route = createFileRoute("/_store/politica-de-privacidade")({
  head: () => ({ meta: [{ title: "Política de Privacidade — Farmácias Associadas" }] }),
  component: PoliticaPrivacidadePage,
});

function PoliticaPrivacidadePage() {
  return (
    <div className="container-fa py-12 max-w-4xl mx-auto min-h-screen">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Scale className="w-8 h-8 text-slate-700" />
        </div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">Política de Privacidade e Termos de Uso</h1>
        <p className="text-slate-600 text-lg">Documento oficial sobre o tratamento e proteção dos seus dados na plataforma.</p>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-3xl border border-slate-200 shadow-sm space-y-8 text-slate-700 text-justify leading-relaxed">
        
        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> 1. Introdução e Natureza da Plataforma
          </h2>
          <p className="mb-4">
            A presente Política de Privacidade regulamenta o tratamento de dados pessoais fornecidos pelos usuários ("Titular dos Dados") 
            no ecossistema digital da <strong>Farmácias Associadas</strong> ("Plataforma"). É de suma importância ressaltar que a Plataforma opera sob 
            uma arquitetura descentralizada de intermediação, configurando-se como uma rede de licenciados e associados independentes.
          </p>
          <p>
            Portanto, ao efetuar uma transação, o Titular reconhece que a Farmácias Associadas atua primordialmente como provedora tecnológica 
            da infraestrutura de e-commerce, sendo as respectivas farmácias locais (Lojas Associadas) as reais vendedoras e as controladoras diretas 
            da transação comercial e do fornecimento físico do produto.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> 2. Coleta e Compartilhamento Restrito de Dados
          </h2>
          <p className="mb-4">
            Em estrita observância à Lei Geral de Proteção de Dados (Lei nº 13.709/2018 - LGPD), a coleta de informações cadastrais (incluindo, 
            mas não se limitando a: Nome Completo, CPF, Endereço de Entrega e Informações de Contato) é baseada nas hipóteses legais de 
            execução de contrato (Art. 7º, V) e legítimo interesse (Art. 7º, IX).
          </p>
          <p className="font-semibold text-slate-900 bg-slate-50 p-4 rounded-xl border border-slate-100 my-4">
            Parágrafo Único: Os dados transacionais de um pedido são compartilhados única e exclusivamente com a Loja Associada específica 
            na qual o Titular optou por celebrar o contrato de compra e venda (Checkout). Não ocorre difusão cruzada de dados de clientes 
            entre farmácias concorrentes ou não relacionadas à transação originária.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. Direitos do Titular dos Dados</h2>
          <p className="mb-4">
            Fica assegurado ao Titular, a qualquer momento e mediante requisição expressa, o exercício de seus direitos previstos no Art. 18 da LGPD, compreendendo:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>A confirmação da existência de tratamento de seus dados;</li>
            <li>O acesso aos dados conservados na base da Plataforma;</li>
            <li>A correção de dados incompletos, inexatos ou desatualizados;</li>
            <li>A anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados em desconformidade;</li>
            <li>A portabilidade dos dados a outro fornecedor de serviço ou produto.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. Segurança e Retenção</h2>
          <p className="mb-4">
            A Plataforma adota medidas técnicas e administrativas aptas a proteger os dados pessoais de acessos não autorizados e de situações acidentais 
            ou ilícitas de destruição, perda, alteração, comunicação ou difusão. As senhas dos usuários são criptografadas por meio de algoritmos de 
            hash unilaterais, impossibilitando sua reversão, e armazenadas de forma segura em provedores Cloud certificados.
          </p>
          <p>
            Os dados serão retidos apenas pelo tempo necessário para o cumprimento das finalidades estipuladas, exceto nos casos onde prazos prescricionais 
            legais obriguem a retenção prolongada para prestação de contas fiscais ou defesa em processos judiciais e administrativos.
          </p>
        </section>
        
        <div className="mt-8 pt-8 border-t border-slate-200 text-sm text-slate-500 text-center">
          <p>Farmácias Associadas — Última atualização: Agosto de 2026.</p>
        </div>

      </div>
      
      <div className="mt-8 text-center">
        <Link to="/" className="text-primary font-bold hover:underline">
          &larr; Voltar para a página inicial
        </Link>
      </div>
    </div>
  );
}
