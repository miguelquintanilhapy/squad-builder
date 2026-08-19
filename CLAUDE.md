# CLAUDE.md - SquadBuilder Project & Discovery Guide

##O Problema Real do Mercado (A Dor que Resolvemos)

Na hora de criar um produto digital, quase todo fundador cai em um destes dois extremos perigosos:

1. **Subestimar o Projeto (A Armadilha do Escopo Curto):**
   * O fundador desmerece a complexidade do software, acha tudo "simples" e contrata pouquíssimas pessoas (ou tenta colocar tudo nas costas de 1 único dev).
   * **Consequência:** O time sofre com sobrecarga e burnout, o prazo estoura de longe, o sistema é lançado cheio de bugs e o objetivo de negócio não é alcançado.

2. **Superestimar o Projeto (A Armadilha do Queima de Caixa):**
   * Por medo ou falta de conhecimento técnico, o fundador contrata um squad enorme com seniors, especialistas e papéis desnecessários para a fase atual.
   * **Consequência:** O custo mensal fica gigante, a empresa queima o orçamento (runway) antes do MVP validar no mercado e o projeto quebra por falta de dinheiro.

**A Missão do SquadBuilder:** Servir como uma "camada de equilíbrio e realidade". A IA analisa a fundo o escopo digitado e encontra o **ponto ótimo** entre time, custo, prazo e risco, permitindo que o fundador negocie e veja as consequências reais antes de gastar um único centavo em contratações.

---

## A Ideia (O que é o SquadBuilder?)
O **SquadBuilder** é um copiloto de inteligência artificial interativo para fundadores, CTOs e gestores de produto dimensionarem equipes de engenharia de software e analisarem riscos de desenvolvimento.

A experiência funciona em um fluxo dinâmico de entrada e negociação:
1. **Entrada Híbrida:** O usuário define parâmetros rápidos via seletores/chips e detalha o escopo e regras de negócio em texto livre.
2. **Diagnóstico Inicial:** A IA analisa a fundo as entradas, sugere a composição ideal da equipe (Squad), calcula custos/prazos realistas e mapeia os riscos de engenharia.
3. **Simulação Interativa (Feedback & Negociação):** O usuário pode questionar e alterar a sugestão da IA em tempo real (ex: *"E se ao invés de 2 devs eu contratar apenas 1 Fullstack?"* ou *"E se eu reduzir o prazo para 2 meses?"*).
4. **Análise de Consequências:** A IA recalcula o cenário na hora e devolve o impacto exato dessa decisão (aumento do Risk Score, risco de burnout, atraso previsível no MVP, perda de qualidade/testes, etc.) até o usuário chegar no formato ideal.

---

## Seu Papel 
Você atuará como um **Co-fundador Técnico e Arquiteto de Software Sênior**. 
1. **Discussão de Stack:** Vamos definir as tecnologias (Front-end, Back-end, Banco de Dados, APIs de IA) passo a passo juntos. Não assuma ferramentas fixas antes de discutirmos.
2. **Refinamento da Arquitetura de Conversa:** Me ajude a desenhar a API e o gerenciamento de estado para suportar o fluxo híbrido e a negociação de escopo vs. consequência.
3. **Desenvolvimento Guiado:** Escreva código limpo, modular, moderno e fortemente tipado à medida que definirmos as partes do sistema.
Quero que você assuma seu papel de Co-fundador Técnico e me faça uma **entrevista profunda**, me questionando ponto a ponto sobre:
1. Nossas escolhas de **Stack Tecnológica** (Front, Back, Banco de Dados, Orquestração e LLM).
2. A **arquitetura da memória** para o fluxo de negociação (como manter o estado da conversa e recalculá-lo).
3. Detalhes da **UX/UI** e regras do nosso modelo de dados.

Faça perguntas inteligentes,para irmos afunilando a ideia até termos um plano de ação imbatível.

## Diretrizes Globais de Interface & UI (Design System)

> Esta seção reflete o estado real da interface implementada (`src/app/globals.css`,
> `src/components/`), não o mockup original de planejamento — atualizada após o redesign
> completo e as rodadas de ajuste de UI/UX.

* **Estilo Visual:** SaaS B2B moderno, limpo e profissional (ferramenta de planejamento, não
  landing page editorial).
* **Tema Visual:** **Light mode exclusivo**, paleta neutra e fria (não bege/creme, que lê como
  "landing gerada por IA"). Tokens reais (`globals.css`):
  * Fundo da página (`--paper`): `#f7f8fa`
  * Superfície recuada / cabeçalho de painel (`--paper-2`): `#e4e7eb`
  * Superfície elevada — cards, tabela, inputs (`--paper-3`): `#ffffff`
  * Texto primário (`--ink`): `#18212a`
  * Texto secundário — labels, premissas, hints (`--ink-2`/`--ink-3`): `#636d78`
  * Hairline / divisores (`--rule`/`--rule-2`): `#c6cdd4` / `#e3e6ea`
* **Cor de Destaque:** **Verde petróleo sólido** (`--petrol`, `#14584a`) — não azul. Usado com
  parcimônia: número-chave, chip/estado selecionado, barra da curva de alocação, botão primário.
* **Cores semânticas de estado** (nunca só a cor sozinha comunica o estado — sempre com um
  segundo canal: ícone, texto, ou formato):
  * **Verde** (`--moss` `#2c7458` / `--petrol`): seleção, resultado positivo, economia, risco baixo.
  * **Âmbar** (`--ochre` `#965d0a`): atenção, aumento de risco, estouro de teto, trade-off. **Nunca
    vermelho só porque um número aumentou** — vermelho é só para erro real.
  * **Vermelho** (`--rust` `#9c3a21`): reservado a erro genuíno (falha de API, validação bloqueante).
