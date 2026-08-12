import { RiskLevel, Scenario } from '@/types'
import { RISK_LEVEL_LABELS } from '@/lib/labels'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: 'var(--moss)',
  medium: 'var(--ochre)',
  high: 'var(--rust)',
  critical: 'var(--rust)',
}

function WeightRow({ weight, children }: { weight: number; children: React.ReactNode }) {
  // Sem linha entre os drivers — só espaço (briefing §4): a lista já é curta e cada item
  // tem peso numérico próprio, uma borda ali não ajuda a ler, só soma ruído.
  return (
    <li className="flex gap-3 py-[7px] text-[14.5px]">
      <span className="tnum w-[30px] shrink-0 pt-[3px] text-right text-[12.5px] text-ink-3">
        +{Math.round(weight)}
      </span>
      <span className="text-ink-2">{children}</span>
    </li>
  )
}

/**
 * Base + todos os drivers, sem corte em top-3: a soma exibida tem que fechar com o score exibido
 * (ver revisão externa 1.4/3.12 — um número que não fecha é pior que nenhum número).
 */
export function RiskPanel({ scenario }: { scenario: Scenario }) {
  const color = RISK_COLOR[scenario.riskLevel]

  return (
    // As duas colunas compartilham a superfície do Panel — sem caixa própria por coluna, só o
    // gap (espaço) separa, evitando "caixa branca dentro de caixa branca" sem contraste nenhum.
    <div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-[210px_1fr]">
      <div>
        <div className="flex items-baseline gap-1">
          <span
            className="tnum font-display text-[54px] font-extrabold leading-none tracking-[-0.045em]"
            style={{ color }}
          >
            {scenario.riskScore}
          </span>
          <span className="tnum text-[16px] font-medium text-ink-3">/100</span>
        </div>
        <div className="mt-1.5 text-[13.5px] font-medium" style={{ color }}>
          Risco {RISK_LEVEL_LABELS[scenario.riskLevel].toLowerCase()}
        </div>
        <div className="mt-[13px] h-1.5 overflow-hidden rounded-full bg-rule-2">
          <div
            className="h-full rounded-full transition-[width] duration-500"
            style={{ width: `${scenario.riskScore}%`, background: color }}
          />
        </div>
        <div className="mt-1.5 flex justify-between text-[11px] text-ink-3">
          <span>Baixo</span>
          <span>Alto</span>
        </div>
      </div>
      <div>
        <ul className="m-0 list-none p-0">
          <WeightRow weight={scenario.riskBase}>Base pela complexidade do escopo.</WeightRow>
          {scenario.drivers.map((driver, index) => (
            <WeightRow key={index} weight={driver.weight}>
              {driver.description}
            </WeightRow>
          ))}
        </ul>
        <p className="mt-[15px] text-[12.5px] leading-[1.7] text-ink-3">
          <b className="font-medium text-ink-2">Assumimos:</b> {scenario.assumptions.join(' · ')}
        </p>
        {scenario.midGroundSuggestion && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            <b className="font-medium text-ink">Sugestão de meio-termo:</b> {scenario.midGroundSuggestion}
          </p>
        )}
      </div>
    </div>
  )
}
