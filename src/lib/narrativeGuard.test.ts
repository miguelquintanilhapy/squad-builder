import { describe, expect, it } from 'vitest'
import { describeContradiction, findNarrativeContradiction, removeContradictingSentences } from './narrativeGuard'
import { SquadMember } from '@/types'

const member = (overrides: Partial<SquadMember>): SquadMember => ({
  role: 'dev-backend',
  seniority: 'pleno',
  quantity: 1,
  allocation: 'full-time',
  ...overrides,
})

describe('findNarrativeContradiction', () => {
  it('detecta quando o texto afirma ausência de um papel presente no squad', () => {
    const squad = [member({ role: 'qa' })]
    expect(findNarrativeContradiction('O squad está sem QA dedicado neste momento.', squad)).toBe('qa')
  })

  it('ignora frases com acentos e caixa alta via normalização', () => {
    const squad = [member({ role: 'qa' })]
    expect(findNarrativeContradiction('Não há QA dedicado no time.', squad)).toBe('qa')
  })

  it('não aponta contradição quando o papel realmente não está no squad', () => {
    const squad = [member({ role: 'dev-backend' })]
    expect(findNarrativeContradiction('O squad está sem QA dedicado.', squad)).toBeNull()
  })

  it('não aponta contradição quando o texto não afirma ausência de nada', () => {
    const squad = [member({ role: 'qa' })]
    expect(findNarrativeContradiction('O squad conta com QA dedicado.', squad)).toBeNull()
  })

  it('ignora papéis com quantidade zero (não contam como presentes)', () => {
    const squad = [member({ role: 'qa', quantity: 0 })]
    expect(findNarrativeContradiction('O squad está sem QA dedicado.', squad)).toBeNull()
  })
})

describe('removeContradictingSentences', () => {
  it('remove só a frase contraditória, preservando o resto do resumo', () => {
    const squad = [member({ role: 'qa' })]
    const summary = 'O squad cobre bem o back-end. Está sem QA dedicado. O prazo é realista.'
    const result = removeContradictingSentences(summary, squad)
    expect(result).not.toContain('sem QA dedicado')
    expect(result).toContain('cobre bem o back-end')
    expect(result).toContain('prazo é realista')
  })

  it('cai no fallback neutro quando o resumo inteiro contradiz a composição', () => {
    const squad = [member({ role: 'qa' })]
    const result = removeContradictingSentences('Está sem QA dedicado no squad.', squad)
    expect(result).toBe('Resumo indisponível: o texto gerado contradizia a composição atual do squad.')
  })

  it('não altera o resumo quando não há contradição', () => {
    const squad = [member({ role: 'dev-backend' })]
    const summary = 'O squad está bem dimensionado para o escopo.'
    expect(removeContradictingSentences(summary, squad)).toBe(summary)
  })
})

describe('describeContradiction', () => {
  it('devolve o rótulo em português do papel', () => {
    expect(describeContradiction('qa')).toBe('QA')
    expect(describeContradiction('dev-backend')).toBe('Desenvolvedor Back-end')
  })
})
