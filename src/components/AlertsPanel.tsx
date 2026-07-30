import { AlertOctagon, AlertTriangle, Info, Lightbulb } from 'lucide-react'
import { RiskAlert, RiskSeverity } from '@/types'
import { Card, SectionLabel } from '@/components/ui/primitives'

const SEVERITY_ICON: Record<RiskSeverity, typeof Info> = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertOctagon,
}

const SEVERITY_ICON_STYLES: Record<RiskSeverity, string> = {
  info: 'text-blue-600',
  warning: 'text-amber-600',
  critical: 'text-red-600',
}

export function AlertsPanel({ alerts, midGroundSuggestion }: { alerts: RiskAlert[]; midGroundSuggestion?: string }) {
  if (alerts.length === 0 && !midGroundSuggestion) return null

  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Alertas de Risco &amp; Recomendações</SectionLabel>
      <Card className="flex flex-col divide-y divide-border-subtle">
        {alerts.map((alert, index) => {
          const Icon = SEVERITY_ICON[alert.severity]
          return (
            <div key={index} className="flex gap-3 px-5 py-4 transition-colors duration-150 hover:bg-accent/5">
              <Icon className={`mt-0.5 size-4 shrink-0 ${SEVERITY_ICON_STYLES[alert.severity]}`} strokeWidth={2} />
              <div>
                <p className="font-medium text-foreground">{alert.title}</p>
                <p className="mt-0.5 text-sm text-muted">{alert.description}</p>
              </div>
            </div>
          )
        })}
        {midGroundSuggestion && (
          <div className="flex gap-3 bg-accent-tint/[0.07] px-5 py-4">
            <Lightbulb className="mt-0.5 size-4 shrink-0 text-accent" strokeWidth={2} />
            <div>
              <p className="font-medium text-foreground">Sugestão de Meio-Termo</p>
              <p className="mt-0.5 text-sm text-muted">{midGroundSuggestion}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
