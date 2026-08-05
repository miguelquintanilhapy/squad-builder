'use client'

import { motion } from 'motion/react'
import { Scenario } from '@/types'
import { MetricsCards } from '@/components/MetricsCards'
import { AnalysisSummary } from '@/components/AnalysisSummary'
import { SquadGrid } from '@/components/SquadGrid'
import { AlertsPanel } from '@/components/AlertsPanel'
import { Card } from '@/components/ui/primitives'

function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-accent/10 ${className}`} />
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-5 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-6 w-32 rounded-full" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Card className="flex flex-col divide-y divide-border-subtle">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-center gap-4 px-5 py-4">
            <Skeleton className="size-8 shrink-0 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          </div>
        ))}
      </Card>
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
    // reusam esta mesma árvore — o único sinal de "isso mudou" fica no RiskBadge.
    <motion.div variants={containerVariants} initial="hidden" animate="show" className="flex flex-col gap-6">
      <motion.div variants={groupVariants}>
        <AnalysisSummary scenario={scenario} />
      </motion.div>
      <motion.div variants={groupVariants}>
        <MetricsCards scenario={scenario} />
      </motion.div>
      <motion.div variants={groupVariants}>
        <SquadGrid scenario={scenario} />
      </motion.div>
      <motion.div variants={groupVariants}>
        <AlertsPanel alerts={scenario.alerts} midGroundSuggestion={scenario.midGroundSuggestion} />
      </motion.div>
    </motion.div>
  )
}
