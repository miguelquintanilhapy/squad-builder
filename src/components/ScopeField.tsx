'use client'

import { SCOPE_SEEDS } from '@/lib/seeds'

// Baixo o suficiente pra raramente disparar (frase curta e concreta já passa) — o gate em si é
// intencional (evita estimar sobre nada), só não pode parecer botão quebrado o tempo todo.
export const MIN_SCOPE_CHARS = 20

// Alto o suficiente pra um PRD colado por engano ainda caber — mas sem truncar silenciosamente:
// acima disso o envio bloqueia e o motivo aparece (revisão externa 2.4).
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
        placeholder="Um app de entregas locais com motos. O cliente pede pelo celular, paga no app e acompanha o motoboy no mapa em tempo real. Precisa de um painel pro lojista e repasse automático pros entregadores."
        rows={7}
        className="block w-full resize-y border-0 bg-transparent px-4 py-3.5 text-base leading-[26px] text-ink outline-none placeholder:text-ink-3"
      />
      <div className="flex items-center justify-between gap-3 border-t border-dashed border-rule-2 px-[15px] py-2 text-[12.5px]">
        <span className={overMax ? 'font-medium text-rust' : nearMax ? 'text-ochre' : 'text-ink-3'}>
          {count.toLocaleString('pt-BR')} caracteres
        </span>
        <span className={overMax ? 'font-medium text-rust' : 'text-ink-3'}>
          {overMax
            ? `${(count - MAX_SCOPE_CHARS).toLocaleString('pt-BR')} acima do limite de ${MAX_SCOPE_CHARS.toLocaleString('pt-BR')} — reduza pra continuar`
            : 'Quanto mais concreto, menos chute'}
        </span>
      </div>
    </div>
  )
}

/** Ao lado do campo de texto livre, não abaixo — junto com ConstraintFields, ocupa a coluna
 * direita da seção de Escopo (ver SquadBuilderApp). */
export function ScopeSeeds({ onUseSeed, disabled }: { onUseSeed: (text: string) => void; disabled?: boolean }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] text-ink-3">Ou parta de</span>
      <div className="flex flex-nowrap items-center gap-2">
        {SCOPE_SEEDS.map((seed) => (
          <button
            key={seed.id}
            type="button"
            onClick={() => onUseSeed(seed.text)}
            disabled={disabled}
            className="rounded-full border border-rule px-3 py-1 text-[13px] font-medium text-petrol transition-transform duration-150 hover:-translate-y-px hover:border-petrol hover:bg-paper-2 active:translate-y-0 active:scale-[0.96] focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {seed.label}
          </button>
        ))}
      </div>
    </div>
  )
}
