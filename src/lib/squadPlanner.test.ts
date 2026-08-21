import { describe, expect, it } from 'vitest'
import { suggestInitialSquad, suggestMinimalSquad } from './squadPlanner'
import { baseInput, baseScope } from './testFixtures'

describe('suggestInitialSquad', () => {
  it('colapsa em 1 dev fullstack quando o escopo é enxuto (baixa complexidade, esforço <= 5, sem mobile)', () => {
    const scope = baseScope({ complexity: 'low', estimatedEffortPersonMonths: 2, productTypes: ['web-app'], platforms: ['web'] })
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'low' }))
    expect(squad).toHaveLength(1)
    expect(squad[0].role).toBe('dev-fullstack')
    expect(squad[0].quantity).toBe(1)
  })

  it('separa front-end e back-end quando não é enxuto, e adiciona QA + designer (complexidade média, web)', () => {
    const scope = baseScope({ complexity: 'medium', estimatedEffortPersonMonths: 8, productTypes: ['web-app'], platforms: ['web'] })
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'medium' }))

    const roles = squad.map((m) => m.role)
    expect(roles).toContain('dev-frontend')
    expect(roles).toContain('dev-backend')
    expect(roles).toContain('qa')
    expect(roles).toContain('designer-uxui')
    expect(roles).not.toContain('devops')
    expect(roles).not.toContain('tech-lead')
  })

  it('usa dev-mobile + dev-backend quando o escopo é mobile sem web', () => {
    const scope = baseScope({
      complexity: 'medium',
      estimatedEffortPersonMonths: 8,
      productTypes: ['mobile-app'],
      platforms: ['ios', 'android'],
    })
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'medium' }))
    const roles = squad.map((m) => m.role)
    expect(roles).toContain('dev-mobile')
    expect(roles).toContain('dev-backend')
    expect(roles).not.toContain('dev-frontend')
  })

  it('escopo enterprise com payments/high-scale/ai-ml traz devops, tech-lead, product-manager, security e data-engineer', () => {
    const scope = baseScope({
      complexity: 'enterprise',
      estimatedEffortPersonMonths: 20,
      productTypes: ['mobile-app', 'web-app'],
      platforms: ['ios', 'android', 'web'],
      requiredCapabilities: ['payments', 'high-scale', 'ai-ml'],
    })
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'enterprise' }))
    const roles = squad.map((m) => m.role)
    expect(roles).toContain('devops')
    expect(roles).toContain('tech-lead')
    expect(roles).toContain('product-manager')
    expect(roles).toContain('security-specialist')
    expect(roles).toContain('data-engineer')
  })

  it('adiciona tech-lead por headcount (>=5) mesmo sem ser enterprise', () => {
    const scope = baseScope({
      complexity: 'medium',
      estimatedEffortPersonMonths: 3,
      productTypes: ['mobile-app'],
      platforms: ['ios', 'android'],
    })
    // targetTimelineMonths=1 força requiredCapacityPerMonth=3, dividido entre 2 papéis (mobile+backend)
    // -> capacityPerShare=1.5 -> quantity=ceil(1.5/1.0)=2 cada -> 4 engenharia + 2 apoio (qa+designer) = 6.
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'medium', targetTimelineMonths: 1 }))
    const totalHeadcount = squad.reduce((sum, m) => sum + m.quantity, 0)
    expect(totalHeadcount).toBeGreaterThanOrEqual(6)
    expect(squad.map((m) => m.role)).toContain('tech-lead')
  })

  it('nunca gera quantidade zero ou negativa por papel', () => {
    const scope = baseScope({ complexity: 'medium', estimatedEffortPersonMonths: 0.001 })
    const squad = suggestInitialSquad(scope, baseInput({ complexity: 'medium', targetTimelineMonths: 100 }))
    squad.forEach((member) => expect(member.quantity).toBeGreaterThanOrEqual(1))
  })
})

describe('suggestMinimalSquad', () => {
  it('mantém só 1 fullstack no modo enxuto, sem nenhum papel de apoio', () => {
    const scope = baseScope({ complexity: 'low', estimatedEffortPersonMonths: 4, productTypes: ['web-app'], platforms: ['web'] })
    const squad = suggestMinimalSquad(scope)
    expect(squad).toEqual([expect.objectContaining({ role: 'dev-fullstack', quantity: 1 })])
  })

  it('mantém 1 pessoa por papel de engenharia exigido, mesmo em escopo enterprise com muitas capacidades', () => {
    const scope = baseScope({
      complexity: 'enterprise',
      estimatedEffortPersonMonths: 40,
      productTypes: ['mobile-app', 'web-app'],
      platforms: ['ios', 'android', 'web'],
      requiredCapabilities: ['payments', 'high-scale', 'ai-ml', 'compliance'],
    })
    const squad = suggestMinimalSquad(scope)

    const roles = squad.map((m) => m.role)
    expect(roles.sort()).toEqual(['dev-backend', 'dev-frontend', 'dev-mobile'].sort())
    squad.forEach((member) => expect(member.quantity).toBe(1))
    // Nenhum papel de apoio, mesmo com todas as capacidades que disparariam devops/tech-lead/PM/
    // security/data-engineer em suggestInitialSquad.
    expect(roles).not.toContain('qa')
    expect(roles).not.toContain('designer-uxui')
    expect(roles).not.toContain('devops')
    expect(roles).not.toContain('tech-lead')
    expect(roles).not.toContain('product-manager')
    expect(roles).not.toContain('security-specialist')
    expect(roles).not.toContain('data-engineer')
  })

  it('quantidade nunca varia com o esforço estimado (sempre 1 por papel)', () => {
    const smallScope = baseScope({ complexity: 'medium', estimatedEffortPersonMonths: 2 })
    const bigScope = baseScope({ complexity: 'medium', estimatedEffortPersonMonths: 500 })
    expect(suggestMinimalSquad(smallScope).every((m) => m.quantity === 1)).toBe(true)
    expect(suggestMinimalSquad(bigScope).every((m) => m.quantity === 1)).toBe(true)
  })
})
