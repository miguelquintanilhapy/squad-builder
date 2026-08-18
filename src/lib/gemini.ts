import { GoogleGenAI, Type } from '@google/genai'
import { z } from 'zod'
import { ProjectInput, ProposedSquadChange, Scenario, ScopeAnalysis, SquadMember } from '@/types'
import { describeContradiction, findNarrativeContradiction, removeContradictingSentences } from './narrativeGuard'

// A LLM nunca calcula custo/prazo/risco: ela só lê texto livre e devolve dados estruturados
// (extração) ou narra números que o motor determinístico (src/lib/calculator.ts) já calculou.

let client: GoogleGenAI | null = null

function getClient(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY não configurada. Adicione ao .env.local (veja .env.local.example).')
    }
    client = new GoogleGenAI({ apiKey })
  }
  return client
}

const MODEL = process.env.GEMINI_MODEL || 'gemini-3.6-flash'

// A API do Gemini devolve erros como uma string JSON em error.message (ex: {"error":{"code":503,...}}).
// Erros de sobrecarga/limite são transitórios: vale tentar de novo antes de desistir.
const RETRYABLE_STATUSES = new Set(['UNAVAILABLE', 'RESOURCE_EXHAUSTED', 'INTERNAL'])
const RETRY_DELAYS_MS = [600, 1500]

// Sem isso, uma chamada travada fica pendente indefinidamente e a UI não tem como saber a
// diferença entre "ainda processando" e "nunca vai responder" (revisão externa 2.1).
const REQUEST_TIMEOUT_MS = 30_000

function withTimeout<T>(promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error('TIMEOUT')), REQUEST_TIMEOUT_MS)
    promise.then(
      (value) => {
        clearTimeout(timeoutId)
        resolve(value)
      },
      (error) => {
        clearTimeout(timeoutId)
        reject(error)
      }
    )
  })
}

interface GeminiApiError {
  code?: number
  message?: string
  status?: string
}

function parseGeminiError(error: unknown): GeminiApiError | null {
  if (!(error instanceof Error)) return null
  try {
    const parsed = JSON.parse(error.message) as { error?: GeminiApiError }
    return parsed.error ?? null
  } catch {
    return null
  }
}

function toFriendlyError(parsed: GeminiApiError | null, fallback: Error): Error {
  switch (parsed?.status) {
    case 'UNAVAILABLE':
      return new Error(
        'A IA do Gemini está sobrecarregada agora (alta demanda no free tier). Já tentei de novo automaticamente algumas vezes — espera uns segundos e tenta mandar de novo.'
      )
    case 'RESOURCE_EXHAUSTED':
      return new Error(
        'O limite de uso gratuito da API do Gemini foi atingido por agora. Espere um pouco antes de tentar de novo.'
      )
    case 'NOT_FOUND':
      return new Error(`O modelo "${MODEL}" não está disponível para sua chave. Confira GEMINI_MODEL no .env.local.`)
    case 'INVALID_ARGUMENT':
    case 'PERMISSION_DENIED':
    case 'UNAUTHENTICATED':
      return new Error('Chave da API do Gemini inválida ou sem permissão. Confira GEMINI_API_KEY no .env.local.')
    default:
      return fallback
  }
}

/** Envolve toda chamada à API do Gemini com retry para erros transitórios de sobrecarga/limite. */
async function callGemini<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      return await withTimeout(fn())
    } catch (error) {
      if (error instanceof Error && error.message === 'TIMEOUT') {
        // Sem retry automático aqui: já esperou o limite inteiro, dobrar a espera é pior UX
        // que devolver o controle e deixar o usuário decidir se tenta de novo.
        throw new Error(`A IA demorou mais de ${REQUEST_TIMEOUT_MS / 1000}s pra responder. Tenta de novo.`)
      }
      const parsed = parseGeminiError(error)
      const canRetry = parsed?.status ? RETRYABLE_STATUSES.has(parsed.status) : false
      const isLastAttempt = attempt === RETRY_DELAYS_MS.length
      if (!canRetry || isLastAttempt) {
        const fallback = error instanceof Error ? error : new Error('Erro inesperado ao chamar a IA.')
        throw toFriendlyError(parsed, fallback)
      }
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS_MS[attempt]))
    }
  }
  throw new Error('Erro inesperado ao chamar a IA.')
}

