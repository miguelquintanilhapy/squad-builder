import { describe, expect, it } from 'vitest'
import { MAX_ALLOCATION_MONTHS, monthlyAllocationPct } from './allocationCurve'

describe('monthlyAllocationPct', () => {
  it('designer concentra nos primeiros 60% do prazo e cai pra 35% depois', () => {
    const pcts = monthlyAllocationPct('designer-uxui', 'full-time', 10)
    expect(pcts.slice(0, 6)).toEqual([100, 100, 100, 100, 100, 100])
    expect(pcts.slice(6)).toEqual([35, 35, 35, 35])
  })

  it('QA fica em 20% nos primeiros 40% do prazo e sobe pra 100% depois', () => {
    const pcts = monthlyAllocationPct('qa', 'full-time', 10)
    expect(pcts.slice(0, 4)).toEqual([20, 20, 20, 20])
    expect(pcts.slice(4)).toEqual([100, 100, 100, 100, 100, 100])
  })

  it('papéis sem curva definida (ex: dev-backend) ficam constantes o prazo inteiro', () => {
    const pcts = monthlyAllocationPct('dev-backend', 'full-time', 6)
    expect(pcts).toEqual([100, 100, 100, 100, 100, 100])
  })

  it('alocação part-time reduz o teto pra 50%, mantendo a mesma forma de curva', () => {
    const pcts = monthlyAllocationPct('dev-backend', 'part-time', 4)
    expect(pcts).toEqual([50, 50, 50, 50])
  })

  it('monthCount é sempre no mínimo 1, mesmo com entrada 0 ou negativa', () => {
    expect(monthlyAllocationPct('dev-backend', 'full-time', 0)).toHaveLength(1)
    expect(monthlyAllocationPct('dev-backend', 'full-time', -5)).toHaveLength(1)
  })

  it('MAX_ALLOCATION_MONTHS é o teto compartilhado com o motor de cálculo', () => {
    expect(MAX_ALLOCATION_MONTHS).toBe(36)
  })
})
