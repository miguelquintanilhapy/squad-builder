import {
  Bug,
  ClipboardList,
  Compass,
  Database,
  Layers,
  type LucideIcon,
  Palette,
  Server,
  ShieldCheck,
  Smartphone,
  Users,
  Workflow,
} from 'lucide-react'
import { RoleType, Scenario } from '@/types'
import { ROLE_LABELS, SENIORITY_LABELS, formatCurrencyBRL } from '@/lib/labels'
import { Card, SectionLabel } from '@/components/ui/primitives'

const ROLE_ICONS: Record<RoleType, LucideIcon> = {
  'dev-frontend': Layers,
  'dev-backend': Server,
  'dev-fullstack': Layers,
  'dev-mobile': Smartphone,
  'designer-uxui': Palette,
  qa: Bug,
  devops: Workflow,
  'tech-lead': Compass,
  'product-manager': ClipboardList,
  'data-engineer': Database,
  'security-specialist': ShieldCheck,
}

export function SquadGrid({ scenario }: { scenario: Scenario }) {
  return (
    <div className="flex flex-col gap-3">
      <SectionLabel>Equipe Recomendada</SectionLabel>
      <Card className="divide-y divide-border-subtle">
        {scenario.squad.map((member, index) => {
          const Icon = ROLE_ICONS[member.role] ?? Users
          return (
            <div
              key={`${member.role}-${index}`}
              className="flex items-start gap-4 px-5 py-4 transition-colors duration-150 hover:bg-accent/5"
            >
              <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
                <Icon className="size-4" strokeWidth={2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-4">
                  <p className="font-medium text-foreground">
                    {member.quantity}x {ROLE_LABELS[member.role]}
                    <span className="ml-2 font-normal text-muted">
                      {SENIORITY_LABELS[member.seniority]} ·{' '}
                      {member.allocation === 'part-time' ? 'Meio período' : 'Tempo integral'}
                    </span>
                  </p>
                  <p className="shrink-0 font-mono text-sm font-medium tabular-nums text-foreground">
                    {formatCurrencyBRL(member.monthlyCostPerPerson ?? 0)}/mês
                  </p>
                </div>
                {member.justification && <p className="mt-1 text-sm text-muted">{member.justification}</p>}
              </div>
            </div>
          )
        })}
      </Card>
    </div>
  )
}
