import { PLATFORM_LABELS, formatNumberPtBR } from '@/lib/labels'
import { ProjectInput, RiskAlert, RiskLevel, ScopeAnalysis, SquadMember } from '@/types'

const BASE_RISK_BY_COMPLEXITY = { low: 5, medium: 15, enterprise: 25 } as const

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

function hasRole(squad: SquadMember[], role: SquadMember['role']): boolean {
  return squad.some((m) => m.role === role)
}

function uiSurfaceCount(scope: ScopeAnalysis): number {
  let count = 0
  if (scope.productTypes.includes('mobile-app') || scope.platforms.some((p) => p === 'ios' || p === 'android')) count++
  if (
    scope.productTypes.includes('web-app') ||
    scope.productTypes.includes('saas-b2b') ||
    scope.productTypes.includes('marketplace') ||
    scope.platforms.includes('web')
  ) {
    count++
  }
  if (scope.requiredCapabilities.includes('admin-panel')) count++
  return count
}

export interface RiskAssessment {
  riskScore: number
  riskLevel: RiskLevel
  alerts: RiskAlert[]
  drivers: RiskAlert[]
  assumptions: string[]
}

export function assessRisk(
  squad: SquadMember[],
  scope: ScopeAnalysis,
  input: ProjectInput,
  realisticTimelineMonths: number,
  totalMonthlyCost: number
): RiskAssessment {
  let score = BASE_RISK_BY_COMPLEXITY[scope.complexity]
  const alerts: RiskAlert[] = []

  const needsQa = scope.complexity !== 'low' || scope.estimatedEffortPersonMonths > 6
  if (needsQa && !hasRole(squad, 'qa')) {
    const weight = 15
    score += weight
    alerts.push({
      category: 'quality',
      severity: 'critical',
      title: 'Sem QA dedicado',
      description:
        'Sem um QA no squad, falhas em fluxos críticos (pagamento, autenticação, integrações) tendem a ser descobertas diretamente pelos usuários em produção.',
      weight,
    })
  }

  const isUiFacing = uiSurfaceCount(scope) > 0
  if (isUiFacing && scope.complexity !== 'low' && !hasRole(squad, 'designer-uxui')) {
    const weight = 10
    score += weight
    alerts.push({
      category: 'ux',
      severity: 'warning',
      title: 'Sem designer de UX/UI',
      description:
        'Sem design dedicado, a usabilidade do produto tende a ficar abaixo do esperado, o que pode aumentar a taxa de abandono dos usuários.',
      weight,
    })
  }

  const needsSecurity =
    scope.requiredCapabilities.includes('payments') || scope.requiredCapabilities.includes('compliance')
  if (needsSecurity && !hasRole(squad, 'security-specialist')) {
    const critical = scope.complexity === 'enterprise'
    const weight = critical ? 15 : 5
    score += weight
    alerts.push({
      category: 'security',
      severity: critical ? 'critical' : 'info',
      title: 'Sem especialista de segurança',
      description:
        'O escopo envolve pagamentos ou compliance. Sem revisão de segurança dedicada, vulnerabilidades em transações financeiras podem passar despercebidas.',
      weight,
    })
  }

  const surfaces = uiSurfaceCount(scope)
  const soloEngineer = squad.find((m) => m.role === 'dev-fullstack' && m.quantity === 1)
  if (soloEngineer && surfaces >= 2) {
    const critical = surfaces >= 3
    const weight = critical ? 15 : 8
    score += weight
    alerts.push({
      category: 'burnout',
      severity: critical ? 'critical' : 'warning',
      title: 'Sobrecarga em 1 dev fullstack',
      description: `1 dev cobrindo ${surfaces} frentes (ex: mobile, web, painel admin) ao mesmo tempo tende a gerar atraso e burnout — a carga de trabalho real excede a capacidade de uma única pessoa.`,
      weight,
    })
  }

  if (input.targetTimelineMonths) {
    const ratio = realisticTimelineMonths / input.targetTimelineMonths
    if (ratio > 1) {
      const weight = clamp((ratio - 1) * 30, 0, 30)
      score += weight
      alerts.push({
        category: 'timeline',
        severity: ratio > 1.5 ? 'critical' : 'warning',
        title: 'Prazo alvo incompatível com o squad',
        description: `Com o squad atual, o prazo realista estimado é de ${formatNumberPtBR(realisticTimelineMonths)} meses, acima dos ${input.targetTimelineMonths} meses desejados.`,
        weight,
      })
    }
  }

  if (input.monthlyBudget && totalMonthlyCost > input.monthlyBudget) {
    const ratio = totalMonthlyCost / input.monthlyBudget
    const weight = clamp((ratio - 1) * 20, 0, 20)
    score += weight
    alerts.push({
      category: 'budget',
      severity: ratio > 1.3 ? 'critical' : 'warning',
      title: 'Custo do squad acima do orçamento',
      description: `O squad atual custa R$ ${totalMonthlyCost.toLocaleString('pt-BR')}/mês, acima do orçamento de R$ ${input.monthlyBudget.toLocaleString('pt-BR')}/mês informado.`,
      weight,
    })
  }

  const riskScore = Math.round(clamp(score, 0, 100))
  const riskLevel: RiskLevel =
    riskScore <= 25 ? 'low' : riskScore <= 50 ? 'medium' : riskScore <= 75 ? 'high' : 'critical'

  const drivers = [...alerts].sort((a, b) => b.weight - a.weight).slice(0, 3)

  return { riskScore, riskLevel, alerts, drivers, assumptions: buildAssumptions(squad, scope) }
}

/** Premissas assumidas no cálculo — geradas a partir do squad/escopo reais, não texto fixo. */
function buildAssumptions(squad: SquadMember[], scope: ScopeAnalysis): string[] {
  const platformLabel = scope.platforms.length
    ? scope.platforms.map((p) => PLATFORM_LABELS[p]).join(' + ')
    : 'plataforma não informada'

  const assumptions = [
    'Custo de referência de mercado, contratação PJ/CLT com custo cheio.',
    `Plataforma considerada: ${platformLabel}.`,
    'Sem orçamento de infraestrutura, licenças ou ferramentas adicionais.',
  ]

  assumptions.push(
    hasRole(squad, 'designer-uxui')
      ? 'Designer dedicado durante todo o período estimado.'
      : 'Sem designer dedicado no squad — leitura editável acima se isso não valer.'
  )
  assumptions.push(
    hasRole(squad, 'qa')
      ? 'QA cobre todo o período de desenvolvimento.'
      : 'Sem QA dedicado no squad — leitura editável acima se isso não valer.'
  )

  return assumptions
}