const PRODUCT_TYPES = ['web-app', 'mobile-app', 'desktop', 'api-backend', 'saas-b2b', 'marketplace'] as const
const PLATFORMS = ['ios', 'android', 'web', 'multi-platform'] as const
const STAGES = ['idea', 'prototype', 'mvp-running', 'legacy-product'] as const
const COMPLEXITIES = ['low', 'medium', 'enterprise'] as const
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

const SCOPE_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    // Triagem antes da estimativa: sem isso, um escopo vago ou fora de domínio ainda produz
    // squad + risco baixo — confiança fabricada sobre nada (revisão externa 2.2/2.3).
    inDomain: { type: Type.BOOLEAN },
    sufficientForEstimate: { type: Type.BOOLEAN },
    clarifyingQuestions: { type: Type.ARRAY, items: { type: Type.STRING } },
    productTypes: { type: Type.ARRAY, items: { type: Type.STRING, enum: PRODUCT_TYPES } },
    platforms: { type: Type.ARRAY, items: { type: Type.STRING, enum: PLATFORMS } },
    stage: { type: Type.STRING, enum: STAGES },
    complexity: { type: Type.STRING, enum: COMPLEXITIES },
    estimatedEffortPersonMonths: { type: Type.NUMBER },
    requiredCapabilities: { type: Type.ARRAY, items: { type: Type.STRING, enum: CAPABILITIES } },
    keyRisksNoted: { type: Type.ARRAY, items: { type: Type.STRING } },
    summary: { type: Type.STRING },
  },
  required: [
    'inDomain',
    'sufficientForEstimate',
    'clarifyingQuestions',
    'productTypes',
    'platforms',
    'stage',
    'complexity',
    'estimatedEffortPersonMonths',
    'requiredCapabilities',
    'keyRisksNoted',
    'summary',
  ],
}

export interface ScopeClarificationNeeded {
  ok: false
  reason: 'insufficient' | 'out-of-domain'
  questions: string[]
}

/** Faz o parse do JSON da resposta e transforma falhas de formato num erro claro pra UI. */
function parseJsonResponse(text: string | undefined, context: string): unknown {
  if (!text?.trim()) {
    throw new Error(`A IA devolveu uma resposta vazia ao ${context}. Tenta de novo.`)
  }
  try {
    return JSON.parse(text)
  } catch {
    throw new Error(`A IA devolveu uma resposta em formato inválido ao ${context}. Tenta de novo.`)
  }
}

function isOneOf<T extends string>(value: unknown, allowed: readonly T[]): value is T {
  return typeof value === 'string' && (allowed as readonly string[]).includes(value)
}

/** Dimensão fora do enum esperado cai no default e loga — nunca propaga pro motor de cálculo. */
function sanitizeEnum<T extends string>(value: unknown, allowed: readonly T[], fallback: T, field: string): T {
  if (isOneOf(value, allowed)) return value
  console.error(`[analyzeScope] "${field}" fora do enum esperado (${JSON.stringify(value)}) — usando "${fallback}".`)
  return fallback
}

function sanitizeEnumArray<T extends string>(value: unknown, allowed: readonly T[], field: string): T[] {
  if (!Array.isArray(value)) return []
  const valid = value.filter((item): item is T => isOneOf(item, allowed))
  if (valid.length !== value.length) {
    console.error(`[analyzeScope] valores fora do enum removidos de "${field}": ${JSON.stringify(value)}`)
  }
  return valid
}

