import { useEffect, useRef } from 'react'
import { render, renderHook, screen } from '@testing-library/react'
import { act } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { MOBILE_BREAKPOINT_PX, useCanScrollRight, useIsMobile } from './useViewport'

/** jsdom não implementa matchMedia — stub controlável por teste, guarda o listener registrado
 * pra disparar a mudança manualmente. */
function mockMatchMedia(initialMatches: boolean) {
  let listener: ((e: { matches: boolean }) => void) | null = null
  const mql = {
    matches: initialMatches,
    media: '',
    addEventListener: (_: string, cb: (e: { matches: boolean }) => void) => {
      listener = cb
    },
    removeEventListener: vi.fn(),
  }
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia
  return {
    triggerChange(matches: boolean) {
      mql.matches = matches
      listener?.({ matches })
    },
  }
}

describe('useIsMobile', () => {
  it('usa o mesmo breakpoint sm do Tailwind (640px)', () => {
    mockMatchMedia(false)
    renderHook(() => useIsMobile())
    expect(window.matchMedia).toHaveBeenCalledWith(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`)
  })

  it('reflete o valor inicial de matches', () => {
    mockMatchMedia(true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('atualiza quando a media query muda (resize)', () => {
    const { triggerChange } = mockMatchMedia(false)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    act(() => triggerChange(true))
    expect(result.current).toBe(true)
  })
})

function ScrollProbe({ scrollWidth, scrollLeft, clientWidth }: { scrollWidth: number; scrollLeft: number; clientWidth: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const canScrollRight = useCanScrollRight(ref, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    Object.defineProperty(el, 'scrollWidth', { value: scrollWidth, configurable: true })
    Object.defineProperty(el, 'scrollLeft', { value: scrollLeft, configurable: true })
    Object.defineProperty(el, 'clientWidth', { value: clientWidth, configurable: true })
    el.dispatchEvent(new Event('scroll'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return <div ref={ref} data-testid="probe">{String(canScrollRight)}</div>
}

describe('useCanScrollRight', () => {
  it('detecta que ainda há conteúdo pra rolar à direita', () => {
    render(<ScrollProbe scrollWidth={1000} scrollLeft={0} clientWidth={400} />)
    expect(screen.getByTestId('probe')).toHaveTextContent('true')
  })

  it('detecta que já rolou até o fim (nada mais à direita)', () => {
    render(<ScrollProbe scrollWidth={1000} scrollLeft={600} clientWidth={400} />)
    expect(screen.getByTestId('probe')).toHaveTextContent('false')
  })

  it('detecta que o conteúdo cabe todo sem precisar rolar', () => {
    render(<ScrollProbe scrollWidth={400} scrollLeft={0} clientWidth={400} />)
    expect(screen.getByTestId('probe')).toHaveTextContent('false')
  })
})
