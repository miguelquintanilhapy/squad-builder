import { Loader2 } from 'lucide-react'

export function Card({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return <div className={`rounded-[3px] border border-rule-2 bg-paper-3 ${className}`}>{children}</div>
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[12.5px] font-medium text-ink-3">{children}</h2>
}

/**
 * Painel com cabeçalho (título + nota opcional) — cromo compartilhado por composição, risco e
 * alocação. Sem padding no corpo (como o .scroller do POC): tabela, SVG e o grid do RiskPanel já
 * levam o próprio espaçamento interno; quem precisar de respiro (ex: NegotiationChat) adiciona.
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
    <div className="overflow-hidden rounded-[3px] border border-rule-2 bg-paper-3">
      <div className="flex items-baseline justify-between gap-3.5 border-b border-rule-2 bg-paper-2 px-[15px] py-[11px]">
        <h3 className="font-display text-[17px] font-bold tracking-[-0.02em] text-ink">{title}</h3>
        {note && <span className="tnum text-[12.5px] text-ink-3">{note}</span>}
      </div>
      {children}
    </div>
  )
}

/**
 * Cabeçalho numerado de seção. Sem traço decorativo — a diferenciação é só tipografia/cor/peso
 * (número em display+petrol vs. rótulo em ink-2), como orientado no PROMPT.md: um traço ali não
 * carregaria nenhuma informação, só ornamentaria.
 */
export function Eyebrow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="mb-5 flex items-center gap-2.5 text-[14px] font-medium text-ink-2">
      <span className="font-display text-[14px] font-bold tracking-[-0.01em] text-petrol">{index}</span>
      {children}
    </div>
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
      className={`group inline-flex items-center justify-center gap-2.5 rounded-[3px] border px-[22px] py-[11px] text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 ${
        disabled
          ? 'cursor-not-allowed border-rule bg-transparent text-ink-3'
          : 'border-ink bg-ink text-paper-2 hover:-translate-y-px hover:shadow-[0_3px_0_0_var(--petrol)]'
      }`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
