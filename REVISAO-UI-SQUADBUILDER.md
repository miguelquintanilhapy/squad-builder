# SquadBuilder — Revisão externa de UI

Revisão feita por um segundo modelo sobre **4 screenshots** da interface rodando com o fixture de dev. Você tem o código; eu tive só as imagens. Onde eu descrevo algo da tela, é o que aparece renderizado.

**v2 — atualizado após a auditoria de código.** As 10 perguntas da seção 6 foram respondidas e os itens abaixo já refletem os achados reais. Onde a leitura do código mudou o diagnóstico, há um bloco `Achado no código`. A seção 6 virou histórico; não precisa responder de novo — exceto o item 6.11, que é novo e ainda está aberto.

## Como tratar

| Marca | Ação |
|---|---|
| `[FIX]` | Corrigir direto |
| `[DECISÃO]` | Trazer opções e recomendação. **Não implementar antes de confirmar** |
| `[CONFIRMAR]` | Pode já existir e não aparecer nos prints. Verificar e responder — se existe, seguir sem mexer |

**Ordem:** resolver 6.11 (discrepância de evidência) → aplicar seção 1 e a paleta (8.1/8.2) → criar fixtures da seção 4 → aplicar seção 2 → discutir seção 5.

**Antes de tudo:** ler a seção 8.3. Há dois pontos onde a diretriz anti-slop do projeto, aplicada literalmente, quebra o produto. Não aplicar a diretriz nesses dois lugares.

Commits separados por seção. Sem refactor de arquitetura, troca de lib ou mudança de paleta.

**Diretriz de desempate:** o produto vende confiança no número, não o número. Se uma escolha deixa a tela mais bonita e o resultado menos auditável, ela está errada.

**Não desfazer:** a inversão do fluxo (texto livre → leitura inferida), a direção visual atual, os chips de exemplo, o microcopy "Quanto mais concreto, menos chute". Nada disso está em questão.

---

## 1. Correções objetivas

### 1.1 `[FIX]` Separador decimal

`2.3 meses` — em pt-BR decimal é vírgula. Na mesma tela `R$ 131.100` sai correto, então o valor de meses escapa do helper de formatação.

```js
(2.3).toFixed(1)                                             // "2.3"  ← errado
(2.3).toLocaleString('pt-BR', { minimumFractionDigits: 1 })  // "2,3"  ← certo
```

**Achado no código:** o módulo existe (`formatCurrencyBRL` / `formatNumberPtBR` em `labels.ts`), e a auditoria encontrou **um** ponto cru: `realisticTimelineMonths.toFixed(1)` em `riskEngine.ts:115`, no texto do driver "prazo alvo incompatível".

**Discrepância — ver 6.11.** O `2.3` que aparece nos prints está no card `Prazo estimado` do KPI strip, não em texto de driver de risco. São locais diferentes. Ou o KPI também escapa do helper, ou há um terceiro caminho. Resolver antes de fechar o item: uma busca por `toFixed` sozinha não pega template string com número cru nem `String(n)`.

Depois: garantir que `formatMonths` seja o único caminho e que nenhum componente interpole número direto.

### 1.2 `[FIX]` Falsa precisão no prazo

`2,3 meses` = 69 dias. Ninguém contrata 0,3 de mês e o modelo não distingue 2,3 de 2,6. Decimal comunica "medimos"; isso é chute informado.

Usar faixa (`2 a 3 meses`) ou arredondar (`~2,5`).

**Propaga:** investimento total = custo × prazo herda a precisão falsa. Se o prazo é faixa, o total é faixa: `R$ 114.000 – 171.000`. Aplicar em cascata nos derivados.

### 1.3 `[FIX]` Custo ambíguo com quantidade > 1

`2x Dev Mobile — R$ 16.000` lê como salário unitário. Mostrar as duas grandezas: `R$ 8.000/pessoa · R$ 16.000/mês`. Toda a tabela.

### 1.4 `[FIX]` Risk score: escala implícita e soma que não fecha

Na tela: score **20**, e um único fator listado (`+5` pagamentos/compliance). Os outros 15 pontos não têm origem visível. E "20" sozinho não diz se a escala é 0–100 ou 0–50, nem qual direção é pior.

