import { describe, expect, it } from 'vitest'
import { describeNegotiationImpact, describeNegotiationImpactCompact } from './negotiationImpact'
import { baseScenario } from './testFixtures'

describe('describeNegotiationImpact', () => {
  it('descreve economia, redução de risco e prazo inalterado', () => {
    const previous = baseScenario({ totalMonthlyCost: 20000, riskScore: 50, estimatedTimelineMonths: 4 })
    const current = baseScenario({ totalMonthlyCost: 15000, riskScore: 40, estimatedTimelineMonths: 4 })
    const text = describeNegotiationImpact(current, previous)
    expect(text).toContain('Economia de')
    expect(text).toContain('redução de 10 pontos no risco')
    expect(text).toContain('permanece inalterado')
  })

  it('descreve aumento de custo, aumento de risco e novo prazo', () => {
    const previous = baseScenario({ totalMonthlyCost: 10000, riskScore: 20, estimatedTimelineMonths: 3 })
    const current = baseScenario({ totalMonthlyCost: 18000, riskScore: 55, estimatedTimelineMonths: 5 })
    const text = describeNegotiationImpact(current, previous)
    expect(text).toContain('Aumento de')
    expect(text).toContain('aumento de 35 pontos no risco')
    expect(text).toContain('5 meses')
  })

  it('sem alteração em nenhuma das três dimensões', () => {
    const scenario = baseScenario({ totalMonthlyCost: 10000, riskScore: 30, estimatedTimelineMonths: 4 })
    const text = describeNegotiationImpact(scenario, scenario)
    expect(text).toContain('Custo sem alteração')
    expect(text).toContain('risco sem alteração')
    expect(text).toContain('permanece inalterado')
  })
})

describe('describeNegotiationImpactCompact', () => {
  it('usa sinal "+" pra aumento e "−" pra redução', () => {
    const previous = baseScenario({ totalMonthlyCost: 10000, riskScore: 30, estimatedTimelineMonths: 4 })
    const increased = baseScenario({ totalMonthlyCost: 12000, riskScore: 40, estimatedTimelineMonths: 5 })
    const decreased = baseScenario({ totalMonthlyCost: 8000, riskScore: 20, estimatedTimelineMonths: 3 })

    const increasedText = describeNegotiationImpactCompact(increased, previous)
    expect(increasedText).toContain('+')
    expect(increasedText).toContain('+10 risco')

    const decreasedText = describeNegotiationImpactCompact(decreased, previous)
    expect(decreasedText).toContain('−')
    expect(decreasedText).toContain('−10 risco')
  })

  it('reporta "sem alteração" nas três dimensões quando nada muda', () => {
    const scenario = baseScenario({ totalMonthlyCost: 10000, riskScore: 30, estimatedTimelineMonths: 4 })
    const text = describeNegotiationImpactCompact(scenario, scenario)
    expect(text).toBe('custo sem alteração · risco sem alteração · prazo sem alteração')
  })
})
