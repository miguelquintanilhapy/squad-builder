import { ProjectInput, Scenario, ScopeAnalysis, SquadMember } from '@/types'
import { capacityForMember, monthlyCostForMember } from './rates'
import { assessRisk } from './riskEngine'

function withCosts(squad: SquadMember[]): SquadMember[] {
  return squad.map((m) => ({
    ...m,
    monthlyCostPerPerson: monthlyCostForMember(m.role, m.seniority, 1, m.allocation),
  }))
}

function totalCost(squad: SquadMember[]): number {
  return squad.reduce((sum, m) => sum + monthlyCostForMember(m.role, m.seniority, m.quantity, m.allocation), 0)
}

function totalEngineeringCapacity(squad: SquadMember[]): number {
  return squad.reduce((sum, m) => sum + capacityForMember(m.role, m.seniority, m.quantity, m.allocation), 0)
}

/**
 * Núcleo determinístico do SquadBuilder: dado um squad (proposto pela IA ou pelo usuário)
 * e a leitura de escopo, calcula custo, prazo realista e risk score sem envolver a LLM.
 */
export function computeScenario(squad: SquadMember[], scope: ScopeAnalysis, input: ProjectInput): Scenario {
  const capacity = totalEngineeringCapacity(squad)
  // Capacidade zero (squad sem nenhum papel de engenharia) é tratada como prazo "infinito" -> teto alto.
  const realisticTimelineMonths = capacity > 0 ? scope.estimatedEffortPersonMonths / capacity : 999

  const cost = totalCost(squad)
  const { riskScore, riskLevel, alerts, drivers, riskBase, budgetAlert, assumptions } = assessRisk(
    squad,
    scope,
    input,
    realisticTimelineMonths,
    cost
  )

  return {
    squad: withCosts(squad),
    totalMonthlyCost: cost,
    estimatedTimelineMonths: Math.round(realisticTimelineMonths * 10) / 10,
    riskScore,
    riskLevel,
    alerts,
    drivers,
    riskBase,
    budgetAlert,
    assumptions,
    summary: '',
  }
}
