# SquadBuilder — Elementos genéricos e inconsistências de UI

Revisão feita a partir de 10 screenshots do fluxo real rodando com o fixture de dev ("Carregar exemplo"), cobrindo landing → formulário → diagnóstico → squad recomendado → composição → índice de risco → negociação → trilha de decisões.

## Objetivo

A lógica de cálculo/LLM já funciona. O problema levantado aqui é puramente de **interface**: vários elementos fazem a tela parecer um template genérico de SaaS de IA (padrões clichês, cores sem sistema, componentes inconsistentes, copy redundante), mesmo com uma direção visual já aprovada em `squadbuilder-poc.html` / `prompt-claude-code.md`. Este documento não propõe um redesign — propõe ajustes pontuais que reforçam a direção já definida (tokens `--petrol` / `--moss` / `--ochre` / `--rust` / `--paper` / `--ink`) em vez de introduzir cores e padrões novos ad-hoc.

## Como usar este documento

- **Não é redesign.** É uma lista de ajustes pontuais, seção por seção.
- Onde já existem tokens de cor definidos no design aprovado, **usar esses tokens** em vez de inventar cor nova.
- `[FIX]` = pode corrigir direto, é objetivo.
- `[DECISÃO]` = tem trade-off ou ambiguidade — trazer opções e recomendação, **não implementar antes de confirmar**.
- Commits separados por seção.
- Testar visualmente cada seção com o fixture ("Carregar exemplo") antes de passar pra próxima, sem gastar API.
- Não mexer na paleta/tokens já aprovados, não remover funcionalidade existente (histórico, trilha, edição de premissas) — só ajustar apresentação e consistência.

---

## 1. Identidade / elementos que parecem template genérico

1.1 `[DECISÃO]` Ícone do logo é um bar-chart genérico (clichê de dashboard). Avaliar wordmark/monograma próprio.

1.2 `[DECISÃO]` Hero da landing é só texto (título + subtítulo + botão), padrão repetido em qualquer SaaS de IA. Avaliar mostrar um preview real do produto (ex.: recorte da curva de alocação ou do dashboard) em vez de tela vazia.

1.3 `[FIX]` O recurso "duas cores no mesmo heading" (preto + destaque numa palavra) aparece 2x — na landing ("Monte o **squad** ideal") e em "**Squad** recomendado". Manter em só um lugar; no dashboard, resolver hierarquia com peso/tamanho tipográfico, não com cor.

1.4 `[FIX]` Botão "Enviar" da negociação usa ícone de avião de papel — idêntico a qualquer chatbot genérico. Trocar por ícone/label específico do contexto (ex.: "Aplicar ajuste →").

1.5 `[FIX]` Os 4 cards de métrica no topo do dashboard (Squad sugerido, Custo mensal, Prazo, Investimento) são cards brancos idênticos sem ícone nem diferenciação — o componente de stat-card mais genérico possível. Adicionar acento visual por métrica.

1.6 `[DECISÃO]` Toda seção da página usa o mesmo componente "card branco, borda cinza fina" — zero hierarquia visual entre seções. Dar mais peso à seção principal (squad recomendado, índice de risco) e menos às de apoio (premissas, histórico).

1.7 `[DECISÃO]` Tipografia sem identidade própria (parece sans padrão de sistema). Avaliar uma fonte de heading com mais personalidade, mantendo o corpo neutro.

1.8 `[FIX]` Uso excessivo de labels em ALL CAPS ("AJUSTE SOLICITADO", "PONTO DE PARTIDA", "ATUAL", "IMPACTO DA ALTERAÇÃO") — tique visual de "enterprise SaaS genérico". Reservar caps para um único tipo de rótulo (ex.: só status), o resto em title case.

1.9 `[DECISÃO]` Barra do índice de risco é uma barra horizontal simples com marcador — sub-desenhada para a métrica mais importante do produto. Avaliar visualização mais rica (gauge, ou barra segmentada por faixa) usando as cores semânticas já definidas por faixa de risco.

---

## 2. Cor sem sistema (reforça os tokens já definidos no poc)

2.1 `[FIX]` **Prioridade alta.** Verde é reaproveitado para pelo menos 6 significados diferentes: cor de marca, "risco baixo", checkmark de confirmação, chip selecionado, delta positivo (economia), toggle PJ selecionado. Auditar todo o app e mapear cada uso para o token correto já definido (petrol = marca/seleção; moss = risco baixo/positivo; ochre = atenção/risco moderado; rust = crítico/risco alto). Nenhuma cor deve carregar mais de um significado.

2.2 `[FIX]` O alerta de estouro de teto e o delta de aumento de risco usam a mesma cor âmbar/laranja sem relação sistemática entre os dois. Aplicar a paleta de status já definida (moss/ochre/rust) de forma consistente em todo alerta e delta.

2.3 `[DECISÃO]` Em "Por que este squad?", palavras como "front-end web", "UX/UI", "Tech Lead" aparecem coloridas como link mas não são clicáveis — affordance falsa. Decidir: tornar de fato clicável (linkar pro papel correspondente na tabela de composição) ou remover a cor de link e usar ênfase neutra (negrito).

---

