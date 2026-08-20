import { MouseEvent, useRef, useState } from 'react'
import { Scenario, SquadMember } from '@/types'
import { MAX_ALLOCATION_MONTHS } from '@/lib/allocationCurve'
import { ROLE_LABELS, SENIORITY_LABELS, formatCurrencyBRL } from '@/lib/labels'
import { ENGINEERING_ROLES } from '@/lib/rates'

// Largura suficiente pra nomes por extenso ("Desenvolvedor Mobile — Sênior") sem cortar contra as
// barras.
const LABEL_GUTTER = 230
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
 * ser o único canal pra comunicar intensidade. Agrupa meses consecutivos com o mesmo percentual
 * em faixas.
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
 * Um segmento por mês, opacidade = intensidade de envolvimento naquele mês. A curva vem de
 * allocationCurve.ts (designer concentra no início, QA na segunda metade, o resto é constante).
 */
interface TooltipState {
  x: number
  y: number
  text: string
}

export function AllocationChart({ scenario }: { scenario: Scenario }) {
  const { squad, estimatedTimelineMonths } = scenario
  // Mesmo teto do motor de cálculo (calculator.ts) — sem isso, um prazo degenerado (squad sem
  // papel de engenharia) desenharia ~1000 colunas de grid com só uma fração preenchida de barras.
  const monthCount = Math.min(MAX_ALLOCATION_MONTHS, Math.max(1, Math.round(estimatedTimelineMonths)))
  const trackWidth = CHART_WIDTH - LABEL_GUTTER - RIGHT_MARGIN
  const step = trackWidth / monthCount
  const height = TOP_MARGIN + squad.length * ROW_HEIGHT + BOTTOM_MARGIN

  const containerRef = useRef<HTMLDivElement>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  function showTooltip(event: MouseEvent, text: string) {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTooltip({ x: event.clientX - rect.left + container.scrollLeft, y: event.clientY - rect.top, text })
  }

  return (
    <div ref={containerRef} className="relative overflow-x-auto px-[15px] py-[15px]">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        role="img"
        aria-label={`Alocação por papel: ${squad.length} papéis ao longo de ${monthCount} meses`}
        className="block h-auto min-w-[660px] w-full"
      >
        {/* Grid temporal discreto: linha mais leve (opacidade baixa) em vez de hairline cheio. */}
        <text x={LABEL_GUTTER - 8} y={14} fontSize={10.5} fill="var(--ink-3)" textAnchor="end">
          Mês
        </text>
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
                  {m + 1}
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
          const rowTooltip = `${roleLabel(member)} — ${SENIORITY_LABELS[member.seniority]} · ${formatCurrencyBRL(monthlyCost)}/mês · envolvimento: ${describeAllocationCurve(pcts)}`
          return (
            <g key={`${member.role}-${index}`} className="group">
              <rect
                x={0}
                y={y}
                width={CHART_WIDTH}
                height={ROW_HEIGHT}
                fill="var(--paper-2)"
                opacity={0}
                className="transition-opacity duration-150 group-hover:opacity-60"
                onMouseMove={(e) => showTooltip(e, rowTooltip)}
                onMouseLeave={() => setTooltip(null)}
              />
              <text x={0} y={y + 12} fontSize={11.5} fill="var(--ink-2)">
                {roleLabel(member)}
                {' — '}
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
                  onMouseMove={(e) => showTooltip(e, `Mês ${m + 1}: ${pct}%`)}
                  onMouseLeave={() => setTooltip(null)}
                />
              ))}
            </g>
          )
        })}
      </svg>
      {tooltip && (
        <div
          role="tooltip"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded-[7px] bg-paper-3 px-2.5 py-1.5 text-[12px] font-medium text-ink shadow-[var(--shadow-raised)]"
          style={{ left: tooltip.x, top: tooltip.y - 10 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}
