'use client'

import { motion } from 'motion/react'
import { Scenario } from '@/types'
import { KpiStrip } from '@/components/KpiStrip'
import { AllocationChart } from '@/components/AllocationChart'
import { CompositionTable } from '@/components/CompositionTable'
import { RiskPanel } from '@/components/RiskPanel'
import { Panel } from '@/components/ui/primitives'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-[3px] bg-rule-2 ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[3px] border border-rule-2 bg-rule-2 sm:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex flex-col gap-2 bg-paper-3 p-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-16" />
          </div>
        ))}
      </div>
      {[1, 2, 3].map((panel) => (
        <div key={panel} className="rounded-[3px] border border-rule-2 bg-paper-3 p-4">
          <Skeleton className="h-4 w-1/3" />
          <div className="mt-4 flex flex-col gap-3">
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

export function DashboardPanel({ scenario, loading }: { scenario: Scenario | null; loading: boolean }) {
  if (loading) {
    return <DashboardSkeleton />
  }

  if (!scenario) {
    return null
  }

  return (
    // Entrada orquestrada uma única vez, na primeira revelação (scenario passa de null a
    // populado): stagger real via Motion, não CSS solto. Atualizações de negociação seguintes
    // reusam esta mesma árvore.
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-4.5">
      <motion.div variants={groupVariants}>
        <KpiStrip scenario={scenario} />
      </motion.div>
      <motion.div variants={groupVariants}>
        <Panel
          title="Curva de alocação"
          note={`${scenario.squad.length} papéis · ${scenario.estimatedTimelineMonths} meses`}
        >
          <AllocationChart scenario={scenario} />
        </Panel>
      </motion.div>
      <motion.div variants={groupVariants}>
        <Panel title="Composição" note="Custo de alocação cheia, valores de referência">
          <CompositionTable scenario={scenario} />
        </Panel>
      </motion.div>
      <motion.div variants={groupVariants}>
        <Panel title="Risk score" note="O que mais empurra o projeto pra fora do plano">
          <RiskPanel scenario={scenario} />
        </Panel>
      </motion.div>
    </motion.div>
  )
}
