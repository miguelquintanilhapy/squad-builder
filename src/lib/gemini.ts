import { GoogleGenAI, Type } from '@google/genai'
import { ProjectInput, ProposedSquadChange, Scenario, ScopeAnalysis, SquadMember } from '@/types'

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
      return await fn()
    } catch (error) {
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

const PRODUCT_TYPES = ['web-app', 'mobile-app', 'desktop', 'api-backend', 'saas-b2b', 'marketplace']
const PLATFORMS = ['ios', 'android', 'web', 'multi-platform']
const STAGES = ['idea', 'prototype', 'mvp-running', 'legacy-product']
const COMPLEXITIES = ['low', 'medium', 'enterprise']
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
]
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
]
const SENIORITIES = ['junior', 'pleno', 'senior']
const ALLOCATIONS = ['full-time', 'part-time']

const SCOPE_ANALYSIS_SCHEMA = {
  type: Type.OBJECT,
  properties: {
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

export async function analyzeScope(input: ProjectInput): Promise<ScopeAnalysis> {
  const prompt = `Você é um arquiteto de software sênior que traduz descrições de projetos em uma leitura estruturada de escopo, para alimentar um motor de cálculo de squad/custo/prazo.

Dados informados pelo fundador:
- Tipo(s) de produto (chips selecionados): ${input.productTypes.join(', ') || 'não informado'}
- Plataforma(s) alvo (chips selecionados): ${input.platforms.join(', ') || 'não informado'}
- Estágio do projeto (chip selecionado): ${input.stage}
- Complexidade esperada (chip selecionado): ${input.complexity}
- Prazo alvo: ${input.targetTimelineMonths ? `${input.targetTimelineMonths} meses` : 'não informado'}
- Orçamento mensal: ${input.monthlyBudget ? `R$ ${input.monthlyBudget}` : 'não informado'}
- Descrição livre do escopo: """${input.description}"""

Analise o texto livre com atenção para identificar funcionalidades e integrações (pagamentos, geolocalização/GPS em tempo real, chat, notificações, painel admin, integrações de terceiros, IA/ML, necessidade de alta escala, exigências de compliance).

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

  return JSON.parse(response.text ?? '{}') as ScopeAnalysis
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

  return JSON.parse(response.text ?? '{}') as ProposedSquadChange
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

  return JSON.parse(response.text ?? '{}') as { summary: string; midGroundSuggestion?: string }
}
