import { CalendarClock, TrendingUp, Users, Wallet } from 'lucide-react'
import { Scenario } from '@/types'
import { formatCurrencyBRL, formatCurrencyRangeBRL, formatMonthsCompact } from '@/lib/labels'

// Um ícone por métrica, pequeno e monocromático (ink-3), não ilustração — acento funcional que
// diferencia os 4 cards, não decoração.
const KPI_ICONS = { 'Squad sugerido': Users, 'Custo mensal': Wallet, 'Prazo estimado': CalendarClock, 'Investimento estimado': TrendingUp } as const

function Kpi({
  label,
  value,
  note,
  loading = false,
  compact = false,
  active = false,
  wide = false,
}: {
  label: string
  value?: React.ReactNode
  note?: string
  loading?: boolean
  compact?: boolean
  /** Destaque cíclico do preview do hero — um anel petrol sutil passa de card em card, dando
   * sensação de "isso está sendo calculado" sem inventar interatividade. */
  active?: boolean
  /** O valor é uma faixa ("R$ 90.000 – R$ 112.500"), mais longa que os outros KPIs — fonte um
   * pouco menor que o padrão, não tão pequena quanto pra parecer um KPI secundário. */
  wide?: boolean
}) {
  const Icon = KPI_ICONS[label as keyof typeof KPI_ICONS]
  return (
    // Cada KPI é a própria superfície, separada por espaço real (gap), não por hairline —
    // o número precisa dominar sem competir com uma grade de linhas em volta.
    <div
      className={`flex flex-col items-center rounded-[7px] bg-paper-3 text-center transition-shadow duration-500 ${compact ? 'px-3 pt-2.5 pb-2' : 'px-[17px] pt-[14px] pb-[13px]'} ${
        active ? 'shadow-[0_0_0_1.5px_var(--petrol)]' : ''
      }`}
    >
      <div className="flex items-center justify-center gap-1.5 text-[12.5px] font-medium text-ink-3">
        <Icon className="size-3.5 shrink-0" strokeWidth={2} />
        {label}
      </div>
      {loading ? (
        <div className="mt-2.5 h-9 w-16 animate-pulse rounded-[7px] bg-rule-2" />
      ) : (
        <div
          // Nunca truncate aqui (nem no compact do hero) — é o número que a pessoa usa pra
          // decidir, não pode esconder parte dele com "...". Quebra linha em vez de cortar.
          className={`tnum break-words font-display font-extrabold leading-[1.1] tracking-[-0.032em] text-ink ${
            compact ? 'mt-1 text-[20px]' : wide ? 'mt-1.5 text-[30px]' : 'mt-1.5 text-[36px]'
          }`}
        >
          {value}
        </div>
      )}
      {note && !loading && <div className="tnum mt-1 text-[12.5px] text-ink-3">{note}</div>}
    </div>
  )
}

const KPI_LABELS = ['Squad sugerido', 'Custo mensal', 'Prazo estimado', 'Investimento estimado']

/**
 * O skeleton do dashboard (DashboardPanel) renderiza este mesmo componente em modo `loading`, em
 * vez de copiar a estrutura à mão — evita divergência silenciosa entre o placeholder e o real a
 * cada mudança de layout.
 */
export function KpiStrip({
  scenario,
  loading = false,
  compact = false,
  activeIndex,
}: {
  scenario: Scenario | null
  loading?: boolean
  /** Modo compacto (preview do hero): o card ali é bem mais estreito que o dashboard real —
   * números menores e sempre 2 colunas, nunca 4, que num container apertado faz os valores
   * saírem pro lado. */
  compact?: boolean
  /** Índice (0-3) do card com destaque cíclico — só o preview do hero usa isso. */
  activeIndex?: number
}) {
  // Empilhado abaixo de 480px — em 2 colunas os 4 cards (com número de 36px cada) ficavam
  // apertados demais numa tela de celular estreita.
  const gridClass = compact ? 'grid grid-cols-2 gap-2.5' : 'grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 sm:grid-cols-4'

  if (loading || !scenario) {
    return (
      <div className={gridClass}>
        {KPI_LABELS.map((label) => (
          <Kpi key={label} label={label} loading compact={compact} />
        ))}
      </div>
    )
  }

  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className={gridClass}>
      <Kpi
        label="Squad sugerido"
        compact={compact}
        active={activeIndex === 0}
        value={
          <>
            {totalHeadcount}
            <span className="ml-1 text-sm font-normal text-ink-3">pessoas</span>
          </>
        }
        note={`${scenario.squad.length} papéis`}
      />
      <Kpi
        label="Custo mensal"
        compact={compact}
        active={activeIndex === 1}
        value={
          <>
            {formatCurrencyBRL(scenario.totalMonthlyCost)}
            <span className="ml-1 text-sm font-normal text-ink-3">/mês</span>
          </>
        }
      />
      <Kpi
        label="Prazo estimado"
        compact={compact}
        active={activeIndex === 2}
        value={
          <>
            {formatMonthsCompact(scenario.estimatedTimelineMonths)}
            <span className="ml-1 text-sm font-normal text-ink-3">meses</span>
          </>
        }
      />
      <Kpi
        label="Investimento estimado"
        compact={compact}
        active={activeIndex === 3}
        wide
        value={formatCurrencyRangeBRL(scenario.totalMonthlyCost, scenario.estimatedTimelineMonths)}
      />
    </div>
  )
}
