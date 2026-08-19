import { Loader2 } from 'lucide-react'

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[12.5px] font-medium text-ink-3">{children}</h2>
}

/**
 * Superfície compartilhada por composição, risco e alocação — sem cabeçalho embutido, o título
 * fica fora (ver PanelTitle), no mesmo padrão do h2 de "Leitura do escopo". Sem borda: a
 * elevação (sombra) bem leve define o limite, não uma linha (briefing §4/§11 — "raised" é
 * elevação com parcimônia, não borda em tudo). Sem padding: tabela, SVG e o grid do RiskPanel já
 * levam o próprio espaçamento interno; quem precisar de respiro (ex: NegotiationChat) adiciona.
 */
export function Panel({ children }: { children: React.ReactNode }) {
  return <div className="overflow-hidden rounded-[7px] bg-paper-3 shadow-[var(--shadow-raised)]">{children}</div>
}

/**
 * Título de card, fora da caixa — mesma ideia visual do h2 de "Leitura do escopo": título solto
 * acima do conteúdo em vez de dentro de uma faixa/cabeçalho embutido no painel.
 * `emphasis` (CRITICA-UI §1.6): todo painel usava o mesmo peso visual, sem diferenciar as seções
 * principais (Squad recomendado, Índice de risco) das de apoio — um pouco maior/mais escuro é
 * suficiente, não precisa de caixa própria nem cor nova.
 */
export function PanelTitle({ title, note, emphasis = false }: { title: string; note?: string; emphasis?: boolean }) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3.5">
      <h3
        className={`font-display font-bold leading-none tracking-[-0.025em] text-ink ${
          emphasis ? 'text-[30px]' : 'text-[26px]'
        }`}
      >
        {title}
      </h3>
      {note && <span className="tnum text-[12.5px] text-ink-3">{note}</span>}
    </div>
  )
}

/**
 * Cabeçalho de seção: só o rótulo, no lugar e no estilo onde antes ficava o número (display,
 * petrol) — sem numeração decorativa, sem traço de preenchimento.
 */
export function Eyebrow({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`mb-5 font-display text-[19px] font-bold tracking-[-0.015em] text-petrol ${className}`}>
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
