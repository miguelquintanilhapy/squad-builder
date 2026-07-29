# 🚀 CLAUDE.md - SquadBuilder Project & Discovery Guide

## ⚠️ O Problema Real do Mercado (A Dor que Resolvemos)

Na hora de criar um produto digital, quase todo fundador cai em um destes dois extremos perigosos:

1. **Subestimar o Projeto (A Armadilha do Escopo Curto):**
   * O fundador desmerece a complexidade do software, acha tudo "simples" e contrata pouquíssimas pessoas (ou tenta colocar tudo nas costas de 1 único dev).
   * **Consequência:** O time sofre com sobrecarga e burnout, o prazo estoura de longe, o sistema é lançado cheio de bugs e o objetivo de negócio não é alcançado.

2. **Superestimar o Projeto (A Armadilha do Queima de Caixa):**
   * Por medo ou falta de conhecimento técnico, o fundador contrata um squad enorme com seniors, especialistas e papéis desnecessários para a fase atual.
   * **Consequência:** O custo mensal fica gigante, a empresa queima o orçamento (runway) antes do MVP validar no mercado e o projeto quebra por falta de dinheiro.

🎯 **A Missão do SquadBuilder:** Servir como uma "camada de equilíbrio e realidade". A IA analisa a fundo o escopo digitado e encontra o **ponto ótimo** entre time, custo, prazo e risco, permitindo que o fundador negocie e veja as consequências reais antes de gastar um único centavo em contratações.

---

## 💡 A Ideia (O que é o SquadBuilder?)
O **SquadBuilder** é um copiloto de inteligência artificial interativo para fundadores, CTOs e gestores de produto dimensionarem equipes de engenharia de software e analisarem riscos de desenvolvimento.

A experiência funciona em um fluxo dinâmico de entrada e negociação:
1. **Entrada Híbrida:** O usuário define parâmetros rápidos via seletores/chips e detalha o escopo e regras de negócio em texto livre.
2. **Diagnóstico Inicial:** A IA analisa a fundo as entradas, sugere a composição ideal da equipe (Squad), calcula custos/prazos realistas e mapeia os riscos de engenharia.
3. **Simulação Interativa (Feedback & Negociação):** O usuário pode questionar e alterar a sugestão da IA em tempo real (ex: *"E se ao invés de 2 devs eu contratar apenas 1 Fullstack?"* ou *"E se eu reduzir o prazo para 2 meses?"*).
4. **Análise de Consequências:** A IA recalcula o cenário na hora e devolve o impacto exato dessa decisão (aumento do Risk Score, risco de burnout, atraso previsível no MVP, perda de qualidade/testes, etc.) até o usuário chegar no formato ideal.

---

## 🎯 Seu Papel como Claude
Você atuará como um **Co-fundador Técnico e Arquiteto de Software Sênior**. 
1. **Discussão de Stack:** Vamos definir as tecnologias (Front-end, Back-end, Banco de Dados, APIs de IA) passo a passo juntos. Não assuma ferramentas fixas antes de discutirmos.
2. **Refinamento da Arquitetura de Conversa:** Me ajude a desenhar a API e o gerenciamento de estado para suportar o fluxo híbrido e a negociação de escopo vs. consequência.
3. **Desenvolvimento Guiado:** Escreva código limpo, modular, moderno e fortemente tipado à medida que definirmos as partes do sistema.
Quero que você assuma seu papel de Co-fundador Técnico e me faça uma **entrevista profunda**, me questionando ponto a ponto sobre:
1. Nossas escolhas de **Stack Tecnológica** (Front, Back, Banco de Dados, Orquestração e LLM).
2. A **arquitetura da memória** para o fluxo de negociação (como manter o estado da conversa e recalculá-lo).
3. Detalhes da **UX/UI** e regras do nosso modelo de dados.

Faça perguntas inteligentes,para irmos afunilando a ideia até termos um plano de ação imbatível.

## 🎨 Diretrizes Globais de Interface & UI (Design System)

* **Estilo Visual:** SaaS B2B moderno, limpo e profissional (Inspirado em interfaces executivas como Linear.app, Vercel e Stripe).
* **Tema Visual:** **Dark Mode exclusivo** (Fundo escuro profundo em tons de Zinc/Slate `#09090b` e `#18181b`, com containers e cards usando bordas finas e sutis em `#27272a`).
* **Cor de Destaque:** **Azul Corporativo sólido** (`#2563EB` / `#1D4ED8`) usado de forma pontual e sóbria apenas em botões de ação primários, seleções de foco e badges de destaque.
* **RESTRIÇÃO SEVERA:** Não utilize gradientes coloridos chamativos, brilhos neon (glow), nem "glassmorphism" exagerado (evitar visual clichê de IA).

