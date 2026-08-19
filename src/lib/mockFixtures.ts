import { ProjectInput, Scenario, ScopeAnalysis, SquadMember } from '@/types'
import { computeScenario } from './calculator'

/**
 * Fixtures pra estressar a UI com casos de borda que o fluxo real raramente produz de primeira
 * (squad grande, muitos fatores de risco somados, estouro de orçamento) — sem gastar cota da API.
 * Squad/scope/input são escritos à mão e passam pelo motor determinístico real (computeScenario),
 * então os números sempre fecham como fechariam numa resposta real da API (ver REVISAO §4:
 * "formato exato do JSON da API, não objeto conveniente pro componente").
 */

function build(squad: SquadMember[], scope: ScopeAnalysis, input: ProjectInput, summary: string, midGroundSuggestion?: string): { scopeAnalysis: ScopeAnalysis; scenario: Scenario } {
  const scenario = computeScenario(squad, scope, input)
  return { scopeAnalysis: scope, scenario: { ...scenario, summary, midGroundSuggestion } }
}

/** `minimo` — layout com pouco conteúdo: 1 papel, 1 fator de risco, sem estouro de orçamento. */
function minimo() {
  const scope: ScopeAnalysis = {
    productTypes: ['web-app'],
    platforms: ['web'],
    stage: 'idea',
    complexity: 'low',
    estimatedEffortPersonMonths: 3,
    requiredCapabilities: ['admin-panel'],
    keyRisksNoted: [],
    summary: 'Painel web simples de gestão interna, escopo pequeno e bem definido.',
  }
  const input: ProjectInput = {
    productTypes: scope.productTypes,
    platforms: scope.platforms,
    stage: scope.stage,
    complexity: scope.complexity,
    description: 'Um painel web interno pra equipe de operações acompanhar pedidos do dia. Só isso, sem app mobile.',
    targetTimelineMonths: 1,
  }
  const squad: SquadMember[] = [{ role: 'dev-fullstack', seniority: 'pleno', quantity: 2, allocation: 'full-time' }]
  return build(
    squad,
    scope,
    input,
    'Escopo pequeno e bem contido: um painel administrativo simples, sem integrações externas. 2 devs fullstack cobrem front e back sem fragmentar o squad.'
  )
}

/** `grande` — estouro de layout: 8 papéis, 12 pessoas, títulos longos, ~6 meses. */
function grande() {
  const scope: ScopeAnalysis = {
    productTypes: ['mobile-app', 'web-app', 'saas-b2b'],
    platforms: ['ios', 'android', 'web'],
    stage: 'mvp-running',
    complexity: 'enterprise',
    estimatedEffortPersonMonths: 67,
    requiredCapabilities: ['payments', 'realtime-tracking', 'admin-panel', 'high-scale', 'compliance'],
    keyRisksNoted: [
      'Volume alto de transações exige arquitetura resiliente desde o início',
      'Compliance financeiro em múltiplas praças exige revisão jurídica contínua',
    ],
    summary:
      'Plataforma financeira multi-plataforma (iOS, Android, Web) em tração, com pagamentos, rastreamento em tempo real e exigência de alta escala e compliance.',
  }
  const input: ProjectInput = {
    productTypes: scope.productTypes,
    platforms: scope.platforms,
    stage: scope.stage,
    complexity: scope.complexity,
    description:
      'Plataforma financeira já em produção, precisa escalar pra múltiplas praças com processamento de pagamentos em tempo real, painel administrativo robusto e conformidade regulatória.',
    targetTimelineMonths: 6,
    monthlyBudget: 150000,
  }
  const squad: SquadMember[] = [
    { role: 'dev-mobile', seniority: 'senior', quantity: 2, allocation: 'full-time' },
    { role: 'dev-frontend', seniority: 'senior', quantity: 2, allocation: 'full-time' },
    { role: 'dev-backend', seniority: 'senior', quantity: 3, allocation: 'full-time' },
    { role: 'designer-uxui', seniority: 'senior', quantity: 1, allocation: 'full-time' },
    { role: 'qa', seniority: 'senior', quantity: 1, allocation: 'full-time' },
    { role: 'devops', seniority: 'senior', quantity: 1, allocation: 'full-time' },
    { role: 'tech-lead', seniority: 'senior', quantity: 1, allocation: 'full-time' },
    { role: 'security-specialist', seniority: 'senior', quantity: 1, allocation: 'full-time' },
  ]
  return build(
    squad,
    scope,
    input,
    'Escopo enterprise em escala: squad amplo cobrindo as 3 plataformas, com liderança técnica e especialista de segurança dedicados por conta do volume de pagamentos.'
  )
}

