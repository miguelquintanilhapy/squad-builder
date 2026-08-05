'use client'

import { SCOPE_SEEDS } from '@/lib/seeds'

export const MIN_SCOPE_CHARS = 40

export function ScopeField({
  value,
  onChange,
  onUseSeed,
  disabled,
}: {
  value: string
  onChange: (value: string) => void
  onUseSeed: (text: string) => void
  disabled?: boolean
}) {
  const count = value.trim().length

  return (
    <div className="flex flex-col gap-3.5">
      <div className="scope-shell">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          spellCheck={false}
          placeholder="Um app de entregas locais com motos. O cliente pede pelo celular, paga no app e acompanha o motoboy no mapa em tempo real. Precisa de um painel pro lojista e repasse automático pros entregadores."
          rows={7}
          className="block w-full resize-y border-0 bg-transparent px-4 py-3.5 text-base leading-[26px] text-ink outline-none placeholder:text-ink-3"
        />
        <div className="flex items-center justify-between gap-3 border-t border-dashed border-rule-2 px-[15px] py-2 text-[12.5px] text-ink-3">
          <span>{count} caracteres</span>
          <span>Quanto mais concreto, menos chute</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[13px] text-ink-3">Ou parta de</span>
        {SCOPE_SEEDS.map((seed) => (
          <button
            key={seed.id}
            type="button"
            onClick={() => onUseSeed(seed.text)}
            disabled={disabled}
            className="rounded-full border border-rule px-3 py-1 text-[13px] font-medium text-petrol transition-transform duration-150 hover:-translate-y-px hover:border-petrol hover:bg-paper-2 disabled:pointer-events-none disabled:opacity-50"
          >
            {seed.label}
          </button>
        ))}
      </div>
    </div>
  )
}
