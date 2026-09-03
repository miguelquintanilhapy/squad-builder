import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ReadingGrid } from './ReadingGrid'
import { baseScope } from '@/lib/testFixtures'

describe('ReadingGrid', () => {
  it('os chips de correção têm a área de toque expandida (guideline de touch target)', () => {
    render(<ReadingGrid scope={baseScope()} onChange={vi.fn()} />)
    const chip = screen.getByRole('button', { name: /Web App/i })
    expect(chip.className).toContain("after:content-['']")
  })

  it('corrigir um campo (ex.: complexidade) chama onChange com o campo alterado', async () => {
    const onChange = vi.fn()
    render(<ReadingGrid scope={baseScope({ complexity: 'medium' })} onChange={onChange} />)
    await userEvent.click(screen.getByRole('radio', { name: 'Enterprise' }))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ complexity: 'enterprise' }), 'complexity')
  })
})
