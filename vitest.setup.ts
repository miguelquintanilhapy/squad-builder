import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'

// Sem test.globals:true no vitest.config, o cleanup automático entre testes (desmontar a árvore
// renderizada) não é registrado por conta própria — sem isso, cada `render()` de um teste
// seguinte acumula em cima do DOM do teste anterior no mesmo arquivo, e getBy* passa a achar
// "múltiplos elementos" que na verdade são cópias deixadas por testes já terminados.
afterEach(() => {
  cleanup()
})

// jsdom não implementa scrollIntoView — vários componentes (SquadBuilderApp, NegotiationChat)
// chamam isso depois de uma resposta de rede pra levar o resultado até a tela.
if (typeof window !== 'undefined' && !window.HTMLElement.prototype.scrollIntoView) {
  window.HTMLElement.prototype.scrollIntoView = () => {}
}

// jsdom não implementa matchMedia — a lib Motion chama isso internamente em useReducedMotion(),
// usado por vários componentes (SquadBuilderApp, DashboardPanel). Default seguro: nada reduzido,
// nada "mobile". Testes que precisam controlar o resultado (useViewport, CommandMenu) sobrescrevem
// window.matchMedia no próprio teste antes de renderizar.
if (typeof window !== 'undefined' && !window.matchMedia) {
  window.matchMedia = ((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
    dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia
}

// jsdom não implementa canvas.getContext — sem isso, cada teste que monta o HeroShader (a
// textura WebGL de fundo) loga "Not implemented" no console. O próprio componente já trata
// getContext retornando null (nenhum navegador headless de CI teria WebGL garantido); o stub só
// evita o log ruidoso, o comportamento é o mesmo caminho que o componente já cobre.
if (typeof window !== 'undefined' && window.HTMLCanvasElement) {
  window.HTMLCanvasElement.prototype.getContext = (() => null) as typeof window.HTMLCanvasElement.prototype.getContext
}

// jsdom não implementa IntersectionObserver — usado internamente pelo `whileInView` da Motion,
// presente na maioria das seções da página.
if (typeof window !== 'undefined' && !window.IntersectionObserver) {
  class IntersectionObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  // @ts-expect-error stub mínimo, não implementa a interface completa
  window.IntersectionObserver = IntersectionObserverStub
}