### Estrutura do Layout (Grid de 2 Colunas):
* **Coluna Esquerda (Inputs Híbridos & Interação):**
  * **Campos Selecionáveis (Chips / Dropdowns de Acesso Rápido):**
    * *Tipo de Produto:* Web App, Mobile App, Desktop, API/Backend, SaaS B2B, Marketplace.
    * *Plataforma Alvo:* iOS, Android, Web Browser, Multi-plataforma.
    * *Estágio do Projeto:* Ideia no Papel, Protótipo/Figma, MVP rodando, Produto Legado.
    * *Nível de Complexidade Esperado:* Baixo, Médio, Enterprise.
  * **Campo de Texto Livre (O Elemento Principal):** `textarea` amplo e expansível com a label *"Descrição do Projeto / Escopo"* para detalhamento de regras de negócio, diferenciais e integrações.
  * **Filtros Numéricos Opcionais:** Prazo Alvo (meses) e Orçamento Mensal Estimado (R$/$).
  * **Botão de Ação Primária:** Botão grande em Azul Corporativo *"Analisar Projeto com IA"*.
  * **Chat de Negociação / Histórico:** Campo de texto secundário para envio de ajustes e réplicas durante a simulação.

* **Coluna Direita (Dashboard Dinâmico de Resultados):**
  * **Cards de Métricas Superiores:** Custo Total Mensal, Prazo Real Estimado e Total de Devs Sugeridos.
  * **Header de Resumo da Análise:** Card com a síntese do entendimento da IA e badge visual de **Risk Score** (`0/100` a `100/100`).
  * **Visualização da Equipe Recomendada (Squad):** Grid de cards mostrando Cargo, Quantidade, Senioridade, Custo Individual e Justificativa Técnica.
  * **Painel de Alertas de Risco & Recomendações:** Bloco de notas técnicas e alertas dinâmicos de impacto.

---

## 🔄 Exemplo Prático do Fluxo de Negociação (User vs. SquadBuilder)

* **Usuário (Entrada Inicial Híbrida):** * *Campos:* Mobile App + Web | Estágio: Ideia | Complexidade: Média.
  * *Texto Livre:* *"Quero criar um aplicativo estilo Uber de entregas locais com motos."*
* **SquadBuilder (Diagnóstico Inicial):**
  * **Squad Sugerido:** 1 Dev Mobile, 1 Dev Backend, 1 Designer UX/UI, 1 QA.
  * **Custo/Mês:** R$ 32.000 | **Prazo:** 4 meses | **Risk Score:** 25/100 (Baixo).

* **Usuário (Interação/Alteração):** *"Achei caro. Quero tirar o QA e o Designer, e colocar só 1 Dev Fullstack para fazer tudo em 3 meses."*
* **SquadBuilder (Retorno de Consequências):**
  * ⚠️ **Risk Score disparou:** 85/100 (Crítico).
  * 🔴 **Alertas de Impacto:**
    * **Gargalo de UX:** Sem designer, a usabilidade do app do entregador pode causar alto abandono.
    * **Bugs em Produção:** Sem QA, falhas no pagamento ou no GPS serão descobertas diretamente pelos clientes.
    * **Risco de Atraso:** A carga de trabalho para 1 único Dev cobrir Mobile + API + Painel Admin excede 3 meses. Prazo real estimado subiu para 7 meses.
  * 💡 **Sugestão de Meio-Termo:** *"Mantenha 1 Dev Fullstack + 1 Designer em meio período para garantir a experiência sem estourar o orçamento."*

---

## 💡 Outros Casos de Uso para Teste da IA

### Caso 1: MVP de Startup Enxuta
* **Inputs:** Web App | Ideia | Complexidade Baixa.
* **Texto:** *"Plataforma B2B simples de agendamento online para barbearias. Orçamento R$ 10k/mês."*
* **Objetivo:** Validar se a IA sugere um time minimalista sem inflar custos.

### Caso 2: Plataforma Enterprise / IA
* **Inputs:** SaaS B2B + API | Produto em Tração | Complexidade Enterprise.
* **Texto:** *"SaaS de análise financeira conectando APIs bancárias e LLMs com suporte a milhares de requisições. Budget R$ 60k/mês."*
* **Objetivo:** Validar se a IA identifica a necessidade de perfis sêniores (DevOps, Sec, Data Engineer).
