import { Scenario } from '@/types'
import { formatCurrencyBRL } from '@/lib/labels'

function Kpi({ label, value, note }: { label: string; value: React.ReactNode; note?: string }) {
  return (
    <div className="bg-paper-3 px-[17px] pt-[14px] pb-[13px]">
      <div className="text-[12.5px] font-medium text-ink-3">{label}</div>
      <div className="mt-1.5 font-display text-[32px] font-bold leading-[1.14] tracking-[-0.032em] text-ink [font-variant-numeric:tabular-nums]">
        {value}
      </div>
      {note && <div className="mt-1 text-[12.5px] text-ink-3 [font-variant-numeric:tabular-nums]">{note}</div>}
    </div>
  )
}

export function KpiStrip({ scenario }: { scenario: Scenario }) {
  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)
  const totalInvestment = scenario.totalMonthlyCost * scenario.estimatedTimelineMonths

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule-2 bg-rule-2 sm:grid-cols-4">
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
            {scenario.estimatedTimelineMonths}
            <span className="ml-1 text-sm font-normal text-ink-3">meses</span>
          </>
        }
      />
      <Kpi
        label="Investimento total"
        value={formatCurrencyBRL(totalInvestment)}
        note={`ao longo de ${scenario.estimatedTimelineMonths} meses`}
      />
    </div>
  )
}
