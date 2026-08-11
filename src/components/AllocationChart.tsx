import { Scenario, SquadMember } from '@/types'
import { ROLE_LABELS, SENIORITY_LABELS } from '@/lib/labels'
import { ALLOCATION_CAPACITY_MULTIPLIER } from '@/lib/rates'

const LABEL_GUTTER = 170
const CHART_WIDTH = 1000
const RIGHT_MARGIN = 22
const ROW_HEIGHT = 22
const TOP_MARGIN = 34
const BOTTOM_MARGIN = 20

function roleLabel(member: SquadMember): string {
  return `${member.quantity}x ${ROLE_LABELS[member.role]}`
}

/**
 * Barra por papel cobrindo o prazo inteiro (sem fases de entrada/saída — o motor de cálculo
 * trata todo o squad como presente do início ao fim). Alocação parcial vira barra mais fina
 * e clara, com o percentual ao lado. Eixo de meses no topo dá a noção de duração do projeto.
 */
export function AllocationChart({ scenario }: { scenario: Scenario }) {
  const { squad, estimatedTimelineMonths } = scenario
  const monthCount = Math.max(1, Math.round(estimatedTimelineMonths))
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
          const allocationFraction = ALLOCATION_CAPACITY_MULTIPLIER[member.allocation]
          const full = allocationFraction >= 1
          return (
            <g key={`${member.role}-${index}`}>
              <text x={0} y={y + 11} fontSize={11.5} fill="var(--ink-2)">
                {roleLabel(member)}{' '}
                <tspan fontSize={10} fill="var(--ink-3)">
                  {SENIORITY_LABELS[member.seniority]}
                </tspan>
              </text>
              <rect
                x={LABEL_GUTTER}
                y={y + (full ? 2 : 4)}
                width={Math.max(trackWidth, 3)}
                height={full ? 13 : 9}
                rx={1.5}
                fill={full ? 'var(--petrol)' : 'rgba(20,88,74,0.4)'}
              />
              {!full && (
                <text x={LABEL_GUTTER + trackWidth + 6} y={y + 11} fontSize={10} fill="var(--ink-3)">
                  {Math.round(allocationFraction * 100)}%
                </text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}
