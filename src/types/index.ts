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

/** Entrada híbrida do usuário: chips/dropdowns + texto livre + filtros opcionais. */
export interface ProjectInput {
  productTypes: ProductType[]
  platforms: Platform[]
  stage: ProjectStage
  complexity: ComplexityLevel
  description: string
  targetTimelineMonths?: number
  monthlyBudget?: number
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
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical'

/** Resultado final calculado deterministicamente + narrado pela LLM. */
export interface Scenario {
  squad: SquadMember[]
  totalMonthlyCost: number
  estimatedTimelineMonths: number
  riskScore: number // 0-100
  riskLevel: RiskLevel
  alerts: RiskAlert[]
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

/** Proposta de squad extraída pela LLM a partir de uma mensagem de negociação do usuário. */
export interface ProposedSquadChange {
  squad: SquadMember[]
  targetTimelineMonths?: number
  targetMonthlyBudget?: number
}