/** `estouro-orcamento` — alerta de custo acima do teto informado, sem outros fatores competindo. */
function estouroOrcamento() {
  const scope: ScopeAnalysis = {
    productTypes: ['web-app'],
    platforms: ['web'],
    stage: 'prototype',
    complexity: 'medium',
    estimatedEffortPersonMonths: 8,
    requiredCapabilities: ['admin-panel'],
    keyRisksNoted: [],
    summary: 'Plataforma web de médio porte, com QA e design dedicados, mas orçamento apertado.',
  }
  const input: ProjectInput = {
    productTypes: scope.productTypes,
    platforms: scope.platforms,
    stage: scope.stage,
    complexity: scope.complexity,
    description: 'Plataforma web de gestão de clientes. Orçamento é apertado, mas não quero cortar design nem QA.',
    monthlyBudget: 15000,
  }
  const squad: SquadMember[] = [
    { role: 'dev-backend', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
    { role: 'dev-frontend', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
    { role: 'designer-uxui', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
    { role: 'qa', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
  ]
  return build(
    squad,
    scope,
    input,
    'Squad completo (dev front, back, design e QA) cobre bem o escopo, mas o custo mensal passa longe do teto informado — o orçamento é a principal restrição aqui, não a composição do squad.',
    'Se o teto de R$15.000/mês for rígido, o ajuste mais direto é reduzir design ou QA pra meio período, ou renegociar o teto — o squad em si já está no tamanho certo pro escopo.'
  )
}

/**
 * `risco-alto` — breakdown de 1.4: 5 fatores somando o score (sem QA, sem designer, sem
 * segurança, burnout de 1 dev sozinho cobrindo 3 frentes, prazo alvo incompatível), risco ≥ 70.
 */
function riscoAlto() {
  const scope: ScopeAnalysis = {
    productTypes: ['mobile-app', 'web-app'],
    platforms: ['ios', 'android', 'web'],
    stage: 'idea',
    complexity: 'enterprise',
    estimatedEffortPersonMonths: 40,
    requiredCapabilities: ['payments', 'compliance', 'admin-panel'],
    keyRisksNoted: [
      'Pagamentos e compliance num escopo enterprise sem revisão de segurança dedicada',
      '1 pessoa sozinha cobrindo mobile, web e painel admin não é sustentável',
    ],
    summary:
      'Escopo enterprise com pagamentos e exigência de compliance, cobrindo mobile (iOS/Android), web e painel administrativo — mas o squad proposto é só 1 dev fullstack.',
  }
  const input: ProjectInput = {
    productTypes: scope.productTypes,
    platforms: scope.platforms,
    stage: scope.stage,
    complexity: scope.complexity,
    description:
      'App financeiro enterprise com pagamentos, compliance regulatório, apps iOS e Android e painel admin web. Quero lançar com só 1 dev fullstack em 2 meses.',
    targetTimelineMonths: 2,
  }
  const squad: SquadMember[] = [{ role: 'dev-fullstack', seniority: 'pleno', quantity: 1, allocation: 'full-time' }]
  return build(
    squad,
    scope,
    input,
    '1 dev fullstack sozinho não sustenta um escopo enterprise com pagamentos, compliance e 3 frentes (mobile, web, admin) em 2 meses — o risco está concentrado em falta de QA, design, segurança e capacidade real de entrega, não em um fator isolado.',
    'Pelo menos separe backend de frontend, adicione QA e um especialista de segurança antes de tocar pagamentos em produção — e renegocie o prazo, 2 meses não é factível pra esse escopo com o squad atual.'
  )
}

/**
 * `alocacao-variavel` — gráfico de 3.7: mistura full-time/part-time (teto por membro) com papéis
 * que agora também variam por mês via allocationCurve.ts (designer concentra no início, QA na
 * segunda metade) — computeScenario gera a curva real, o fixture só monta o squad.
 */
function alocacaoVariavel() {
  const scope: ScopeAnalysis = {
    productTypes: ['web-app'],
    platforms: ['web'],
    stage: 'prototype',
    complexity: 'medium',
    estimatedEffortPersonMonths: 6,
    requiredCapabilities: ['admin-panel'],
    keyRisksNoted: [],
    summary: 'Plataforma web de médio porte, começando com parte do squad em meio período pra validar antes de escalar.',
  }
  const input: ProjectInput = {
    productTypes: scope.productTypes,
    platforms: scope.platforms,
    stage: scope.stage,
    complexity: scope.complexity,
    description:
      'Plataforma web de gestão. Quero começar com backend e QA full-time, mas frontend, design e DevOps só meio período enquanto validamos.',
  }
  const squad: SquadMember[] = [
    { role: 'dev-backend', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
    { role: 'qa', seniority: 'pleno', quantity: 1, allocation: 'full-time' },
    { role: 'dev-frontend', seniority: 'pleno', quantity: 1, allocation: 'part-time' },
    { role: 'designer-uxui', seniority: 'pleno', quantity: 1, allocation: 'part-time' },
    { role: 'devops', seniority: 'senior', quantity: 1, allocation: 'part-time' },
  ]
  return build(
    squad,
    scope,
    input,
    'Backend e QA full-time sustentam o núcleo; frontend, design e DevOps entram em meio período enquanto o escopo ainda está validando — a curva de alocação reflete essa mistura por papel.'
  )
}

export const MOCK_FIXTURES: Record<string, () => { scopeAnalysis: ScopeAnalysis; scenario: Scenario }> = {
  minimo,
  grande,
  'estouro-orcamento': estouroOrcamento,
  'risco-alto': riscoAlto,
  'alocacao-variavel': alocacaoVariavel,
}