function sanitizeScopeAnalysis(raw: unknown): ScopeAnalysis {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>

  const estimatedEffortPersonMonths =
    typeof r.estimatedEffortPersonMonths === 'number' && r.estimatedEffortPersonMonths > 0
      ? r.estimatedEffortPersonMonths
      : 3
  if (estimatedEffortPersonMonths === 3 && r.estimatedEffortPersonMonths !== 3) {
    console.error(
      `[analyzeScope] "estimatedEffortPersonMonths" inválido (${JSON.stringify(r.estimatedEffortPersonMonths)}) — usando fallback de 3 pessoa-mês.`
    )
  }

  return {
    productTypes: sanitizeEnumArray(r.productTypes, PRODUCT_TYPES, 'productTypes'),
    platforms: sanitizeEnumArray(r.platforms, PLATFORMS, 'platforms'),
    stage: sanitizeEnum(r.stage, STAGES, 'idea', 'stage'),
    complexity: sanitizeEnum(r.complexity, COMPLEXITIES, 'medium', 'complexity'),
    estimatedEffortPersonMonths,
    requiredCapabilities: sanitizeEnumArray(r.requiredCapabilities, CAPABILITIES, 'requiredCapabilities'),
    keyRisksNoted: Array.isArray(r.keyRisksNoted) ? r.keyRisksNoted.filter((v): v is string => typeof v === 'string') : [],
    summary:
      typeof r.summary === 'string' && r.summary.trim()
        ? r.summary
        : 'Não foi possível gerar uma síntese detalhada para este escopo.',
  }
}

export async function analyzeScope(
  input: ProjectInput
): Promise<{ ok: true; scopeAnalysis: ScopeAnalysis } | ScopeClarificationNeeded> {
  const prompt = `Você é um arquiteto de software sênior que traduz descrições de projetos em uma leitura estruturada de escopo, para alimentar um motor de cálculo de squad/custo/prazo.

O fundador descreveu o projeto em texto livre — essa descrição é a fonte principal, leia com atenção. Os campos abaixo são pistas adicionais opcionais, informadas antes da leitura do texto, e podem estar vazias:
- Tipo(s) de produto: ${input.productTypes.join(', ') || 'não informado, infira do texto'}
- Plataforma(s) alvo: ${input.platforms.join(', ') || 'não informado, infira do texto'}
- Estágio do projeto: ${input.stage}
- Complexidade esperada: ${input.complexity}
- Prazo alvo: ${input.targetTimelineMonths ? `${input.targetTimelineMonths} meses` : 'não informado'}
- Orçamento mensal: ${input.monthlyBudget ? `R$ ${input.monthlyBudget}` : 'não informado'}

Descrição livre do escopo: """${input.description}"""

Antes de estimar, faça a triagem:
1. "inDomain": false se o pedido não é sobre construir um produto de software/digital (ex: abrir uma padaria, uma loja física, um pedido pessoal sem nenhum componente de software). true se for um projeto de software, app, plataforma ou sistema.
2. "sufficientForEstimate": false se o texto é vago demais pra sustentar uma estimativa com confiança real (ex: "quero um app massa", sem dizer o quê ele faz, pra quem, ou qual problema resolve) — mesmo que o texto seja longo, se não dá pra saber o que construir, é insuficiente. true se há detalhe concreto suficiente (funcionalidades, público, problema a resolver) pra estimar com confiança.
3. Se "inDomain" for false OU "sufficientForEstimate" for false, preencha "clarifyingQuestions" com até 3 perguntas curtas e concretas que, respondidas, destravariam uma estimativa real — e pode deixar os outros campos com valores neutros/vazios, eles não serão usados. Se ambos forem true, "clarifyingQuestions" fica vazio.

Se a triagem passar (inDomain e sufficientForEstimate true), analise o texto livre com atenção para identificar funcionalidades e integrações (pagamentos, geolocalização/GPS em tempo real, chat, notificações, painel admin, integrações de terceiros, IA/ML, necessidade de alta escala, exigências de compliance).

Estime o esforço de desenvolvimento necessário em pessoa-mês (pessoa-mês = quanto uma pessoa plena, em tempo integral, levaria para entregar sozinha; um projeto que precisa de 2 pessoas plenas por 4 meses tem ~8 pessoa-mês de esforço). Seja realista: não subestime a complexidade de integrações e múltiplas plataformas.

Responda respeitando estritamente o schema JSON fornecido.`

  const response = await callGemini(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: SCOPE_ANALYSIS_SCHEMA,
      },
    })
  )

  const raw = parseJsonResponse(response.text, 'ler o escopo') as Record<string, unknown>
  const inDomain = raw.inDomain !== false
  const sufficientForEstimate = raw.sufficientForEstimate !== false

  if (!inDomain || !sufficientForEstimate) {
    const questions = Array.isArray(raw.clarifyingQuestions)
      ? raw.clarifyingQuestions.filter((q): q is string => typeof q === 'string').slice(0, 3)
      : []
    return {
      ok: false,
      reason: inDomain ? 'insufficient' : 'out-of-domain',
      questions: questions.length
        ? questions
        : ['Pode descrever com mais detalhe o que o produto faz e para quem?'],
    }
  }

  return { ok: true, scopeAnalysis: sanitizeScopeAnalysis(raw) }
}

