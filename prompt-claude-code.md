# Refatorar o SquadBuilder para a interface do POC

## Contexto

Na raiz do projeto existe `squadbuilder-poc.html` — um POC de interface autocontido (HTML + CSS + JS inline, sem build). Ele representa a direção visual e de fluxo **aprovada**. A interface atual do app foi rejeitada por parecer template genérico.

Sua tarefa é reconstruir a interface do app existente seguindo esse POC, integrando-a à arquitetura de componentes que já existe — **não** portando o HTML como uma página monolítica.

## Antes de escrever qualquer código

1. Leia `squadbuilder-poc.html` inteiro, incluindo o `<style>` e o `<script>`.
2. Mapeie o código atual: stack, roteamento, sistema de estilo (Tailwind? CSS Modules? styled-components?), onde vivem os tokens de design hoje, quais componentes renderizam o formulário e o resultado.
3. Me entregue um **plano** com: lista de arquivos a criar, alterar e deletar; onde os tokens vão morar; como o fluxo novo se encaixa no roteamento/estado atual; e o que você identificou como risco.
4. **Espere minha aprovação do plano antes de codar.**

---

## 1. Tokens de design (valores exatos, sem improvisar)

Centralize em **um único lugar** (tema do Tailwind, arquivo de CSS custom properties, ou o que a stack já usar). Nenhum hex literal espalhado em componente.

```
--paper      #E9EBE7   fundo da página
--paper-2    #F5F6F3   superfície elevada (cabeçalhos de painel, affixes)
--paper-3    #FDFDFC   superfície de conteúdo (cards, campos)
--ink        #14201D   texto principal e botão primário
--ink-2      #4E5A56   texto secundário
--ink-3      #818B87   rótulos, notas, texto terciário
--rule       #CBD0C9   divisor forte
--rule-2     #DDE0DA   divisor fraco / bordas de campo
--petrol     #14554E   cor estrutural da marca, barras de dados, foco
--ochre      #A9690B   risco moderado
--rust       #9C3A21   risco alto / crítico
--moss       #2C7458   risco baixo
```

Regras:
- Raio de borda: **3px** em campos, cards e botões; `999px` só nos chips de exemplo. Nada de raio uniforme grande.
- Separação por **hairline de 1px**, não por sombra. A única sombra permitida é o deslocamento de 3px em `--petrol` no hover do botão primário.
- Foco visível: `2px solid var(--petrol)` com offset, mais `box-shadow 0 0 0 3px rgba(20,85,78,.13)` em campos.
- **Delete os tokens antigos** ao final. Não empilhe paleta nova sobre a velha deixando CSS morto.

## 2. Tipografia

Duas famílias, e só duas:

| Papel | Família | Uso |
|---|---|---|
| Display | **Bricolage Grotesque** (700/800) | h1, h2, títulos de painel, valores numéricos grandes, número do risk score, wordmark |
| Corpo/UI | **IBM Plex Sans** (400/500/600) | todo o resto, sem exceção |

- Display sempre com tracking negativo (`-.02em` a `-.045em`, mais negativo quanto maior).
- Rótulos pequenos: 12.5px, peso 500, `--ink-3`, **sentence case**, `letter-spacing: 0`.
- Números em tabela e KPI: `font-variant-numeric: tabular-nums` + `font-feature-settings: "tnum" 1`, alinhados à direita. É isso que alinha as casas — não é preciso fonte monoespaçada.
- Carregue as fontes com `display=swap` e defina fallbacks de sistema.

## 3. Lista negra — não reintroduzir em nenhuma tela

Estes são os padrões que fizeram a interface anterior ser rejeitada. Vale para as telas do POC **e para qualquer tela nova que você criar**:

- ❌ **Fonte monoespaçada em qualquer lugar da UI.** Mono só se houver largura fixa de caractere fazendo trabalho real: código, diff, hash, ID, chave de API, payload de export. Rótulo, chip, KPI, badge e nota **não** são esses casos.
- ❌ Rótulo em CAIXA ALTA com `letter-spacing` largo.
- ❌ Índigo/violeta padrão do Tailwind (`indigo-500/600`), `gray-50`, `slate-*` como neutro.
- ❌ `rounded-lg`/`rounded-xl` aplicado uniformemente a tudo.
- ❌ Logo de quadrado arredondado com gradiente e ícone abstrato dentro. O mark do POC são três barras verticais crescentes (rampa de headcount) em SVG inline — use ele.
- ❌ Empty state com ícone centralizado + título em bold + três linhas de texto cinza explicando o que o botão faz. Se não há resultado, a seção de resultado **não existe no DOM**.
- ❌ "IA", "AI", "com IA", "powered by" em label de botão ou título de seção. O controle nomeia a ação.
- ❌ Estado desabilitado como cor primária com opacidade baixa. Desabilitado é outline neutro **mais** uma mensagem dizendo o que falta.
- ❌ Placeholder repetido ("Opcional" em dois campos). Cada campo tem affixo próprio (`R$` antes, `meses` depois).
- ❌ Layout dividido 50/50 com metade vazia esperando conteúdo.
- ❌ Emoji como ícone; ícone decorativo que não muda o entendimento.
- ❌ Animação espalhada. Só o reveal escalonado do resultado (`.rv` + delays de 20/100/180/260ms), respeitando `prefers-reduced-motion`.

## 4. Mudança de fluxo — isto é produto, não só visual

O app hoje pede seis grupos de chips **antes** de qualquer texto. Inverta:

1. **Escopo primeiro.** A tela abre com um textarea grande (papel milimetrado ao fundo, `background-size: 100% 26px` alinhado ao `line-height`), contador de caracteres, e quatro exemplos clicáveis que preenchem e disparam a análise.
2. Botão primário travado abaixo de ~40 caracteres, com mensagem dizendo quantos faltam.
3. **Depois** da análise, aparece a seção "O que entendemos": as quatro dimensões (tipo de produto, plataforma, estágio, complexidade) já **inferidas** do texto, como chips editáveis. Clicar recalcula na hora. Nada de recarregar ou de segundo submit.
4. Abaixo, a lista de sinais detectados no texto, com os não-detectados riscados em cinza — o usuário vê o raciocínio, não só o resultado.
5. Resultado: quatro KPIs, a curva de alocação, a tabela de composição, o risk score com os três drivers de maior peso e as premissas assumidas.

### A inferência é chamada de modelo, não a heurística do POC

A função `infer()` do POC é stub de demonstração por regex. **Não porte ela.** Substitua por uma chamada ao modelo, server-side, com este contrato de saída:

```json
{
  "dimensoes": { "tipo": "Marketplace", "plataforma": "Web + mobile",
                 "estagio": "Ideia no papel", "complexidade": "Alta" },
  "sinais": ["mobile", "realtime", "payments", "market"],
  "prazoMeses": 8,
  "papeis": [{ "nome": "Eng. Backend Sênior", "alocacao": 1, "mesInicio": 1, "mesFim": 8 }],
  "riscos": [{ "peso": 16, "texto": "..." }],
  "premissas": ["..."]
}
```

Regras da integração:
- O modelo **não devolve dinheiro**. Custo é calculado a partir de uma tabela de tarifas versionada no código (`RATE` no POC), multiplicada por alocação e janela. Preço inventado por modelo é passivo, não feature.
- Valide a resposta contra um schema. Dimensão fora do enum → cai no default e loga.
- Estado de carregamento: skeleton nos blocos que vão aparecer, não spinner centralizado bloqueando a tela.
- Erro: mensagem no lugar do resultado dizendo o que falhou e oferecendo "tentar de novo". Sem tom de desculpa, sem vago.

## 5. Componentização esperada

Quebre em componentes reais da stack, com props tipadas. Sugestão de fronteiras:

```
ScopeField        textarea + grid + contador + exemplos
ConstraintFields  prazo alvo e teto mensal, com affixos
ReadingGrid       as 4 dimensões editáveis + sinais detectados
KpiStrip          4 métricas
AllocationChart   o SVG da curva (assinatura da interface)
CompositionTable  tabela de papéis
RiskPanel         score + drivers + premissas
```

O `AllocationChart` é o elemento de assinatura — o que a interface tem que ninguém copia. Reescreva o SVG do POC como componente que recebe `papeis`, `prazoMeses` e devolve as barras por papel mais o histograma de FTE por mês. Mantenha: `viewBox` de largura fixa com altura derivada da contagem de papéis, gutter de rótulos de 170, alocação parcial como barra mais fina e clara com o percentual ao lado, pico do histograma em fill mais escuro. Container com `overflow-x: auto` e `min-width` para não amassar no mobile.

## 6. Densidade e ritmo

A queixa foi de excesso de respiro. Calibragem final do POC:

- Container: `max-width: 1300px`, padding lateral 22px (15px no mobile).
- Seções: 32px vertical, separadas por hairline (26px no mobile).
- Espaço entre painéis: 18px.
- Célula de tabela: `8px 15px`. Cabeçalho: `9px 15px`.
- Colunas numéricas com largura fixa de 128px (`auto` abaixo de 760px) — sem isso os números se espalham em telas largas.
- Coluna de texto corrido nunca passa de ~56–60ch, mesmo com container largo.

## 7. Não mexer

- Lógica de negócio, contratos de API existentes, autenticação, camada de dados.
- Testes que já passam. Se a refatoração quebrar teste, **conserte o teste junto** e me diga o que mudou.
- Não instale biblioteca de componentes nem de gráficos. O SVG é escrito à mão; não há dependência nova justificada aqui.

## 8. Piso de qualidade

- Responsivo até 360px de largura. Tabela e timeline com scroll horizontal, grades colapsando para uma coluna.
- Navegável por teclado, foco visível em tudo que é interativo. Chips de dimensão como `button` com `aria-pressed`. SVG com `role="img"` e `aria-label` descritivo.
- `prefers-reduced-motion: reduce` desliga animação e transição.
- Contraste AA no texto sobre `--paper` e `--paper-3`.
- Sem `console.log` nem código morto no final.

## 9. Processo

Trabalhe em etapas, commitando entre elas:

1. Tokens e tipografia centralizados; fontes carregando.
2. Layout base, header e a seção de escopo.
3. Inferência real integrada, com validação de schema, loading e erro.
4. Seção de leitura editável com recálculo.
5. KPIs, tabela e risk score.
6. `AllocationChart`.
7. Limpeza: remoção dos tokens e componentes antigos, CSS morto, teste manual mobile.

No final, me entregue:
- diff resumido por arquivo
- screenshots em 1440px e 390px de largura
- checklist da lista negra da seção 3, item por item, dizendo onde cada um foi verificado
- o que você decidiu diferente do POC e por quê

O POC é a direção, não escritura. Se algo nele conflitar com uma restrição real do código, **me avise antes de divergir** — não resolva silenciosamente.