- Exibir `20/100` com direção rotulada.
- Listar **todos** os fatores com peso, somando exatamente o total. Se o schema da resposta não garante isso, ajustar o schema.
- **Se não der pra auditar, remover o número** e deixar só o rótulo qualitativo. Número que não fecha é pior que nenhum número.

**Achado no código:** o `RiskPanel` exibe apenas os **top-3 drivers por peso**. Isso explica a aritmética quebrada de duas formas possíveis, e você precisa determinar qual é:

1. Existe um **score-base invisível** somado aos drivers (20 = base 15 + driver 5). Nesse caso, a base tem que aparecer como linha própria: `Base: 15 · Pagamentos/compliance: +5`.
2. Havia mais drivers e o corte do top-3 os escondeu. Nesse caso o print teria mostrado 3, não 1 — então provavelmente é o caso 1.

**Consequência maior:** o corte de top-3 é incompatível com a diretriz de auditabilidade. Qualquer driver pode desaparecer da tela sem aviso, mas continua somando no score. Ou lista todos, ou mostra os 3 com um `+N outros fatores` expansível que revela o resto. Nunca truncar em silêncio um número que o usuário vai usar pra decidir.

### 1.5 `[FIX]` Teto mensal é campo morto

Vem pré-preenchido com `0` (zero é valor válido, não estado vazio → usar placeholder).

**Achado no código — parcialmente errei:** o teto **chega** no cálculo (`riskEngine.ts:121` gera alerta quando `totalMonthlyCost > monthlyBudget`). Não é campo morto.

Mas o efeito prático é pior que campo morto: o alerta entra na fila de drivers de risco e **só aparece se cair no top-3 por peso**. Ou seja, o usuário pode estourar o orçamento em R$ 27.000 e não ver nada na tela, porque três outros drivers pesaram mais. Um alerta que às vezes aparece é menos confiável que um que nunca aparece — o usuário aprende a confiar na ausência.

**Correção:** estouro de orçamento sai da fila de drivers e vira alerta próprio, sempre visível, ancorado nos cards de resultado — com a diferença em reais e ao menos uma sugestão de corte acionável. Pode continuar contando no score, mas não pode competir por espaço de exibição.

Quando `custoMensal > tetoMensal`: alerta explícito acima dos números, com a diferença e ao menos uma sugestão de corte acionável. É o momento de maior valor da ferramenta e hoje não existe.

### 1.6 `[FIX]` "Reler escopo"

Na primeira execução não houve leitura pra "reler". `Dimensionar squad` na primeira, `Recalcular` nas seguintes. Manter o verbo consistente no estado de loading.

### 1.7 `[FIX]` Mínimo de 40 caracteres

`Faltam 40 caracteres pra liberar` com botão cinza = parece quebrado. Deixar ativo e validar no clique, com mensagem útil. Ou baixar o mínimo pra um valor que raramente dispare aviso.

### 1.8 `[FIX]` Taxonomia conflitante em Plataforma

Nos prints, `iOS` + `Android` + `Web Browser` estão marcados **e** existe a opção `Multi-plataforma`. Se os três estão ligados, isso *é* multi-plataforma — leitura contraditória.

Ou `Multi-plataforma` é exclusivo e desmarca os outros, ou some e "multi" passa a ser derivado de ≥2 seleções.

### 1.9 `[FIX]` Chip selecionado em preto

Resto do sistema é verde escuro. Segunda cor de destaque sem motivo. Unificar.

### 1.10 `[FIX]` Seleção só por cor

Estado marcado depende exclusivamente de cor de fundo. Falha em daltonismo e contraste baixo. Adicionar segundo canal — o check da versão anterior fazia isso e o redesign perdeu.

### 1.11 `[FIX]` Contraste

Subtítulo do hero, bloco de premissas e labels cinza sobre o bege provavelmente reprovam AA (4.5:1 corpo, 3:1 texto grande). Medir todos os pares e escurecer os que falharem. Reportar tabela antes/depois.

### 1.12 `[FIX]` Botão "Enviar" da negociação

Ghost + largura total + cinza = lido como desabilitado. É ação primária: preenchido, verde, largura de conteúdo.

### 1.13 `[FIX]` Seção Negociação