## 3. Inconsistência de componentes interativos

3.1 `[FIX]` CTAs primárias usam dois estilos diferentes: botão preto sólido ("Descrever meu projeto") vs. botão outline ("Montar squad", "Atualizar estimativa"). Padronizar: 1 estilo sólido para ação primária, 1 outline para secundária, aplicado sem exceção.

3.2 `[FIX]` "Editar premissas", "Ver custos de referência" e "Carregar exemplo" têm o mesmo estilo visual (texto sublinhado) apesar de fazerem coisas diferentes (editar estado, expandir conteúdo, carregar fixture de dev). Diferenciar visualmente por função.

3.3 `[DECISÃO]` "Carregar exemplo" aparece na interface de produção em pelo menos 3 telas. Confirmar se deve ficar escondido atrás de flag de dev/debug antes de qualquer teste com usuário real ou lançamento.

---

## 4. Redundância de conteúdo/copy

4.1 `[FIX]` "O que entendemos do seu projeto" (título) seguido de "Entendimento do projeto" (subtítulo) dizem a mesma coisa. Cortar um dos dois.

4.2 `[FIX]` O CTA "Descrever meu projeto" aparece na landing E de novo fixo no topo da tela seguinte. No topo fixo, trocar por indicador de etapa/nome da fase atual em vez de repetir o mesmo CTA.

4.3 `[FIX]` A frase de impacto do ajuste (ex.: "Economia de R$ 6.000/mês, com aumento de 12 pontos no risco...") aparece duas vezes na mesma tela — no painel de histórico e de novo no rodapé do painel de impacto. Manter só uma ocorrência, no painel de impacto, que é o local de maior destaque.

---

## 5. Detalhes de polimento

5.1 `[FIX]` Inputs de custo de referência (edição de premissas) não têm máscara de moeda ("8000" cru, resto do app usa "R$ 8.000"). Aplicar a mesma formatação usada no resto do app.

5.2 `[FIX]` Coluna "Dedicação" mostra 100% para todos os papéis sem nenhuma variação — questionável ter coluna própria sem uso real. Esconder a coluna quando não há variação, ou mostrar só quando algum papel tem dedicação < 100%.

5.3 `[FIX]` Linha de totais da tabela de composição ("6 pessoas no squad") se mistura visualmente com as linhas normais. Diferenciar com fundo ou borda superior mais forte.

5.4 `[FIX]` Labels de papel na curva de alocação aparecem cortados/espremidos contra as barras. Dar mais largura à coluna de label, ou truncar com tooltip no hover.

5.5 `[DECISÃO]` A legenda da curva de alocação diz "intensidade da cor = % de envolvimento", mas as barras aparecem como blocos de cor sólida, não gradiente. Decidir entre implementar o gradiente real por mês, ou ajustar o texto explicativo para descrever o que de fato é mostrado.

5.6 `[FIX]` O toggle de edição de premissas usa verbos assimétricos: "Editar premissas" para entrar, "Concluir edição" para sair. Usar um par simétrico (ex.: "Editar premissas" ↔ "Salvar premissas").

5.7 `[DECISÃO]` Não há indicador de etapa da jornada (Descrição → Diagnóstico → Squad → Negociação). Avaliar um stepper fixo no topo para o usuário se localizar no fluxo.

5.8 `[FIX]` Ao clicar em "Ponto de partida" na trilha de decisões, o painel "Impacto do ajuste" some sem nenhuma explicação. Mostrar uma mensagem no lugar (ex.: "Este é o cenário inicial, sem ajustes aplicados").

5.9 `[DECISÃO]` **Maior impacto na proposta do produto.** A seção Histórico/Trilha é a única parte do app em 2 colunas — o resto é tudo empilhado em coluna única, inclusive input de negociação e resultado recalculado, que ficam distantes um do outro por uma rolagem longa. Isso vai contra a proposta central de "ver a consequência da decisão em tempo real". Recomendado: estender o grid de 2 colunas (input à esquerda, dashboard/resultado à direita) para o app inteiro. Alternativa mais barata: manter 1 coluna, mas manter o painel de impacto sempre visível/fixo perto do campo de negociação.

5.10 `[FIX]` Os nós da trilha de decisões são clicáveis (navegam entre estados) mas não têm nenhuma affordance visual disso — sem cursor pointer, hover state ou indício (seta/sublinhado). Adicionar indicação clara de que são interativos.

5.11 `[FIX]` Microcopy de ajuda importante ("Quanto mais contexto, mais precisa a estimativa", "Ctrl/Cmd + Enter para enviar") está em cinza claro e tamanho pequeno demais, fácil de ignorar. Aumentar contraste e tamanho.

---

## Ordem de prioridade sugerida

1. **Seção 2** (cor sem sistema) — afeta credibilidade e é rápido de reconciliar com os tokens já existentes.
2. **5.9 + 5.10** (layout de 2 colunas + affordance da trilha) — maior impacto na proposta central do produto.
3. **Seção 3** (consistência de componentes interativos).
4. **Seção 4** (redundância de copy) — rápido, baixo risco.
5. **Seções 1 e 5 restante** (polimento/identidade) — podem ser feitas incrementalmente, uma por commit.