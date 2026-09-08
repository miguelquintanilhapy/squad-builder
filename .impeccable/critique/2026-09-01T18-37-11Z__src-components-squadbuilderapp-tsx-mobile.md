---
target: src/components/SquadBuilderApp.tsx (mobile)
total_score: 31
max_score: 40
na_heuristics: 
p0_count: 2
p1_count: 3
timestamp: 2026-09-01T18-37-11Z
slug: src-components-squadbuilderapp-tsx-mobile
---
Method: dual-agent (A: revisão de design mobile · B: auditoria mecânica + detector)

## Design Health Score

| # | Heurística | Nota | Problema-chave |
|---|---|---|---|
| 1 | Visibilidade do status do sistema | 3 | Pílula de recálculo (`DashboardPanel.tsx:93-109`, `absolute right-0 top-0`) não tem offset mobile e sobrepõe o card "Squad sugerido" na grade de 1 coluna (`KpiStrip.tsx:85`); seu botão "Cancelar" interno também tem ~20-22px de altura. |
| 2 | Correspondência com o mundo real | 4 | Nomenclatura "squad"/"projeto", formatação BRL, termos PJ/CLT — nenhum deslize no mobile. |
| 3 | Controle e liberdade do usuário | 4 | Cancelar em toda operação assíncrona, "Restaurar leitura da IA", histórico de versões completo para desfazer a negociação. |
| 4 | Consistência e padrões | 3 | Dois padrões de modal coexistem: `CommandMenu.tsx:88-111` ainda é diálogo centralizado com scale/y em qualquer viewport, enquanto `RoleDetailModal` (`CompositionTable.tsx:83-135`) já foi migrado pra bottom sheet no mobile. A ordem "pergunta → consequência" também se inverte só na Negociação abaixo de `lg`. |
| 5 | Prevenção de erros | 4 | Limites min/max em prazo/orçamento/escopo, guardas de race condition, estados disabled consistentes. |
| 6 | Reconhecimento em vez de memorização | 3 | Ponto de campo editado + restaurar funciona bem; mas o painel de impacto pode renderizar fora da tela sem nenhum sinal, forçando o usuário a lembrar do próprio pedido enquanto rola a página. |
| 7 | Flexibilidade e eficiência de uso | 2 | Todo atalho (Ctrl/Cmd+Enter, Ctrl/Cmd+K) é exclusivo de teclado — no touch não existe nenhuma aceleração equivalente. |
| 8 | Estética e design minimalista | 3 | KPIs em coluna única funcionam bem; mas `AllocationChart` força um SVG de 660px dentro de uma tela de ~350px — o oposto de adaptação minimalista. |
| 9 | Ajuda a reconhecer/diagnosticar/recuperar erros | 4 | Banner de erro com "Tentar novamente", fluxo de perguntas de esclarecimento em vez de "chutar" o squad com input fraco. |
| 10 | Ajuda e documentação | 1 | Nenhum onboarding/tooltip contextual; o detalhe por mês/papel do `AllocationChart` só existe via `onMouseMove` — sem equivalente touch, e a lista `sr-only` é invisível a um usuário vidente. |
| **Total** | | **31/40** | **Bom** |

## Veredito de Especificidade de Design

**Misto, pendendo para "remendado".** Há engenharia mobile real aqui — não é um `overflow-x:scroll` de última hora — mas os remendos se concentram nas superfícies "seguras" (cards, sheets, chips), enquanto os dois widgets que carregam o diferencial do produto (o gráfico de alocação e o painel de negociação) foram encolhidos, não repensados.

**Genuinamente repensado:**
- `CompositionTable.tsx:172-275` — no mobile, a tabela vira cards `RoleCard` empilhados com `<dl>`, não uma tabela espremida. IA real, não reflexo de media query.
- `CompositionTable.tsx:83-135` — o modal de justificativa do papel vira bottom sheet no mobile via `useIsMobile()` (matchMedia), com `env(safe-area-inset-bottom)`. Atenção real ao chrome do dispositivo.
- `SquadBuilderApp.tsx:811-821` — barra inferior fixa com resumo de custo/prazo, compensando com `pb-14 sm:pb-0` no `<main>`.
- `ScopeField.tsx:71` — os chips de exemplo viram carrossel `snap-x` no mobile.

