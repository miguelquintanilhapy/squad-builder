import { ScenarioVersion } from '@/types'
import { formatCurrencyBRL, formatMonthsLabel } from '@/lib/labels'

/**
 * Comparar cenários é o trabalho que a pessoa está tentando fazer (revisão externa 3.1) — não
 * um chat que substitui o anterior. Cada versão mostra os números-chave e o diff contra a
 * anterior, e nenhuma é descartada ao voltar pra uma mais antiga.
 */
export function VersionList({
  versions,
  activeVersionId,
  onSelect,
}: {
  versions: ScenarioVersion[]
  activeVersionId: string | null
  onSelect: (id: string) => void
}) {
  if (versions.length < 2) return null

  return (
    <div className="flex flex-col gap-2">
      {versions.map((version, index) => {
        const previous = versions[index - 1]
        const isActive = version.id === activeVersionId
        const costChanged = previous && previous.scenario.totalMonthlyCost !== version.scenario.totalMonthlyCost
        const riskChanged = previous && previous.scenario.riskScore !== version.scenario.riskScore
        const timelineChanged =
          previous && previous.scenario.estimatedTimelineMonths !== version.scenario.estimatedTimelineMonths

        return (
          <button
            key={version.id}
            type="button"
            onClick={() => onSelect(version.id)}
            aria-current={isActive}
            className={`rounded-[7px] border px-3.5 py-3 text-left transition-colors ${
              isActive ? 'border-petrol bg-petrol/5' : 'border-rule-2 bg-paper-3 hover:border-ink-3'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[13px] font-medium text-ink">{version.label}</span>
              {isActive && (
                <span className="shrink-0 rounded-full bg-petrol px-2 py-0.5 text-[11px] font-semibold text-paper-2">
                  Ativo
                </span>
              )}
            </div>
            <div className="tnum mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[12.5px] text-ink-2">
              <span>{formatCurrencyBRL(version.scenario.totalMonthlyCost)}/mês</span>
              <span>{formatMonthsLabel(version.scenario.estimatedTimelineMonths)}</span>
              <span>Risco {version.scenario.riskScore}</span>
            </div>
            {previous && (costChanged || riskChanged || timelineChanged) && (
              <div className="tnum mt-1 text-[11.5px] text-ink-3">
                vs. anterior:{' '}
                {costChanged && (
                  <>
                    {formatCurrencyBRL(previous.scenario.totalMonthlyCost)} → {formatCurrencyBRL(version.scenario.totalMonthlyCost)}
                  </>
                )}
                {timelineChanged && (
                  <>
                    {costChanged ? ' · ' : ''}
                    {formatMonthsLabel(previous.scenario.estimatedTimelineMonths)} → {formatMonthsLabel(version.scenario.estimatedTimelineMonths)}
                  </>
                )}
                {riskChanged && (
                  <>
                    {costChanged || timelineChanged ? ' · ' : ''}
                    risco {previous.scenario.riskScore} → {version.scenario.riskScore}
                  </>
                )}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
