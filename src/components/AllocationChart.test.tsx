import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { AllocationChart } from './AllocationChart'
import { baseScenario } from '@/lib/testFixtures'

describe('AllocationChart', () => {
  it('mostra o detalhe de envolvimento por papel como texto sempre visível (não só via hover)', () => {
    const scenario = baseScenario({
      estimatedTimelineMonths: 3,
      squad: [
        {
          role: 'qa',
          seniority: 'pleno',
          quantity: 1,
          allocation: 'full-time',
          monthlyCostPerPerson: 8000,
          monthlyAllocationPct: [0, 50, 100],
        },
      ],
    })
    render(<AllocationChart scenario={scenario} />)
    // getAllByText: o mesmo texto existe tanto na lista mobile (sempre visível) quanto no
    // sr-only do gráfico desktop — o ponto do teste é que ele existe fora de um hover de mouse.
    const matches = screen.getAllByText((_, node) => node?.textContent?.includes('envolvimento:') ?? false)
    expect(matches.length).toBeGreaterThan(0)
  })

  it('mantém o gráfico SVG desktop (aria-hidden — a leitura acessível é o sr-only, não o svg)', () => {
    const scenario = baseScenario({
      squad: [{ role: 'dev-backend', seniority: 'senior', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 12000 }],
    })
    const { container } = render(<AllocationChart scenario={scenario} />)
    const svg = container.querySelector('svg[aria-label*="Alocação por papel"]')
    expect(svg).not.toBeNull()
  })
})
