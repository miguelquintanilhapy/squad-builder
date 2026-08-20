import { RoleType, SquadMember } from '@/types'

// Cada papel de engenharia hands-on entra no mesmo bucket ("N especialistas de desenvolvimento")
// — tech-lead/data-engineer têm frase própria abaixo, não competem nessa contagem.
const ENGINEERING_ROLES: RoleType[] = ['dev-frontend', 'dev-backend', 'dev-fullstack', 'dev-mobile']

const DEMAND_PHRASE: Partial<Record<RoleType, string>> = {
  'dev-mobile': 'desenvolvimento mobile',
  'dev-frontend': 'um front-end web',
  'dev-backend': 'uma camada de back-end para as APIs',
  'dev-fullstack': 'desenvolvimento full-stack (front-end e back-end)',
}

const SUPPORT_PHRASE: Partial<Record<RoleType, string>> = {
  'designer-uxui': 'um profissional de UX/UI',
  qa: 'um QA dedicado',
  devops: 'um DevOps dedicado',
  'tech-lead': 'um Tech Lead para coordenar a arquitetura e as decisões técnicas',
  'product-manager': 'um Product Manager dedicado',
  'data-engineer': 'um Data Engineer dedicado',
  'security-specialist': 'um especialista em segurança',
}

function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} e ${items[items.length - 1]}`
}

/**
 * Explica o squad como consequência do escopo, não só apresenta o resultado. Derivado do squad
 * já montado, não do escopo separadamente — assim nunca contradiz o que está de fato na
 * composição, mesmo depois de uma negociação que mude os papéis (regra determinística, mesma
 * lógica de squadPlanner.ts, não decisão da IA).
 */
export function describeSquadRationale(squad: SquadMember[]): string {
  const hasRole = (role: RoleType) => squad.some((m) => m.role === role)

  const demands = (Object.keys(DEMAND_PHRASE) as RoleType[]).filter(hasRole).map((role) => DEMAND_PHRASE[role]!)
  const demandSentence = demands.length
    ? `O projeto exige ${joinWithAnd(demands)}.`
    : 'O escopo descrito não exige uma frente de desenvolvimento hands-on dedicada.'

  const engineeringHeadcount = squad
    .filter((m) => ENGINEERING_ROLES.includes(m.role))
    .reduce((sum, m) => sum + m.quantity, 0)

  const recommendations: string[] = []
  if (engineeringHeadcount > 0) {
    recommendations.push(
      `${engineeringHeadcount} ${engineeringHeadcount === 1 ? 'especialista de desenvolvimento' : 'especialistas de desenvolvimento'}`
    )
  }
  recommendations.push(...(Object.keys(SUPPORT_PHRASE) as RoleType[]).filter(hasRole).map((role) => SUPPORT_PHRASE[role]!))

  if (!recommendations.length) return demandSentence

  return `${demandSentence} Por isso, recomendamos ${joinWithAnd(recommendations)}.`
}