* **Elevação, não borda:** hierarquia visual vem de sombra leve (`--shadow-raised`) e espaço, não
  de linhas/bordas por toda parte.
* **RESTRIÇÃO SEVERA:** sem gradientes chamativos, brilho neon (glow), glassmorphism, dark mode,
  ou qualquer visual clichê de "produto gerado por IA".

### Estrutura do Layout (Fluxo Vertical de Seções, não grid de 2 colunas)

O layout evoluiu de um grid de 2 colunas (mockup original) para um **fluxo vertical único**, uma
seção por etapa da jornada, cada uma ocupando a largura do container (`.wrap`, até 1680px):

1. **Hero:** headline de impacto ("Descreva seu projeto. Monte o squad ideal.") + subtítulo +
   botão primário ("Descrever meu projeto →"). Sem segunda frase de impacto, bastante espaço em
   branco.
2. **Entrada** ("Descreva seu projeto"): `textarea` livre e amplo (campo principal) + coluna
   lateral com chips de classificação rápida (Tipo de Produto, Plataforma, Estágio,
   Complexidade — via `ReadingGrid`/`ConstraintFields`) e os campos opcionais de Prazo
   alvo/Teto mensal.
3. **Entendimento do projeto:** leitura de escopo inferida pela IA, editável por chip
   (`ReadingGrid`) — corrigir nunca reverte em silêncio, sempre com indicador de campo editado e
   opção de restaurar.
4. **Squad recomendado:** KPIs (Squad sugerido, Custo mensal, Prazo estimado, Investimento
   estimado), curva de alocação por papel/mês, Composição do Squad (nome do papel clicável →
   modal com a justificativa), "Por que este squad?" (explicação determinística da composição) e
   Índice de risco (fatores com peso, premissas editáveis colapsadas).
5. **Negociação:** histórico de ajustes + trilha de decisões comparável (versionamento) + impacto
   do ajuste (custo/prazo/risco com trade-off explicado em texto).

* **Header sticky:** logo + tagline até haver resultado; depois vira resumo dinâmico
  ("Squad de N pessoas · R$X/mês · Y meses") que acompanha o scroll.
* **Modais:** overlay com backdrop (fade) + card (fade + leve scale/subida via Motion), fecha por
  clique fora, Esc ou botão fechar — usado pra detalhe pontual (ex: justificativa de um papel),
  não pra navegação estrutural.

### Nomenclatura padrão (consistência de copy)

* Sempre **"squad"** — nunca alternar com "time" ou "equipe" pro squad recomendado.
* Sempre **"projeto"** (não "produto") ao se referir ao que o usuário está descrevendo/construindo.
* **"custo mensal"**, **"R$ X/mês"**, **"prazo estimado"**, **"teto mensal"** como termos fixos.
* Nomes de cargo por extenso: "Desenvolvedor Mobile", "Desenvolvedor Front-end" etc. (não "Dev"),
  formato `Cargo — Senioridade` com travessão.

---

##  Exemplo Prático do Fluxo de Negociação (User vs. SquadBuilder)

* **Usuário (Entrada Inicial Híbrida):** * *Campos:* Mobile App + Web | Estágio: Ideia | Complexidade: Média.
  * *Texto Livre:* *"Quero criar um aplicativo estilo Uber de entregas locais com motos."*
* **SquadBuilder (Diagnóstico Inicial):**
  * **Squad Sugerido:** 1 Desenvolvedor Mobile, 1 Desenvolvedor Backend, 1 Designer UX/UI, 1 QA.
  * **Custo mensal:** R$ 32.000 | **Prazo:** 4 meses | **Índice de risco:** 25/100 (Baixo).

* **Usuário (Interação/Alteração):** *"Achei caro. Quero tirar o QA e o Designer, e colocar só 1 Desenvolvedor Fullstack para fazer tudo em 3 meses."*
* **SquadBuilder (Retorno de Consequências):**
  *  **Índice de risco disparou:** 85/100 (Crítico).
  * **Alertas de Impacto:**
    * **Gargalo de UX:** Sem designer, a usabilidade do app do entregador pode causar alto abandono.
    * **Bugs em Produção:** Sem QA, falhas no pagamento ou no GPS serão descobertas diretamente pelos clientes.
    * **Risco de Atraso:** A carga de trabalho para 1 único Desenvolvedor cobrir Mobile + API + Painel Admin excede 3 meses. Prazo real estimado subiu para 7 meses.
  *  **Como reduzir o risco:** *"Mantenha 1 Desenvolvedor Fullstack + 1 Designer em meio período para garantir a experiência sem estourar o orçamento."*

---

## Outros Casos de Uso para Teste da IA

### Caso 1: MVP de Startup Enxuta
* **Inputs:** Web App | Ideia | Complexidade Baixa.
* **Texto:** *"Plataforma B2B simples de agendamento online para barbearias. Orçamento R$ 10k/mês."*
* **Objetivo:** Validar se a IA sugere um squad minimalista sem inflar custos.

### Caso 2: Plataforma Enterprise / IA
* **Inputs:** SaaS B2B + API | Produto em Tração | Complexidade Enterprise.
* **Texto:** *"SaaS de análise financeira conectando APIs bancárias e LLMs com suporte a milhares de requisições. Budget R$ 60k/mês."*
* **Objetivo:** Validar se a IA identifica a necessidade de perfis sêniores (DevOps, Sec, Data Engineer).