**Remendado / apenas encolhido:**
- `AllocationChart.tsx:124` — SVG fixo em `min-w-[660px]` dentro de `overflow-x-auto`; em um phone de 375px, ~55% do gráfico fica fora da tela por padrão, e o detalhe por mês só existe via hover de mouse (`onMouseMove`/`onMouseLeave`, `:171,190`) — sem `onTouchStart`/`onClick` equivalente.
- `CommandMenu.tsx` reaproveitado como único nav mobile (`SquadBuilderApp.tsx:497-504`, `md:hidden`) — é uma paleta Cmd+K que autofoca um `<input>` de busca (`CommandMenu.tsx:60`), disfarçada de menu hambúrguer para 2-4 destinos estáticos.
- `NegotiationChat.tsx:47-50` — abaixo de `lg`, o campo de input renderiza *antes* da trilha de versões e do `ImpactSummary`. `handleNegotiate` (`SquadBuilderApp.tsx:297-363`) não tem nenhum `scrollIntoView` equivalente ao de `handleAnalyze` (`:195`) — o número mais dramático do app (risco saltando pra 85/100) pode atualizar totalmente fora da tela.

**Varredura determinística**: `detect.mjs` aponta 1 achado em `src/components` (limpo em `src/app`): `bounce-easing` em `SquadBuilderApp.tsx:567` (`animate-bounce` no chevron de scroll do hero) — contraria a própria restrição do CLAUDE.md contra clichês visuais e o padrão de easing exponencial (`[0.23, 1, 0.32, 1]`) usado em todo o resto do app.

**Evidência visual**: nenhuma — não há ferramenta de navegador disponível nesta sessão. Todo o julgamento acima vem de leitura de código (classes Tailwind, variantes de animação, atributos aria), não de inspeção visual real.

## Impressão Geral

O mobile não foi feito às pressas — dá pra ver decisões deliberadas (bottom sheet com safe-area, dual-render de tabela, carrossel de chips). Mas a energia foi para as superfícies mais fáceis de "responsivizar", e não para os dois momentos que são a razão de o produto existir: entender **quando** contratar cada papel (AllocationChart) e ver **a consequência** de uma negociação (ImpactSummary). Essas duas telas são exatamente onde um fundador no celular mais precisa de clareza, e são as duas que ficaram piores no mobile.

## O Que Está Funcionando

1. **`CompositionTable`'s dual-render** (`:172-275`) — em vez de espremer uma tabela de 4 colunas, reautora os mesmos dados como cards tocáveis com `<dl>`, com o próprio comentário do código (`:170-171`) justificando que tabelas com scroll horizontal "são fáceis de não notar". Isso é letramento em UX mobile, não reflexo de media query.
2. **Bottom sheet com consciência de safe-area** (`CompositionTable.tsx:83-135`) — detecta mobile via `matchMedia` (não só CSS), anima de `y:'100%'`, e reserva padding pro home indicator do iPhone. A maioria dos "passes de responsividade" pula isso.
3. **Disciplina de abort/cancelamento mantida sem concessões no mobile** (`SquadBuilderApp.tsx:136-263`) — `AbortController`s separados por ação, botões "Cancelar" visíveis durante chamadas longas. Numa conexão mobile instável, é exatamente o controle que um usuário distraído precisa, e não foi sacrificado no passe mobile.

## Problemas Prioritários

**[P0] AllocationChart é ilegível e seu detalhe é intocável no mobile**
- **O quê**: `AllocationChart.tsx:124` renderiza um SVG fixo `min-w-[660px]`; o detalhe por mês/papel só existe via `onMouseMove`/`onMouseLeave` (`:171,190`), sem handler de toque.
- **Por que importa**: esse gráfico responde "quando preciso de cada papel" — central pra decisão de contratação. Em um phone de 375px, ~55% do gráfico fica fora da tela, e a única forma de pegar o detalhe numérico (a lista `sr-only` é invisível pra quem vê a tela) é um hover que não existe em touch. Um fundador no celular literalmente não consegue ler o único artefato que responde "quando contrato o QA?".
- **Fix**: no mobile, trocar o SVG largo por uma visão compacta por papel (uma barra horizontal full-width por papel, meses comprimidos em sparkline), com `onTouchStart`/`onClick` nos segmentos pra abrir o tooltip, não só hover.
- **Comando sugerido**: `adapt`

**[P0] Painel de consequência da negociação não é visto por padrão nem rolado até a vista**
- **O quê**: `NegotiationChat.tsx:47-50` empilha o input antes do `ImpactSummary` abaixo de `lg`; `handleNegotiate` (`SquadBuilderApp.tsx:297-363`) não tem nenhum scroll-into-view equivalente ao `resultsRef` de `handleAnalyze` (`:195`).
- **Por que importa**: essa é a promessa central do produto (o exemplo do Uber no CLAUDE.md: perguntar e ver a consequência). No mobile, o número mais importante do app — o risco recalculado — pode atualizar totalmente fora da tela, com só um toast genérico ("Ajuste aplicado") como sinal.
- **Fix**: depois que a negociação resolver, rolar (ou destacar visualmente) até o `ImpactSummary`/nó de versão ativo, igual o `resultsRef` já faz na análise inicial. Considerar reordenar o stack mobile pra o impacto renderizar direto sob o botão de enviar.
- **Comando sugerido**: `layout`

