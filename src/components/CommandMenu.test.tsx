import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CommandMenu, type CommandMenuItem } from './CommandMenu'

function mockMatchMedia(matches: boolean) {
  window.matchMedia = vi.fn().mockReturnValue({
    matches,
    media: '',
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }) as unknown as typeof window.matchMedia
}

const items: CommandMenuItem[] = [
  { id: 'hero', label: 'Início', onSelect: vi.fn() },
  { id: 'form', label: 'Formulário', onSelect: vi.fn() },
]

describe('CommandMenu', () => {
  it('no desktop mantém a paleta de busca com autofoco (comportamento original)', () => {
    mockMatchMedia(false)
    render(<CommandMenu items={items} open onOpenChange={() => {}} />)
    expect(screen.getByPlaceholderText('Buscar uma ação...')).toBeInTheDocument()
  })

  it('no mobile não renderiza campo de busca — só uma lista de toque com botão de fechar', () => {
    mockMatchMedia(true)
    render(<CommandMenu items={items} open onOpenChange={() => {}} />)
    expect(screen.queryByPlaceholderText('Buscar uma ação...')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
    expect(screen.getByText('Início')).toBeInTheDocument()
    expect(screen.getByText('Formulário')).toBeInTheDocument()
  })

  it('no mobile, tocar em "Fechar" chama onOpenChange(false)', async () => {
    mockMatchMedia(true)
    const onOpenChange = vi.fn()
    render(<CommandMenu items={items} open onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })

  it('selecionar um item chama onSelect e fecha o menu', async () => {
    mockMatchMedia(true)
    const onOpenChange = vi.fn()
    render(<CommandMenu items={items} open onOpenChange={onOpenChange} />)
    await userEvent.click(screen.getByText('Formulário'))
    expect(items[1].onSelect).toHaveBeenCalled()
    expect(onOpenChange).toHaveBeenCalledWith(false)
  })
})
