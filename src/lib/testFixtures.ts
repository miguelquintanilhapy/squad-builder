import { ProjectInput, RiskLevel, Scenario, ScopeAnalysis } from '@/types'

/** Escopo mínimo válido pro motor determinístico, sobrescrevível por teste. */
export function baseScope(overrides: Partial<ScopeAnalysis> = {}): ScopeAnalysis {
  return {
    productTypes: ['web-app'],
    platforms: ['web'],
    stage: 'idea',
    complexity: 'medium',
    estimatedEffortPersonMonths: 8,
    requiredCapabilities: [],
    keyRisksNoted: [],
    summary: 'Escopo de teste.',
    ...overrides,
  }
}

export function baseInput(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    productTypes: ['web-app'],
    platforms: ['web'],
    stage: 'idea',
    complexity: 'medium',
    description: 'Descrição de teste.',
    ...overrides,
  }
}

export function baseScenario(overrides: Partial<Scenario> = {}): Scenario {
  return {
    squad: [],
    totalMonthlyCost: 10000,
    estimatedTimelineMonths: 4,
    riskScore: 20,
    riskLevel: 'low' as RiskLevel,
    alerts: [],
    drivers: [],
    riskBase: 15,
    contractType: 'pj',
    assumptions: [],
    summary: '',
    ...overrides,
  }
}
