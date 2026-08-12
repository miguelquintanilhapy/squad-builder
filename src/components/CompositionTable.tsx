import { Scenario } from '@/types'
import {
  ROLE_LABELS,
  SENIORITY_LABELS,
  formatCurrencyBRL,
  formatCurrencyRangeBRL,
  formatMonthsLabel,
} from '@/lib/labels'
import { ALLOCATION_CAPACITY_MULTIPLIER } from '@/lib/rates'

const numCellClasses = 'min-[760px]:w-32 px-[15px] py-3 text-right tnum'
const numHeadClasses = 'min-[760px]:w-32 px-[15px] py-[9px] text-right text-[12.5px] font-medium text-ink-3'

export function CompositionTable({ scenario }: { scenario: Scenario }) {
  const totalHeadcount = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-[14.5px]">
        <thead>
          <tr className="bg-paper-2">
            <th scope="col" className="px-[15px] py-[9px] text-left text-[12.5px] font-medium text-ink-3">
              Papel
            </th>
            <th scope="col" className={numHeadClasses}>
              Alocação
            </th>
            <th scope="col" className={numHeadClasses}>
              Custo/mês
            </th>
            <th scope="col" className={numHeadClasses}>
              Total no período
            </th>
          </tr>
        </thead>
        <tbody>
          {scenario.squad.map((member, index) => {
            const allocationPct = Math.round(ALLOCATION_CAPACITY_MULTIPLIER[member.allocation] * 100)
            const perPerson = member.monthlyCostPerPerson ?? 0
            const monthlyCost = perPerson * member.quantity
            return (
              // Sem linha por papel — a separação vem do padding generoso e do hover, não de
              // borda (briefing §4/§18: reduzir bordas pesadas e linhas excessivas em tabela).
              <tr key={`${member.role}-${index}`} className="hover:bg-paper-2">
                <td className="px-[15px] py-3 text-ink">
                  <div className="font-semibold">
                    {member.quantity}x {ROLE_LABELS[member.role]}{' '}
                    <span className="font-normal text-[12.5px] text-ink-3">{SENIORITY_LABELS[member.seniority]}</span>
                  </div>
                  {member.justification && (
                    <div className="mt-0.5 text-[12.5px] text-ink-3">{member.justification}</div>
                  )}
                </td>
                <td className={numCellClasses}>{allocationPct}%</td>
                <td className={numCellClasses}>
                  {member.quantity > 1 ? (
                    <>
                      {formatCurrencyBRL(perPerson)}/pessoa
                      <span className="text-ink-3"> · {formatCurrencyBRL(monthlyCost)}/mês</span>
                    </>
                  ) : (
                    formatCurrencyBRL(monthlyCost)
                  )}
                </td>
                <td className={numCellClasses}>{formatCurrencyRangeBRL(monthlyCost, scenario.estimatedTimelineMonths)}</td>
              </tr>
            )
          })}
        </tbody>
        <tfoot>
          <tr className="bg-paper-2 font-semibold">
            <td className="px-[15px] py-3">{totalHeadcount} pessoas no squad</td>
            <td className={numCellClasses}>{formatMonthsLabel(scenario.estimatedTimelineMonths)}</td>
            <td className={numCellClasses}>{formatCurrencyBRL(scenario.totalMonthlyCost)}</td>
            <td className={numCellClasses}>
              {formatCurrencyRangeBRL(scenario.totalMonthlyCost, scenario.estimatedTimelineMonths)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}
