import { Loader2 } from 'lucide-react'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[12.5px] font-medium text-ink-3">{children}</h2>
}

/**
 * Painel com cabeçalho (título + nota opcional) — cromo compartilhado por composição, risco e
 * alocação. Sem borda: a superfície (paper-3 sobre o paper-2 da página) e uma elevação bem leve
 * definem o limite, não uma linha (briefing §4/§11 — "raised" é elevação com parcimônia, não
 * borda em tudo). Sem padding no corpo: tabela, SVG e o grid do RiskPanel já levam o próprio
 * espaçamento interno; quem precisar de respiro (ex: NegotiationChat) adiciona.
 */
export function Panel({
  title,
  note,
  children,
}: {
  title: string
  note?: string
  children: React.ReactNode
}) {
  return (
    <div className="overflow-hidden rounded-[7px] bg-paper-3 shadow-[0_1px_2px_rgba(24,33,42,0.04),0_2px_8px_rgba(24,33,42,0.06)]">
      <div className="flex items-baseline justify-between gap-3.5 bg-paper-2 px-[15px] py-[11px]">
        <h3 className="font-display text-[19px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
        {note && <span className="tnum text-[12.5px] text-ink-3">{note}</span>}
      </div>
      {children}
    </div>
  )
}

/**
 * Cabeçalho de seção: só o rótulo, no lugar e no estilo onde antes ficava o número (display,
 * petrol) — sem numeração decorativa, sem traço de preenchimento.
 */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-5 font-display text-[19px] font-bold tracking-[-0.015em] text-petrol">{children}</div>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading = false,
  type = 'button',
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
}) {
  // Desabilitado é outline neutro, nunca a cor primária com opacidade baixa — quem explica o
  // que falta é o texto ao lado do botão, não o próprio botão.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`group inline-flex items-center justify-center gap-2.5 rounded-[7px] border px-[22px] py-[11px] text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-300 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 ${
        disabled
          ? 'cursor-not-allowed border-rule bg-transparent text-ink-3'
          : 'border-ink bg-ink text-paper-2 shadow-[0_6px_16px_-4px_rgba(20,88,74,0)] hover:-translate-y-px hover:shadow-[0_6px_16px_-4px_rgba(20,88,74,0.35)] active:translate-y-0 active:scale-[0.98] active:shadow-none'
      }`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