const PROPOSED_SQUAD_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    squad: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          role: { type: Type.STRING, enum: ROLES },
          seniority: { type: Type.STRING, enum: SENIORITIES },
          quantity: { type: Type.NUMBER },
          allocation: { type: Type.STRING, enum: ALLOCATIONS },
        },
        required: ['role', 'seniority', 'quantity', 'allocation'],
      },
    },
    targetTimelineMonths: { type: Type.NUMBER },
    targetMonthlyBudget: { type: Type.NUMBER },
  },
  required: ['squad'],
}

// ProposedSquadChange vem de texto livre do usuário e muta custo/prazo/risco direto — é a
// superfície mais perigosa da negociação e, ao contrário de ScopeAnalysis, não tinha nenhuma
// validação (revisão externa 3.11). Campo malformado aqui não pode virar número na tela.
const PROPOSED_SQUAD_CHANGE_SCHEMA = z.object({
  squad: z
    .array(
      z.object({
        role: z.enum(ROLES),
        seniority: z.enum(SENIORITIES),
        quantity: z.number().int().positive(),
        allocation: z.enum(ALLOCATIONS),
      })
    )
    .min(1),
  targetTimelineMonths: z.number().positive().optional(),
  targetMonthlyBudget: z.number().positive().optional(),
})

export async function extractProposedSquad(params: {
  scope: ScopeAnalysis
  input: ProjectInput
  currentSquad: SquadMember[]
  userMessage: string
}): Promise<ProposedSquadChange> {
  const { scope, input, currentSquad, userMessage } = params

  const prompt = `Você traduz pedidos de mudança de squad, em linguagem natural, para uma lista estruturada de cargos.

Contexto do projeto:
${scope.summary}

Squad atual:
${currentSquad.map((m) => `- ${m.quantity}x ${m.role} (${m.seniority}, ${m.allocation})`).join('\n')}

Prazo alvo atual: ${input.targetTimelineMonths ? `${input.targetTimelineMonths} meses` : 'não definido'}
Orçamento mensal atual: ${input.monthlyBudget ? `R$ ${input.monthlyBudget}` : 'não definido'}

Mensagem do fundador propondo uma mudança: """${userMessage}"""

Interprete o pedido e devolva o NOVO squad completo resultante (não apenas o delta — inclua também os cargos do squad atual que não foram mencionados e continuam valendo, a menos que o usuário tenha claramente pedido para removê-los).

Atenção especial a substituição de cargos de desenvolvimento: se o usuário disser que quer "só 1 [cargo] pra fazer tudo" ou algo equivalente (ex: "1 fullstack cobrindo tudo"), isso SUBSTITUI todos os outros cargos de desenvolvimento (dev-mobile, dev-frontend, dev-backend, dev-fullstack) que cobririam as mesmas frentes — não os mantenha em paralelo. Cargos de suporte (designer, qa, devops etc.) só são removidos se o usuário mencionar isso explicitamente.

Se o usuário mencionar um novo prazo ou orçamento, inclua em targetTimelineMonths/targetMonthlyBudget. Se não mencionar, omita esses campos.

Responda respeitando estritamente o schema JSON fornecido.`

  const response = await callGemini(() =>
    getClient().models.generateContent({
      model: MODEL,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: PROPOSED_SQUAD_SCHEMA,
      },
    })
  )

  const raw = parseJsonResponse(response.text, 'reinterpretar o squad')
  const parsed = PROPOSED_SQUAD_CHANGE_SCHEMA.safeParse(raw)
  if (!parsed.success) {
    console.error('[extractProposedSquad] resposta fora do schema esperado:', parsed.error.flatten())
    throw new Error('A IA devolveu uma proposta de squad em formato inválido. Tenta reformular o pedido.')
  }
  return parsed.data as ProposedSquadChange
}

