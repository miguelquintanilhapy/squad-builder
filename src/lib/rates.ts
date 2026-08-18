import { AllocationType, ComplexityLevel, ContractType, RoleType, SeniorityLevel } from '@/types'

/**
 * Multiplicador de encargos CLT sobre o valor PJ (13º, férias+1/3, FGTS, INSS patronal etc.) —
 * estimativa interna de referência, não uma fonte de mercado citável (revisão externa 3.3/3.2:
 * premissa precisa ficar editável, não escondida atrás de "custo de referência de mercado").
 */
export const CLT_OVERHEAD_MULTIPLIER = 1.65

/** Custo mensal de referência (R$) por cargo e senioridade — estimativa interna, contratação PJ. */
export const MONTHLY_RATE_BRL: Record<RoleType, Record<SeniorityLevel, number>> = {
  'dev-frontend': { junior: 4000, pleno: 7000, senior: 11000 },
  'dev-backend': { junior: 4500, pleno: 7500, senior: 12000 },
  'dev-fullstack': { junior: 5000, pleno: 8500, senior: 13000 },
  'dev-mobile': { junior: 4500, pleno: 8000, senior: 12500 },
  'designer-uxui': { junior: 3500, pleno: 6000, senior: 9500 },
  qa: { junior: 3500, pleno: 6000, senior: 9000 },
  devops: { junior: 5000, pleno: 9000, senior: 14000 },
  'tech-lead': { junior: 9000, pleno: 12000, senior: 17000 },
  'product-manager': { junior: 6000, pleno: 9000, senior: 14000 },
  'data-engineer': { junior: 5000, pleno: 9000, senior: 15000 },
  'security-specialist': { junior: 6000, pleno: 10000, senior: 16000 },
}

/** Produtividade relativa por senioridade, usada para converter squad em capacidade de entrega. */
export const SENIORITY_CAPACITY_MULTIPLIER: Record<SeniorityLevel, number> = {
  junior: 0.6,
  pleno: 1.0,
  senior: 1.4,
}

export const ALLOCATION_CAPACITY_MULTIPLIER: Record<AllocationType, number> = {
  'full-time': 1.0,
  'part-time': 0.5,
}

/** Cargos que contam como capacidade de engenharia para o cálculo de prazo. */
export const ENGINEERING_ROLES: RoleType[] = [
  'dev-frontend',
  'dev-backend',
  'dev-fullstack',
  'dev-mobile',
  'tech-lead',
  'data-engineer',
]

/** Prazo-alvo padrão (meses) quando o usuário não informa um, por nível de complexidade. */
export const DEFAULT_TIMELINE_MONTHS: Record<ComplexityLevel, number> = {
  low: 2,
  medium: 4,
  enterprise: 6,
}

/** Senioridade padrão sugerida por complexidade, usada ao montar o squad inicial. */
export const DEFAULT_SENIORITY_BY_COMPLEXITY: Record<ComplexityLevel, SeniorityLevel> = {
  low: 'pleno',
  medium: 'pleno',
  enterprise: 'senior',
}

export function monthlyCostForMember(
  role: RoleType,
  seniority: SeniorityLevel,
  quantity: number,
  allocation: AllocationType,
  contractType: ContractType = 'pj',
  /** Premissa editável (revisão externa 3.2): substitui MONTHLY_RATE_BRL[role][seniority]. */
  rateOverride?: number
): number {
  const referenceRate = rateOverride ?? MONTHLY_RATE_BRL[role][seniority]
  const base = referenceRate * (contractType === 'clt' ? CLT_OVERHEAD_MULTIPLIER : 1)
  const allocationFactor = ALLOCATION_CAPACITY_MULTIPLIER[allocation]
  return Math.round(base * allocationFactor) * quantity
}

export function capacityForMember(
  role: RoleType,
  seniority: SeniorityLevel,
  quantity: number,
  allocation: AllocationType
): number {
  if (!ENGINEERING_ROLES.includes(role)) return 0
  return (
    SENIORITY_CAPACITY_MULTIPLIER[seniority] *
    ALLOCATION_CAPACITY_MULTIPLIER[allocation] *
    quantity
  )
}
