import { useEffect, useRef } from 'react'
import { ScenarioVersion } from '@/types'
import { formatCurrencyBRL, formatMonthsLabel } from '@/lib/labels'

/**
 * Trilha de decisões, não lista de cards: cada versão é um nó numa linha do tempo, e a partir da
 * segunda o rótulo é a mensagem literal que o usuário mandou — deixando explícito que aquele
 * pedido foi a causa do cenário, não uma edição de dados qualquer (revisão externa 3.1 pedia
 * comparação entre cenários; esta é a camada visual que faz a causa saltar aos olhos).
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
  const activeRef = useRef<HTMLButtonElement | null>(null)

  // Trocar de versão rola a trilha até o nó ativo — só relevante quando a negociação já rendeu
  // versões suficientes pra estourar o max-h e esconder o nó fora da vista.
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }, [activeVersionId])

  if (versions.length < 2) return null

  return (
    <div className="relative max-h-72 overflow-y-auto pr-1">
      <div className="absolute bottom-3 left-[5px] top-3 w-px bg-rule-2" aria-hidden="true" />
      <div className="flex flex-col">
        {versions.map((version, index) => {
          const isActive = version.id === activeVersionId
          const isFirst = index === 0

          return (
            <button
              key={version.id}
              ref={isActive ? activeRef : undefined}
              type="button"
              onClick={() => onSelect(version.id)}
              aria-current={isActive}
              className={`group relative flex w-full items-start gap-3 rounded-[7px] py-2.5 pl-0 pr-2.5 text-left transition-colors ${
                isActive ? 'bg-petrol/5' : 'hover:bg-paper-2/60'
              }`}
            >
              <span className="relative z-10 mt-[3px] flex size-[11px] shrink-0 items-center justify-center">
                <span
                  className={
                    isActive
                      ? 'size-3 rounded-full bg-petrol shadow-[var(--shadow-focus)]'
                      : 'size-2 rounded-full border border-ink-3 bg-paper-3 transition-colors group-hover:border-ink'
                  }
                />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10.5px] font-semibold uppercase tracking-wide ${
                      isActive ? 'text-petrol' : 'text-ink-3'
                    }`}
                  >
                    {isFirst ? 'Ponto de partida' : 'Ajuste solicitado'}
                  </span>
                  {isActive && (
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-petrol">· Atual</span>
                  )}
                </div>
                <p
                  className={`mt-0.5 truncate text-[13.5px] ${
                    isFirst ? 'not-italic' : 'italic'
                  } ${isActive ? 'font-medium text-ink' : 'text-ink-3 group-hover:text-ink-2'}`}
                >
                  {isFirst ? version.label : `"${version.label}"`}
                </p>
                <div
                  className={`tnum mt-1 flex flex-wrap gap-x-3 gap-y-0.5 ${
                    isActive ? 'text-[12.5px] text-ink-2' : 'text-[11.5px] text-ink-3'
                  }`}
                >
                  <span>{formatCurrencyBRL(version.scenario.totalMonthlyCost)}/mês</span>
                  <span>{formatMonthsLabel(version.scenario.estimatedTimelineMonths)}</span>
                  <span>Risco {version.scenario.riskScore}</span>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
