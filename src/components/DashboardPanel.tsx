'use client'

import { motion } from 'motion/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Scenario } from '@/types'
import { formatMonthsLabel } from '@/lib/labels'
import { KpiStrip } from '@/components/KpiStrip'
import { AllocationChart } from '@/components/AllocationChart'
import { CompositionTable } from '@/components/CompositionTable'
import { RiskPanel } from '@/components/RiskPanel'
import { Panel } from '@/components/ui/primitives'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[7px] bg-rule-2 ${className}`} />
}

/**
 * Precisa bater quase pixel a pixel com o layout final (Kpi/Panel reais) — senão troca de
 * skeleton pra conteúdo é um salto visível bem no momento de maior atenção do usuário. Por isso
 * repete a mesma estrutura sem borda + sombra do Panel/Kpi reais, em vez de uma caixa genérica.
 */
function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-[7px] bg-paper-3 px-[17px] pt-[14px] pb-[13px]">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="mt-2.5 h-9 w-16" />
          </div>
        ))}
      </div>
      {[1, 2, 3].map((panel) => (
        <div key={panel} className="overflow-hidden rounded-[7px] bg-paper-3 shadow-[var(--shadow-raised)]">
          <div className="bg-paper-2 px-[15px] py-[11px]">
            <Skeleton className="h-[19px] w-1/4" />
          </div>
          <div className="flex flex-col gap-3 p-4">
            {[1, 2, 3].map((row) => (
              <Skeleton key={row} className="h-4 w-full" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09 } },
}

const groupVariants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.23, 1, 0.32, 1] as const } },
}

export function DashboardPanel({
  scenario,
  loading,
  recomputing = false,
}: {
  scenario: Scenario | null
  loading: boolean
  /** Recálculo por edição de chip: mantém os números antigos visíveis (esmaecidos), nunca volta
   * pro skeleton — perder o ponto de comparação é o pior momento pra isso (revisão externa 2.5). */
  recomputing?: boolean
}) {
  if (loading) {
    return <DashboardSkeleton />
  }

  if (!scenario) {
    return null
  }

  return (
    <div className="relative">
      {recomputing && (
        <div className="absolute right-0 top-0 z-10 flex items-center gap-1.5 rounded-full bg-ink px-3 py-1 text-[12.5px] font-medium text-paper-2 shadow-[var(--shadow-raised)]">
          <Loader2 className="size-3 animate-spin" />
          Recalculando
        </div>
      )}
      {/* Entrada orquestrada uma única vez, na primeira revelação (scenario passa de null a
          populado): stagger real via Motion, não CSS solto. Atualizações de negociação seguintes
          reusam esta mesma árvore. */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className={`flex flex-col gap-6 transition-opacity duration-200 ${recomputing ? 'pointer-events-none opacity-50' : ''}`}
      >
        {scenario.budgetAlert && (
          <motion.div variants={groupVariants}>
            <div className="flex items-start gap-3 rounded-[7px] border border-ochre/30 bg-ochre/5 px-4 py-3 text-sm text-ink">
              <AlertTriangle className="mt-0.5 size-4 shrink-0 text-ochre" strokeWidth={2} />
              <p>{scenario.budgetAlert.suggestion}</p>
            </div>
          </motion.div>
        )}
        <motion.div variants={groupVariants}>
          <KpiStrip scenario={scenario} />
        </motion.div>
        <motion.div variants={groupVariants}>
          <Panel
            title="Curva de alocação"
            note={`${scenario.squad.length} papéis · ${formatMonthsLabel(scenario.estimatedTimelineMonths)}`}
          >
            <AllocationChart scenario={scenario} />
          </Panel>
        </motion.div>
        <motion.div variants={groupVariants}>
          <Panel title="Composição">
            <CompositionTable scenario={scenario} />
          </Panel>
        </motion.div>
        <motion.div variants={groupVariants}>
          <Panel title="Risk score">
            <RiskPanel scenario={scenario} />
          </Panel>
        </motion.div>
      </motion.div>
    </div>
  )
}
