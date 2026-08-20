import { useEffect, useRef } from 'react'
import { ChevronRight } from 'lucide-react'
import { ScenarioVersion } from '@/types'

/**
 * Trilha de decisões, não lista de cards: cada versão é um nó numa linha do tempo, e a partir da
 * segunda o rótulo é a mensagem literal enviada na negociação — deixando explícito que aquela
 * mensagem foi a causa do cenário, não uma edição de dados qualquer. Os números do cenário
 * resultante ficam só no ImpactSummary — repeti-los aqui competiria com ele por atenção, e a
 * trilha deve ficar leve, só a causa, não a consequência.
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
    <div className="relative max-h-96 overflow-y-auto pr-1">
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
              className={`group relative flex w-full items-start gap-3 rounded-[7px] py-2 pl-0 pr-2.5 text-left transition-colors ${
                isActive ? 'bg-petrol/5' : 'hover:bg-paper'
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
                  {/* Caps reservado só pro badge de status "· Atual" — o rótulo de categoria fica
                      em title case. */}
                  <span className={`text-[10.5px] font-semibold tracking-wide ${isActive ? 'text-petrol' : 'text-ink-3'}`}>
                    {isFirst ? 'Ponto de partida' : 'Ajuste solicitado'}
                  </span>
                  {isActive && (
                    <span className="text-[10.5px] font-semibold uppercase tracking-wide text-petrol">· Atual</span>
                  )}
                </div>
                <p
                  className={`mt-0.5 truncate ${isFirst ? 'not-italic' : 'italic'} ${
                    isActive ? 'text-[14.5px] font-medium text-ink' : 'text-[13px] text-ink-3 group-hover:text-ink-2'
                  }`}
                >
                  {isFirst ? version.label : `"${version.label}"`}
                </p>
              </div>
              {/* Chevron só no hover — sinaliza que os nós são clicáveis, não texto estático. */}
              {!isActive && (
                <ChevronRight
                  aria-hidden="true"
                  className="mt-1 size-3.5 shrink-0 text-ink-3 opacity-0 transition-opacity group-hover:opacity-100"
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
