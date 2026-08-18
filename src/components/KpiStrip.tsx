import { Scenario } from '@/types'
import { formatCurrencyBRL, formatCurrencyRangeBRL, formatMonthsCompact, formatMonthsLabel } from '@/lib/labels'

function Kpi({
  label,
  value,
  note,
  loading = false,
}: {
  label: string
  value?: React.ReactNode
  note?: string
  loading?: boolean
}) {
  return (
    // Cada KPI é a própria superfície, separada por espaço real (gap), não por hairline —
    // o número precisa dominar sem competir com uma grade de linhas em volta (briefing §10).
    <div className="rounded-[7px] bg-paper-3 px-[17px] pt-[14px] pb-[13px]">
      <div className="text-[12.5px] font-medium text-ink-3">{label}</div>
      {loading ? (
        <div className="mt-2.5 h-9 w-16 animate-pulse rounded-[7px] bg-rule-2" />
      ) : (
        <div className="tnum mt-1.5 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
          {value}
        </div>
      )}
      {note && !loading && <div className="tnum mt-1 text-[12.5px] text-ink-3">{note}</div>}
    </div>
  )
}

const KPI_LABELS = ['Squad sugerido', 'Custo mensal', 'Prazo estimado', 'Custo acumulado no período']

/**
 * O skeleton do dashboard (DashboardPanel) renderiza este mesmo componente em modo `loading`, em
 * vez de copiar a estrutura à mão — evita divergência silenciosa entre o placeholder e o real a
 * cada mudança de layout (revisão externa 2.8).
 */
export function KpiStrip({ scenario, loading = false }: { scenario: Scenario | null; loading?: boolean }) {
  if (loading || !scenario) {
    return (
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {KPI_LABELS.map((label) => (
          <Kpi key={label} label={label} loading />
        ))}
      </div>
    )
  }

  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      <Kpi
        label="Squad sugerido"
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
        value={
          <>
            {formatCurrencyBRL(scenario.totalMonthlyCost)}
            <span className="ml-1 text-sm font-normal text-ink-3">/mês</span>
          </>
        }
      />
      <Kpi
        label="Prazo estimado"
        value={
          <>
            {formatMonthsCompact(scenario.estimatedTimelineMonths)}
            <span className="ml-1 text-sm font-normal text-ink-3">meses</span>
          </>
        }
      />
      <Kpi
        label="Custo acumulado no período"
        value={formatCurrencyRangeBRL(scenario.totalMonthlyCost, scenario.estimatedTimelineMonths)}
        note={`ao longo de ${formatMonthsLabel(scenario.estimatedTimelineMonths)}`}
      />
    </div>
  )
}
