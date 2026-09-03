import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { DashboardPanel } from './DashboardPanel'
import { baseScenario } from '@/lib/testFixtures'

describe('DashboardPanel — pílula de recálculo', () => {
  it('não fica em posição absoluta por padrão (evita sobrepor o primeiro KPI no mobile) — só a partir de sm', () => {
    const scenario = baseScenario({
      squad: [{ role: 'dev-backend', seniority: 'senior', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 12000 }],
    })
    render(<DashboardPanel scenario={scenario} loading={false} recomputing onCancelRecompute={vi.fn()} />)
    const pill = screen.getByText('Recalculando').closest('div')
    expect(pill?.className).not.toMatch(/(?<!sm:)\babsolute\b/)
    expect(pill?.className).toContain('sm:absolute')
  })

  it('o botão de cancelar o recálculo funciona e tem alvo de toque expandido', async () => {
    const onCancelRecompute = vi.fn()
    const scenario = baseScenario({
      squad: [{ role: 'dev-backend', seniority: 'senior', quantity: 1, allocation: 'full-time', monthlyCostPerPerson: 12000 }],
    })
    render(<DashboardPanel scenario={scenario} loading={false} recomputing onCancelRecompute={onCancelRecompute} />)
    const cancelButton = screen.getByRole('button', { name: 'Cancelar' })
    expect(cancelButton.className).toContain("after:content-['']")
    await userEvent.click(cancelButton)
    expect(onCancelRecompute).toHaveBeenCalled()
  })
})
