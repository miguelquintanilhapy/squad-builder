import { describe, expect, it } from 'vitest'
import { assessRisk } from './riskEngine'
import { baseInput, baseScope } from './testFixtures'
import { SquadMember } from '@/types'

const member = (overrides: Partial<SquadMember>): SquadMember => ({
  role: 'dev-backend',
  seniority: 'pleno',
  quantity: 1,
  allocation: 'full-time',
  ...overrides,
})

describe('assessRisk', () => {
  it('soma QA ausente + designer ausente quando o escopo é web de complexidade média', () => {
    const scope = baseScope({ complexity: 'medium', productTypes: ['web-app'], platforms: ['web'] })
    const squad = [member({ role: 'dev-backend' }), member({ role: 'dev-frontend' })]
    const result = assessRisk(squad, scope, baseInput({ complexity: 'medium' }), 4, 10000)

    expect(result.riskBase).toBe(15)
    expect(result.alerts.some((a) => a.title === 'Sem QA dedicado')).toBe(true)
    expect(result.alerts.some((a) => a.title === 'Sem designer de UX/UI')).toBe(true)
    expect(result.riskScore).toBe(15 + 15 + 10)
    expect(result.riskLevel).toBe('medium')
  })

  it('não exige QA nem designer em escopo de baixa complexidade e esforço pequeno', () => {
    const scope = baseScope({ complexity: 'low', estimatedEffortPersonMonths: 3, productTypes: ['web-app'], platforms: ['web'] })
    const squad = [member({ role: 'dev-fullstack' })]
    const result = assessRisk(squad, scope, baseInput({ complexity: 'low' }), 3, 5000)

    expect(result.alerts.some((a) => a.title === 'Sem QA dedicado')).toBe(false)
    expect(result.alerts.some((a) => a.title === 'Sem designer de UX/UI')).toBe(false)
    expect(result.riskScore).toBe(5)
    expect(result.riskLevel).toBe('low')
  })

  it('exige QA quando o esforço estimado passa de 6 pessoa-mês mesmo em baixa complexidade', () => {
    const scope = baseScope({ complexity: 'low', estimatedEffortPersonMonths: 7 })
    const squad = [member({ role: 'dev-fullstack' })]
    const result = assessRisk(squad, scope, baseInput({ complexity: 'low' }), 3, 5000)
    expect(result.alerts.some((a) => a.title === 'Sem QA dedicado')).toBe(true)
  })

  it('não gera alerta de QA/designer quando os papéis já estão no squad', () => {
    const scope = baseScope({ complexity: 'medium' })
    const squad = [
      member({ role: 'dev-backend' }),
      member({ role: 'dev-frontend' }),
      member({ role: 'qa' }),
      member({ role: 'designer-uxui' }),
    ]
    const result = assessRisk(squad, scope, baseInput({ complexity: 'medium' }), 4, 10000)
    expect(result.alerts.some((a) => a.title === 'Sem QA dedicado')).toBe(false)
    expect(result.alerts.some((a) => a.title === 'Sem designer de UX/UI')).toBe(false)
  })

  it('alerta de segurança é crítico (peso 15) em enterprise e informativo (peso 5) fora dele', () => {
    const squad = [member({ role: 'dev-backend' }), member({ role: 'qa' })]

    const enterprise = assessRisk(
      squad,
      baseScope({ complexity: 'enterprise', requiredCapabilities: ['payments'] }),
      baseInput({ complexity: 'enterprise' }),
      4,
      10000
    )
    const securityAlertEnterprise = enterprise.alerts.find((a) => a.category === 'security')
    expect(securityAlertEnterprise?.weight).toBe(15)
    expect(securityAlertEnterprise?.severity).toBe('critical')

    const medium = assessRisk(
      squad,
      baseScope({ complexity: 'medium', requiredCapabilities: ['payments'] }),
      baseInput({ complexity: 'medium' }),
      4,
      10000
    )
    const securityAlertMedium = medium.alerts.find((a) => a.category === 'security')
    expect(securityAlertMedium?.weight).toBe(5)
    expect(securityAlertMedium?.severity).toBe('info')
  })

  it('sobrecarga de 1 dev fullstack sobe de peso conforme o número de superfícies de UI', () => {
    const squad = [member({ role: 'dev-fullstack', quantity: 1 })]

    const twoSurfaces = assessRisk(
      squad,
      baseScope({ productTypes: ['web-app', 'mobile-app'], platforms: ['web', 'ios'] }),
      baseInput(),
      4,
      10000
    )
    const burnoutTwo = twoSurfaces.alerts.find((a) => a.category === 'burnout')
    expect(burnoutTwo?.weight).toBe(8)
    expect(burnoutTwo?.severity).toBe('warning')

    const threeSurfaces = assessRisk(
      squad,
      baseScope({
        productTypes: ['web-app', 'mobile-app'],
        platforms: ['web', 'ios'],
        requiredCapabilities: ['admin-panel'],
      }),
      baseInput(),
      4,
      10000
    )
    const burnoutThree = threeSurfaces.alerts.find((a) => a.category === 'burnout')
    expect(burnoutThree?.weight).toBe(15)
    expect(burnoutThree?.severity).toBe('critical')
  })

  it('não sinaliza burnout quando o fullstack solo cobre só 1 superfície', () => {
    const squad = [member({ role: 'dev-fullstack', quantity: 1 })]
    const result = assessRisk(squad, baseScope({ productTypes: ['web-app'], platforms: ['web'] }), baseInput(), 4, 10000)
    expect(result.alerts.some((a) => a.category === 'burnout')).toBe(false)
  })

  it('alerta de prazo incompatível: peso proporcional e crítico quando a razão passa de 1.5x', () => {
    const scope = baseScope()
    const squad = [member({})]

    const mild = assessRisk(squad, scope, baseInput({ targetTimelineMonths: 5 }), 6, 10000)
    const mildAlert = mild.alerts.find((a) => a.category === 'timeline')
    expect(mildAlert?.severity).toBe('warning')
    expect(mildAlert?.weight).toBeCloseTo((6 / 5 - 1) * 30, 5)

    const severe = assessRisk(squad, scope, baseInput({ targetTimelineMonths: 2 }), 6, 10000)
    const severeAlert = severe.alerts.find((a) => a.category === 'timeline')
    expect(severeAlert?.severity).toBe('critical')
    expect(severeAlert?.weight).toBe(30) // clamped no teto de 30

    const onTime = assessRisk(squad, scope, baseInput({ targetTimelineMonths: 6 }), 6, 10000)
    expect(onTime.alerts.some((a) => a.category === 'timeline')).toBe(false)
  })

  it('não gera alerta de prazo quando o usuário não informa um prazo-alvo', () => {
    const result = assessRisk([member({})], baseScope(), baseInput({ targetTimelineMonths: undefined }), 100, 10000)
    expect(result.alerts.some((a) => a.category === 'timeline')).toBe(false)
  })

  it('budgetAlert só aparece quando o custo passa do teto mensal, com o valor de estouro correto', () => {
    const withinBudget = assessRisk([member({})], baseScope(), baseInput({ monthlyBudget: 10000 }), 4, 8000)
    expect(withinBudget.budgetAlert).toBeUndefined()

    const overBudget = assessRisk([member({})], baseScope(), baseInput({ monthlyBudget: 10000 }), 4, 15000)
    expect(overBudget.budgetAlert?.overageAmount).toBe(5000)

    const noBudgetSet = assessRisk([member({})], baseScope(), baseInput({ monthlyBudget: undefined }), 4, 999999)
    expect(noBudgetSet.budgetAlert).toBeUndefined()
  })

  it('riskScore nunca passa de 100 mesmo somando todos os fatores possíveis', () => {
    const squad = [member({ role: 'dev-fullstack', quantity: 1 })]
    const result = assessRisk(
      squad,
      baseScope({
        complexity: 'enterprise',
        productTypes: ['web-app', 'mobile-app'],
        platforms: ['web', 'ios'],
        requiredCapabilities: ['payments', 'admin-panel'],
      }),
      baseInput({ complexity: 'enterprise', targetTimelineMonths: 1, monthlyBudget: 1000 }),
      50,
      500000
    )
    expect(result.riskScore).toBeLessThanOrEqual(100)
    expect(result.riskLevel).toBe('critical')
  })

  it('drivers vêm ordenados do maior peso pro menor', () => {
    const scope = baseScope({ complexity: 'medium', productTypes: ['web-app'], platforms: ['web'] })
    const result = assessRisk([member({ role: 'dev-backend' })], scope, baseInput({ complexity: 'medium' }), 4, 10000)
    const weights = result.drivers.map((d) => d.weight)
    expect(weights).toEqual([...weights].sort((a, b) => b - a))
  })

  it('assumptions refletem presença de designer/QA no squad', () => {
    const withRoles = assessRisk(
      [member({ role: 'designer-uxui' }), member({ role: 'qa' })],
      baseScope(),
      baseInput(),
      4,
      10000
    )
    expect(withRoles.assumptions).toContain('Designer dedicado durante todo o período estimado.')
    expect(withRoles.assumptions).toContain('QA cobre todo o período de desenvolvimento.')

    const without = assessRisk([member({ role: 'dev-backend' })], baseScope(), baseInput(), 4, 10000)
    expect(without.assumptions).toContain('Sem designer dedicado no squad — leitura editável acima se isso não valer.')
    expect(without.assumptions).toContain('Sem QA dedicado no squad — leitura editável acima se isso não valer.')
  })
})