**[P1] CommandMenu é o padrão errado de navegação mobile — e inconsistente com o novo bottom sheet**
- **O quê**: `CommandMenu.tsx:88-111` é uma paleta Cmd+K que autofoca um input de busca (`:60`, placeholder "Buscar uma ação...") reaproveitada como único menu mobile (`SquadBuilderApp.tsx:497-504`), com só 2-4 itens estáticos. Além disso, ela ainda usa diálogo centralizado com scale/y em qualquer viewport — nenhum branch `isMobile` — enquanto `RoleDetailModal` já foi migrado pra bottom sheet.
- **Por que importa**: pra um usuário distraído (Casey), tocar no hambúrguer e receber o teclado do celular em cima de uma busca é fricção pra uma tarefa que devia ser só "ir pra outra seção" — e lê como bug na primeira vez. E agora o app tem dois filosofias de overlay coexistindo (uma modernizada, uma não).
- **Fix**: no mobile, renderizar os mesmos itens como uma lista de toque simples em bottom sheet, sem campo de busca — reservar a paleta com busca pro desktop, onde é acessada por atalho de teclado de qualquer forma.
- **Comando sugerido**: `adapt`

**[P1] Pílula de recálculo sobrepõe o KPI e seu próprio botão de cancelar é pequeno demais**
- **O quê**: `DashboardPanel.tsx:93-109`, `absolute right-0 top-0`, sem offset responsivo; a grade de KPI empilha em 1 coluna abaixo de 480px (`KpiStrip.tsx:85`) sem reservar espaço acima. O botão "Cancelar" dentro dessa pílula é `rounded-full px-2 py-0.5` com texto 12.5px → ~20-22px de altura.
- **Por que importa**: toda edição de chip ou override de taxa dispara essa pílula. Em mobile ela vai sobrepor o card "Squad sugerido" — exatamente o tipo de "isso quebrou?" que corrói confiança numa ferramenta de decisão financeira — e a única forma de cancelar é um alvo de toque abaixo do recomendado.
- **Fix**: dar à faixa de KPI um `pt-8 sm:pt-0` (ou similar) quando `recomputing`, ou reposicionar a pílula como faixa full-width acima da grade de KPI no mobile, com o botão de cancelar no tamanho de toque padrão.
- **Comando sugerido**: `harden`

**[P1] Chips de correção (ReadingGrid + ScopeSeeds) têm alvo de toque abaixo de 30px — na tela mais tocada do fluxo**
- **O quê**: `ReadingGrid.tsx:28-32` (`chipBase`, `px-3 py-[5px] text-[13px]`, ~30px de altura efetiva) e `ScopeField.tsx:71-83` (chips de exemplo, `py-1`, ~28-30px), ambos abaixo do guideline de ~40-44px.
- **Por que importa**: `ReadingGrid` é a tela onde o usuário corrige a leitura da IA — é tocada repetidamente. O próprio código já sabe resolver isso: `RiskPanel.tsx:179,199,219` usa `after:absolute after:-inset-y-2.5 after:inset-x-0` pra expandir a área de toque sem mudar o visual. Essa técnica simplesmente não foi aplicada aos chips.
- **Fix**: aplicar a mesma técnica de `after:-inset-y-*` (ou aumentar padding real) aos chips de `ReadingGrid` e `ScopeSeeds`.
- **Comando sugerido**: `harden`

## Red Flags por Persona

**Casey (usuário mobile distraído, uma mão, pouca paciência, prefere tocar a digitar)**
- Quebra em: `ScopeField.tsx` — o único caminho de entrada é um textarea de 7 linhas fixas (`:43`) com mínimo de 20 caracteres. Não existe caminho "só toque" até um diagnóstico além dos 3-4 exemplos prontos (`ScopeSeeds`) — se nenhum exemplo bate com o projeto de Casey, ela fica obrigada a digitar um parágrafo com uma mão antes de ver qualquer coisa.

**Jordan (primeira vez, leva rótulos ao pé da letra, hesita em elementos desconhecidos)**
- Quebra em: o hambúrguer mobile (`SquadBuilderApp.tsx:497-504`) abre o que parece uma busca (`CommandMenu.tsx:112-127`, placeholder "Buscar uma ação...", dica "Esc" que não existe em celular). Jordan espera uma lista de páginas e recebe um campo de busca — confusão real. Termos como "premissas" e "alocação" (`RiskPanel.tsx:172-183`) também exigem uma tradução mental que Jordan não tem.

