import { Sparkles } from 'lucide-react'
import { Scenario } from '@/types'
import { Card, RiskBadge } from '@/components/ui/primitives'

export function AnalysisSummary({ scenario }: { scenario: Scenario }) {
  return (
    <Card className="flex flex-col gap-3 p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-accent/10 text-accent">
            <Sparkles className="size-4" strokeWidth={2} />
          </span>
          <h2 className="font-display text-lg font-bold tracking-tight text-foreground">Diagnóstico da IA</h2>
        </div>
        <RiskBadge score={scenario.riskScore} level={scenario.riskLevel} />
      </div>
      <p className="text-sm leading-relaxed text-foreground-secondary">{scenario.summary}</p>
    </Card>
  )
}
