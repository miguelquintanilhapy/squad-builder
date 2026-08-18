import { useState } from 'react'
import { ContractType, RiskLevel, RoleType, Scenario } from '@/types'
import { RISK_LEVEL_LABELS, ROLE_LABELS, formatCurrencyBRL, parseCurrencyPtBR } from '@/lib/labels'
import { MONTHLY_RATE_BRL } from '@/lib/rates'

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = { pj: 'PJ', clt: 'CLT' }

/**
 * Custo de referência por papel (revisão externa 3.2) — a assunção que mais gera desconfiança
 * quando fixa: "R$ 8.000 pra Dev Mobile Pleno" varia por região/senioridade real. Editável aqui,
 * junto das outras premissas, em vez de escondida atrás de "custo de mercado".
 */
function RateOverrideRow({
  role,
  effectiveRate,
  onChange,
}: {
  role: RoleType
  effectiveRate: number
  onChange?: (role: RoleType, monthlyRate: number) => void
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(effectiveRate))

  function commit() {
    // parseCurrencyPtBR, não Number() cru: "8.000" digitado é R$ 8 mil em pt-BR, não 8 (achado
    // de code review — type="number" nativo aceitava e interpretava o ponto como decimal).
    const value = parseCurrencyPtBR(draft)
    if (Number.isFinite(value) && value > 0) onChange?.(role, value)
    setEditing(false)
  }

  const label = `Custo de referência (${ROLE_LABELS[role]}, PJ integral)`

  if (!onChange) {
    return (
      <li>
        {label}: {formatCurrencyBRL(effectiveRate)}/mês
      </li>
    )
  }

  if (editing) {
    return (
      <li className="flex flex-wrap items-center gap-2">
        <span>{label}:</span>
        <input
          type="text"
          inputMode="numeric"
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') {
              setDraft(String(effectiveRate))
              setEditing(false)
            }
          }}
          className="w-24 rounded border border-rule-2 bg-paper-3 px-1.5 py-0.5 text-[12.5px] text-ink outline-none focus:border-petrol"
        />
        <span>/mês</span>
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center gap-2">
      <span>
        {label}: {formatCurrencyBRL(effectiveRate)}/mês
      </span>
      <button
        type="button"
        onClick={() => {
          setDraft(String(effectiveRate))
          setEditing(true)
        }}
        className="text-[11px] font-medium text-petrol underline underline-offset-2 hover:text-ink"
      >
        editar
      </button>
    </li>
  )
}

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
export function RiskPanel({
  scenario,
  onContractTypeChange,
  rateOverrides,
  onRateOverrideChange,
}: {
  scenario: Scenario
  /** Ausente = premissa fica só-leitura (ex: snapshot de uma versão passada da negociação). */
  onContractTypeChange?: (contractType: ContractType) => void
  rateOverrides?: Partial<Record<RoleType, number>>
  onRateOverrideChange?: (role: RoleType, monthlyRate: number) => void
}) {
  const color = RISK_COLOR[scenario.riskLevel]

  // Uma linha por papel distinto no squad — mesma senioridade e taxa pra todas as entradas
  // desse papel, mesmo que o squad tenha, num caso raro, o mesmo papel em duas senioridades.
  const distinctRoles = [...new Map(scenario.squad.map((m) => [m.role, m.seniority])).entries()]

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
        <div className="mt-1.5 flex items-center gap-1.5 text-[13.5px] font-medium" style={{ color }}>
          <span aria-hidden="true" className="inline-block size-[7px] rounded-full" style={{ background: color }} />
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
        <p className="text-[12.5px] font-medium text-ink-2">Por que esse risco?</p>
        <ul className="m-0 mt-1.5 list-none p-0">
          <WeightRow weight={scenario.riskBase}>Base pela complexidade do escopo.</WeightRow>
          {scenario.drivers.map((driver, index) => (
            <WeightRow key={index} weight={driver.weight}>
              {driver.description}
            </WeightRow>
          ))}
        </ul>
        {/* Lista de verdade, não parágrafo corrido (revisão externa 3.2) — e o modelo de
            contratação vira um parâmetro editável de fato, não um item de texto perdido no meio. */}
        <div className="mt-[15px]">
          <p className="text-[12.5px] font-medium text-ink-2">Assumimos</p>
          <ul className="m-0 mt-1.5 list-none space-y-1.5 p-0 text-[12.5px] leading-[1.6] text-ink-3">
            <li className="flex flex-wrap items-center gap-2">
              <span>Modelo de contratação:</span>
              <span role="radiogroup" aria-label="Modelo de contratação" className="inline-flex gap-1">
                {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((ct) => (
                  <button
                    key={ct}
                    type="button"
                    role="radio"
                    aria-checked={scenario.contractType === ct}
                    disabled={!onContractTypeChange}
                    onClick={() => onContractTypeChange?.(ct)}
                    className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold transition-[color,background-color,border-color,transform] duration-150 hover:-translate-y-px active:translate-y-0 active:scale-[0.96] ${
                      scenario.contractType === ct
                        ? 'border-petrol bg-petrol text-paper-2'
                        : 'border-ink-3 text-ink-2 hover:border-ink'
                    } disabled:pointer-events-none`}
                  >
                    {CONTRACT_TYPE_LABELS[ct]}
                  </button>
                ))}
              </span>
            </li>
            {distinctRoles.map(([role, seniority]) => (
              <RateOverrideRow
                key={role}
                role={role}
                effectiveRate={rateOverrides?.[role] ?? MONTHLY_RATE_BRL[role][seniority]}
                onChange={onRateOverrideChange}
              />
            ))}
            {scenario.assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
        </div>
        {scenario.midGroundSuggestion && (
          <p className="mt-3 text-[13px] leading-relaxed text-ink-2">
            <b className="font-medium text-ink">Sugestão de meio-termo:</b> {scenario.midGroundSuggestion}
          </p>
        )}
      </div>
    </div>
  )
}
