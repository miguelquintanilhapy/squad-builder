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
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${fullWidth ? 'w-full' : ''} group inline-flex items-center justify-center gap-2 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white shadow-[0_1px_0_0_rgba(255,255,255,0.16)_inset,0_8px_20px_-8px_rgba(37,99,235,0.55)] transition-[transform,background-color,box-shadow] duration-150 ease-out hover:bg-accent-strong hover:shadow-[0_1px_0_0_rgba(255,255,255,0.16)_inset,0_10px_24px_-6px_rgba(37,99,235,0.65)] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 disabled:shadow-none`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  )
}
