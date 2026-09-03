import { MouseEvent, useRef, useState } from 'react'
import { Scenario, SquadMember } from '@/types'
import { MAX_ALLOCATION_MONTHS } from '@/lib/allocationCurve'
import { ROLE_LABELS, SENIORITY_LABELS, formatCurrencyBRL } from '@/lib/labels'
import { ENGINEERING_ROLES } from '@/lib/rates'
import { useCanScrollRight } from '@/lib/useViewport'

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

interface AllocationDetail {
  monthlyCost: number
  pcts: number[]
  baseColor: string
  curveText: string
}

/** Derivado por papel, usado nos três lugares que descrevem o mesmo membro do squad (lista
 * mobile, lista sr-only, linha do SVG desktop) — um ponto só pra fallback/corte/formatação não
 * divergir silenciosamente entre eles se a lógica mudar no futuro. */
function getAllocationDetail(member: SquadMember, monthCount: number): AllocationDetail {
  const pcts = (member.monthlyAllocationPct ?? Array.from({ length: monthCount }, () => 100)).slice(0, monthCount)
  return {
    monthlyCost: (member.monthlyCostPerPerson ?? 0) * member.quantity,
    pcts,
    baseColor: barBaseColor(member),
    curveText: describeAllocationCurve(pcts),
  }
}

/**
 * Abaixo de 640px, o gráfico desenhado pro desktop (SVG largo, detalhe só via hover) fica
 * ilegível e intocável: ~55% dele fica fora da tela e não existe equivalente de toque pro
 * tooltip. Em vez de só permitir arrastar o mesmo SVG, reautora os dados como uma lista de cards
 * por papel — mesmo padrão dual-render que o CompositionTable já usa (cards no mobile, tabela/SVG
 * no desktop) — com a curva de envolvimento sempre visível como texto, não escondida atrás de um
 * gesto que não existe em touch.
 */
function MobileAllocationRow({ member, monthCount }: { member: SquadMember; monthCount: number }) {
  const { monthlyCost, pcts, baseColor, curveText } = getAllocationDetail(member, monthCount)

  return (
    <div className="rounded-[7px] border border-rule-2 bg-paper-3 p-3.5">
      <p className="text-[13.5px] text-ink">
        <span className="font-semibold">{roleLabel(member)}</span>
        {' — '}
        <span className="text-[12px] text-ink-3">{SENIORITY_LABELS[member.seniority]}</span>
      </p>
      {/* Mini barra decorativa (mesma lógica de opacidade do gráfico desktop) — o texto abaixo,
          não a barra, é o canal que carrega a informação de verdade. */}
      <div aria-hidden="true" className="mt-2.5 flex gap-[2px]">
        {pcts.map((pct, m) => (
          <div
            key={m}
            className="h-3.5 flex-1 rounded-[2px]"
            style={{ background: `rgba(${baseColor}, ${Math.max(pct / 100, 0.14).toFixed(2)})` }}
          />
        ))}
      </div>
      <p className="mt-2 text-[12.5px] text-ink-3">
        {formatCurrencyBRL(monthlyCost)}/mês · envolvimento: {curveText}
      </p>
    </div>
  )
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
  // Só num gráfico que rola horizontalmente (desktop com squad grande) faz sentido sinalizar que
  // tem mais coluna fora da tela.
  const canScrollRight = useCanScrollRight(containerRef, [monthCount, squad.length])

  function showTooltip(event: MouseEvent, text: string) {
    const container = containerRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    setTooltip({ x: event.clientX - rect.left + container.scrollLeft, y: event.clientY - rect.top, text })
  }

  return (
    <>
      {/* Abaixo de 640px, a lista de cards abaixo já mostra esse mesmo texto visível — este
          sr-only só serve o SVG desktop pra quem navega por teclado/leitor de tela. */}
      <ul className="sr-only hidden sm:block">
        {squad.map((member, index) => {
          const { monthlyCost, curveText } = getAllocationDetail(member, monthCount)
          return (
            <li key={`${member.role}-${index}`}>
              {roleLabel(member)} — {SENIORITY_LABELS[member.seniority]} · {formatCurrencyBRL(monthlyCost)}/mês ·
              envolvimento: {curveText}
            </li>
          )
        })}
      </ul>

      <div className="flex flex-col gap-2.5 p-[15px] sm:hidden">
        {squad.map((member, index) => (
          <MobileAllocationRow key={`${member.role}-${index}`} member={member} monthCount={monthCount} />
        ))}
      </div>

      <div ref={containerRef} className="relative hidden overflow-x-auto px-[15px] py-[15px] sm:block">
      <svg
        viewBox={`0 0 ${CHART_WIDTH} ${height}`}
        role="img"
        aria-label={`Alocação por papel: ${squad.length} papéis ao longo de ${monthCount} meses`}
        aria-hidden="true"
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
          const { monthlyCost, pcts, baseColor, curveText } = getAllocationDetail(member, monthCount)
          const rowTooltip = `${roleLabel(member)} — ${SENIORITY_LABELS[member.seniority]} · ${formatCurrencyBRL(monthlyCost)}/mês · envolvimento: ${curveText}`
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
      {/* Sinaliza que tem mais mês fora da tela pra rolar — sem isso, no mobile (onde o gráfico
          quase sempre é mais largo que a tela) nada indica que dá pra arrastar pro lado. Fixo na
          borda do container, não do conteúdo — não se move com o scroll. */}
      {canScrollRight && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-paper-3 to-transparent"
        />
      )}
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
    </>
  )
}
