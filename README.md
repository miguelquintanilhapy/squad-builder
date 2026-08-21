# SquadBuilder

Copiloto de IA para fundadores, CTOs e gestores de produto dimensionarem squads de engenharia de software: descreve o projeto em texto livre + alguns chips, recebe uma composição de squad sugerida com custo mensal, prazo estimado e índice de risco, e pode negociar o cenário em linguagem natural ("e se eu tirar o QA e reduzir o prazo pra 2 meses?") vendo o impacto real de cada decisão antes de contratar.

## Como rodar localmente

Pré-requisitos: Node 20+ e uma chave gratuita da API do Gemini (não pede cartão de crédito).

```bash
git clone https://github.com/miguelquintanilhapy/SquadBuilder.git
cd SquadBuilder
npm install
```

Copie o arquivo de exemplo de variáveis de ambiente e preencha sua chave:

```bash
cp .env.local.example .env.local
```

Gere a chave em [aistudio.google.com/apikey](https://aistudio.google.com/apikey) e cole em `GEMINI_API_KEY` dentro de `.env.local`. Sem isso o app builda e a interface roda, mas qualquer chamada de IA (análise de escopo, negociação) falha.

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

Outros scripts: `npm run build` (build de produção), `npm run start` (serve o build), `npm run lint` (ESLint).

### Modo de preview sem gastar cota da API

Fora de produção (`NODE_ENV !== 'production'`), a home aceita `?mock=<nome>` na URL pra carregar um cenário fixo (rodando o motor determinístico de verdade, só sem chamar o Gemini). Os fixtures disponíveis estão em `src/lib/mockFixtures.ts`. Também existe um botão "Preview" (mesmo ambiente) que carrega um cenário fixo via `src/lib/previewFixtures.ts`, útil pra testar a interface do dashboard sem digitar nada.

## Tecnologias

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (configuração via `@theme` direto em `src/app/globals.css`, sem `tailwind.config.js`)
- **Motion** (sucessor do Framer Motion) para as animações
- **@google/genai** — SDK oficial do Gemini (modelo configurável via `GEMINI_MODEL`, default `gemini-3.6-flash`)
- **Zod** — validação do JSON estruturado que volta da LLM
- **lucide-react** — ícones
- Nenhuma lib de componentes de UI (Radix, shadcn, etc.) — os poucos componentes que normalmente viriam de uma lib (menu de comando Cmd/Ctrl+K, toast) foram escritos à mão pra não trazer dependência nova só por conveniência

Sem banco de dados: todo o estado (escopo, cenário, histórico de negociação, versões) vive só no client, em memória (`useState` em `SquadBuilderApp.tsx`). Recarregar a página perde o progresso.

## Arquitetura: motor determinístico + LLM só pra interpretar/narrar

A regra central do projeto: **a IA nunca calcula custo, prazo ou risco**. Esses números sempre saem de um motor determinístico em TypeScript puro — a LLM só faz duas coisas: (1) ler texto livre e extrair dados estruturados, e (2) narrar em português os números que o motor já calculou. Isso existe pra evitar dois problemas de produto sérios: a IA "alucinar" um número diferente a cada chamada pro mesmo input, e o usuário não conseguir confiar na estimativa que vai basear uma decisão de contratação real.

```
ProjectInput (chips + texto livre)
        │
        ▼
   /api/analyze  ──▶  Gemini extrai ScopeAnalysis (tipos de produto, plataformas,
        │              estágio, complexidade, esforço estimado, capacidades exigidas)
        ▼
  /api/recompute ──▶  squadPlanner.ts sugere a composição inicial (determinístico)
        │              calculator.ts calcula custo/prazo (determinístico)
        │              riskEngine.ts calcula o índice de risco (determinístico)
        │              Gemini só narra o resumo em texto (narrateScenario)
        ▼
     Scenario (squad, custo mensal, prazo, risco, alertas, premissas)
        │
        ▼
  /api/negotiate ──▶  Gemini interpreta a mensagem de negociação em linguagem
                       natural e devolve um squad/prazo/orçamento propostos
                       (extractProposedSquad) — o motor determinístico recalcula
                       o cenário de novo a partir dessa proposta, nunca aceita
                       números que a LLM tenha calculado diretamente
```

`/api/recompute` também é o endpoint usado para qualquer correção manual que não seja uma negociação em linguagem natural — corrigir um chip da leitura de escopo, trocar PJ/CLT, editar o custo de referência de um papel. Nesses casos não há chamada de extração, só recálculo + renarração.

### Módulos principais (`src/lib`)

| Arquivo | Responsabilidade |
|---|---|
| `gemini.ts` | Único ponto de contato com a API do Gemini — extração de escopo, narração de cenário, extração de proposta de negociação |
| `narrativeGuard.ts` | Heurística que detecta contradição entre o texto narrado pela LLM e a composição real do squad (ex: narrar "sem QA dedicado" quando há QA no squad) |
| `squadPlanner.ts` | Sugere a composição inicial do squad a partir da leitura de escopo |
| `calculator.ts` | Calcula custo mensal, prazo estimado e monta o `Scenario` final |
| `riskEngine.ts` | Calcula o índice de risco (0–100) e os fatores que o compõem |
| `allocationCurve.ts` | Curva de alocação mensal por papel (ex: designer concentra no início, QA na segunda metade) |
| `squadRationale.ts` | Gera a explicação determinística de "por que este squad" |
| `negotiationImpact.ts` | Descreve o trade-off entre duas versões do cenário (custo/prazo/risco) |
| `rates.ts` | Valores de referência de custo por papel/senioridade, multiplicador CLT, capacidade por senioridade |

### Modelo de dados (`src/types/index.ts`)

```
ProjectInput  →  (LLM)  →  ScopeAnalysis  →  (motor determinístico)  →  Scenario
```

- `ProjectInput`: entrada híbrida do usuário (chips + texto livre + prazo/teto opcionais)
- `ScopeAnalysis`: leitura estruturada do escopo — o "contrato" entre a IA e o motor de cálculo
- `Scenario`: resultado final (squad, custo, prazo, risco, alertas, premissas), sempre calculado deterministicamente
- `ScenarioVersion`: snapshot completo e comparável de um cenário — cada correção de premissa ou negociação gera uma versão navegável, não só uma mensagem de chat

## Funcionalidades

- **Entrada híbrida**: chips de classificação rápida (tipo de produto, plataforma, estágio, complexidade) + campo de texto livre + prazo/teto mensal opcionais
- **Leitura de escopo editável**: a interpretação da IA aparece como chips que podem ser corrigidos manualmente — uma correção nunca é revertida em silêncio por uma nova leitura da IA
- **Dashboard do squad**: KPIs (headcount, custo mensal, prazo, investimento total), curva de alocação por papel/mês, composição do squad, explicação de "por que este squad" e índice de risco com os fatores que o compõem
- **Premissas editáveis**: modelo de contratação (PJ/CLT) e custo de referência por papel, ambos recalculando o cenário de verdade ao mudar
- **Negociação em linguagem natural**: histórico de chat + trilha de versões comparáveis, cada ajuste mostrando o trade-off real (custo/prazo/risco) antes/depois
- **Toasts de confirmação** para ações que salvam algo sem navegar (premissa salva, ajuste aplicado etc.)
- **Menu de comando** (Ctrl/Cmd+K) para navegar entre as seções
- **Fundo animado** (WebGL, ruído monocromático bem sutil) no topo da página

## Estrutura de pastas

```
src/
  app/
    api/analyze/       # extração de escopo (LLM)
    api/recompute/     # recálculo determinístico + renarração
    api/negotiate/      # negociação em linguagem natural
    layout.tsx, page.tsx
  components/          # UI (um componente por seção/painel do dashboard)
    ui/primitives.tsx  # Panel, PanelTitle, PrimaryButton, Eyebrow — vocabulário visual compartilhado
  lib/                 # motor determinístico + integração com o Gemini (ver tabela acima)
  types/index.ts       # modelo de dados central
```

## Fluxo de branches

- `main`: estável.
- `dev`: branch de trabalho compartilhada — é onde o desenvolvimento do dia a dia acontece.