const NARRATION_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    summary: { type: Type.STRING },
    midGroundSuggestion: { type: Type.STRING },
  },
  required: ['summary'],
}

export async function narrateScenario(params: {
  scope: ScopeAnalysis
  input: ProjectInput
  scenario: Scenario
  userMessage?: string
}): Promise<{ summary: string; midGroundSuggestion?: string }> {
  const { scope, scenario, userMessage } = params

  const prompt = `Você é o SquadBuilder, um copiloto de IA que ajuda fundadores a dimensionar squads de engenharia. Todos os números abaixo já foram calculados por um motor determinístico — você NÃO deve alterá-los, apenas explicá-los de forma clara e acionável para o fundador.

Contexto do projeto: ${scope.summary}

${userMessage ? `O fundador acabou de pedir: """${userMessage}"""\n` : 'Este é o diagnóstico inicial, antes de qualquer negociação.\n'}

Squad atual:
${scenario.squad.map((m) => `- ${m.quantity}x ${m.role} (${m.seniority}, ${m.allocation}) — R$ ${m.monthlyCostPerPerson}/mês cada`).join('\n')}

Custo total mensal: R$ ${scenario.totalMonthlyCost.toLocaleString('pt-BR')}
Prazo realista estimado: ${scenario.estimatedTimelineMonths} meses
Risk Score: ${scenario.riskScore}/100 (${scenario.riskLevel})

Alertas identificados pelo motor de risco:
${scenario.alerts.length ? scenario.alerts.map((a) => `- [${a.severity}] ${a.title}: ${a.description}`).join('\n') : '- Nenhum alerta crítico.'}

Escreva:
1. "summary": um parágrafo curto e direto (2-4 frases) resumindo esse cenário para o fundador — em tom de co-fundador técnico, sem enrolação.
2. "midGroundSuggestion": (opcional, só se o risk score for médio/alto/crítico) uma sugestão concreta de meio-termo que reduziria o risco sem inflar o custo de volta ao squad "ideal".

Responda em português do Brasil, respeitando estritamente o schema JSON fornecido.`

  async function generate(): Promise<{ summary: string; midGroundSuggestion?: string }> {
    const response = await callGemini(() =>
      getClient().models.generateContent({
        model: MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: NARRATION_SCHEMA,
        },
      })
    )
    return parseJsonResponse(response.text, 'narrar o cenário') as { summary: string; midGroundSuggestion?: string }
  }

  let result = await generate()
  let contradiction = findNarrativeContradiction(result.summary, scenario.squad)

  // O pipeline entrega o squad já fechado pro modelo — uma contradição aqui não é erro de dados,
  // é o modelo se contradizendo. Tenta regenerar uma vez; se persistir, suprime só a frase em vez
  // de exibir uma afirmação falsa sobre a composição (revisão externa 3.10).
  if (contradiction) {
    console.error(
      `[narrateScenario] texto nega "${describeContradiction(contradiction)}", presente no squad — regenerando.`
    )
    result = await generate()
    contradiction = findNarrativeContradiction(result.summary, scenario.squad)
  }
  if (contradiction) {
    console.error(`[narrateScenario] contradição persistiu — suprimindo a frase em vez de exibir.`)
    result = { ...result, summary: removeContradictingSentences(result.summary, scenario.squad) }
  }

  return result
}
