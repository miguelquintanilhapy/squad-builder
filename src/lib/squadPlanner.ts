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

// Curta e escaneável, mas sem virar tautologia ("cobre a demanda de X") — cada linha ainda
// defende por que o papel existe, só num clause em vez de um parágrafo.
const ENGINEERING_JUSTIFICATION: Record<string, string> = {
  'dev-mobile': 'Cobre a superfície mobile nativa — a entrega mais visível pro usuário final.',
  'dev-frontend': 'Interface web é onde o usuário decide continuar ou abandonar.',
  'dev-backend': 'Sustenta dados e regras de negócio de todas as superfícies do produto.',
}

const LEAN_FULLSTACK_JUSTIFICATION = 'Escopo enxuto: 1 dev fullstack cobre front e back sem fragmentar o squad.'

interface EngineeringRoleSelection {
  roles: RoleType[]
  leanFullstack: boolean
}

/** Quais cargos de engenharia o escopo exige — a mesma seleção serve tanto pra distribuir
 * capacidade (planEngineeringRoles) quanto pro squad mínimo viável (suggestMinimalSquad). */
function selectEngineeringRoles(scope: ScopeAnalysis): EngineeringRoleSelection {
  const mobile = needsMobile(scope)
  const web = needsWebFrontend(scope)

  // Modo enxuto: só uma superfície de UI (ou nenhuma), escopo pequeno e baixa complexidade
  // -> 1 fullstack cobre front+back em vez de fragmentar o squad.
  const leanFullstack =
    scope.complexity === 'low' && scope.estimatedEffortPersonMonths <= 5 && !mobile

  if (leanFullstack) {
    return { roles: ['dev-fullstack'], leanFullstack: true }
  }

  const roles: RoleType[] = []
  if (mobile) roles.push('dev-mobile')
  if (web) roles.push('dev-frontend')
  // Backend quase sempre necessário para sustentar as superfícies acima.
  roles.push('dev-backend')
  return { roles, leanFullstack: false }
}

function engineeringJustification(role: RoleType, leanFullstack: boolean): string | undefined {
  return leanFullstack ? LEAN_FULLSTACK_JUSTIFICATION : ENGINEERING_JUSTIFICATION[role]
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
  const { roles, leanFullstack } = selectEngineeringRoles(scope)
  const capacityPerShare = requiredCapacityPerMonth / roles.length
  const seniorityMultiplier = SENIORITY_CAPACITY_MULTIPLIER[seniority]

  return roles.map((role) => {
    const quantity = Math.max(1, Math.ceil(capacityPerShare / seniorityMultiplier))
    return {
      role,
      seniority,
      quantity,
      allocation: 'full-time',
      justification: engineeringJustification(role, leanFullstack),
    }
  })
}

/** A partir de quantas pessoas no squad a falta de liderança técnica dedicada vira o primeiro
 * ponto que um comprador experiente aponta — independente da complexidade formal do projeto. */
const TECH_LEAD_HEADCOUNT_THRESHOLD = 5

function planSupportRoles(scope: ScopeAnalysis, complexity: ComplexityLevel, engineeringHeadcount: number): SquadMember[] {
  const support: SquadMember[] = []
  const seniority = DEFAULT_SENIORITY_BY_COMPLEXITY[complexity]
  const uiFacing = needsMobile(scope) || needsWebFrontend(scope)

  if (complexity !== 'low' && uiFacing) {
    support.push({
      role: 'designer-uxui',
      seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Sem design dedicado, risco de UX alto na interface do usuário final.',
    })
  }

  if (complexity !== 'low') {
    support.push({
      role: 'qa',
      seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Reduz bugs em produção antes do usuário encontrá-los.',
    })
  }

  if (complexity === 'enterprise' || scope.requiredCapabilities.includes('high-scale')) {
    support.push({
      role: 'devops',
      seniority: seniority === 'pleno' ? 'senior' : seniority,
      quantity: 1,
      allocation: 'full-time',
      justification: 'Escala crítica exige automação de deploy e observabilidade dedicadas.',
    })
  }

  const supportHeadcountSoFar = support.reduce((sum, m) => sum + m.quantity, 0)
  const totalHeadcountSoFar = engineeringHeadcount + supportHeadcountSoFar
  if (complexity === 'enterprise' || totalHeadcountSoFar >= TECH_LEAD_HEADCOUNT_THRESHOLD) {
    support.push({
      role: 'tech-lead',
      seniority: 'senior',
      quantity: 1,
      allocation: 'full-time',
      justification:
        complexity === 'enterprise'
          ? 'Escopo enterprise precisa de liderança técnica dedicada pra coordenar arquitetura.'
          : `Squad de ${totalHeadcountSoFar}+ pessoas sem liderança dedicada fragmenta decisões de arquitetura.`,
    })
  }

  if (complexity === 'enterprise') {
    support.push({
      role: 'product-manager',
      seniority: 'senior',
      quantity: 1,
      allocation: 'full-time',
      justification: 'Múltiplos stakeholders exigem gestão de produto dedicada.',
    })
    if (scope.requiredCapabilities.includes('payments') || scope.requiredCapabilities.includes('compliance')) {
      support.push({
        role: 'security-specialist',
        seniority: 'senior',
        quantity: 1,
        allocation: 'full-time',
        justification: 'Integrações financeiras/compliance exigem revisão de segurança dedicada.',
      })
    }
    if (scope.requiredCapabilities.includes('ai-ml') || scope.requiredCapabilities.includes('high-scale')) {
      support.push({
        role: 'data-engineer',
        seniority: 'senior',
        quantity: 1,
        allocation: 'full-time',
        justification: 'Volume de dados/IA exige pipelines e infraestrutura dedicados.',
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
  const engineeringHeadcount = engineering.reduce((sum, m) => sum + m.quantity, 0)
  const support = planSupportRoles(scope, scope.complexity, engineeringHeadcount)

  return [...engineering, ...support]
}

/** Squad mínimo viável: 1 pessoa por cargo de engenharia que o escopo exige, sem nenhum papel de
 * apoio (designer, QA, devops, liderança...) — o piso abaixo do qual o produto simplesmente não
 * tem quem construa cada superfície exigida. */
export function suggestMinimalSquad(scope: ScopeAnalysis): SquadMember[] {
  const { roles, leanFullstack } = selectEngineeringRoles(scope)
  const seniority = DEFAULT_SENIORITY_BY_COMPLEXITY[scope.complexity]

  return roles.map((role) => ({
    role,
    seniority,
    quantity: 1,
    allocation: 'full-time',
    justification: engineeringJustification(role, leanFullstack),
  }))
}
