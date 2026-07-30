## Escopo
Refatoração ampla cobrindo 7 seções (Header/Global, Home, Listagens, PDP/ANVISA, Checkout, Footer, Páginas Institucionais). É um trabalho extenso (~25–35 arquivos novos/editados). Antes de executar tudo, confirmo a abordagem.

## 1. Header, Navegação e Global
- `useSmartSticky` hook (esconde ao descer / mostra ao subir) aplicado no `Header`.
- Mega Menu: alinhar grid, adicionar card de produto destaque por categoria, remover "Compre rápido com receita" e "Frete grátis na sua região", renomear "Convênio PBM" → "Desconto de laboratório".
- Novo componente `BackToTop` (botão flutuante, smooth scroll).
- Trocar "Carrinho"→"Cesta" globalmente; ícone `ShoppingBasket` no header em vez de `+`.
- Lazy loading: `loading="lazy"` em todas as imagens + `React.lazy` para rotas pesadas.
- `CookieBanner` fixo no rodapé com persistência em localStorage.
- Header mobile reestruturado nas 4 linhas (logo+cesta/menu, busca com lupa+câmera, CEP, card "Acompanhe pedidos").

## 2. Home (hierarquia estrita)
Ordem: Full Banner (setas no hover) → Cards iniciais (alinhados) → "Viva toda a experiência" (5 benefícios) → Banner único → Compre por categoria → Vitrine de marcas → Grade 2+2 banners → Serviços de Saúde → Bloco institucional verde-água (Propósito/Visão/Missão/Valores + foto) → Blog "Saúde em Pauta".

## 3. Listagens / Cards
- `ProductFilters` (sidebar desktop / Sheet mobile): Preço, Marca, Princípio Ativo, Características.
- Card de produto: botões "COMPRAR" + "Comprar pelo WhatsApp" (ícone), marca em **negrito**, tag "Medicamento Genérico" dinâmica, ícone raio verde junto ao desconto.
- "Ver todos os produtos" no topo direito de cada vitrine.
- Mobile: carrosséis com scroll horizontal mostrando 2.5 cards (snap + width 40%); grids fixos em 2 colunas.

## 4. PDP / ANVISA
- Imagem principal 600x600 max + galeria.
- Remover "Farmacêutico Responsável"; destacar Princípios Ativos, Laboratório, Quantidade.
- Reordenar: Características antes de Descrição.
- Alertas de tarja (MIP, Vermelha, Preta, Genérico).
- Retenção de Receita / Tarja Preta: bloquear "Entrega em casa", forçar "Retirada na loja" + aviso Portaria 344/98.

## 5. Checkout
- Modal obrigatório de escolha de loja no início.
- Lógica de estoque por loja (Indisponível / Parcial com lista).
- Card da loja como radio: Nome, Endereço, CNPJ, RT/CRF-RS, AFE + aviso.
- Pagamento dividido em "Pague Online" (Cartão/Pix) e "Pague na Farmácia" (Dinheiro/Maquininha/Convênio).

## 6. Footer multi-colunas
Topo: termos mais buscados + Newsletter. Colunas: Institucional, Navegação/SEO, Serviços, Perfil, Atendimento, Segurança. Redes sociais. Base: ícones de pagamento (cartões, Pix, Convênio, Dinheiro) + dados de contato (Av. Pátria, 817).

## 7. Páginas Institucionais (a partir dos .docx)
Vou parsear cada `.docx` e criar:
- `/prazo-entrega-retirada`, `/termos-de-uso`, `/cancelamento-reembolso`, `/como-comprar`, `/protecao-de-dados`, `/devolucao-trocas`, `/formas-de-pagamento`, `/politica-de-privacidade`
- `/faq` em **Accordion** (shadcn)
- `/mapa-do-site` hierárquico

Cada rota com `head()` próprio (title/description/og).

## Detalhes técnicos
- Mocks-only, sem backend.
- Reutiliza tokens semânticos de `src/styles.css`.
- Animações: Framer Motion (já instalado).
- Parsing dos .docx via `document--parse_document` antes de criar páginas institucionais.
- Atualizo `routeTree.gen.ts` para registrar novas rotas.

## Pergunta antes de executar
Pelo tamanho do escopo, recomendo fazer **em 3 entregas sequenciais** para você validar:
1. **Entrega A** — Global (Header smart sticky, Cesta, BackToTop, CookieBanner, Footer multi-colunas, header mobile).
2. **Entrega B** — Home reordenada + Cards/Filtros/Listagens + PDP/ANVISA + Checkout.
3. **Entrega C** — Todas as páginas institucionais (.docx → rotas) + FAQ Accordion + Mapa do Site.

Aprovo este plano e começo pela Entrega A, ou prefere que eu faça tudo de uma vez em um único push (mais demorado e mais difícil de revisar)?