import { ContractType, ProjectInput, RoleType, Scenario, ScopeAnalysis, SquadMember } from '@/types'
import { monthlyAllocationPct } from './allocationCurve'
import { capacityForMember, monthlyCostForMember } from './rates'
import { assessRisk } from './riskEngine'

type RateOverrides = Partial<Record<RoleType, number>>

function withCosts(
  squad: SquadMember[],
  contractType: ContractType,
  monthCount: number,
  rateOverrides?: RateOverrides
): SquadMember[] {
  return squad.map((m) => ({
    ...m,
    monthlyCostPerPerson: monthlyCostForMember(m.role, m.seniority, 1, m.allocation, contractType, rateOverrides?.[m.role]),
    monthlyAllocationPct: monthlyAllocationPct(m.role, m.allocation, monthCount),
  }))
}

function totalCost(squad: SquadMember[], contractType: ContractType, rateOverrides?: RateOverrides): number {
  return squad.reduce(
    (sum, m) =>
      sum + monthlyCostForMember(m.role, m.seniority, m.quantity, m.allocation, contractType, rateOverrides?.[m.role]),
    0
  )
}

function totalEngineeringCapacity(squad: SquadMember[]): number {
  return squad.reduce((sum, m) => sum + capacityForMember(m.role, m.seniority, m.quantity, m.allocation), 0)
}

/**
 * Núcleo determinístico do SquadBuilder: dado um squad (proposto pela IA ou pelo usuário)
 * e a leitura de escopo, calcula custo, prazo realista e risk score sem envolver a LLM.
 */
export function computeScenario(squad: SquadMember[], scope: ScopeAnalysis, input: ProjectInput): Scenario {
  const contractType = input.contractType ?? 'pj'
  const rateOverrides = input.rateOverrides
  const capacity = totalEngineeringCapacity(squad)
  // Capacidade zero (squad sem nenhum papel de engenharia) é tratada como prazo "infinito" -> teto alto.
  const realisticTimelineMonths = capacity > 0 ? scope.estimatedEffortPersonMonths / capacity : 999

  const cost = totalCost(squad, contractType, rateOverrides)
  const { riskScore, riskLevel, alerts, drivers, riskBase, budgetAlert, assumptions } = assessRisk(
    squad,
    scope,
    input,
    realisticTimelineMonths,
    cost
  )
  const estimatedTimelineMonths = Math.round(realisticTimelineMonths * 10) / 10
  // Teto defensivo: capacidade zero (squad sem nenhum papel de engenharia) já cai num prazo de
  // "infinito" (999) antes daqui — sem isso a curva geraria centenas de meses à toa.
  const monthCount = Math.min(36, Math.max(1, Math.round(estimatedTimelineMonths)))

  return {
    squad: withCosts(squad, contractType, monthCount, rateOverrides),
    totalMonthlyCost: cost,
    estimatedTimelineMonths,
    riskScore,
    riskLevel,
    alerts,
    drivers,
    riskBase,
    budgetAlert,
    contractType,
    assumptions,
    summary: '',
  }
}
