import { useRef, useState } from 'react'
import { ContractType, RiskLevel, RoleType, Scenario } from '@/types'
import { RISK_LEVEL_LABELS, ROLE_LABELS, formatCurrencyBRL, parseCurrencyPtBR } from '@/lib/labels'
import { MONTHLY_RATE_BRL } from '@/lib/rates'

const CONTRACT_TYPE_LABELS: Record<ContractType, string> = { pj: 'PJ', clt: 'CLT' }

/**
 * Custo de referência por papel (revisão externa 3.2) — a assunção que mais gera desconfiança
 * quando fixa: "R$ 8.000 pra Dev Mobile Pleno" varia por região/senioridade real. Editável aqui,
 * junto das outras premissas. Um único "Editar premissas" no topo controla a edição de todas as
 * linhas de uma vez — não um "editar" por papel (AJUSTES-UI §16/17: poluía a lista).
 */
function RateOverrideRow({
  role,
  effectiveRate,
  editing,
  onChange,
}: {
  role: RoleType
  effectiveRate: number
  editing: boolean
  onChange?: (role: RoleType, monthlyRate: number) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  function commit() {
    // parseCurrencyPtBR, não Number() cru: "8.000" digitado é R$ 8 mil em pt-BR, não 8 (achado
    // de code review — type="number" nativo aceitava e interpretava o ponto como decimal).
    const value = parseCurrencyPtBR(inputRef.current?.value ?? '')
    if (Number.isFinite(value) && value > 0) onChange?.(role, value)
  }

  if (!editing) {
    return (
      <li className="flex items-baseline justify-between gap-2">
        <span>{ROLE_LABELS[role]}</span>
        <span className="tnum text-ink">{formatCurrencyBRL(effectiveRate)}/mês</span>
      </li>
    )
  }

  return (
    <li className="flex flex-wrap items-center justify-between gap-2">
      <span>{ROLE_LABELS[role]}</span>
      <span className="flex items-center gap-1.5">
        <input
          ref={inputRef}
          key={effectiveRate}
          type="text"
          inputMode="numeric"
          defaultValue={String(effectiveRate)}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              commit()
              e.currentTarget.blur()
            }
          }}
          className="w-24 rounded border border-rule-2 bg-paper-3 px-1.5 py-0.5 text-right text-[12.5px] text-ink outline-none focus:border-petrol"
        />
        <span className="text-ink-3">/mês</span>
      </span>
    </li>
  )
}

const RISK_COLOR: Record<RiskLevel, string> = {
  low: 'var(--moss)',
  medium: 'var(--ochre)',
  high: 'var(--rust)',
  critical: 'var(--rust)',
}

/**
 * "+N · Título" na frente, explicação curta embaixo (AJUSTES-UI §15) — antes só a descrição
 * longa aparecia e o título de cada driver (já existente em riskEngine.ts) ficava sem uso.
 */
function WeightRow({ weight, title, description }: { weight: number; title: string; description?: string }) {
  // Sem linha entre os drivers — só espaço (briefing §4): a lista já é curta e cada item
  // tem peso numérico próprio, uma borda ali não ajuda a ler, só soma ruído.
  return (
    <li className="flex gap-3 py-[7px] text-[14.5px]">
      <span className="tnum w-[30px] shrink-0 pt-[3px] text-right text-[12.5px] text-ink-3">
        +{Math.round(weight)}
      </span>
      <div>
        <span className="font-medium text-ink">{title}</span>
        {description && <p className="mt-0.5 text-[12.5px] text-ink-3">{description}</p>}
      </div>
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
  const [showRates, setShowRates] = useState(false)
  const [editingRates, setEditingRates] = useState(false)

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
        <p className="text-[12.5px] font-medium text-ink-2">O que gera esse risco?</p>
        <ul className="m-0 mt-1.5 list-none p-0">
          <WeightRow weight={scenario.riskBase} title="Complexidade do escopo" />
          {scenario.drivers.map((driver, index) => (
            <WeightRow key={index} weight={driver.weight} title={driver.title} description={driver.description} />
          ))}
        </ul>
        {/* Lista de verdade, não parágrafo corrido (revisão externa 3.2) — e o modelo de
            contratação vira um parâmetro editável de fato, não um item de texto perdido no meio. */}
        <div className="mt-[15px]">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[12.5px] font-medium text-ink-2">Premissas</p>
            {/* Um único controle de edição pra todas as premissas (AJUSTES-UI §17) — antes cada
                papel tinha seu próprio "editar", poluindo a lista. */}
            {onRateOverrideChange && (
              <button
                type="button"
                onClick={() => {
                  setEditingRates((prev) => !prev)
                  if (!editingRates) setShowRates(true)
                }}
                className="text-[11px] font-medium text-petrol underline underline-offset-2 hover:text-ink"
              >
                {editingRates ? 'Concluir edição' : 'Editar premissas'}
              </button>
            )}
          </div>
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
            {scenario.assumptions.map((assumption, index) => (
              <li key={index}>{assumption}</li>
            ))}
          </ul>
          {/* Custos por papel escondidos por padrão (AJUSTES-UI §16) — expostos sempre inflava a
              lista com números que a maioria das negociações não precisa revisitar. */}
          <button
            type="button"
            onClick={() => setShowRates((prev) => !prev)}
            className="mt-2 text-[11.5px] font-medium text-ink-3 hover:text-ink"
          >
            {showRates ? 'Ocultar custos de referência ▴' : 'Ver custos de referência ▾'}
          </button>
          {showRates && (
            <ul className="m-0 mt-1.5 list-none space-y-1.5 p-0 text-[12.5px] leading-[1.6] text-ink-3">
              {distinctRoles.map(([role, seniority]) => (
                <RateOverrideRow
                  key={role}
                  role={role}
                  effectiveRate={rateOverrides?.[role] ?? MONTHLY_RATE_BRL[role][seniority]}
                  editing={editingRates}
                  onChange={onRateOverrideChange}
                />
              ))}
            </ul>
          )}
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
