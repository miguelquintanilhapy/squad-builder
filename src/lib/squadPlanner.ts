import {
  ComplexityLevel,
  ProjectInput,
  RoleType,
  ScopeAnalysis,
  SeniorityLevel,
  SquadMember,
} from '@/types'
import {
  DEFAULT_SENIORITY_BY_COMPLEXITY,
  DEFAULT_TIMELINE_MONTHS,
  SENIORITY_CAPACITY_MULTIPLIER,
} from './rates'

function needsMobile(scope: ScopeAnalysis): boolean {
  return (
    scope.productTypes.includes('mobile-app') ||
    scope.platforms.includes('ios') ||
    scope.platforms.includes('android')
  )
}

function needsWebFrontend(scope: ScopeAnalysis): boolean {
  return (
    scope.productTypes.includes('web-app') ||
    scope.productTypes.includes('saas-b2b') ||
    scope.productTypes.includes('marketplace') ||
    scope.platforms.includes('web') ||
    scope.platforms.includes('multi-platform')
  )
}

/**
 * Distribui a capacidade de engenharia necessária (pessoa-mês / mês) entre os cargos
 * de engenharia exigidos pelo escopo, arredondando pra cima em headcount por cargo.
 */
function planEngineeringRoles(
  scope: ScopeAnalysis,
  seniority: SeniorityLevel,
  requiredCapacityPerMonth: number
): SquadMember[] {
  const mobile = needsMobile(scope)
  const web = needsWebFrontend(scope)

  // Modo enxuto: só uma superfície de UI (ou nenhuma), escopo pequeno e baixa complexidade
  // -> 1 fullstack cobre front+back em vez de fragmentar o time.
  const leanFullstack =
    scope.complexity === 'low' && scope.estimatedEffortPersonMonths <= 5 && !mobile

  const roleShares: { role: RoleType; share: number }[] = []

  if (leanFullstack) {
    roleShares.push({ role: 'dev-fullstack', share: 1 })
  } else {
    if (mobile) roleShares.push({ role: 'dev-mobile', share: 1 })
    if (web) roleShares.push({ role: 'dev-frontend', share: 1 })
    // Backend quase sempre necessário para sustentar as superfícies acima.
    roleShares.push({ role: 'dev-backend', share: 1 })
  }

  const totalShares = roleShares.reduce((sum, r) => sum + r.share, 0)
  const capacityPerShare = requiredCapacityPerMonth / totalShares
  const seniorityMultiplier = SENIORITY_CAPACITY_MULTIPLIER[seniority]

  // Cada justificativa defende por que o papel existe e o que quebra sem ele — não descreve o
  // óbvio ("cobre a demanda de X"), que é tautologia e não sobrevive ao teste "se eu apagar,
  // alguma informação se perde?" (revisão externa 3.9).
  const ENGINEERING_JUSTIFICATION: Record<string, string> = {
    'dev-mobile':
      'Superfície mobile nativa (iOS/Android): sem um dev dedicado, ela disputa tempo com web/back-end e atrasa a entrega mais visível pro usuário final.',
    'dev-frontend':
      'Interface web é onde o usuário decide continuar ou abandonar: sem front-end dedicado, toda mudança de UI compete por tempo com API e dados.',
    'dev-backend':
      'Sustenta dados, regras de negócio e integrações de todas as superfícies: sem back-end dedicado, a lógica fica espalhada no cliente e frágil a mudanças.',
  }

  return roleShares.map(({ role, share }) => {
    const capacityNeeded = capacityPerShare * share
    const quantity = Math.max(1, Math.ceil(capacityNeeded / seniorityMultiplier))
    return {
      role,
      seniority,
      quantity,
      allocation: 'full-time',
      justification: leanFullstack
        ? 'Escopo enxuto e baixa complexidade: 1 dev fullstack cobre front-end e back-end sem fragmentar o time.'
        : ENGINEERING_JUSTIFICATION[role],
    }
  })
}

function planSupportRoles(scope: ScopeAnalysis, complexity: ComplexityLevel): SquadMember[] {
  const support: SquadMember[] = []
  const seniority = DEFAULT_SENIORITY_BY_COMPLEXITY[complexity]
  const uiFacing = needsMobile(scope) || needsWebFrontend(scope)

  if (complexity !== 'low' && uiFacing) {
    support.push({
      role: 'designer-uxui',
      seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Produto com interface voltada ao usuário final: risco de UX alto sem design dedicado.',
    })
  }

  if (complexity !== 'low') {
    support.push({
      role: 'qa',
      seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Garante cobertura de testes e reduz bugs em produção antes do usuário encontrá-los.',
    })
  }

  if (complexity === 'enterprise' || scope.requiredCapabilities.includes('high-scale')) {
    support.push({
      role: 'devops',
      seniority: seniority === 'pleno' ? 'senior' : seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Escala/infraestrutura crítica exige automação de deploy, observabilidade e confiabilidade dedicadas.',
    })
  }

  if (complexity === 'enterprise') {
    support.push({
      role: 'tech-lead',
      seniority: 'senior',
      quantity: 1,
      allocation: 'full-time',
      justification: 'Time grande e escopo complexo precisam de liderança técnica dedicada para coordenar arquitetura.',
    })
    support.push({
      role: 'product-manager',
      seniority: 'senior',
      quantity: 1,
      allocation: 'full-time',
      justification: 'Escopo enterprise com múltiplos stakeholders exige gestão de produto dedicada.',
    })
    if (scope.requiredCapabilities.includes('payments') || scope.requiredCapabilities.includes('compliance')) {
      support.push({
        role: 'security-specialist',
        seniority: 'senior',
        quantity: 1,
        allocation: 'full-time',
        justification: 'Integrações financeiras/compliance em escala exigem revisão de segurança dedicada.',
      })
    }
    if (scope.requiredCapabilities.includes('ai-ml') || scope.requiredCapabilities.includes('high-scale')) {
      support.push({
        role: 'data-engineer',
        seniority: 'senior',
        quantity: 1,
        allocation: 'full-time',
        justification: 'Volume de dados/IA em escala exige pipelines e infraestrutura de dados dedicados.',
      })
    }
  }

  return support
}

/** Gera a sugestão inicial de squad a partir da leitura de escopo, sem nenhuma negociação prévia. */
export function suggestInitialSquad(scope: ScopeAnalysis, input: ProjectInput): SquadMember[] {
  const desiredTimeline = input.targetTimelineMonths ?? DEFAULT_TIMELINE_MONTHS[scope.complexity]
  const requiredCapacityPerMonth = scope.estimatedEffortPersonMonths / desiredTimeline
  const seniority = DEFAULT_SENIORITY_BY_COMPLEXITY[scope.complexity]

  const engineering = planEngineeringRoles(scope, seniority, requiredCapacityPerMonth)
  const support = planSupportRoles(scope, scope.complexity)

  return [...engineering, ...support]
}
