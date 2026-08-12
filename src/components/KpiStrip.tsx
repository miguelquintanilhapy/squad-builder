import { Scenario } from '@/types'
import { formatCurrencyBRL, formatCurrencyRangeBRL, formatMonthsCompact, formatMonthsLabel } from '@/lib/labels'

function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    // Cada KPI é a própria superfície, separada por espaço real (gap), não por hairline —
    // o número precisa dominar sem competir com uma grade de linhas em volta (briefing §10).
    <div className="rounded-[7px] bg-paper-3 px-[17px] pt-[14px] pb-[13px]">
      <div className="text-[12.5px] font-medium text-ink-3">{label}</div>
      <div className="tnum mt-1.5 font-display text-[36px] font-extrabold leading-[1.1] tracking-[-0.032em] text-ink">
        {value}
      </div>
      {note && <div className="tnum mt-1 text-[12.5px] text-ink-3">{note}</div>}
    </div>
  )
}

export function KpiStrip({ scenario }: { scenario: Scenario }) {
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
      <Kpi label="Custo mensal" value={formatCurrencyBRL(scenario.totalMonthlyCost)} />
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