**Alex (usuário avançado impaciente, já fez isso antes, odeia passos redundantes)**
- Quebra em: todo atalho de eficiência é exclusivo de teclado e invisível no mobile — Ctrl/Cmd+Enter pra enviar escopo e mensagem de negociação, Ctrl/Cmd+K pra paleta. No mobile, Alex tem exatamente a mesma velocidade que um usuário de primeira viagem: mesmo textarea de 7 linhas, mesmo modal por papel, mesmo scroll por tudo.

**Sam (dependente de acessibilidade — leitor de tela, teclado, alto contraste)**
- Parcialmente bem servido: todo botão só-ícone tem `aria-label` (`SquadBuilderApp.tsx:500,566`; `CompositionTable.tsx:144`), o card `RoleCard` mobile tem `role="button"` + `tabIndex` + `onKeyDown` + `focus-visible` corretos, e nenhum input dispara zoom indevido no iOS. Mas quebra no mesmo lugar que quebra pra qualquer um com precisão motora reduzida: os alvos de toque sub-30px em `ReadingGrid`/`ScopeSeeds`/botão de fechar modal/cancelar pílula — a acessibilidade de teclado foi cuidada, a de toque/motora não.

## Observações Menores

- **Cluster do chevron de scroll do hero** (`SquadBuilderApp.tsx:563-570`) — três problemas independentes na mesma peça de ~10 linhas: (1) usa `animate-bounce` ignorando o `useReducedMotion()` que o resto do componente respeita; (2) não tem padding, então sua área de toque real é só o ícone de 20px; (3) fica na mesma região da barra fixa inferior de resumo (`z-40`), que pode sobrepor/roubar o toque quando `scenario` existe. Três achados independentes na mesma adição recente sugerem que ela foi colada por último, sem o mesmo cuidado do resto do passe mobile.
- `ReadingGrid.tsx:143-157` — "Tipo de produto" renderiza 6 chips lisos, acima do guideline de ≤4 itens por grupo/decisão; nenhum sub-agrupamento.
- `ImpactSummary.tsx:121-126` — o nível de risco ativo é comunicado só por cor (`RISK_COLOR[...]`), sem texto/ícone ao lado — inconsistente com `RiskPanel.tsx:133-136`, que sempre pareia a mesma cor com um dot **e** texto explícito ("Risco alto").
- `CompositionTable.tsx:88` — `useIsMobile` reimplementa o breakpoint `sm` (639px) hardcoded em JS, sem constante compartilhada com o Tailwind config.
- O fix de zoom do iOS (`text-base sm:text-*`) foi colado à mão em 5 inputs diferentes (`CommandMenu`, `ConstraintFields` x2, `RiskPanel`, `NegotiationChat`) em vez de um primitivo de input compartilhado — qualquer input novo pode reintroduzir o bug.
- `ScopeSeeds` (carrossel, `ScopeField.tsx:71`) não tem nenhuma pista visual de "role pra ver mais" (fade/seta), diferente do `AllocationChart`, que já tem esse cuidado (`canScrollRight`, fade) — tratamento inconsistente entre dois componentes que rolam horizontalmente.
- `Toast.tsx:44` hardcoda `bottom-[calc(4rem+...)]` pra não colidir com a barra sticky, mas a barra sticky não tem altura fixa/token compartilhado — se o texto da barra quebrar em 2 linhas um dia, o toast pode ficar escondido atrás dela.
- Botão de menu no header mobile é `size-9` (36px) — um pouco abaixo do guideline de ~40-44px.
- `SquadBuilderApp.tsx:473` — `max-w-[200px]` no texto truncado do header é código morto: esse texto já está `hidden` abaixo de `sm`.
- Botão de imprimir renderiza sem condição no mobile, onde "imprimir" é uma ação rara e de fluxo incerto (varia por SO) — baixo valor ocupando espaço de toque.

## Perguntas para Reflexão

1. Se o preview do hero é bom o suficiente pra ser o "cartão de confiança" do desktop, por que o mobile — o dispositivo onde o fundador mais provavelmente está avaliando com ceticismo, antes de se comprometer a digitar um parágrafo — não recebe nada dele?
2. A negociação é vendida como uma conversa ("E se eu contratar só 1 fullstack?"), mas a UI mobile não tem nenhuma affordance de chat — sem bolhas de mensagem, sem sensação de turno. Ela deveria parecer mais "trocar mensagem com um cofundador" do que preencher um campo que alimenta uma lista de versões?
3. A equipe já provou, no `CompositionTable`, que está disposta a construir duas renderizações genuinamente diferentes pra dois viewports — por que o `AllocationChart`, o widget mais hostil ao mobile dos dois, recebeu só um patch de scroll-hint em vez do mesmo tratamento? Que visualização "por papel" (em vez de "por mês") resolveria isso sem scroll horizontal?
