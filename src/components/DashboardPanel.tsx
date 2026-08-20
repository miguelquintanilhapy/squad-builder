'use client'

import { motion, useReducedMotion } from 'motion/react'
import { Info, Loader2 } from 'lucide-react'
import { ContractType, RoleType, Scenario } from '@/types'
import { formatMonthsLabel } from '@/lib/labels'
import { describeSquadRationale } from '@/lib/squadRationale'
import { KpiStrip } from '@/components/KpiStrip'
import { AllocationChart } from '@/components/AllocationChart'
import { CompositionTable } from '@/components/CompositionTable'
import { RiskPanel } from '@/components/RiskPanel'
import { Panel, PanelTitle } from '@/components/ui/primitives'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[7px] bg-rule-2 ${className}`} />
}

const SKELETON_PANEL_TITLES = ['Curva de alocação', 'Composição do Squad', 'Por que este squad?', 'Índice de risco']

/**
 * Reusa KpiStrip (em modo loading) e Panel/PanelTitle reais em vez de copiar a estrutura à mão —
 * um shell duplicado sempre diverge do layout real na próxima mudança (revisão externa 2.8). Só
 * o miolo de cada painel continua genérico (linhas), já que o conteúdo varia demais pra valer o
 * espelhamento pixel a pixel.
 */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-12">
      <KpiStrip scenario={null} loading />
      {SKELETON_PANEL_TITLES.map((title) => (
        <div key={title}>
          <PanelTitle title={title} />
          <Panel>
            <div className="flex flex-col gap-3 p-4">
              {[1, 2, 3].map((row) => (
                <Skeleton key={row} className="h-4 w-full" />
              ))}
            </div>
          </Panel>
        </div>
      ))}
    </div>
  )
}

function useDashboardVariants() {
  // prefers-reduced-motion: só opacity, sem translateY, quando reduzido — o CSS global já
  // neutraliza transition/scroll-behavior, mas Motion anima via WAAPI/rAF própria, não pela
  // propriedade CSS `transition`, então precisa do hook da própria lib.
  const reduceMotion = useReducedMotion()
  // Sem stagger de container aqui — cada seção dispara whileInView por conta própria (ver uso
  // abaixo). Um stagger de container só faria sentido se todo o grupo entrasse na tela junto;
  // numa coluna única longa, Curva/Composição/Risco entram em momentos de scroll bem diferentes.
  return {
    groupVariants: {
      hidden: { opacity: 0, y: reduceMotion ? 0 : 14 },
      show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: [0.23, 1, 0.32, 1] as const } },
    },
  }
}

export function DashboardPanel({
  scenario,
  loading,
  recomputing = false,
  onCancelRecompute,
  onContractTypeChange,
  rateOverrides,
  onRateOverrideChange,
}: {
  scenario: Scenario | null
  loading: boolean
  /** Recálculo por edição de chip: mantém os números antigos visíveis (esmaecidos), nunca volta
   * pro skeleton — perder o ponto de comparação é o pior momento pra isso (revisão externa 2.5). */
  recomputing?: boolean
  onCancelRecompute?: () => void
  onContractTypeChange?: (contractType: ContractType) => void
  rateOverrides?: Partial<Record<RoleType, number>>
  onRateOverrideChange?: (role: RoleType, monthlyRate: number) => void
}) {
  const { groupVariants } = useDashboardVariants()

  if (loading) {
    return <DashboardSkeleton />
  }

  if (!scenario) {
    return null
  }

  return (
    <div className="relative">
      {recomputing && (
        <div className="absolute right-0 top-0 z-10 flex items-center gap-2.5 rounded-full bg-ink pl-3 pr-1.5 py-1 text-[12.5px] font-medium text-paper-2 shadow-[var(--shadow-raised)]">
          <span className="flex items-center gap-1.5">
            <Loader2 className="size-3 animate-spin" />
            Recalculando
          </span>
          {onCancelRecompute && (
            <button
              type="button"
              onClick={onCancelRecompute}
              className="rounded-full px-2 py-0.5 underline underline-offset-2 hover:bg-paper-3/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-paper-2 focus-visible:outline-offset-1"
            >
              Cancelar
            </button>
          )}
        </div>
      )}
      {/* Cada seção revela quando ELA MESMA entra na tela, não quando o topo do dashboard entra
          (bug reportado pelo usuário: com whileInView só no container pai, o stagger inteiro
          disparava de uma vez assim que "Squad recomendado" aparecia, e Composição/Índice de
          risco já estavam animados — e portanto estáticos — muito antes do usuário rolar até
          eles). `once` em cada uma — nunca replay ao rolar pra cima e descer de novo.
          Atualizações de negociação seguintes reusam a mesma árvore (já revelada), não retrigger. */}
      <div className={`flex flex-col gap-12 transition-opacity duration-200 ${recomputing ? 'pointer-events-none opacity-50' : ''}`}>
        {/* Números primeiro, nota depois: o alerta de teto era o primeiro elemento da seção — a
            primeira coisa que a pessoa via ao chegar no resultado era um banner ambar, lido como
            erro do sistema, não como aviso (feedback do usuário). Ícone Info, não AlertTriangle —
            triângulo de alerta é vocabulário visual de erro/perigo, e isso é uma nota, não uma
            falha. */}
        <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <KpiStrip scenario={scenario} />
        </motion.div>
        {scenario.budgetAlert && (
          <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
            <div className="flex items-start gap-3 rounded-[7px] border border-ochre/30 bg-ochre/5 px-4 py-3 text-sm text-ink">
              <Info className="mt-0.5 size-4 shrink-0 text-ochre" strokeWidth={2} />
              <p>{scenario.budgetAlert.suggestion}</p>
            </div>
          </motion.div>
        )}
        <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <PanelTitle
            title="Curva de alocação"
            note={`${scenario.squad.length} papéis · ${formatMonthsLabel(scenario.estimatedTimelineMonths)}`}
          />
          <Panel>
            <AllocationChart scenario={scenario} />
          </Panel>
        </motion.div>
        <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <PanelTitle title="Composição do Squad" />
          <Panel>
            <CompositionTable scenario={scenario} />
          </Panel>
        </motion.div>
        {/* Explica o squad como consequência do escopo, não só o resultado — o sistema dava a
            resposta mas explicava pouco o raciocínio por trás dela (feedback do usuário).
            Determinístico (squadRationale.ts), não a IA: mesma regra de todo o resto do cálculo. */}
        <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <PanelTitle title="Por que este squad?" />
          <Panel>
            <p className="p-4 text-[14px] leading-relaxed text-ink-2">{describeSquadRationale(scenario.squad)}</p>
          </Panel>
        </motion.div>
        <motion.div variants={groupVariants} initial="hidden" whileInView="show" viewport={{ once: true, margin: '-80px' }}>
          <PanelTitle title="Índice de risco" emphasis />
          <Panel>
            <RiskPanel
              scenario={scenario}
              onContractTypeChange={onContractTypeChange}
              rateOverrides={rateOverrides}
              onRateOverrideChange={onRateOverrideChange}
            />
          </Panel>
        </motion.div>
      </div>
    </div>
  )
}
