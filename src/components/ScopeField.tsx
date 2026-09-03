'use client'

import { useRef } from 'react'
import { SCOPE_SEEDS } from '@/lib/seeds'
import { TOUCH_TARGET_EXPAND_Y } from '@/components/ui/primitives'
import { useCanScrollRight } from '@/lib/useViewport'

// Baixo o suficiente pra raramente disparar (frase curta e concreta já passa) — o gate em si é
// intencional (evita estimar sobre nada), só não pode parecer botão quebrado o tempo todo.
export const MIN_SCOPE_CHARS = 20

// Alto o suficiente pra um PRD colado por engano ainda caber — mas sem truncar silenciosamente:
// acima disso o envio bloqueia e o motivo aparece.
export const MAX_SCOPE_CHARS = 6000

export function ScopeField({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  /** Atalho Ctrl/Cmd+Enter — fluxo texto → resultado espera isso, sem precisar soltar o teclado. */
  onSubmit: () => void
  disabled?: boolean
}) {
  const count = value.trim().length
  const overMax = count > MAX_SCOPE_CHARS
  const nearMax = !overMax && count > MAX_SCOPE_CHARS * 0.9

  return (
    <div className="scope-shell">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            onSubmit()
          }
        }}
        disabled={disabled}
        spellCheck={false}
        placeholder="Ex.: Quero criar um app de entregas locais com cadastro de clientes e entregadores, pagamentos online, rastreamento em tempo real e um painel administrativo. O MVP deve estar pronto em até 4 meses."
        rows={7}
        className="block w-full resize-y border-0 bg-transparent px-4 py-3.5 text-base leading-[26px] text-ink outline-none placeholder:text-ink-3"
      />
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-rule-2 px-[15px] py-2 text-[12.5px]">
        <span className={overMax ? 'font-medium text-rust' : nearMax ? 'text-ochre' : 'text-ink-3'}>
          {count.toLocaleString('pt-BR')} caracteres
        </span>
        {/* ink-2, não ink-3 — contraste suficiente pra não ser fácil demais de ignorar, sem
            deixar de ser secundário. */}
        <span className={overMax ? 'font-medium text-rust' : 'text-ink-2'}>
          {overMax
            ? `${(count - MAX_SCOPE_CHARS).toLocaleString('pt-BR')} acima do limite de ${MAX_SCOPE_CHARS.toLocaleString('pt-BR')} — reduza pra continuar`
            : 'Quanto mais contexto, mais precisa a estimativa.'}
        </span>
      </div>
    </div>
  )
}

/** Ao lado do campo de texto livre, não abaixo — junto com ConstraintFields, ocupa a coluna
 * direita da seção de Escopo (ver SquadBuilderApp). */
export function ScopeSeeds({ onUseSeed, disabled }: { onUseSeed: (text: string) => void; disabled?: boolean }) {
  const trackRef = useRef<HTMLDivElement>(null)
  // Mesmo hook do AllocationChart — sinaliza que tem mais chip fora da tela pra arrastar, em vez
  // de deixar o corte abrupto na borda como única pista.
  const canScrollRight = useCanScrollRight(trackRef, [])

  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-ink-3">Experimente um exemplo</span>
      {/* Carrossel com scroll-snap no mobile — 4 chips não cabem numa linha só numa tela estreita
          e quebrar em 2 linhas ocupava espaço vertical à toa. A partir de sm sobra espaço de sobra,
          então vira uma linha comum sem scroll. */}
      <div className="relative">
        <div
          ref={trackRef}
          // gap-y-3.5, não gap-2 uniforme: no carrossel mobile (linha única) não faz diferença,
          // mas a partir de sm isso quebra em várias linhas (flex-wrap) — cada chip expande a
          // área de toque real 6px pra cima/baixo (TOUCH_TARGET_EXPAND_Y), e menos de 12px de
          // espaço vertical faria essas áreas invisíveis de linhas vizinhas se sobreporem.
          className="flex snap-x snap-mandatory items-center gap-x-2 gap-y-3.5 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0"
        >
          {SCOPE_SEEDS.map((seed) => (
            <button
              key={seed.id}
              type="button"
              onClick={() => onUseSeed(seed.text)}
              disabled={disabled}
              // TOUCH_TARGET_EXPAND_Y: mesmo alvo de toque pequeno de qualquer chip — aqui ainda
              // mais crítico, empilhado num carrossel onde o vizinho está a poucos px de distância.
              className={`shrink-0 snap-start rounded-full border border-rule px-3 py-1 text-[13px] font-medium text-petrol transition-transform duration-150 hover:-translate-y-px hover:border-petrol hover:bg-paper active:translate-y-0 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50 ${TOUCH_TARGET_EXPAND_Y}`}
            >
              {seed.label}
            </button>
          ))}
        </div>
        {canScrollRight && (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-paper to-transparent sm:hidden"
          />
        )}
      </div>
    </div>
  )
}
