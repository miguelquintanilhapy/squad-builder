import { Scenario, SquadMember } from '@/types'
import { MAX_ALLOCATION_MONTHS } from '@/lib/allocationCurve'
import { ROLE_LABELS, SENIORITY_LABELS, formatCurrencyBRL } from '@/lib/labels'
import { ENGINEERING_ROLES } from '@/lib/rates'

const LABEL_GUTTER = 170
const CHART_WIDTH = 1000
const RIGHT_MARGIN = 22
const ROW_HEIGHT = 24
const TOP_MARGIN = 34
const BOTTOM_MARGIN = 20

function roleLabel(member: SquadMember): string {
  return `${member.quantity}x ${ROLE_LABELS[member.role]}`
}

/**
 * Hierarquia real (não decorativa): papel de engenharia (quem constrói) pinta sólido; suporte
 * (quem viabiliza) pinta num tom secundário — usa um dado que já existe (ENGINEERING_ROLES),
 * não inventa categoria nova só pra variar a barra.
 */
function barBaseColor(member: SquadMember): string {
  return ENGINEERING_ROLES.includes(member.role) ? '20,88,74' : '150,93,10'
}

/**
 * Texto equivalente à curva visual (ex: "100% (M1–M3), 35% (M4–M6)") — opacidade sozinha não pode
 * ser o único canal pra comunicar intensidade (mesmo princípio usado pra corrigir os chips em
 * 1.10; achado de code review). Agrupa meses consecutivos com o mesmo percentual em faixas.
 */
function describeAllocationCurve(pcts: number[]): string {
  const ranges: { pct: number; start: number; end: number }[] = []
  pcts.forEach((pct, i) => {
    const last = ranges[ranges.length - 1]
    if (last && last.pct === pct) {
      last.end = i
    } else {
      ranges.push({ pct, start: i, end: i })
    }
  })
  return ranges
    .map((r) => (r.start === r.end ? `${r.pct}% (M${r.start + 1})` : `${r.pct}% (M${r.start + 1}–M${r.end + 1})`))
    .join(', ')
}

/**
 * Um segmento por mês, opacidade = intensidade de envolvimento naquele mês (revisão externa
 * 3.7): a curva vem de allocationCurve.ts (designer concentra no início, QA na segunda metade,
 * o resto é constante) — não é mais uma barra chapada cobrindo o prazo inteiro sem dizer nada.
 */
export function AllocationChart({ scenario }: { scenario: Scenario }) {
  const { squad, estimatedTimelineMonths } = scenario
  // Mesmo teto do motor de cálculo (calculator.ts) — sem isso, um prazo degenerado (squad sem
  // papel de engenharia) desenhava ~1000 colunas de grid com só uma fração preenchida de barras
  // (achado de code review).
  const monthCount = Math.min(MAX_ALLOCATION_MONTHS, Math.max(1, Math.round(estimatedTimelineMonths)))
  const trackWidth = CHART_WIDTH - LABEL_GUTTER - RIGHT_MARGIN
  const step = trackWidth / monthCount
  const height = TOP_MARGIN + squad.length * ROW_HEIGHT + BOTTOM_MARGIN

  return (
    <div className="overflow-x-auto px-[15px] py-[15px]">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        role="img"
        aria-label={`Alocação por papel: ${squad.length} papéis ao longo de ${monthCount} meses`}
        className="block h-auto min-w-[660px] w-full"
      >
        {/* Grid temporal discreto: linha mais leve (opacidade baixa) em vez de hairline cheio. */}
        {Array.from({ length: monthCount + 1 }, (_, m) => {
          const x = LABEL_GUTTER + m * step
          return (
            <g key={m}>
              <line
                x1={x}
                y1={20}
                x2={x}
                y2={TOP_MARGIN + squad.length * ROW_HEIGHT + 6}
                stroke="var(--rule-2)"
                strokeWidth={1}
                strokeOpacity={0.6}
              />
              {m < monthCount && (
                <text x={x + step / 2} y={14} fontSize={10.5} fill="var(--ink-3)" textAnchor="middle">
                  M{m + 1}
                </text>
              )}
            </g>
          )
        })}

        {squad.map((member, index) => {
          const y = TOP_MARGIN + index * ROW_HEIGHT
          const monthlyCost = (member.monthlyCostPerPerson ?? 0) * member.quantity
          const pcts = (member.monthlyAllocationPct ?? Array.from({ length: monthCount }, () => 100)).slice(
            0,
            monthCount
          )
          const baseColor = barBaseColor(member)
          const tooltip = `${roleLabel(member)} ${SENIORITY_LABELS[member.seniority]} · ${formatCurrencyBRL(monthlyCost)}/mês · envolvimento: ${describeAllocationCurve(pcts)}`
          return (
            // group + rect de fundo: hover contextual só com CSS, sem estado novo em React.
            <g key={`${member.role}-${index}`} className="group">
              <title>{tooltip}</title>
              <rect
                x={0}
                y={y}
                width={CHART_WIDTH}
                height={ROW_HEIGHT}
                fill="var(--paper-2)"
                opacity={0}
                className="transition-opacity duration-150 group-hover:opacity-60"
              />
              <text x={0} y={y + 12} fontSize={11.5} fill="var(--ink-2)">
                {roleLabel(member)}{' '}
                <tspan fontSize={10} fill="var(--ink-3)">
                  {SENIORITY_LABELS[member.seniority]}
                </tspan>
              </text>
              {pcts.map((pct, m) => (
                <rect
                  key={m}
                  x={LABEL_GUTTER + m * step + 1}
                  y={y + 4}
                  width={Math.max(step - 2, 1)}
                  height={14}
                  rx={2}
                  fill={`rgba(${baseColor}, ${Math.max(pct / 100, 0.14).toFixed(2)})`}
                >
                  {/* Título por segmento: hover num mês específico dá o percentual exato — a
                      opacidade sozinha não é o único jeito de saber a intensidade daquele mês. */}
                  <title>{`M${m + 1}: ${pct}%`}</title>
                </rect>
              ))}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
