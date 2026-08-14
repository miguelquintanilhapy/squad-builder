import { PLATFORM_LABELS, formatCurrencyBRL, formatMonthsLabel } from '@/lib/labels'
import { BudgetAlert, ProjectInput, RiskAlert, RiskLevel, ScopeAnalysis, SquadMember } from '@/types'

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
  /** Todos os fatores que somaram no score, ordenados por peso — nenhum é escondido da tela. */
  drivers: RiskAlert[]
  /** Pontos de partida do score, só pela complexidade do escopo — a linha que faltava pra fechar a soma. */
  riskBase: number
  assumptions: string[]
  /**
   * Estouro de teto mensal: sai da fila de drivers (não compete por espaço/peso com os outros
   * fatores) e fica sempre visível, ancorado nos KPIs. Continua contando pro score.
   */
  budgetAlert?: BudgetAlert
}

export function assessRisk(
  squad: SquadMember[],
  scope: ScopeAnalysis,
  input: ProjectInput,
  realisticTimelineMonths: number,
  totalMonthlyCost: number
): RiskAssessment {
  const riskBase = BASE_RISK_BY_COMPLEXITY[scope.complexity]
  let score = riskBase
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
        description: `Com o squad atual, o prazo realista estimado é de ${formatMonthsLabel(realisticTimelineMonths)}, acima dos ${input.targetTimelineMonths} meses desejados.`,
        weight,
      })
    }
  }

  // Estouro de teto não entra em "alerts"/"drivers" — vira budgetAlert, sempre visível, pra não
  // competir por espaço de exibição com fatores de peso maior (ver 1.5/3.12 da revisão externa).
  let budgetAlert: BudgetAlert | undefined
  if (input.monthlyBudget && totalMonthlyCost > input.monthlyBudget) {
    const overageAmount = totalMonthlyCost - input.monthlyBudget
    const ratio = totalMonthlyCost / input.monthlyBudget
    score += clamp((ratio - 1) * 20, 0, 20)
    budgetAlert = {
      overageAmount,
      suggestion: `Squad atual custa ${formatCurrencyBRL(totalMonthlyCost)}/mês, ${formatCurrencyBRL(overageAmount)} acima do teto de ${formatCurrencyBRL(input.monthlyBudget)}. Renegocie o prazo ou tire um papel de suporte pra caber — use o chat de negociação abaixo.`,
    }
  }

  const riskScore = Math.round(clamp(score, 0, 100))
  const riskLevel: RiskLevel =
    riskScore <= 25 ? 'low' : riskScore <= 50 ? 'medium' : riskScore <= 75 ? 'high' : 'critical'

  const drivers = [...alerts].sort((a, b) => b.weight - a.weight)

  return { riskScore, riskLevel, alerts, drivers, riskBase, budgetAlert, assumptions: buildAssumptions(squad, scope) }
}

/** Premissas assumidas no cálculo — geradas a partir do squad/escopo reais, não texto fixo. */
function buildAssumptions(squad: SquadMember[], scope: ScopeAnalysis): string[] {
  const platformLabel = scope.platforms.length
    ? scope.platforms.map((p) => PLATFORM_LABELS[p]).join(' + ')
    : 'plataforma não informada'

  const assumptions = [
    // Não "custo de referência de mercado" — é estimativa interna, sem fonte de mercado citável.
    // O modelo de contratação (PJ/CLT) virou parâmetro editável de verdade, não texto solto aqui
    // (revisão externa 3.2/3.3) — ver Scenario.contractType e o toggle no RiskPanel.
    'Valores de custo por cargo são estimativas internas de referência, não uma cotação de mercado — ajuste na negociação se não valerem pro seu contexto.',
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
