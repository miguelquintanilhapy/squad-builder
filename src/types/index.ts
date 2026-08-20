// Modelo de dados central do SquadBuilder.
// ProjectInput -> (LLM) ScopeAnalysis -> (motor determinístico) Scenario

export type ProductType =
  | 'web-app'
  | 'mobile-app'
  | 'desktop'
  | 'api-backend'
  | 'saas-b2b'
  | 'marketplace'

export type Platform = 'ios' | 'android' | 'web' | 'multi-platform'

export type ProjectStage =
  | 'idea'
  | 'prototype'
  | 'mvp-running'
  | 'legacy-product'

export type ComplexityLevel = 'low' | 'medium' | 'enterprise'

/** PJ é o padrão dos valores de referência em rates.ts; CLT aplica o multiplicador de encargos. */
export type ContractType = 'pj' | 'clt'

/** Entrada híbrida do usuário: chips/dropdowns + texto livre + filtros opcionais. */
export interface ProjectInput {
  productTypes: ProductType[]
  platforms: Platform[]
  stage: ProjectStage
  complexity: ComplexityLevel
  description: string
  targetTimelineMonths?: number
  monthlyBudget?: number
  /** Premissa editável — ausente = 'pj', o padrão dos valores de referência. */
  contractType?: ContractType
  /** Premissa editável: corrige o custo de referência mensal (PJ, tempo integral) assumido para
   * um papel — sobrescreve MONTHLY_RATE_BRL[role][seniority] só nele. */
  rateOverrides?: Partial<Record<RoleType, number>>
}

export type SeniorityLevel = 'junior' | 'pleno' | 'senior'

export type RoleType =
  | 'dev-frontend'
  | 'dev-backend'
  | 'dev-fullstack'
  | 'dev-mobile'
  | 'designer-uxui'
  | 'qa'
  | 'devops'
  | 'tech-lead'
  | 'product-manager'
  | 'data-engineer'
  | 'security-specialist'

export type AllocationType = 'full-time' | 'part-time'

export interface SquadMember {
  role: RoleType
  seniority: SeniorityLevel
  quantity: number
  allocation: AllocationType
  /** Custo mensal por pessoa, em R$. Só preenchido pelo motor de cálculo. */
  monthlyCostPerPerson?: number
  /** Explicação técnica de por que esse cargo/senioridade está no squad. */
  justification?: string
  /** % de envolvimento por mês do prazo, determinístico por arquétipo de papel (não a IA — ver
   * allocationCurve.ts). Dá à barra do gráfico uma curva real em vez de um bloco chapado. */
  monthlyAllocationPct?: number[]
}

export type RequiredCapability =
  | 'payments'
  | 'realtime-tracking'
  | 'geolocation'
  | 'chat'
  | 'notifications'
  | 'admin-panel'
  | 'third-party-integrations'
  | 'high-scale'
  | 'compliance'
  | 'ai-ml'

/**
 * Leitura estruturada do escopo, extraída pela LLM a partir do texto livre + chips.
 * É o "contrato" entre a IA e o motor de cálculo determinístico: a IA nunca calcula
 * custo/prazo/risco diretamente, só interpreta o pedido do usuário nesses campos.
 */
export interface ScopeAnalysis {
  productTypes: ProductType[]
  platforms: Platform[]
  stage: ProjectStage
  complexity: ComplexityLevel
  /** Esforço estimado para construir o escopo descrito, em pessoa-mês. */
  estimatedEffortPersonMonths: number
  requiredCapabilities: RequiredCapability[]
  /** Notas de risco identificadas pela IA na leitura do texto (ex: "GPS em tempo real é crítico"). */
  keyRisksNoted: string[]
  /** Síntese em linguagem natural do entendimento da IA sobre o projeto. */
  summary: string
}

export type RiskCategory =
  | 'ux'
  | 'quality'
  | 'timeline'
  | 'scalability'
  | 'security'
  | 'burnout'
  | 'budget'

export type RiskSeverity = 'info' | 'warning' | 'critical'

export interface RiskAlert {
  category: RiskCategory
  severity: RiskSeverity
  title: string
  description: string
  /** Quantos pontos esse alerta somou ao risk score — usado pra ordenar os drivers de maior peso. */
  weight: number
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** Estouro de teto mensal — sempre visível, fora da fila de drivers (ver riskEngine.assessRisk). */
export interface BudgetAlert {
  overageAmount: number
  suggestion: string
}

/** Resultado final calculado deterministicamente + narrado pela LLM. */
export interface Scenario {
  squad: SquadMember[]
  totalMonthlyCost: number
  estimatedTimelineMonths: number
  riskScore: number // 0-100
  riskLevel: RiskLevel
  alerts: RiskAlert[]
  /** Todos os alertas que somaram no score, ordenados por peso — nenhum é truncado em silêncio. */
  drivers: RiskAlert[]
  /** Pontos de partida do score, só pela complexidade — base + soma dos drivers = riskScore. */
  riskBase: number
  budgetAlert?: BudgetAlert
  /** Premissa editável que efetivamente entrou no cálculo de custo — não só texto exibido. */
  contractType: ContractType
  /** Premissas assumidas no cálculo (ex: sem verba de infra) — o usuário corrige a leitura acima se algo não valer. */
  assumptions: string[]
  summary: string
  midGroundSuggestion?: string
}

export interface NegotiationTurn {
  id: string
  role: 'user' | 'assistant'
  message: string
  /** Presente nos turnos do assistant: o estado do cenário após esse turno. */
  scenarioSnapshot?: Scenario
  timestamp: number
}

/** Estado completo da negociação, mantido no client (sem persistência em banco). */
export interface NegotiationState {
  projectInput: ProjectInput
  scopeAnalysis: ScopeAnalysis
  currentScenario: Scenario
  history: NegotiationTurn[]
}

/**
 * Um snapshot completo e comparável do cenário — não "chat com histórico", versionamento de
 * verdade: lista de versões, diff dos números, voltar a uma anterior, mensagem em linguagem
 * natural preservada como rótulo.
 */
export interface ScenarioVersion {
  id: string
  label: string
  scopeAnalysis: ScopeAnalysis
  scenario: Scenario
  input: ProjectInput
}

/** Proposta de squad extraída pela LLM a partir de uma mensagem de negociação do usuário. */
export interface ProposedSquadChange {
  squad: SquadMember[]
  targetTimelineMonths?: number
  targetMonthlyBudget?: number
}
