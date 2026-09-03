import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ImpactSummary } from './ImpactSummary'
import { baseScenario, baseScope, baseInput } from '@/lib/testFixtures'
import { ScenarioVersion } from '@/types'

function version(overrides: Partial<ScenarioVersion['scenario']> = {}): ScenarioVersion {
  return {
    id: 'v1',
    label: 'teste',
    scopeAnalysis: baseScope(),
    input: baseInput(),
    scenario: baseScenario(overrides),
  }
}

describe('ImpactSummary', () => {
  it('mostra o texto inicial quando não há versão anterior', () => {
    render(<ImpactSummary active={version()} />)
    expect(screen.getByText(/cenário inicial/i)).toBeInTheDocument()
  })

  it('nunca comunica o nível de risco só por cor — sempre com o rótulo textual ao lado', () => {
    const previous = version({ riskScore: 20, riskLevel: 'low' })
    const active = version({ riskScore: 85, riskLevel: 'critical' })
    render(<ImpactSummary active={active} previous={previous} />)
    // "85/100" e o rótulo "Crítico" precisam estar os dois na tela — cor nunca é o único canal.
    expect(screen.getByText('85/100')).toBeInTheDocument()
    expect(screen.getByText('Crítico')).toBeInTheDocument()
  })
})
