'use client'

import { useEffect, useState, type RefObject } from 'react'

/** Mesmo breakpoint `sm` do Tailwind (ver globals.css — sem override em @theme, é o padrão de
 * 640px). Único ponto de referência: nenhum outro lugar deve hardcodar "639px"/"640px" à mão. */
export const MOBILE_BREAKPOINT_PX = 640

/** Abaixo do breakpoint `sm`, sem media query de largura de tela não dá pra saber, em JS (fora
 * do CSS), se um comportamento (ex.: modal vira bottom sheet) deve mudar. */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false)
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`)
    const update = () => setIsMobile(query.matches)
    update()
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])
  return isMobile
}

/** Detecta se o conteúdo dentro do elemento referenciado ainda tem mais pra rolar à direita —
 * usado pra mostrar o fade que sinaliza "arraste pro lado" em carrosséis/gráficos horizontais.
 * Recalcula a cada scroll/resize, nunca um valor fixo. */
export function useCanScrollRight<T extends HTMLElement>(ref: RefObject<T | null>, deps: unknown[] = []): boolean {
  const [canScrollRight, setCanScrollRight] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const update = () => setCanScrollRight(el.scrollWidth - el.scrollLeft - el.clientWidth > 1)
    update()
    el.addEventListener('scroll', update)
    window.addEventListener('resize', update)
    return () => {
      el.removeEventListener('scroll', update)
      window.removeEventListener('resize', update)
    }
    // deps controla apenas quando reavaliar (conteúdo mudou de largura) — ref e el não entram.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return canScrollRight
}
