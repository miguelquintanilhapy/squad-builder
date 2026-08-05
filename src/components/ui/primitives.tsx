import { Check, Loader2, ShieldAlert, ShieldCheck, ShieldQuestion, ShieldX } from 'lucide-react'
import { RiskLevel } from '@/types'
import { RISK_LEVEL_LABELS } from '@/lib/labels'

export function Card({
  className = '',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  // .glass declara elevação uma única vez: fundo translúcido + blur + realce de aresta +
  // sombra tingida de accent, como um efeito material coeso (não borda + drop-shadow soltos).
  return <div className={`glass rounded-2xl ${className}`}>{children}</div>
}

export function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h2 className="text-xs font-medium tracking-[0.08em] text-muted uppercase">{children}</h2>
}

/** Cabeçalho numerado de seção (POC): número em petrol + rótulo + linha de preenchimento. */
export function Eyebrow({ index, children }: { index: string; children: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-center gap-2.5 text-[13.5px] font-medium text-ink-2">
      <span className="font-display text-[13px] font-bold tracking-[-0.01em] text-petrol">{index}</span>
      {children}
      <span className="h-px flex-1 bg-rule" />
    </div>
  )
}

export function Chip({
  label,
  active,
  onClick,
}: {
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-[13px] leading-5 transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 ${
        active
          ? 'border-accent/40 bg-accent/15 text-foreground shadow-[0_0_0_1px_rgba(37,99,235,0.18)]'
          : 'border-border-subtle bg-white/40 text-muted hover:border-accent/30 hover:text-foreground-secondary'
      }`}
    >
      {active && <Check className="size-3" strokeWidth={2.5} />}
      {label}
    </button>
  )
}

const RISK_BADGE_STYLES: Record<RiskLevel, string> = {
  low: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  high: 'border-orange-200 bg-orange-50 text-orange-700',
  critical: 'border-red-200 bg-red-50 text-red-700',
}

const RISK_ICONS: Record<RiskLevel, typeof ShieldCheck> = {
  low: ShieldCheck,
  medium: ShieldQuestion,
  high: ShieldAlert,
  critical: ShieldX,
}

export function RiskBadge({ score, level }: { score: number; level: RiskLevel }) {
  const Icon = RISK_ICONS[level]
  return (
    // key força remount quando o score muda (nova negociação), disparando o pulso de
    // "isso foi recalculado" — o único momento de motion autoral ligado a mudança de estado.
    <span
      key={`${level}-${score}`}
      className={`animate-value-pulse inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tabular-nums ${RISK_BADGE_STYLES[level]}`}
    >
      <Icon className="size-3.5" strokeWidth={2} />
      Risk Score {score}/100 · {RISK_LEVEL_LABELS[level]}
    </span>
  )
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  loading = false,
  type = 'button',
  fullWidth = false,
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  loading?: boolean
  type?: 'button' | 'submit'
  fullWidth?: boolean
}) {
  // Desabilitado é outline neutro, nunca a cor primária com opacidade baixa — quem explica o
  // que falta é o texto ao lado do botão, não o próprio botão.
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} group inline-flex items-center justify-center gap-2.5 rounded-[3px] border px-[22px] py-[11px] text-[15px] font-semibold transition-[transform,background-color,box-shadow] duration-150 ease-out focus-visible:outline focus-visible:outline-2 focus-visible:outline-petrol focus-visible:outline-offset-2 ${
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
