import { Scenario } from '@/types'
import { ROLE_LABELS, SENIORITY_LABELS, formatCurrencyBRL } from '@/lib/labels'
import { ALLOCATION_CAPACITY_MULTIPLIER } from '@/lib/rates'

const numCellClasses = 'min-[760px]:w-32 px-[15px] py-2 text-right tnum'
const numHeadClasses = 'min-[760px]:w-32 px-[15px] py-[9px] text-right text-[12.5px] font-medium text-ink-3'

export function CompositionTable({ scenario }: { scenario: Scenario }) {
  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)
  const totalInvestment = scenario.totalMonthlyCost * scenario.estimatedTimelineMonths

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[14.5px]">
        <thead>
          <tr className="bg-paper-2">
            <th className="px-[15px] py-[9px] text-left text-[12.5px] font-medium text-ink-3">Papel</th>
            <th className={numHeadClasses}>Alocação</th>
            <th className={numHeadClasses}>Custo/mês</th>
            <th className={numHeadClasses}>Total</th>
          </tr>
        </thead>
        <tbody>
          {scenario.squad.map((member, index) => {
            const allocationPct = Math.round(ALLOCATION_CAPACITY_MULTIPLIER[member.allocation] * 100)
            const monthlyCost = (member.monthlyCostPerPerson ?? 0) * member.quantity
            const total = monthlyCost * scenario.estimatedTimelineMonths
            return (
              <tr key={`${member.role}-${index}`} className="border-b border-rule-2 last:border-b-0 hover:bg-paper-2">
                <td className="px-[15px] py-2 text-ink">
                  <div>
                    {member.quantity}x {ROLE_LABELS[member.role]}{' '}
                    <span className="text-[12.5px] text-ink-3">{SENIORITY_LABELS[member.seniority]}</span>
                  </div>
                  {member.justification && (
                    <div className="mt-0.5 text-[12.5px] text-ink-3">{member.justification}</div>
                  )}
                </td>
                <td className={numCellClasses}>{allocationPct}%</td>
                <td className={numCellClasses}>{formatCurrencyBRL(monthlyCost)}</td>
                <td className={numCellClasses}>{formatCurrencyBRL(total)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="border-t border-rule bg-paper-2 font-semibold">
            <td className="px-[15px] py-2">{totalHeadcount} pessoas no squad</td>
            <td className={numCellClasses}>{scenario.estimatedTimelineMonths} meses</td>
            <td className={numCellClasses}>{formatCurrencyBRL(scenario.totalMonthlyCost)}</td>
            <td className={numCellClasses}>{formatCurrencyBRL(totalInvestment)}</td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
