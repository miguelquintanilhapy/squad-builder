import { AnimatePresence, motion } from 'motion/react'
import { Minus, TrendingDown, TrendingUp } from 'lucide-react'
import { RiskLevel, ScenarioVersion } from '@/types'
import { formatCurrencyBRL, formatMonthsLabel, formatNumberPtBR } from '@/lib/labels'
import { describeNegotiationImpact } from '@/lib/negotiationImpact'

const RISK_COLOR: Record<RiskLevel, string> = {
  low: 'var(--moss)',
  medium: 'var(--ochre)',
  high: 'var(--rust)',
  critical: 'var(--rust)',
}

type Direction = 'up' | 'down' | 'flat'

/** Pill de delta: cor e seta dependem só da direção — quem decide se "melhor" é pra cima ou pra
 * baixo é o chamador (custo/prazo: menos é melhor; risco: idem), não este componente. */
function DeltaPill({ direction, good, children }: { direction: Direction; good: boolean; children: React.ReactNode }) {
  // Âmbar, não vermelho, pra qualquer piora — vermelho fica reservado pra erro de verdade, não
  // pra "algo aumentou".
  const color = direction === 'flat' ? 'var(--ink-3)' : good ? 'var(--moss)' : 'var(--ochre)'
  const Icon = direction === 'up' ? TrendingUp : direction === 'down' ? TrendingDown : Minus

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] font-semibold"
      style={{ color, background: direction === 'flat' ? 'var(--rule-2)' : `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <Icon className="size-3" strokeWidth={2.5} />
      {children}
    </span>
  )
}

function Metric({
  label,
  previousValue,
  activeValue,
  delta,
}: {
  label: string
  previousValue: React.ReactNode
  activeValue: React.ReactNode
  delta: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-[7px] bg-paper-3 px-5 pt-4 pb-[15px]">
      <span className="text-[12.5px] font-medium text-ink-3">{label}</span>
      <span className="tnum whitespace-nowrap text-[12px] text-ink-3 line-through">{previousValue}</span>
      <AnimatePresence mode="wait">
        <motion.span
          key={String(activeValue)}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
          className="tnum whitespace-nowrap font-display text-[28px] font-extrabold leading-none tracking-[-0.03em] text-ink"
        >
          {activeValue}
        </motion.span>
      </AnimatePresence>
      {delta}
    </div>
  )
}

/**
 * O impacto da versão ativa contra a anterior é o foco desta coluna, não a trilha — por isso
 * cabeçalho no mesmo peso visual do Eyebrow (usado nos títulos de seção do topo da página), 3
 * colunas lado a lado (não empilhadas: comparar precisa caber num só golpe de vista) e números
 * maiores que os da trilha. A trilha mostra a causa (o pedido); aqui mostra a consequência.
 */
export function ImpactSummary({ active, previous }: { active: ScenarioVersion; previous?: ScenarioVersion }) {
  // Mensagem explícita em vez de sumir em silêncio quando não há versão anterior pra comparar.
  if (!previous) {
    return (
      <div className="flex flex-col gap-3">
        <div className="font-display text-[17px] font-bold tracking-[-0.015em] text-petrol">Impacto do ajuste</div>
        <p className="text-[13px] leading-relaxed text-ink-2">
          Este é o cenário inicial, sem ajustes aplicados ainda.
        </p>
      </div>
    )
  }

  const costDelta = active.scenario.totalMonthlyCost - previous.scenario.totalMonthlyCost
  const costDirection: Direction = costDelta === 0 ? 'flat' : costDelta > 0 ? 'up' : 'down'

  const timelineDelta = active.scenario.estimatedTimelineMonths - previous.scenario.estimatedTimelineMonths
  const timelineDirection: Direction = timelineDelta === 0 ? 'flat' : timelineDelta > 0 ? 'up' : 'down'

  const riskDelta = active.scenario.riskScore - previous.scenario.riskScore
  const riskDirection: Direction = riskDelta === 0 ? 'flat' : riskDelta > 0 ? 'up' : 'down'

  return (
    <div className="flex flex-col gap-3">
      <div className="font-display text-[17px] font-bold tracking-[-0.015em] text-petrol">Impacto do ajuste</div>
      <div className="grid grid-cols-1 gap-3.5 min-[480px]:grid-cols-3">
        <Metric
          label="Custo mensal"
          previousValue={formatCurrencyBRL(previous.scenario.totalMonthlyCost)}
          activeValue={formatCurrencyBRL(active.scenario.totalMonthlyCost)}
          delta={
            <DeltaPill direction={costDirection} good={costDelta <= 0}>
              {costDelta === 0 ? 'sem mudança' : `${costDelta > 0 ? '+' : ''}${formatCurrencyBRL(costDelta)}`}
            </DeltaPill>
          }
        />
        <Metric
          label="Prazo estimado"
          previousValue={formatMonthsLabel(previous.scenario.estimatedTimelineMonths)}
          activeValue={formatMonthsLabel(active.scenario.estimatedTimelineMonths)}
          delta={
            <DeltaPill direction={timelineDirection} good={timelineDelta <= 0}>
              {timelineDelta === 0
                ? 'sem mudança'
                : `${timelineDelta > 0 ? '+' : ''}${formatNumberPtBR(timelineDelta)} meses`}
            </DeltaPill>
          }
        />
        <Metric
          label="Índice de risco"
          previousValue={`${previous.scenario.riskScore}/100`}
          activeValue={
            <span style={{ color: RISK_COLOR[active.scenario.riskLevel] }}>{active.scenario.riskScore}/100</span>
          }
          delta={
            <DeltaPill direction={riskDirection} good={riskDelta <= 0}>
              {riskDelta === 0 ? 'sem mudança' : `${riskDelta > 0 ? '+' : ''}${riskDelta} pts`}
            </DeltaPill>
          }
        />
      </div>
      {/* Trade-off em texto, não só números — mostra o que se ganha e o que se sacrifica numa
          decisão. */}
      <p className="text-[13px] leading-relaxed text-ink-2">
        {describeNegotiationImpact(active.scenario, previous.scenario)}
      </p>
    </div>
  )
}
