'use client'

import { motion } from 'motion/react'
import { Banknote, CalendarClock, Users } from 'lucide-react'
import { Scenario } from '@/types'
import { formatCurrencyBRL } from '@/lib/labels'

const tileVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
}

function MetricTile({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: typeof Banknote
}) {
  return (
    <motion.div
      variants={tileVariants}
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="glass flex flex-col gap-3 rounded-2xl p-5"
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
        <Icon className="size-4.5" strokeWidth={2} />
      </span>
      <div>
        <p className="text-xs font-medium tracking-[0.06em] text-muted uppercase">{label}</p>
        <p className="mt-1 font-mono text-2xl font-medium tracking-tight text-foreground tabular-nums">{value}</p>
      </div>
    </motion.div>
  )
}

export function MetricsCards({ scenario }: { scenario: Scenario }) {
  const totalDevs = scenario.squad.reduce((sum, m) => sum + m.quantity, 0)

  return (
    <div className="grid grid-cols-3 gap-4">
      <MetricTile icon={Banknote} label="Custo Total Mensal" value={formatCurrencyBRL(scenario.totalMonthlyCost)} />
      <MetricTile icon={CalendarClock} label="Prazo Real Estimado" value={`${scenario.estimatedTimelineMonths} meses`} />
      <MetricTile icon={Users} label="Devs Sugeridos" value={`${totalDevs}`} />
    </div>
  )
}