Dois problemas visíveis no print: a coluna esquerda está inteira vazia com o conteúdo empurrado pro meio-direita (parece bug de grid), e o parágrafo do SquadBuilder ali é **cópia literal** do texto da seção 03. Aquele espaço deveria abrir o histórico de ajustes, não repetir o diagnóstico.

### 1.14 `[FIX]` Largura inconsistente

Seção 01 usa ~55% da tela; 02 e 03 usam quase 100%. Rolando, parece página diferente. Container único, largura total só onde há justificativa (tabela, gráfico).

### 1.15 `[FIX]` Quebra da headline

"Descreva o produto. O / resto a gente deduz." quebra no meio da frase. Forçar quebra na pontuação.

### 1.16 `[FIX]` Numeração incompleta

01, 02, 03 — e Composição, Risk score e Negociação ficam sem número.

**Não estender a numeração** (regra #3 da diretriz anti-slop: número só quando carrega informação real). Escopo → leitura → squad **é** sequência genuína e a numeração ali se justifica. Composição, Risk score e Negociação não são etapas: são partes internas do resultado.

Correção: as três primeiras se leem como fluxo (idealmente com stepper de navegação, já que a página é longa); as demais descem um nível de hierarquia como blocos do 03, sem numeração. O problema não é numeração faltando, é hierarquia achatada.

### 1.17 `[FIX]` Link de dev exposto em produção

`Dev: ver com dados de exemplo` visível. Env flag ou `?mock=1`.

### 1.18 `[FIX]` Botão flutuante "N"

Canto inferior esquerdo, sem função aparente. Se é conta/avatar, sobe pro header (topo direito). Se é resto de scaffold, remove.

### 1.19 `[FIX]` "Investimento total"

Muda de significado quando o prazo muda na negociação. `Custo acumulado no período` ou com a faixa no rótulo.

---

## 2. Estados e fluxos

### 2.1 `[CONFIRMAR]` Erro de API

Não aparece nos prints. Se não existe: mensagem específica por tipo (timeout, 429, resposta malformada, quota), retry preservando o escopo digitado, cancelar durante o loading, timeout com limite explícito.

Você acabou de viver o rate limit — o usuário também vai.

### 2.2 `[DECISÃO]` Escopo insuficiente

"quero um app massa" com 40 caracteres. Hoje sai squad de 8 pessoas e risco baixo — confiança fabricada sobre nada, o pior resultado possível pra credibilidade.

Proposta: devolver **perguntas em vez de números** quando o escopo não sustenta estimativa. Isso vende a competência da ferramenta melhor que qualquer chute.

Decidir: detecção por heurística de tamanho ou o próprio modelo classifica a suficiência? Teto de quantas perguntas?

### 2.3 `[DECISÃO]` Escopo fora de domínio

"Quero abrir uma padaria." Precisa de recusa desenhada que reorienta.

### 2.4 `[CONFIRMAR]` Escopo gigante

PRD de 8.000 caracteres colado. Tem limite? Se tem, contador ao se aproximar. Truncagem silenciosa não.

### 2.5 `[FIX]` Recálculo não deve voltar pra skeleton

A tela promete "clique pra corrigir — o squad recalcula na hora".

- Debounce: trocar Médio → Enterprise → Médio não deve queimar três chamadas.
- **Skeleton na segunda vez é regressão** — o usuário perde o ponto de comparação exatamente quando quer comparar. Manter os números antigos esmaecidos com indicador de recálculo sobreposto.

### 2.6 `[DECISÃO]` Inferido vs. editado à mão

Se o usuário desmarca "Mobile App", o texto dele continua dizendo "pede pelo celular". Ele está corrigindo a *leitura* ou sobrescrevendo a *decisão*?

Não-negociáveis: distinguir visualmente inferido de editado, e **recálculo nunca reverte escolha manual**. Reverter irrita e destrói confiança.

Decidir: existe "restaurar leitura da IA" por campo?

### 2.7 `[FIX]` Loading com progresso

Chamada de LLM leva 10–30s.

**Achado no código:** as 3 chamadas usam `generateContent`, sem streaming.

Mas há três chamadas sequenciais (`analyzeScope`, `suggestInitialSquad`+`computeScenario`, `narrateScenario`), e isso é melhor que streaming pra esse caso: dá **progresso real, não teatro**. Cada etapa concluída é um estado verdadeiro pra mostrar, e a leitura do escopo pode inclusive renderizar assim que a primeira volta — o usuário já vê os chips preenchidos enquanto o squad é calculado.

Trocar o spinner por progresso por etapa. Streaming token-a-token da narração é opcional depois, e só vale se a narração for a chamada mais lenta.

### 2.8 `[FIX]` Fidelidade do skeleton

Precisa bater com o layout final quase pixel a pixel, senão há layout shift no momento de maior atenção. Medir CLS.

Detalhe do print anterior: os três cards do meio tinham opacidade decrescente da esquerda pra direita — o olho lê como "esse ainda vai carregar". A gradação não comunica nada (regra #6: ornamento sem função). Uniformizar e deixar o shimmer indicar atividade.

### 2.9 `[CONFIRMAR]` Formulário durante o loading

O usuário pode trocar "Baixo" por "Enterprise" no meio da análise e receber resultado que não corresponde à tela. Ou congela os controles, ou detecta divergência e mostra "Parâmetros alterados — recalcular".

---

## 3. Confiança e valor

Não é polimento. É o que separa a ferramenta de um prompt solto.

### 3.1 `[DECISÃO]` Negociação com versões comparáveis — **prioridade da seção**

A caixa aceita "quero tirar o QA e colocar 1 Fullstack em 3 meses". O que acontece depois define três produtos diferentes:

| | Comportamento | |
|---|---|---|
| (a) | Recalcula e o estado anterior se perde | **Pior das três** — é o que o layout atual sugere |
| (b) | Chat com histórico, página estática | Aceitável |
| (c) | Versionamento v1/v2/v3 comparável | **Recomendado** |

(c) é o valor real: `com QA: R$ 57k / sem QA: R$ 51k, risco sobe pra 45`. Comparar cenários **é** o trabalho que a pessoa está tentando fazer.

Mínimo pra (c): lista de versões, diff dos números, voltar a uma versão anterior, pedido em linguagem natural preservado como rótulo.

### 3.2 `[DECISÃO]` Premissas editáveis

Hoje "Assumissions" é parágrafo corrido separado por `·`. É o elemento que mais gera confiança na página e está formatado como rodapé.

1. Virar lista com título de verdade.
2. **Torná-las editáveis.** Se a pessoa pode mudar o custo-hora ou dizer "somos CLT, não PJ", os números recalculam e ela passa a acreditar neles. Premissa editável é o que separa calculadora de adivinhação.

### 3.3 `[DECISÃO]` Origem dos valores

"Custo de referência de mercado" é vago. `R$ 8.000` pra Dev Mobile Pleno é afirmação forte e discutível — varia por região, senioridade real e modelo de contratação.

Se há fonte citável, citar. Se é o modelo estimando, dizer que é. Um comprador que discorda do número descarta a ferramenta inteira em vez de ajustar a premissa — a menos que a tela deixe claro que é ajustável.

### 3.4 `[DECISÃO]` Contrafactual

"8 pessoas, 2–3 meses" não responde a pergunta real: **e se eu não puder pagar isso?** Um "mínimo viável: 4 pessoas, 4 meses, veja do que você abre mão" transforma diagnóstico em decisão. Casa com 3.1 e com 1.5.

### 3.5 `[FIX]` Exportar

Peça de venda sem "baixar PDF" ou link compartilhável = o usuário printa a tela e você perde o rastro e o canal de distribuição. Provavelmente o maior ROI entre os ausentes.

Se houver link: `<title>`, favicon e OG tags passam a ser parte do produto.

### 3.6 `[FIX]` Resumo sticky

A página é longa. Lendo a tabela de Composição, os números-chave já saíram de vista. Barra fina: `8 pessoas · R$ 57.000/mês · 2–3 meses`.

### 3.7 `[DECISÃO]` A curva de alocação não mostra curva

As cinco barras são 100% do M1 ao M2 — retângulo sólido ocupando muita altura pra comunicar zero. É literalmente a regra #8 da diretriz anti-slop: *gráfico sem dados*. Barra flat em dois meses não expressa informação nenhuma.

- **(a)** o modelo passa a devolver alocação por fase (`{papel, mes, percentual}`) e o gráfico ganha sentido — designer pesado no início, QA na segunda metade, back-end constante;
- **(b)** enquanto for flat, trocar por uma linha de texto e economizar a altura.

Se (a): planejar tons de verde agora. O verde sólido atual é bonito mas monolítico e não representa intensidade.

### 3.8 `[CONFIRMAR]` Regras de composição

No fixture: 8 pessoas, todas Pleno, nenhuma liderança. Se as regras reais permitem isso, squad de 8 sem tech lead é a primeira coisa que um comprador experiente aponta. Revisar: quando entra lead, distribuição de senioridade por tamanho, quando um papel entra em alocação parcial.

### 3.9 `[FIX]` Descrições que justificam de verdade

Duas linhas do mesmo output:

- ❌ "Cobre a demanda de desenvolvimento mobile estimada para o escopo." — tautologia
- ✅ "Produto com interface voltada ao usuário final: risco de UX alto sem design dedicado." — **essa é a boa**

Toda linha deve defender por que o papel existe e o que quebra sem ele. Ajustar o prompt e rejeitar/regenerar descrições tautológicas.

É a regra #6 aplicada a texto: a primeira existe pra preencher a célula, não pra informar. Removê-la não perde nada — logo não deveria existir. Vale o teste da diretriz em cada linha: se eu apagar, alguma informação se perde?

### 3.10 `[FIX]` Coerência narrativa × resultado

No output dos prints, o parágrafo dizia "o risco maior hoje é lançar sem QA dedicado" — e a composição **incluía** 1x QA.

**Achado no código:** o pipeline está correto. `analyzeScope → suggestInitialSquad → computeScenario → narrateScenario` — a narração recebe o scenario já fechado. Minha hipótese de ordem errada estava errada.

**Mas isso não fecha o item, agrava.** Se o modelo tem o squad final no contexto e ainda assim escreveu "sem QA dedicado" com QA na lista, então o problema não é de dados — é o modelo contradizendo o que recebeu. Pipeline correto não previne alucinação; só remove a desculpa. E não há nenhuma checagem de consistência entre o texto e o squad.

**Correção:** validação pós-geração. Para cada papel presente na composição, verificar se a narrativa afirma sua ausência (padrões como "sem X", "falta X", "não há X", "risco de lançar sem X"). Se houver contradição, regenerar uma vez e, na segunda falha, suprimir a frase em vez de exibir.

Vale ainda confirmar se a contradição se reproduz com resposta real da API — pode ter sido só o fixture. Mas a checagem vale de qualquer forma, porque hoje é a única defesa que existe.

### 3.11 `[FIX]` Validação de schema — a negociação está desprotegida

**Achado no código:** não há Zod nem equivalente. Existe sanitização manual (`sanitizeEnum` / `sanitizeEnumArray`) **só para `ScopeAnalysis`**. `ProposedSquadChange` e a saída da narração entram sem validação nenhuma.

Isso inverte a prioridade: `ScopeAnalysis` é a superfície **menos** perigosa (enums fechados, poucos campos), e é a única protegida. `ProposedSquadChange` é a **mais** perigosa — vem de texto livre do usuário ("tira o QA e põe 1 fullstack em 3 meses"), muta o squad, e alimenta custo, prazo e risco. Um campo malformado ali propaga para todos os números da tela sem nada barrar.

**Correção:**
- Adicionar Zod como **dependência direta**. Hoje está em `node_modules` por transitividade de outra lib — usar assim quebra na próxima resolução de dependências.
- Schema para `ProposedSquadChange` primeiro, `ScopeAnalysis` depois (migrar a sanitização manual), narração por último.
- Em falha de parse: não renderizar números parciais. Tratar como erro de API (2.1) e oferecer nova tentativa.

Sem isso, tudo em 5.1 (versionamento da negociação) é construído sobre entrada não validada.

### 3.12 `[FIX]` Truncamento silencioso de drivers de risco

Consequência transversal do achado em 1.4/1.5: o `RiskPanel` corta os drivers no top-3 por peso. Qualquer fator pode desaparecer da tela e continuar somando no score.

Isso contradiz diretamente a diretriz de desempate deste documento. Se o número é auditável, o corte não pode ser silencioso: mostrar os 3 com `+N outros fatores` expansível, ou listar todos. E o estouro de orçamento sai da fila (ver 1.5).

---

## 4. Fixtures — pré-requisito pra validar o resto

O fixture atual exercita o caso mais fácil possível: risco com um fator só (não testa cinco), alocação flat (não testa ramp), todos Pleno com nomes curtos (não testa `1x Especialista em Segurança` estourando a coluna).

Criar 5, alternáveis por `?mock=nome`:

| Fixture | Testa | Conteúdo |
|---|---|---|
| `minimo` | Layout com pouco conteúdo | 2 pessoas, 1 papel, 1 fator de risco |
| `grande` | Estouro de layout | 12 pessoas, 8 papéis, títulos longos, 6 meses |
| `estouro-orcamento` | Alerta de 1.5 | Custo acima do teto informado |
| `risco-alto` | Breakdown de 1.4 | 5+ fatores somando o total, risco ≥ 70 |
| `alocacao-variavel` | Gráfico de 3.7 | Percentuais diferentes por mês e papel |

**Requisito:** escrever no **formato exato do JSON da API**, não como objeto conveniente pro componente. Vira teste de contrato de graça.

---

## 5. Decisões que dependem de mim

Não implementar antes de confirmar. Traga opções e recomendação.

1. Negociação: destrutivo, chat ou versionamento? (§3.1 — inclinação: versionamento)
2. Premissas editáveis: quais campos, o que dispara recálculo? (§3.2)
3. Valores de mercado: fonte citável ou estimativa declarada? (§3.3)
4. Contrafactual: cenário fixo ou gerado sob demanda? (§3.4)
5. Inferido vs. editado: como marcar, tem "restaurar"? (§2.6)
6. Escopo insuficiente: como detectar, quantas perguntas? (§2.2)
7. Escopo fora de domínio: qual a resposta? (§2.3)
8. Alocação: modelo gera variável ou tiramos o gráfico? (§3.7)
9. "Leitura do escopo" no mobile: accordion ou resumo textual? (§6 / responsivo)

---

## 6. Auditoria de código — respondida (histórico)

Respostas da leitura do código. ✅ = fechado, 🔴 = ainda aberto.

1. ✅ São `<button aria-pressed>` — semânticos. Mas os 4 grupos compartilham o mesmo componente `Chip`: tipo/plataforma são multi-select, estágio/complexidade são single-select, e nada disso é comunicado à tecnologia assistiva. **`aria-pressed` está errado nos single-select** — grupo de opções exclusivas quer `role="radiogroup"` + `role="radio"` + `aria-checked`. Corrigir junto com 1.10 (segundo canal visual) e 1.8 (taxonomia de Multi-plataforma).
2. ⚠️ Existe (`labels.ts`) mas não é usado em todo lugar. Um ponto cru achado em `riskEngine.ts:115` — mas não é o do print. Ver 6.11.
3. ✅ É `<table>`/`<th>` de verdade. Falta só `scope="col"` nos `<th>` — correção de uma linha, fazer.
4. 🔴 Não existe. Ver 3.11 — a negociação é a superfície mais perigosa e é a desprotegida.
5. ✅ Recebe o scenario fechado. Minha hipótese estava errada — mas ver 3.10: isso agrava o item em vez de fechá-lo.
6. ⚠️ Chega no cálculo (`riskEngine.ts:121`), mas pode ser engolido pelo corte de top-3 drivers. Ver 1.5 e 3.12 — o diagnóstico mudou.
7. ✅ Não suporta (`generateContent`). Mas as 3 chamadas sequenciais dão progresso real — ver 2.7, virou vantagem.
8. ✅ Não existe. Ver item 12.
9. ✅ Confirmado o risco: `DashboardSkeleton` é componente genérico separado (grid solto + 3 blocos), não deriva do JSX de `KpiStrip`/`AllocationChart`/`CompositionTable`/`RiskPanel`. **Correção:** extrair um shell de layout compartilhado, ou no mínimo fixar as mesmas alturas. Skeleton genérico sempre divergirá do real na próxima mudança de layout — resolver na estrutura, não com números mágicos.
10. ✅ Sobrevive — o `catch` de `handleAnalyze` só seta `error`/`lastFailedAction`, nunca toca em `input`. Nada a fazer.

11. 🔴 **Aberto — resolver antes de mexer na formatação.** O `2.3` visível no print está no card `Prazo estimado` do KPI strip. A auditoria achou `toFixed(1)` cru em `riskEngine.ts:115`, que é texto de driver de risco — outro lugar. Então: o KPI também escapa do helper, ou existe um terceiro caminho? Buscar também por `String(`, `${` com número cru e `Number.prototype` em template strings, não só `toFixed`. Reportar todos os pontos antes de corrigir.

12. Não há testes automatizados nem nenhum `.test`/`.spec` em `src/`. **Não montar suíte agora** — fora de escopo. Mas os 5 fixtures da seção 4, escritos no formato exato da API, mais os schemas Zod de 3.11, cobrem o essencial por muito menos esforço.

---

## 7. Acessibilidade e responsivo

### Acessibilidade
- `[FIX]` `Ctrl/Cmd + Enter` submete do textarea — atalho esperado em fluxo texto → resultado
- `[FIX]` Alternativa textual pro gráfico de alocação (tabela equivalente ou `aria-label` com os dados)
- `[FIX]` Foco visível em todos os interativos, não só `:hover`
- `[FIX]` `prefers-reduced-motion` respeitado, inclusive no shimmer
- Ver também 1.10 (seleção por dois canais), 1.11 (contraste), 6.1 e 6.3 (semântica)

### Responsivo (375px)
- `[FIX]` **Tabela de Composição:** 4 colunas de números + descrição não cabem. Card por papel, números empilhados e rotulados
- `[DECISÃO]` **Leitura do escopo:** 4 colunas de chips. Empilhado fica altíssimo e empurra o resultado fora da tela. Accordion, ou resumo textual (`Mobile App · iOS+Android · Ideia no papel · Médio`) com "Editar"
- `[FIX]` **Headline:** 4rem vira ~6 linhas. `clamp()`
- `[FIX]` **Gráfico:** nomes + barras lado a lado não cabem. Definir scroll horizontal ou fallback textual

---

## 8. Paleta e convivência com a diretriz anti-slop

### 8.1 `[FIX]` Nova paleta — Ardósia

O bege atual (`#F4F1EA`, quente, próximo de creme) está dentro do agrupamento mais reconhecível de design gerado por IA: fundo creme + display de alto contraste + acento único. Como existe uma diretriz anti-slop no projeto, o fundo é justamente onde a marca ficou mais visível.

Trocar por um neutro **frio**. O subtom azulado remove a leitura de "landing page editorial" e empurra pra "ferramenta de planejamento", que é o registro correto pro produto.

| Papel | Hex | Uso |
|---|---|---|
| Fundo da página | `#EBEEF1` | canvas |
| Superfície | `#FFFFFF` | cards, tabela, inputs |
| Hairline | `#C6CDD4` | bordas, divisores |
| Texto secundário | `#67717C` | labels, premissas, hints |
| Tinta / acento | `#14584A` | número-chave, chip ativo, barras |
| Texto primário | `#18212A` | corpo e títulos |

Regras de aplicação:

- O verde é **tinta**, não acento de marca. Usar com parcimônia — número-chave, chip ativo, barra do gráfico. Se ele aparecer em tudo, cai no segundo agrupamento genérico (neutro + acento vibrante).
- Elimina de quebra o problema de 1.9: o preto do chip selecionado sai, o verde assume.
- **Revalidar contraste** (1.11) depois da troca. O fundo mudou de luminância; os pares antigos não valem mais.

**Evitar:** dark mode (isso é peça que alguém exporta e mostra pra cliente — fundo escuro imprime mal e lê como dashboard interno) e branco puro sem subtom com estrutura só de hairlines (é o terceiro agrupamento genérico, o layout broadsheet).

### 8.2 `[FIX]` Numerais tabulares em fonte mono

Provavelmente o maior ganho de credibilidade da revisão inteira, e é uma linha de CSS.

Nos prints, `R$ 16.000` / `R$ 14.000` / `R$ 15.000` não alinham verticalmente na tabela porque a fonte é proporcional — o olho lê como texto corrido, não como planilha.

```css
font-variant-numeric: tabular-nums;
```

Aplicar em toda célula numérica da Composição, nos cards de resultado e no risk score, com uma face mono para os valores. Número que entra em coluna parece calculado; número em fonte proporcional parece escrito.

### 8.3 Duas exceções explícitas à diretriz anti-slop

A diretriz do projeto é boa e a revisão acima a reforça em vários pontos. Mas há dois lugares onde aplicá-la ao pé da letra **quebra o produto**. Registrar como exceção consciente:

**Exceção 1 — os quatro cards de resultado não são "faixa de estatísticas".**

`Squad sugerido / Custo mensal / Prazo / Investimento total` são visualmente idênticos ao padrão que a regra #4 proíbe. Mas a regra fala de prova social decorativa (`+250 processos`, `98% satisfação`) — números que existem pra dar autoridade e poderiam ser removidos sem perda.

Aqui os números **são o produto**. São a resposta que o usuário veio buscar. Passam o teste da regra central com folga: removê-los destrói a página. **Não desmontar, não incorporar em outra seção, não reduzir.**

**Exceção 2 — sem animação de contagem.**

A regra #5 sugere contagem a partir de zero, odômetro e stagger quando uma faixa de números se justifica. **Não aplicar aqui.** Ver `R$ 0` subindo até `R$ 57.000` num orçamento parece truque de landing page e mina exatamente a credibilidade que o produto vende. Números de estimativa aparecem prontos.

Stagger discreto na entrada dos blocos é aceitável. Contagem de valor, não.

---

## 9. Checklist de aceite

Verificar em 375px e desktop, com teclado e leitor de tela.

**Números**
- [ ] Nenhum decimal com ponto na UI
- [ ] Prazo em faixa ou arredondado
- [ ] Derivados do prazo coerentes com a faixa
- [ ] Custo por pessoa e total visíveis em quantidade > 1
- [ ] Risk score com escala e fatores somando o total
- [ ] Formatação passando por módulo único

**Integridade do resultado**
- [ ] Score de risco: base + todos os fatores somando o total exibido
- [ ] Nenhum driver truncado em silêncio (`+N outros` expansível ou lista completa)
- [ ] Estouro de orçamento como alerta próprio, fora da fila de drivers
- [ ] Zod como dependência direta, schema em `ProposedSquadChange`
- [ ] Falha de parse não renderiza números parciais
- [ ] Checagem de contradição narrativa × composição
- [ ] Todos os pontos de número cru mapeados (6.11) antes de corrigir

**Estados**
- [ ] Erro de API específico por tipo, escopo preservado
- [ ] Progresso por etapa das 3 chamadas, não spinner
- [ ] Cancelar durante o loading
- [ ] Recálculo mantém números antigos visíveis
- [ ] Recálculo não reverte edição manual
- [ ] Alerta de estouro de teto com sugestão de corte
- [ ] Escopo insuficiente / fora de domínio / gigante tratados
- [ ] Loading com progresso
- [ ] Skeleton derivado de shell compartilhado, CLS medido

**Acessibilidade**
- [ ] `role="radiogroup"`/`radio` nos single-select, `aria-pressed` só nos multi
- [ ] `scope="col"` nos `<th>` da Composição
- [ ] Seleção por dois canais
- [ ] Pares texto/fundo passando AA — tabela antes/depois reportada
- [ ] Tabela semântica
- [ ] Gráfico com alternativa textual
- [ ] Foco visível
- [ ] `prefers-reduced-motion`

**Paleta e tipografia**
- [ ] Paleta Ardósia aplicada, bege removido
- [ ] Verde usado com parcimônia, não em tudo
- [ ] Contraste revalidado depois da troca de fundo
- [ ] `tabular-nums` + face mono em toda célula numérica
- [ ] Nenhuma animação de contagem em valor
- [ ] Cards de resultado preservados (exceção 8.3)

**Layout**
- [ ] Container consistente entre seções
- [ ] Headline quebrando na pontuação
- [ ] Negociação alinhada, sem texto duplicado da 03
- [ ] Enviar com aparência de primária
- [ ] Composição usável em 375px
- [ ] Numeração só no fluxo 01–03, blocos internos sem número
- [ ] Resumo sticky
- [ ] Link de dev escondido
- [ ] Botão "N" resolvido

**Fixtures**
- [ ] 5 fixtures no formato exato da API
- [ ] Validado visualmente nos 5

---

*Em conflito entre bonito e auditável, auditável ganha.*
