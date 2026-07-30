import type { ReactNode } from "react";

export type Policy = {
  slug: string;
  title: string;
  description: string;
  content: ReactNode;
};

const Section = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="mt-8">
    <h2 className="text-xl font-bold text-primary-dark mb-3">{title}</h2>
    <div className="space-y-3 text-[15px] leading-relaxed text-foreground/85">{children}</div>
  </section>
);

const Lead = ({ children }: { children: ReactNode }) => (
  <p className="text-[15px] leading-relaxed text-foreground/85">{children}</p>
);

const Bullets = ({ items }: { items: ReactNode[] }) => (
  <ul className="list-disc pl-5 space-y-2">
    {items.map((it, i) => (
      <li key={i}>{it}</li>
    ))}
  </ul>
);

export const POLICIES: Record<string, Policy> = {
  "prazo-entrega": {
    slug: "prazo-entrega",
    title: "Prazo de Entrega e Retirada",
    description: "Como calculamos prazos de tele-entrega, retirada em loja (Clique e Retire) e regras para medicamentos controlados.",
    content: (
      <>
        <Lead>
          A <strong>Farmácias Associadas</strong> (CNPJ 87.132.809/0001-55) estabelece as regras de prazos de entrega e retirada
          de pedidos realizados neste site. A infraestrutura logística e tecnológica é fornecida pela <strong>GAM Distribuidora</strong>{" "}
          (CNPJ 82.873.068/0001-40); a execução e o cumprimento dos prazos são de responsabilidade exclusiva da Farmácia Parceira selecionada.
        </Lead>

        <Section title="1. Prazos de Entrega em Domicílio (Tele-Entrega)">
          <Bullets
            items={[
              <><strong>Cálculo automático:</strong> o tempo estimado é exibido no carrinho antes da finalização, baseado na distância entre a farmácia parceira e o CEP de destino.</>,
              <><strong>Início da contagem:</strong> começa após a confirmação do pagamento pelo gateway (Pagar.me) e validação do estoque pela farmácia.</>,
              <><strong>Fatores de atraso:</strong> condições climáticas, trânsito, alta demanda sazonal ou restrições de horário do estabelecimento.</>,
            ]}
          />
        </Section>

        <Section title="2. Retirada em Loja (Clique e Retire)">
          <Bullets
            items={[
              <><strong>Tempo de separação:</strong> informado no checkout (em horas úteis).</>,
              <><strong>Aviso de liberação:</strong> dirija-se à loja somente após o status mudar para <em>"Pronto para Retirada"</em>.</>,
              <><strong>Prazo limite:</strong> 7 dias corridos após a liberação. Pedidos não retirados podem ser cancelados.</>,
            ]}
          />
        </Section>

        <Section title="3. Horários de Atendimento">
          <Lead>
            Os prazos seguem o horário comercial da farmácia selecionada. Pedidos fora desse horário, em domingos ou feriados, têm a separação iniciada no
            primeiro horário útil seguinte daquela unidade.
          </Lead>
        </Section>

        <Section title="4. Medicamentos Controlados e Termolábeis (RDC 44/2009)">
          <Bullets
            items={[
              <><strong>Retenção de receita:</strong> não possuem entrega domiciliar — somente retirada em loja, mediante receita física original.</>,
              <><strong>Cadeia de frio (termolábeis):</strong> retirada presencial obrigatória para garantir a refrigeração.</>,
            ]}
          />
        </Section>

        <Section title="5. Suporte Logístico">
          <Lead>
            Em caso de atrasos ou problemas na retirada, acione a Central de Atendimento. A Administradora da Plataforma intervirá junto à farmácia parceira para
            solucionar o incidente.
          </Lead>
        </Section>
      </>
    ),
  },

  "termos-de-uso": {
    slug: "termos-de-uso",
    title: "Termos e Condições de Uso",
    description: "Termos da plataforma digital de intermediação entre o usuário e as farmácias associadas.",
    content: (
      <>
        <Lead>
          Ao acessar, cadastrar-se ou realizar um pedido neste site, o <strong>USUÁRIO</strong> declara estar ciente e concorda integralmente com os
          termos abaixo e suas atualizações futuras.
        </Lead>

        <Section title="1. Natureza do Serviço e Intermediação Tecnológica">
          <Bullets
            items={[
              <><strong>Administradora:</strong> a Associação gerencia a vitrine digital, campanhas, suporte e a marca — não vende produtos diretamente.</>,
              <><strong>Infraestrutura tecnológica (SaaS):</strong> fornecida pela GAM Distribuidora (CNPJ 82.873.068/0001-40), que opera como provedora técnica.</>,
              <><strong>Farmácia parceira:</strong> a transação comercial, estoque e responsabilidade sanitária são exclusivos do estabelecimento selecionado.</>,
            ]}
          />
        </Section>

        <Section title="2. Faturamento e Emissão de Nota Fiscal">
          <Lead>
            A Nota Fiscal é emitida exclusivamente pelo CNPJ da farmácia física responsável pelo pedido e entregue junto com os produtos (ou no balcão, em
            caso de retirada).
          </Lead>
        </Section>

        <Section title="3. Responsabilidade Sanitária (ANVISA)">
          <Bullets
            items={[
              <>O conteúdo é informativo — não utilize para automedicação. Consulte um médico ao persistirem os sintomas.</>,
              <>Em cumprimento à RDC 44/2009, os dados regulatórios da farmácia responsável constarão no checkout e na NF.</>,
              <>Medicamentos sujeitos à retenção de receita e itens termolábeis <strong>não são entregues em domicílio</strong> — apenas retirada em loja.</>,
            ]}
          />
        </Section>

        <Section title="4. Pagamentos, Cancelamentos e Estoque">
          <Bullets
            items={[
              <>Pagamentos online via gateway Pagar.me, liquidados diretamente na conta da farmácia parceira.</>,
              <>Estornos e reembolsos são executados pela farmácia emitente. A Administradora atua na mediação.</>,
              <>Pedidos sujeitos à confirmação de estoque físico após finalização.</>,
            ]}
          />
        </Section>

        <Section title="5. Dados Pessoais (LGPD)">
          <Lead>
            O usuário é responsável pelo sigilo das credenciais. Em conformidade com a Lei nº 13.709/2018, o usuário autoriza o compartilhamento dos dados cadastrais
            com a farmácia parceira e a operadora tecnológica (GAM Distribuidora) para emissão de NF, segurança dos servidores e logística.
          </Lead>
        </Section>

        <Section title="6. Foro">
          <Lead>
            As partes elegem o foro da comarca da sede da Administradora da Plataforma para dirimir quaisquer questões decorrentes destes termos.
          </Lead>
        </Section>
      </>
    ),
  },

  "cancelamento": {
    slug: "cancelamento",
    title: "Cancelamento e Reembolso",
    description: "Como cancelar pedidos, prazos legais (Art. 49 CDC) e reembolsos via Pagar.me.",
    content: (
      <>
        <Lead>
          O processamento dos reembolsos é de responsabilidade exclusiva da <strong>Farmácia Parceira</strong> que emitiu a Nota Fiscal do seu pedido,
          através do gateway Pagar.me.
        </Lead>

        <Section title="1. Cancelamento antes do envio">
          <Lead>Acesse a área do cliente ou a Central de Atendimento. Notificaremos a farmácia para interromper o fluxo e autorizar o estorno integral.</Lead>
        </Section>

        <Section title="2. Arrependimento (Art. 49 CDC) — 7 dias">
          <Bullets
            items={[
              <>Perfumaria, cosméticos e higiene: devolvidos lacrados, sem uso, na embalagem original.</>,
              <><strong>Restrição ANVISA:</strong> medicamentos não podem ser cancelados por arrependimento após saírem da farmácia. Devolução só em caso de defeito de fabricação.</>,
            ]}
          />
        </Section>

        <Section title="3. Cancelamento por falta de estoque">
          <Lead>A farmácia parceira entrará em contato para oferecer substituição ou cancelamento parcial/total, com reembolso automático.</Lead>
        </Section>

        <Section title="4. Regras e Prazos de Reembolso (Pagar.me)">
          <Bullets
            items={[
              <><strong>Pix:</strong> estorno na mesma conta bancária utilizada no pagamento.</>,
              <><strong>Cartão de Crédito:</strong> pode levar de 1 a 2 faturas para constar, dependendo da bandeira.</>,
              <><strong>Pagamento presencial:</strong> devolução resolvida diretamente no balcão da farmácia emitente.</>,
            ]}
          />
        </Section>

        <Section title="5. Central de Atendimento">
          <Lead>Caso encontre dificuldades, acione nossa Central. A Associação intervirá junto ao associado para garantir o cumprimento dos prazos legais.</Lead>
        </Section>
      </>
    ),
  },

  "como-comprar": {
    slug: "como-comprar",
    title: "Como Comprar no Site",
    description: "Passo a passo completo para realizar pedidos: cesta, identificação, escolha da loja, pagamento e confirmação.",
    content: (
      <>
        <Lead>
          Comprar na plataforma das <strong>Farmácias Associadas</strong> é simples, rápido e seguro. Siga os passos abaixo.
        </Lead>

        <Section title="1. Escolha seus produtos">
          <Bullets
            items={[
              <>Navegue pelas categorias ou use a barra de busca.</>,
              <>Clique em <strong>"Comprar"</strong> em cada produto desejado.</>,
              <>Continue navegando ou prossiga para a finalização.</>,
            ]}
          />
        </Section>

        <Section title="2. Revise sua Cesta">
          <Lead>Clique no ícone da <strong>Cesta</strong> no topo, confira itens, quantidades e valores. Avance quando estiver tudo certo.</Lead>
        </Section>

        <Section title="3. Identificação">
          <Bullets
            items={[
              <><strong>Já tem conta?</strong> Faça login com e-mail e senha.</>,
              <><strong>Primeira compra?</strong> Crie sua conta. O CPF é exigência legal para emissão de NF de produtos farmacêuticos.</>,
            ]}
          />
        </Section>

        <Section title="4. Loja e Logística (Entrega ou Retirada)">
          <Bullets
            items={[
              <>Insira o CEP — o sistema localizará as farmácias da rede mais próximas.</>,
              <><strong>Escolha a farmácia:</strong> ela será responsável por estoque, NF e preparo.</>,
              <><strong>Modalidade:</strong> Entrega domiciliar ou Retirada em Loja (sem frete).</>,
            ]}
          />
        </Section>

        <Section title="5. Pagamento e Cupom">
          <Bullets
            items={[
              <><strong>Pagamento Online:</strong> Pix (QR Code / copia e cola) ou Cartão de Crédito processado pelo Pagar.me.</>,
              <><strong>Pagar na Farmácia:</strong> dinheiro, débito, crédito, Pix ou convênio próprio da loja, no ato da entrega/retirada.</>,
              <>Cupons promocionais valem exclusivamente para pagamentos online.</>,
            ]}
          />
        </Section>

        <Section title="6. Finalização e Confirmação">
          <Lead>
            Revise as informações, clique em <strong>"Finalizar Pedido"</strong> e pronto. Você receberá um e-mail de confirmação. A Nota Fiscal será emitida pela farmácia
            física escolhida.
          </Lead>
        </Section>
      </>
    ),
  },

  "protecao-dados": {
    slug: "protecao-dados",
    title: "Como Protegemos Seus Dados",
    description: "Práticas de segurança técnica, criptografia SSL, padrão PCI-DSS e governança LGPD da plataforma.",
    content: (
      <>
        <Lead>
          Adotamos as melhores práticas de mercado e padrões rígidos de segurança técnica, administrativa e operacional para proteger seus dados pessoais. A
          infraestrutura é fornecida pela <strong>GAM Distribuidora</strong>.
        </Lead>

        <Section title="1. Criptografia na Transmissão (SSL)">
          <Lead>Todo o tráfego entre seu navegador e nossos servidores é protegido por <strong>SSL</strong> com criptografia de ponta — terceiros não conseguem interceptar.</Lead>
        </Section>

        <Section title="2. Cartões de Crédito (PCI-DSS)">
          <Bullets
            items={[
              <>Dados digitados em janela segura operada pelo gateway <strong>Pagar.me</strong>.</>,
              <>Nem a Administradora nem a GAM armazenam dados de cartão — processamento sob o padrão <strong>PCI-DSS</strong>.</>,
            ]}
          />
        </Section>

        <Section title="3. Controle de Acesso aos Servidores">
          <Lead>Bancos de dados em servidores modernos da GAM. Acesso monitorado e limitado a funcionários autorizados.</Lead>
        </Section>

        <Section title="4. Governança com as Farmácias Associadas">
          <Bullets
            items={[
              <>Termos de confidencialidade rigorosos — farmácias recebem dados apenas para NF e entrega.</>,
              <>Nenhuma loja pode usar suas informações para publicidade ou repasse a terceiros sem consentimento explícito (LGPD).</>,
            ]}
          />
        </Section>

        <Section title="5. Boas Práticas do Usuário">
          <Bullets
            items={[
              <>Nunca compartilhe sua senha.</>,
              <>Evite salvar credenciais em computadores públicos.</>,
              <>Crie senhas fortes (maiúsculas, minúsculas, números e símbolos).</>,
              <>Faça logout ao terminar em aparelhos compartilhados.</>,
            ]}
          />
        </Section>

        <Section title="6. Auditoria e Atualizações">
          <Lead>Realizamos varreduras e testes periódicos, aplicando correções de segurança em tempo real para manter o site sempre atualizado.</Lead>
        </Section>
      </>
    ),
  },

  "devolucao": {
    slug: "devolucao",
    title: "Devolução e Trocas",
    description: "Direito de arrependimento (CDC), restrição sanitária para medicamentos e como solicitar devolução ou troca.",
    content: (
      <>
        <Lead>
          As trocas, devoluções e reembolsos são processados pela <strong>Farmácia Parceira</strong> responsável pelo faturamento. Seguimos rigorosamente o
          CDC e as normativas da ANVISA.
        </Lead>

        <Section title="1. Direito de Arrependimento (Art. 49 CDC) — 7 dias">
          <Bullets
            items={[
              <>Embalagem original, lacrada, sem indícios de uso, com NF.</>,
              <><strong>Medicamentos:</strong> por determinação da ANVISA, não podem ser devolvidos por arrependimento — só por defeito de fabricação ou erro de separação.</>,
            ]}
          />
        </Section>

        <Section title="2. Defeito, Avaria ou Divergência">
          <Bullets
            items={[
              <><strong>Recuse o recebimento</strong> ao identificar embalagem violada, produto quebrado, vencido ou diferente.</>,
              <>Comunique o suporte em até <strong>72 horas</strong> para registrar a ocorrência.</>,
            ]}
          />
        </Section>

        <Section title="3. Como Solicitar">
          <Bullets
            items={[
              <>Abra um chamado na Central de Atendimento ou área do cliente.</>,
              <>A Administradora notifica a Farmácia Parceira emitente da NF.</>,
              <>O produto é devolvido ao estabelecimento físico para avaliação técnica.</>,
              <>Após validação, o processo de troca ou reembolso é autorizado.</>,
            ]}
          />
        </Section>

        <Section title="4. Reembolso (Pagar.me)">
          <Bullets
            items={[
              <><strong>Pix:</strong> estorno na mesma conta bancária utilizada.</>,
              <><strong>Cartão de Crédito:</strong> 1 a 2 faturas para constar.</>,
            ]}
          />
        </Section>

        <Section title="5. Perfumaria, Higiene e Cosméticos">
          <Lead>Trocas permitidas com lacre original intacto. Termolábeis não são aceitos para devolução após saírem da loja.</Lead>
        </Section>
      </>
    ),
  },

  "formas-pagamento": {
    slug: "formas-pagamento",
    title: "Formas de Pagamento",
    description: "Pagamento online (Pix, Cartão), pagamento presencial na farmácia (Dinheiro, Maquininha, Convênio) e regras de cupons.",
    content: (
      <>
        <Lead>
          Oferecemos segurança e flexibilidade. O processamento financeiro é de responsabilidade exclusiva da <strong>Farmácia Parceira</strong> selecionada.
        </Lead>

        <Section title="1. Pagamento Online (no site)">
          <Bullets
            items={[
              <><strong>Pix:</strong> QR Code e código "copia e cola" gerados na hora — confirmação instantânea.</>,
              <><strong>Cartão de Crédito:</strong> principais bandeiras, dados digitados em ambiente criptografado do Pagar.me. Não armazenamos dados de cartão.</>,
            ]}
          />
        </Section>

        <Section title="2. Pagamento Presencial (entrega ou retirada)">
          <Bullets
            items={[
              <><strong>Dinheiro:</strong> em espécie ao entregador ou no balcão.</>,
              <><strong>Cartão Débito/Crédito:</strong> maquininha física da farmácia.</>,
              <><strong>Convênios e Crediários:</strong> exclusivo para clientes com cadastro ativo na loja específica.</>,
            ]}
          />
        </Section>

        <Section title="3. Cupons de Desconto">
          <Lead>Válidos exclusivamente para a modalidade de Pagamento Online — aplicados automaticamente antes da finalização.</Lead>
        </Section>

        <Section title="4. Responsabilidade Fiscal e Estornos">
          <Lead>
            A NF é de competência da farmácia escolhida. Estornos são solicitados ao Pagar.me pela farmácia emitente. Divergências de valor devem ser
            comunicadas à Central.
          </Lead>
        </Section>
      </>
    ),
  },

  "privacidade": {
    slug: "privacidade",
    title: "Política de Privacidade",
    description: "Como coletamos, usamos e protegemos seus dados pessoais em conformidade com a Lei nº 13.709/2018 (LGPD).",
    content: (
      <>
        <Lead>
          Esta Política explica de forma transparente como coletamos, utilizamos, armazenamos, tratamos e compartilhamos suas informações, em conformidade com
          a <strong>LGPD (Lei nº 13.709/2018)</strong>.
        </Lead>

        <Section title="1. Agentes de Tratamento">
          <Bullets
            items={[
              <><strong>Controladora:</strong> Associação dos Proprietários e Oficiais de Farmácia do Estado do Rio Grande do Sul — Farmácias Associadas (CNPJ 87.132.809/0001-55).</>,
              <><strong>Operadora (SaaS):</strong> GAM Distribuidora (CNPJ 82.873.068/0001-40) — provedora da infraestrutura tecnológica.</>,
              <><strong>Co-controladora:</strong> a Farmácia Parceira selecionada, que recebe os dados exclusivamente para NF e logística.</>,
            ]}
          />
        </Section>

        <Section title="2. Dados Coletados e Finalidades">
          <Bullets
            items={[
              <><strong>Cadastro</strong> (Nome, CPF, E-mail, Telefone, Data de Nascimento): autenticação, identidade e processamento de pedidos. CPF é exigência legal.</>,
              <><strong>Endereço:</strong> cálculo de frete, prazos e logística.</>,
              <><strong>Pagamento:</strong> processado de forma criptografada pelo Pagar.me — não armazenamos dados de cartão.</>,
            ]}
          />
        </Section>

        <Section title="3. Compartilhamento Seguro">
          <Lead>
            Os dados do pedido são compartilhados com a Farmácia Parceira apenas para: emissão da NF-e, separação dos produtos e logística. Nenhum parceiro está
            autorizado a usar os dados para publicidade ou repasse.
          </Lead>
        </Section>

        <Section title="4. Segurança e Retenção">
          <Bullets
            items={[
              <>Criptografia SSL em todo o tráfego.</>,
              <>Dados cadastrais ativos enquanto a conta existir; histórico de pedidos retido conforme legislação fiscal e sanitária.</>,
            ]}
          />
        </Section>

        <Section title="5. Seus Direitos (Art. 18 LGPD)">
          <Bullets
            items={[
              <>Confirmação de tratamento e acesso aos dados.</>,
              <>Correção de dados incompletos ou desatualizados.</>,
              <>Anonimização, bloqueio ou eliminação de dados desnecessários.</>,
              <>Revogação do consentimento e exclusão da conta (ressalvadas obrigações legais).</>,
            ]}
          />
        </Section>

        <Section title="6. Encarregado de Dados (DPO)">
          <Lead>
            Para exercer seus direitos, contate nosso DPO via <strong>faleconosco@farmaciasassociadas.com.br</strong> ou pelo WhatsApp de atendimento.
          </Lead>
        </Section>
      </>
    ),
  },
};

export const POLICY_LIST = Object.values(POLICIES);
