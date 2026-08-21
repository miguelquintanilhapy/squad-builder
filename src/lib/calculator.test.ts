import { describe, expect, it } from 'vitest'
import { computeScenario } from './calculator'
import { baseInput, baseScope } from './testFixtures'
import { SquadMember } from '@/types'

const member = (overrides: Partial<SquadMember>): SquadMember => ({
  role: 'dev-backend',
  seniority: 'pleno',
  quantity: 1,
  allocation: 'full-time',
  ...overrides,
})

describe('computeScenario', () => {
  it('calcula custo total como a soma do custo de cada membro', () => {
    const squad = [member({ role: 'dev-backend', quantity: 2 }), member({ role: 'qa', quantity: 1 })]
    const scenario = computeScenario(squad, baseScope(), baseInput())
    // dev-backend pleno pj = 7500 * 2 = 15000; qa pleno pj = 6000 * 1 = 6000.
    expect(scenario.totalMonthlyCost).toBe(15000 + 6000)
  })

  it('aplica o multiplicador CLT no custo total quando contractType é clt', () => {
    const squad = [member({ role: 'dev-backend', quantity: 1 })]
    const scenario = computeScenario(squad, baseScope(), baseInput({ contractType: 'clt' }))
    expect(scenario.totalMonthlyCost).toBe(Math.round(7500 * 1.65))
    expect(scenario.contractType).toBe('clt')
  })

  it('respeita rateOverrides no custo total e no custo por pessoa do squad', () => {
    const squad = [member({ role: 'dev-backend', quantity: 1 })]
    const scenario = computeScenario(squad, baseScope(), baseInput({ rateOverrides: { 'dev-backend': 9999 } }))
    expect(scenario.totalMonthlyCost).toBe(9999)
    expect(scenario.squad[0].monthlyCostPerPerson).toBe(9999)
  })

  it('prazo estimado vem da capacidade de engenharia disponível (esforço / capacidade)', () => {
    const squad = [member({ role: 'dev-backend', seniority: 'senior', quantity: 1 })]
    // capacidade = 1.4 (senior) * 1.0 (full-time) * 1 = 1.4 pessoa-mês/mês
    const scope = baseScope({ estimatedEffortPersonMonths: 14 })
    const scenario = computeScenario(squad, scope, baseInput())
    expect(scenario.estimatedTimelineMonths).toBeCloseTo(10, 1)
  })

  it('prazo degenera para um teto alto quando o squad não tem nenhum papel de engenharia', () => {
    const squad = [member({ role: 'qa', quantity: 3 })]
    const scenario = computeScenario(squad, baseScope(), baseInput())
    expect(scenario.estimatedTimelineMonths).toBe(999)
  })

  it('a curva de alocação de cada membro nunca passa do teto MAX_ALLOCATION_MONTHS de meses', () => {
    const squad = [member({ role: 'dev-backend', quantity: 1 })]
    const scenario = computeScenario(squad, baseScope({ estimatedEffortPersonMonths: 5000 }), baseInput())
    expect(scenario.squad[0].monthlyAllocationPct?.length).toBeLessThanOrEqual(36)
  })

  it('propaga o risco calculado por assessRisk (budgetAlert incluído)', () => {
    const squad = [member({ role: 'dev-backend', quantity: 5 })]
    const scenario = computeScenario(squad, baseScope(), baseInput({ monthlyBudget: 1000 }))
    expect(scenario.budgetAlert).toBeDefined()
    expect(scenario.riskScore).toBeGreaterThan(0)
  })

  it('summary começa vazio — só o narrateScenario (LLM) o preenche depois', () => {
    const scenario = computeScenario([member({})], baseScope(), baseInput())
    expect(scenario.summary).toBe('')
  })
})
