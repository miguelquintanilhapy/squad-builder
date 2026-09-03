import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach } from 'vitest'
import { NegotiationChat } from './NegotiationChat'
import { baseInput, baseScenario, baseScope } from '@/lib/testFixtures'
import { ScenarioVersion } from '@/types'

function makeVersion(id: string, riskScore: number): ScenarioVersion {
  return {
    id,
    label: `versão ${id}`,
    scopeAnalysis: baseScope(),
    input: baseInput(),
    scenario: baseScenario({ riskScore }),
  }
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
}

describe('NegotiationChat — impacto da negociação sempre visível', () => {
  let scrollIntoView: ReturnType<typeof vi.fn>

  beforeEach(() => {
    scrollIntoView = vi.fn()
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView as unknown as typeof window.HTMLElement.prototype.scrollIntoView
  })

  const baseProps = {
    history: [],
    onSend: vi.fn(),
    loading: false,
    versions: [] as ScenarioVersion[],
    onSelectVersion: vi.fn(),
  }

  // VersionList tem seu próprio scrollIntoView (block: 'nearest') pra manter o chip ativo da
  // trilha visível — comportamento existente, não o desta correção. O fix de negociação usa
  // block: 'start' especificamente; as asserções abaixo miram só essa chamada.
  function scrolledToImpactPanel() {
    return scrollIntoView.mock.calls.some(([opts]) => opts?.block === 'start')
  }

  it('não rola até o painel de impacto no mount inicial, mesmo já havendo versões (evita scroll indesejado ao entrar na seção)', () => {
    setViewportWidth(375)
    const v1 = makeVersion('v1', 20)
    const v2 = makeVersion('v2', 50)
    render(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v2.id} />)
    expect(scrolledToImpactPanel()).toBe(false)
  })

  /** requestAnimationFrame é assíncrono mesmo no polyfill do jsdom — espera o próximo frame
   * antes de checar a chamada, senão a asserção corre antes do callback disparar. */
  function nextFrame() {
    return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  }

  it('no mobile/tablet (<1024px), rola até o painel de impacto quando uma nova negociação resolve', async () => {
    setViewportWidth(375)
    const v1 = makeVersion('v1', 20)
    const { rerender } = render(<NegotiationChat {...baseProps} versions={[v1]} activeVersionId={v1.id} />)

    const v2 = makeVersion('v2', 85)
    rerender(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v2.id} />)
    await nextFrame()

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' })
  })

  it('no desktop (>=1024px) não força o scroll — as duas colunas já ficam lado a lado', async () => {
    setViewportWidth(1280)
    const v1 = makeVersion('v1', 20)
    const { rerender } = render(<NegotiationChat {...baseProps} versions={[v1]} activeVersionId={v1.id} />)

    const v2 = makeVersion('v2', 85)
    rerender(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v2.id} />)
    await nextFrame()

    expect(scrolledToImpactPanel()).toBe(false)
  })

  it('voltar para uma versão anterior pela trilha também traz o impacto pra tela no mobile', async () => {
    setViewportWidth(375)
    const v1 = makeVersion('v1', 20)
    const v2 = makeVersion('v2', 85)
    const { rerender } = render(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v2.id} />)
    await nextFrame()
    scrollIntoView.mockClear()

    rerender(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v1.id} />)
    await nextFrame()
    expect(scrolledToImpactPanel()).toBe(true)
  })

  it('renderiza o painel de impacto (não escondido) depois de uma negociação', () => {
    setViewportWidth(375)
    const v1 = makeVersion('v1', 20)
    const v2 = makeVersion('v2', 85)
    render(<NegotiationChat {...baseProps} versions={[v1, v2]} activeVersionId={v2.id} />)
    expect(screen.getByText('Impacto do ajuste')).toBeInTheDocument()
  })
})
