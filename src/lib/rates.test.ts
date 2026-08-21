import { describe, expect, it } from 'vitest'
import { capacityForMember, monthlyCostForMember } from './rates'

describe('monthlyCostForMember', () => {
  it('usa o valor de referência PJ por padrão', () => {
    expect(monthlyCostForMember('dev-backend', 'pleno', 1, 'full-time')).toBe(7500)
  })

  it('aplica o multiplicador de encargos CLT', () => {
    expect(monthlyCostForMember('dev-backend', 'pleno', 1, 'full-time', 'clt')).toBe(Math.round(7500 * 1.65))
  })

  it('aplica o fator de alocação part-time', () => {
    expect(monthlyCostForMember('dev-backend', 'pleno', 1, 'part-time', 'pj')).toBe(Math.round(7500 * 0.5))
  })

  it('multiplica pela quantidade de pessoas', () => {
    expect(monthlyCostForMember('dev-backend', 'pleno', 3, 'full-time', 'pj')).toBe(7500 * 3)
  })

  it('usa a premissa editável (rateOverride) em vez da tabela quando presente', () => {
    expect(monthlyCostForMember('dev-backend', 'pleno', 1, 'full-time', 'pj', 20000)).toBe(20000)
  })

  it('arredonda o resultado final, não trunca', () => {
    // 333 * 1.65 = 549.45 -> arredonda pra 549, não 549.45 nem 550.
    expect(monthlyCostForMember('dev-backend', 'pleno', 1, 'full-time', 'clt', 333)).toBe(549)
  })
})

describe('capacityForMember', () => {
  it('papéis de engenharia contam capacidade proporcional à senioridade e alocação', () => {
    expect(capacityForMember('dev-backend', 'senior', 2, 'full-time')).toBeCloseTo(1.4 * 1.0 * 2, 5)
    expect(capacityForMember('dev-backend', 'junior', 1, 'part-time')).toBeCloseTo(0.6 * 0.5 * 1, 5)
  })

  it('papéis de apoio (qa, designer, devops, PM, security) não contam capacidade de engenharia', () => {
    expect(capacityForMember('qa', 'senior', 10, 'full-time')).toBe(0)
    expect(capacityForMember('designer-uxui', 'senior', 10, 'full-time')).toBe(0)
    expect(capacityForMember('devops', 'senior', 10, 'full-time')).toBe(0)
    expect(capacityForMember('product-manager', 'senior', 10, 'full-time')).toBe(0)
    expect(capacityForMember('security-specialist', 'senior', 10, 'full-time')).toBe(0)
  })

  it('tech-lead e data-engineer contam como capacidade de engenharia', () => {
    expect(capacityForMember('tech-lead', 'senior', 1, 'full-time')).toBeGreaterThan(0)
    expect(capacityForMember('data-engineer', 'senior', 1, 'full-time')).toBeGreaterThan(0)
  })
})
