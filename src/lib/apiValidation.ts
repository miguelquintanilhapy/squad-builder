import { z } from 'zod'

// Corpo de requisição das rotas /api/* vem de fora (fetch do client) — nunca confiar no shape
// sem validar. Campos malformados aqui alimentariam direto o prompt da LLM ou o motor
// determinístico, então um `as Tipo` sem checagem de runtime pode disparar um TypeError não
// tratado (ex: `.join` num campo que devia ser array e chegou undefined/string).

const PRODUCT_TYPES = ['web-app', 'mobile-app', 'desktop', 'api-backend', 'saas-b2b', 'marketplace'] as const
const PLATFORMS = ['ios', 'android', 'web', 'multi-platform'] as const
const STAGES = ['idea', 'prototype', 'mvp-running', 'legacy-product'] as const
const COMPLEXITIES = ['low', 'medium', 'enterprise'] as const
const CONTRACT_TYPES = ['pj', 'clt'] as const
const ROLES = [
  'dev-frontend',
  'dev-backend',
  'dev-fullstack',
  'dev-mobile',
  'designer-uxui',
  'qa',
  'devops',
  'tech-lead',
  'product-manager',
  'data-engineer',
  'security-specialist',
] as const
const SENIORITIES = ['junior', 'pleno', 'senior'] as const
const ALLOCATIONS = ['full-time', 'part-time'] as const
const CAPABILITIES = [
  'payments',
  'realtime-tracking',
  'geolocation',
  'chat',
  'notifications',
  'admin-panel',
  'third-party-integrations',
  'high-scale',
  'compliance',
  'ai-ml',
] as const

// Limite generoso, só pra impedir payloads absurdamente grandes indo pro prompt da LLM (custo/
// latência), não uma restrição de conteúdo.
const MAX_DESCRIPTION_LENGTH = 8000
const MAX_MESSAGE_LENGTH = 4000

export const ProjectInputSchema = z.object({
  productTypes: z.array(z.enum(PRODUCT_TYPES)),
  platforms: z.array(z.enum(PLATFORMS)),
  stage: z.enum(STAGES),
  complexity: z.enum(COMPLEXITIES),
  description: z.string().max(MAX_DESCRIPTION_LENGTH),
  targetTimelineMonths: z.number().positive().optional(),
  monthlyBudget: z.number().positive().optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  rateOverrides: z.record(z.enum(ROLES), z.number().positive()).optional(),
})

export const ScopeAnalysisSchema = z.object({
  productTypes: z.array(z.enum(PRODUCT_TYPES)),
  platforms: z.array(z.enum(PLATFORMS)),
  stage: z.enum(STAGES),
  complexity: z.enum(COMPLEXITIES),
  estimatedEffortPersonMonths: z.number().positive(),
  requiredCapabilities: z.array(z.enum(CAPABILITIES)),
  keyRisksNoted: z.array(z.string()),
  summary: z.string(),
})

export const SquadMemberSchema = z.object({
  role: z.enum(ROLES),
  seniority: z.enum(SENIORITIES),
  quantity: z.number().int().positive(),
  allocation: z.enum(ALLOCATIONS),
  monthlyCostPerPerson: z.number().optional(),
  justification: z.string().optional(),
  monthlyAllocationPct: z.array(z.number()).optional(),
})

export const AnalyzeRequestSchema = ProjectInputSchema

export const RecomputeRequestSchema = z.object({
  scopeAnalysis: ScopeAnalysisSchema,
  input: ProjectInputSchema,
  currentSquad: z.array(SquadMemberSchema).optional(),
})

export const NegotiateRequestSchema = z.object({
  scopeAnalysis: ScopeAnalysisSchema,
  input: ProjectInputSchema,
  currentSquad: z.array(SquadMemberSchema),
  userMessage: z.string().min(1).max(MAX_MESSAGE_LENGTH),
})

/** Faz o parse do corpo JSON da requisição sem deixar um body malformado (JSON inválido, ou
 * vazio) virar exceção não tratada na rota. */
export async function parseJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json()
  } catch {
    throw new InvalidRequestError('Corpo da requisição não é um JSON válido.')
  }
}

export class InvalidRequestError extends Error {}

/** Valida `body` contra `schema`; em caso de falha, lança um erro com mensagem segura pro
 * cliente (nunca o detalhe interno do zod) e loga o detalhe completo só no servidor. */
export function validateBody<T>(schema: z.ZodType<T>, body: unknown, routeName: string): T {
  const result = schema.safeParse(body)
  if (!result.success) {
    console.error(`[${routeName}] corpo da requisição inválido:`, result.error.flatten())
    throw new InvalidRequestError('Corpo da requisição não tem o formato esperado.')
  }
  return result.data
}
